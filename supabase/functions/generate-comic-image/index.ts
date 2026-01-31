/**
 * Generate Comic Image Edge Function
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting (IP + User based)
 * - Input validation & sanitization
 * - Proper authentication handling
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed fields in request body
const ALLOWED_FIELDS = ["panelDescription", "subject", "style", "guestMode"];

// Maximum description length
const MAX_DESCRIPTION_LENGTH = 1000;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return errorResponse(405, "Méthode non autorisée", corsHeaders);
  }

  let userId: string | undefined;

  try {
    // =========================================================================
    // RATE LIMITING
    // =========================================================================
    const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, undefined, corsHeaders);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // =========================================================================
    // PARSE & VALIDATE JSON BODY
    // =========================================================================
    const { body, error: parseError } = await safeParseJSON(req, MAX_LENGTHS.json, corsHeaders);
    if (parseError) return parseError;

    // Reject unexpected fields
    const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS, corsHeaders);
    if (unexpectedError) return unexpectedError;

    const { panelDescription, subject, style, guestMode } = body as Record<string, unknown>;

    // =========================================================================
    // AUTHENTICATION
    // =========================================================================
    if (!guestMode) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return errorResponse(401, "Non autorisé", corsHeaders);
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);

      if (claimsError || !claimsData?.claims) {
        return errorResponse(401, "Non autorisé", corsHeaders);
      }

      userId = claimsData.claims.sub as string;

      // Re-check rate limit with user ID
      const userRateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, userId, corsHeaders);
      if (userRateLimitResponse) {
        return userRateLimitResponse;
      }
    }

    // =========================================================================
    // INPUT VALIDATION
    // =========================================================================

    // Validate panelDescription
    const descriptionValidation = sanitizeString(
      panelDescription,
      MAX_DESCRIPTION_LENGTH,
      "panelDescription",
      { required: true, allowNewlines: true }
    );
    if (descriptionValidation.error) {
      return errorResponse(400, descriptionValidation.error, corsHeaders);
    }
    const validatedDescription = descriptionValidation.value!;

    // Validate subject
    const subjectValidation = sanitizeString(subject, MAX_LENGTHS.subject, "subject", {
      required: true,
    });
    if (subjectValidation.error) {
      return errorResponse(400, subjectValidation.error, corsHeaders);
    }
    const validatedSubject = subjectValidation.value!;

    // Validate style (optional, default to "comic")
    const styleValidation = sanitizeString(style, 50, "style");
    if (styleValidation.error) {
      return errorResponse(400, styleValidation.error, corsHeaders);
    }
    const validatedStyle = styleValidation.value || "comic";

    // =========================================================================
    // CALL AI SERVICE
    // =========================================================================

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse(500, "Service IA non configuré", corsHeaders);
    }

    // Build the image generation prompt
    const imagePrompt = `Create a colorful educational comic panel illustration in a friendly cartoon style.
Subject: ${validatedSubject}
Scene: ${validatedDescription}

Style requirements:
- Colorful and vibrant colors
- Educational and kid-friendly
- Clear simple shapes
- Cartoon/comic book aesthetic
- No text or speech bubbles in the image
- Square format suitable for a comic panel`;

    console.log("Generating comic panel image with Gemini...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          {
            role: "user",
            content: imagePrompt,
          },
        ],
        modalities: ["image", "text"],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini image API error:", response.status, errorText);

      if (response.status === 429) {
        return errorResponse(429, "Trop de requêtes, réessayez plus tard", corsHeaders);
      }
      if (response.status === 402) {
        return errorResponse(402, "Crédits insuffisants", corsHeaders);
      }
      return errorResponse(500, "Échec de la génération d'image", corsHeaders);
    }

    const data = await response.json();
    const imageUrl = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

    if (!imageUrl) {
      console.error("No image generated:", data);
      return successResponse({ error: "Pas d'image générée", fallback: true }, corsHeaders);
    }

    console.log("Comic panel image generated successfully");

    return successResponse({ success: true, imageUrl }, corsHeaders);
  } catch (error) {
    console.error("Error in generate-comic-image function:", error);
    return errorResponse(500, "Erreur interne du serveur", corsHeaders);
  }
});
