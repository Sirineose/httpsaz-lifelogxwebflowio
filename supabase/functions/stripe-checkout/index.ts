/**
 * Stripe Checkout Edge Function
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting
 * - Authentication required (no guest mode)
 * - Input validation & sanitization
 * - Server-side user identity (never trust client)
 */

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  checkRateLimit,
  RATE_LIMITS,
  safeParseJSON,
  sanitizeString,
  rejectUnexpectedFields,
  errorResponse,
  successResponse,
  MAX_LENGTHS,
} from "../_shared/security.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Price IDs - configured via environment (NO fallbacks to avoid using placeholder IDs)
const PRICE_IDS: Record<string, string | undefined> = {
  essential: Deno.env.get("STRIPE_PRICE_ESSENTIAL_MONTHLY"),
  pro: Deno.env.get("STRIPE_PRICE_PRO_MONTHLY"),
  ultimate: Deno.env.get("STRIPE_PRICE_ULTIMATE_MONTHLY"),
};

// Log secrets at startup (truncated for security)
console.log("Loaded Price IDs:", {
  essential: PRICE_IDS.essential ? PRICE_IDS.essential.slice(0, 15) + "..." : "NOT SET",
  pro: PRICE_IDS.pro ? PRICE_IDS.pro.slice(0, 15) + "..." : "NOT SET",
  ultimate: PRICE_IDS.ultimate ? PRICE_IDS.ultimate.slice(0, 15) + "..." : "NOT SET",
});

// Allowed fields per route
const ALLOWED_FIELDS_CHECKOUT = ["plan", "successUrl", "cancelUrl"];
const ALLOWED_FIELDS_PORTAL = ["returnUrl"];
const ALLOWED_FIELDS_STATUS: string[] = [];

