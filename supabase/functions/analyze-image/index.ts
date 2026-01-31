/**
 * Analyze Image Edge Function (Snap & Solve)
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting (IP + User based)
 * - Input validation & sanitization
 * - File type validation
 * - Proper authentication handling
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkRateLimit,
  RATE_LIMITS,
  safeParseJSON,
  sanitizeString,
  validateBase64DataUrl,
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
const ALLOWED_FIELDS = ["imageBase64", "pdfBase64", "subject", "guestMode"];

// Allowed MIME types for uploads
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];
const ALLOWED_PDF_TYPES = ["application/pdf"];

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
    // RATE LIMITING
    // =========================================================================
    const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, undefined, corsHeaders);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // =========================================================================
    // PARSE & VALIDATE JSON BODY (larger limit for base64 images/PDFs)
    // =========================================================================
    const { body, error: parseError } = await safeParseJSON(
      req,
      MAX_LENGTHS.pdfBase64 + 1000, // Extra for JSON overhead
      corsHeaders
    );
    if (parseError) return parseError;

    // Reject unexpected fields
    const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS, corsHeaders);
    if (unexpectedError) return unexpectedError;

    const { imageBase64, pdfBase64, subject, guestMode } = body as {
      imageBase64?: unknown;
      pdfBase64?: unknown;
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

      // Re-check rate limit with user ID
      const userRateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, userId, corsHeaders);
      if (userRateLimitResponse) {
        return userRateLimitResponse;
      }
    }

    // =========================================================================
    // INPUT VALIDATION
    // =========================================================================

    // Validate image or PDF (one is required)
    let validatedFileBase64: string | null = null;
    let isPdf = false;

    if (pdfBase64) {
      const pdfValidation = validateBase64DataUrl(pdfBase64, "PDF", {
        maxSize: MAX_LENGTHS.pdfBase64,
        allowedMimeTypes: ALLOWED_PDF_TYPES,
      });
      if (pdfValidation.error) {
        return errorResponse(400, pdfValidation.error, corsHeaders);
      }
      validatedFileBase64 = pdfValidation.value;
      isPdf = true;
    } else if (imageBase64) {
      const imageValidation = validateBase64DataUrl(imageBase64, "Image", {
        maxSize: MAX_LENGTHS.imageBase64,
        allowedMimeTypes: ALLOWED_IMAGE_TYPES,
      });
      if (imageValidation.error) {
        return errorResponse(400, imageValidation.error, corsHeaders);
      }
      validatedFileBase64 = imageValidation.value;
    }

    if (!validatedFileBase64) {
      return errorResponse(400, "Image ou PDF requis", corsHeaders);
    }

    // Validate subject (optional)
    const subjectValidation = sanitizeString(subject, MAX_LENGTHS.subject, "subject");
    if (subjectValidation.error) {
      return errorResponse(400, subjectValidation.error, corsHeaders);
    }

    const validatedSubject = subjectValidation.value;

    // =========================================================================
    // CALL AI SERVICE
    // =========================================================================

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not set");
      return errorResponse(500, "Service IA non configuré", corsHeaders);
    }

    console.log(`Analyzing ${isPdf ? "PDF" : "image"} using Gemini...`);

    // Build the extraction prompt
    const extractionPrompt = isPdf
      ? "Extrais tout le texte visible dans ce document PDF. Retourne uniquement le texte brut, sans commentaire ni explication. Si c'est un document de cours, un exercice ou des notes, retourne le contenu tel quel."
      : "Extrais tout le texte visible dans cette image. Retourne uniquement le texte brut, sans commentaire ni explication. Si c'est un document de cours, un exercice ou des notes, retourne le contenu tel quel.";

    // Ensure proper data URL format
    let dataUrl = validatedFileBase64;
    if (isPdf && !validatedFileBase64.startsWith("data:")) {
      dataUrl = `data:application/pdf;base64,${validatedFileBase64}`;
    } else if (!isPdf && !validatedFileBase64.startsWith("data:")) {
      dataUrl = `data:image/jpeg;base64,${validatedFileBase64}`;
    }

    // Step 1: Extract text from image/PDF
    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-lite",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: extractionPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);

      if (geminiResponse.status === 429) {
        return errorResponse(429, "Trop de requêtes, réessayez plus tard", corsHeaders);
      }
      if (geminiResponse.status === 402) {
        return errorResponse(402, "Crédits insuffisants", corsHeaders);
      }
      return errorResponse(500, "Erreur du service IA", corsHeaders);
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.choices?.[0]?.message?.content || "";

    console.log("Extracted text:", extractedText.substring(0, 100) + "...");

    if (!extractedText || extractedText.trim().length === 0) {
      return errorResponse(
        400,
        "Aucun texte détecté dans l'image. Assure-toi que l'image est nette et bien éclairée.",
        corsHeaders
      );
    }

    // Step 2: Generate solution
    const systemPrompt = `Tu es PRAGO, un assistant pédagogique expert en résolution d'exercices.
${validatedSubject ? `Tu es spécialisé en ${validatedSubject}.` : ""}

Ta mission :
- Analyser l'exercice ou le problème extrait de l'image
- Fournir une solution détaillée, étape par étape
- Expliquer chaque étape de manière claire et pédagogique
- Utiliser des formules mathématiques quand nécessaire
- Encourager l'apprentissage en expliquant le raisonnement

Règles :
- Réponds toujours en français
- Structure ta réponse avec des titres en gras (**titre**)
- Utilise des listes numérotées pour les étapes
- Mets en évidence les résultats finaux
- Si l'exercice n'est pas clair, demande des précisions`;

    console.log("Calling Gemini for solution...");

    const solutionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Voici le texte extrait de l'exercice :\n\n${extractedText}\n\nRésous cet exercice de manière détaillée.`,
          },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!solutionResponse.ok) {
      const errorText = await solutionResponse.text();
      console.error("Gemini solution API error:", solutionResponse.status, errorText);

      if (solutionResponse.status === 429) {
        return errorResponse(429, "Trop de requêtes, réessayez plus tard", corsHeaders);
      }
      if (solutionResponse.status === 402) {
        return errorResponse(402, "Crédits insuffisants", corsHeaders);
      }
      return errorResponse(500, "Erreur du service IA", corsHeaders);
    }

    const solutionData = await solutionResponse.json();
    const solution = solutionData.choices?.[0]?.message?.content;

    if (!solution) {
      console.error("No solution from Gemini:", solutionData);
      return errorResponse(500, "Pas de solution générée", corsHeaders);
    }

    console.log("Solution generated successfully");

    return successResponse({ extractedText, solution }, corsHeaders);
  } catch (error) {
    console.error("Error in analyze-image function:", error);
    return errorResponse(500, "Erreur interne du serveur", corsHeaders);
  }
});
