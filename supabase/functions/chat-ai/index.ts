/**
 * Chat AI Edge Function
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting (IP + User based)
 * - Input validation & sanitization
 * - Proper authentication handling
 * - No sensitive data exposure
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkRateLimit,
  RATE_LIMITS,
  safeParseJSON,
  sanitizeString,
  validateArray,
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

// Allowed fields in request body - reject anything else
const ALLOWED_FIELDS = ["messages", "subject", "guestMode"];

// Maximum messages in conversation to prevent abuse
const MAX_MESSAGES = 50;
const MAX_MESSAGE_LENGTH = 5000;

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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

  let userId: string | undefined;

  try {
    // =========================================================================
    // RATE LIMITING - Apply before any processing
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

    // Reject unexpected fields (prevent parameter pollution)
    const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS, corsHeaders);
    if (unexpectedError) return unexpectedError;

    const { messages, subject, guestMode } = body as {
      messages?: unknown;
      subject?: unknown;
      guestMode?: unknown;
    };

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

      // Re-check rate limit with user ID for more accurate limiting
      const userRateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, userId, corsHeaders);
      if (userRateLimitResponse) {
        return userRateLimitResponse;
      }
    }

    // =========================================================================
    // INPUT VALIDATION
    // =========================================================================

    // Validate messages array
    const messagesValidation = validateArray<Message>(
      messages,
      "messages",
      (item, index) => {
        if (typeof item !== "object" || item === null) {
          return { value: null, error: "doit être un objet" };
        }

        const msg = item as Record<string, unknown>;

        // Validate role
        if (!["user", "assistant", "system"].includes(msg.role as string)) {
          return { value: null, error: "rôle invalide" };
        }

        // Validate and sanitize content
        const contentValidation = sanitizeString(
          msg.content,
          MAX_MESSAGE_LENGTH,
          `message[${index}].content`,
          { required: true, allowNewlines: true }
        );

        if (contentValidation.error) {
          return { value: null, error: contentValidation.error };
        }

        return {
          value: {
            role: msg.role as "user" | "assistant" | "system",
            content: contentValidation.value!,
          },
          error: null,
        };
      },
      { required: true, minLength: 1, maxLength: MAX_MESSAGES }
    );

    if (messagesValidation.error) {
      return errorResponse(400, messagesValidation.error, corsHeaders);
    }

    // Validate subject (optional)
    const subjectValidation = sanitizeString(subject, MAX_LENGTHS.subject, "subject");
    if (subjectValidation.error) {
      return errorResponse(400, subjectValidation.error, corsHeaders);
    }

    const validatedMessages = messagesValidation.value!;
    const validatedSubject = subjectValidation.value;

    // =========================================================================
    // CALL AI SERVICE
    // =========================================================================

    // Build system prompt for educational assistant
    const systemPrompt = `Tu es PRAGO, un assistant pédagogique intelligent et bienveillant pour les étudiants francophones.

Ton rôle :
- Aider les étudiants à comprendre leurs cours et exercices
- Expliquer les concepts de manière claire et adaptée à leur niveau
- Fournir des exemples concrets et des analogies pour faciliter la compréhension
- Encourager et motiver les étudiants dans leur apprentissage
${validatedSubject ? `- Tu es spécialisé en ${validatedSubject} pour cette conversation` : ""}

Règles :
- Réponds toujours en français
- Sois patient et encourageant
- Utilise des émojis pour rendre tes réponses plus engageantes
- Structure tes réponses avec des titres et des listes si nécessaire
- Si l'étudiant fait une erreur, guide-le vers la bonne réponse sans la donner directement`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...validatedMessages,
    ];

    // Call Mistral API (key from environment, never exposed)
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      console.error("MISTRAL_API_KEY is not set");
      return errorResponse(500, "Service IA non configuré", corsHeaders);
    }

    console.log(`Chat AI request: ${validatedMessages.length} messages, subject: ${validatedSubject || "none"}`);

    const aiResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: apiMessages,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("Mistral API error:", aiResponse.status, errorText);

      if (aiResponse.status === 429) {
        return errorResponse(429, "Service IA surchargé, réessayez plus tard", corsHeaders);
      }

      return errorResponse(500, "Erreur du service IA", corsHeaders);
    }

    const aiData = await aiResponse.json();
    const assistantMessage = aiData.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      console.error("No response from AI:", aiData);
      return errorResponse(500, "Pas de réponse de l'IA", corsHeaders);
    }

    console.log("AI response received successfully");

    return successResponse(
      {
        message: assistantMessage,
        role: "assistant",
      },
      corsHeaders
    );
  } catch (error) {
    console.error("Error in chat-ai function:", error);
    return errorResponse(500, "Erreur interne du serveur", corsHeaders);
  }
});
