/**
 * Stripe Webhook Edge Function
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting (lenient for webhooks)
 * - Webhook signature verification
 * - No authentication (webhooks are verified via signature)
 */

import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import {
  checkRateLimit,
  RATE_LIMITS,
} from "../_shared/security.ts";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2023-10-16",
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;

Deno.serve(async (req) => {
  // =========================================================================
  // RATE LIMITING (lenient for webhooks)
  // =========================================================================
  const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.webhook, undefined, {});
  if (rateLimitResponse) {
    return rateLimitResponse;
  }

  // =========================================================================
  // WEBHOOK SIGNATURE VERIFICATION
  // =========================================================================
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    console.error("No Stripe signature found");
    return new Response("No signature", { status: 400 });
  }

  try {
    const body = await req.text();

    // Verify webhook signature (this is the primary security mechanism)
    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : "Unknown error";
      console.error("Webhook signature verification failed:", errMessage);
      return new Response(`Webhook signature verification failed: ${errMessage}`, { status: 400 });
    }

    console.log("Received Stripe event:", event.type);

    // =========================================================================
    // HANDLE EVENTS
    // =========================================================================

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout completed:", session.id);

        const userId = session.metadata?.user_id;
        const customerId = session.customer as string;
        const subscriptionId = session.subscription as string;

        if (userId && customerId) {
          // Update user profile with Stripe customer ID
          const { error } = await supabase
            .from("profiles")
            .update({
              stripe_customer_id: customerId,
              subscription_id: subscriptionId,
              subscription_status: "active",
            })
            .eq("user_id", userId);

          if (error) {
            console.error("Error updating profile:", error);
          } else {
            console.log("Profile updated with subscription info");
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription updated:", subscription.id);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: subscription.status,
            subscription_cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq("subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription status:", error);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        console.log("Subscription deleted:", subscription.id);

        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_status: "canceled",
            subscription_id: null,
          })
          .eq("subscription_id", subscription.id);

        if (error) {
          console.error("Error updating subscription status:", error);
        }
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment succeeded for invoice:", invoice.id);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        console.log("Payment failed for invoice:", invoice.id);

        const customerId = invoice.customer as string;

        const { error } = await supabase
          .from("profiles")
          .update({ subscription_status: "past_due" })
          .eq("stripe_customer_id", customerId);

        if (error) {
          console.error("Error updating payment status:", error);
        }
        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    return new Response(`Webhook error: ${errorMessage}`, { status: 500 });
  }
});