// Helper function to authenticate user
async function authenticateUser(
  req: Request
): Promise<{ user: { id: string; email: string } | null; error: string | null }> {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid authorization header" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    console.error("Auth error:", error?.message);
    return { user: null, error: "Unauthorized" };
  }

  return {
    user: {
      id: data.user.id,
      email: data.user.email || "",
    },
    error: null,
  };
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return errorResponse(405, "Méthode non autorisée", corsHeaders);
  }

  try {
    // =========================================================================
    // RATE LIMITING
    // =========================================================================
    const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.standard, undefined, corsHeaders);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // =========================================================================
    // AUTHENTICATION (required for all Stripe routes)
    // =========================================================================
    const { user, error: authError } = await authenticateUser(req);

    if (authError || !user) {
      console.error("Authentication failed:", authError);
      return errorResponse(401, "Non autorisé", corsHeaders);
    }

    console.log("Authenticated user:", user.id);

    // Re-check rate limit with user ID
    const userRateLimitResponse = checkRateLimit(req, RATE_LIMITS.standard, user.id, corsHeaders);
    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    // =========================================================================
    // ROUTE HANDLING
    // =========================================================================

    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // Route: Create checkout session
    if (path === "create-checkout") {
      const { body, error: parseError } = await safeParseJSON(req, MAX_LENGTHS.json, corsHeaders);
      if (parseError) return parseError;

      const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS_CHECKOUT, corsHeaders);
      if (unexpectedError) return unexpectedError;

      const { plan, successUrl, cancelUrl } = body as Record<string, unknown>;

      // Validate plan name
      const planValidation = sanitizeString(plan, 20, "plan", { required: true });
      if (planValidation.error) {
        return errorResponse(400, planValidation.error, corsHeaders);
      }

      const planName = planValidation.value as string;
      if (!["essential", "pro", "ultimate"].includes(planName)) {
        return errorResponse(400, "Plan invalide", corsHeaders);
      }

      // Get actual price ID from environment
      const priceId = PRICE_IDS[planName];
      if (!priceId) {
        console.error(`Price ID not configured for plan: ${planName}`);
        return errorResponse(500, "Configuration de prix manquante", corsHeaders);
      }

      // Validate URLs
      const successUrlValidation = sanitizeString(successUrl, MAX_LENGTHS.url, "successUrl");
      const cancelUrlValidation = sanitizeString(cancelUrl, MAX_LENGTHS.url, "cancelUrl");

      if (successUrlValidation.error) {
        return errorResponse(400, successUrlValidation.error, corsHeaders);
      }
      if (cancelUrlValidation.error) {
        return errorResponse(400, cancelUrlValidation.error, corsHeaders);
      }

      // Use authenticated user's email and ID - ignore client-provided values
      const email = user.email;
      const userId = user.id;

      console.log("Creating checkout session for authenticated user:", { plan: planName, priceId, userId });

      // Check if customer already exists
      let customerId: string | undefined;
      if (email) {
        const existingCustomers = await stripe.customers.list({ email, limit: 1 });
        if (existingCustomers.data.length > 0) {
          customerId = existingCustomers.data[0].id;
        }
      }

      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ["card"],
        mode: "subscription",
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        success_url: successUrlValidation.value || `${req.headers.get("origin") || "https://prago-dev.lovable.app"}/dashboard?success=true`,
        cancel_url: cancelUrlValidation.value || `${req.headers.get("origin") || "https://prago-dev.lovable.app"}/pricing?canceled=true`,
        metadata: {
          user_id: userId,
        },
      };

      if (customerId) {
        sessionParams.customer = customerId;
      } else if (email) {
        sessionParams.customer_email = email;
      }

      const session = await stripe.checkout.sessions.create(sessionParams);

      console.log("Checkout session created:", session.id);

      return successResponse({ sessionId: session.id, url: session.url }, corsHeaders);
    }

    // Route: Create customer portal session
    if (path === "customer-portal") {
      const { body, error: parseError } = await safeParseJSON(req, MAX_LENGTHS.json, corsHeaders);
      if (parseError) return parseError;

      const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS_PORTAL, corsHeaders);
      if (unexpectedError) return unexpectedError;

      const { returnUrl } = body as Record<string, unknown>;

      // Validate returnUrl
      const returnUrlValidation = sanitizeString(returnUrl, MAX_LENGTHS.url, "returnUrl");
      if (returnUrlValidation.error) {
        return errorResponse(400, returnUrlValidation.error, corsHeaders);
      }

      // Get customer ID from Stripe using authenticated user's email
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });

      if (customers.data.length === 0) {
        return errorResponse(404, "Aucun client Stripe trouvé pour ce compte", corsHeaders);
      }

      const customerId = customers.data[0].id;
      console.log("Creating portal session for authenticated customer:", customerId);

      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrlValidation.value || `${req.headers.get("origin")}/profile`,
      });

      return successResponse({ url: session.url }, corsHeaders);
    }

    // Route: Get subscription status
    if (path === "subscription-status") {
      // Minimal body expected
      const { body, error: parseError } = await safeParseJSON(req, MAX_LENGTHS.json, corsHeaders);
      if (parseError) return parseError;

      const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS_STATUS, corsHeaders);
      if (unexpectedError) return unexpectedError;

      const email = user.email;
      console.log("Checking subscription for authenticated user:", email);

      const customers = await stripe.customers.list({ email, limit: 1 });

      if (customers.data.length === 0) {
        return successResponse({ subscription: null, plan: "free" }, corsHeaders);
      }

      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: "active",
        limit: 1,
      });

      if (subscriptions.data.length === 0) {
        return successResponse(
          {
            subscription: null,
            plan: "free",
            customerId: customers.data[0].id,
          },
          corsHeaders
        );
      }

      const subscription = subscriptions.data[0];
      const priceId = subscription.items.data[0]?.price.id;

      let plan = "free";
      if (priceId === PRICE_IDS.essential) {
        plan = "essential";
      } else if (priceId === PRICE_IDS.pro) {
        plan = "pro";
      } else if (priceId === PRICE_IDS.ultimate) {
        plan = "ultimate";
      }

      return successResponse(
        {
          subscription: {
            id: subscription.id,
            status: subscription.status,
            currentPeriodEnd: subscription.current_period_end,
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
          plan,
          customerId: customers.data[0].id,
        },
        corsHeaders
      );
    }

    return errorResponse(404, "Route non trouvée", corsHeaders);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Stripe error:", errorMessage);
    return errorResponse(500, "Erreur du service de paiement", corsHeaders);
  }
});
