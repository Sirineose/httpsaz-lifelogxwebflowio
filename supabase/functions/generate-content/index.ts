/**
 * Generate Content Edge Function (Flashcards, Quiz, Synthesis, Comics)
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting (IP + User based)
 * - Input validation & sanitization
 * - Content type validation
 * - Proper authentication handling
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  checkRateLimit,
  RATE_LIMITS,
  safeParseJSON,
  sanitizeString,
  validateBase64DataUrl,
  validateContentType,
  validateNumber,
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
const ALLOWED_FIELDS = ["imageBase64", "textContent", "contentType", "subject", "guestMode", "options"];
const ALLOWED_OPTION_FIELDS = ["count", "title"];

// Limits
const MAX_ITEMS = 20; // Max flashcards/quiz questions to generate
const MIN_ITEMS = 1;
const MAX_TEXT_LENGTH = 100000; // ~100KB text

type ContentType = "flashcards" | "quiz" | "synthesis" | "comic";

const getPromptForType = (contentType: ContentType, subject: string, count: number) => {
  switch (contentType) {
    case "flashcards":
      return {
        system: `Tu es PRAGO, un expert en création de flashcards éducatives.
${subject ? `Spécialité : ${subject}` : ""}

Crée exactement ${count} flashcards à partir du contenu fourni.
Chaque flashcard doit avoir :
- Une question claire et concise (front)
- Une réponse complète mais pas trop longue (back)

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.
Format exact :
{
  "flashcards": [
    {"front": "Question 1", "back": "Réponse 1"},
    {"front": "Question 2", "back": "Réponse 2"}
  ]
}`,
        user: (text: string) => `Crée ${count} flashcards à partir de ce contenu :\n\n${text}`,
      };

    case "quiz":
      return {
        system: `Tu es PRAGO, un expert en création de quiz éducatifs.
${subject ? `Spécialité : ${subject}` : ""}

Crée exactement ${count} questions à choix multiples à partir du contenu fourni.
Chaque question doit avoir :
- Une question claire
- 4 options de réponse
- L'index de la bonne réponse (0-3)

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.
Format exact :
{
  "questions": [
    {
      "question": "Question 1",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correct_index": 0
    }
  ]
}`,
        user: (text: string) => `Crée ${count} questions de quiz à partir de ce contenu :\n\n${text}`,
      };

    case "synthesis":
      return {
        system: `Tu es PRAGO, un expert en création de synthèses éducatives.
${subject ? `Spécialité : ${subject}` : ""}

Crée une synthèse claire et structurée du contenu fourni.
La synthèse doit :
- Résumer les points clés
- Être bien organisée avec des sections
- Faciliter la mémorisation
- Utiliser des listes à puces quand approprié

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.
Format exact :
{
  "title": "Titre de la synthèse",
  "content": "Contenu markdown de la synthèse",
  "tags": ["tag1", "tag2", "tag3"]
}`,
        user: (text: string) => `Crée une synthèse à partir de ce contenu :\n\n${text}`,
      };

    case "comic":
      return {
        system: `Tu es PRAGO, un expert en création de BD éducatives.
${subject ? `Spécialité : ${subject}` : ""}

Crée une BD éducative en ${count} panels pour expliquer le concept du contenu fourni.
Chaque panel doit :
- Avoir un contenu descriptif (ce qui se passe visuellement)
- Avoir un dialogue explicatif

IMPORTANT: Réponds UNIQUEMENT avec un JSON valide, sans texte avant ou après.
Format exact :
{
  "title": "Titre de la BD",
  "panels": [
    {"id": 1, "content": "Description visuelle", "hasDialog": true, "dialog": "Dialogue explicatif"},
    {"id": 2, "content": "Description visuelle", "hasDialog": true, "dialog": "Dialogue explicatif"}
  ]
}`,
        user: (text: string) => `Crée une BD éducative en ${count} panels à partir de ce contenu :\n\n${text}`,
      };
  }
};

async function extractTextFromImage(imageBase64: string, apiKey: string): Promise<string> {
  console.log("Extracting text from image using Gemini...");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extrais tout le texte visible dans cette image. Retourne uniquement le texte brut, sans commentaire ni explication. Si c'est un document de cours, un exercice ou des notes, retourne le contenu tel quel.",
            },
            {
              type: "image_url",
              image_url: { url: imageBase64 },
            },
          ],
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);

    if (response.status === 429) {
      throw new Error("RATE_LIMIT");
    }
    if (response.status === 402) {
      throw new Error("PAYMENT_REQUIRED");
    }
    throw new Error(`AI service error: ${response.status}`);
  }

  const data = await response.json();
  const extractedText = data.choices?.[0]?.message?.content || "";

  console.log("Extracted text length:", extractedText.length);
  return extractedText;
}

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
    const { body, error: parseError } = await safeParseJSON(
      req,
      MAX_LENGTHS.pdfBase64 + 1000,
      corsHeaders
    );
    if (parseError) return parseError;

    // Reject unexpected fields
    const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS, corsHeaders);
    if (unexpectedError) return unexpectedError;

    const { imageBase64, textContent, contentType, subject, guestMode, options } = body as {
      imageBase64?: unknown;
      textContent?: unknown;
      contentType?: unknown;
      subject?: unknown;
      guestMode?: unknown;
      options?: unknown;
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

    // Validate content type
    const contentTypeValidation = validateContentType(contentType);
    if (contentTypeValidation.error) {
      return errorResponse(400, contentTypeValidation.error, corsHeaders);
    }
    const validatedContentType = contentTypeValidation.value!;

    // Validate options
    let count = 5;
    if (options && typeof options === "object") {
      // Check for unexpected option fields
      const optionsObj = options as Record<string, unknown>;
      const unexpectedOptions = Object.keys(optionsObj).filter(k => !ALLOWED_OPTION_FIELDS.includes(k));
      if (unexpectedOptions.length > 0) {
        return errorResponse(400, "Options invalides", corsHeaders);
      }

      const countValidation = validateNumber(optionsObj.count, "count", {
        min: MIN_ITEMS,
        max: MAX_ITEMS,
        integer: true,
      });
      if (countValidation.error) {
        return errorResponse(400, countValidation.error, corsHeaders);
      }
      if (countValidation.value !== null) {
        count = countValidation.value;
      }
    }

    // Validate subject
    const subjectValidation = sanitizeString(subject, MAX_LENGTHS.subject, "subject");
    if (subjectValidation.error) {
      return errorResponse(400, subjectValidation.error, corsHeaders);
    }
    const validatedSubject = subjectValidation.value || "";

    // Validate image or text (one required)
    let validatedImageBase64: string | null = null;
    let validatedTextContent: string | null = null;

    if (imageBase64) {
      const imageValidation = validateBase64DataUrl(imageBase64, "Image", {
        maxSize: MAX_LENGTHS.imageBase64,
      });
      if (imageValidation.error) {
        return errorResponse(400, imageValidation.error, corsHeaders);
      }
      validatedImageBase64 = imageValidation.value;
    }

    if (textContent) {
      const textValidation = sanitizeString(textContent, MAX_TEXT_LENGTH, "textContent", {
        allowNewlines: true,
      });
      if (textValidation.error) {
        return errorResponse(400, textValidation.error, corsHeaders);
      }
      validatedTextContent = textValidation.value;
    }

    if (!validatedImageBase64 && !validatedTextContent) {
      return errorResponse(400, "Image ou texte requis", corsHeaders);
    }

    // =========================================================================
    // CALL AI SERVICE
    // =========================================================================

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse(500, "Service IA non configuré", corsHeaders);
    }

    let extractedText = validatedTextContent || "";

    // Extract text from image if provided
    if (validatedImageBase64) {
      console.log("Extracting text from image...");
      try {
        extractedText = await extractTextFromImage(validatedImageBase64, LOVABLE_API_KEY);
      } catch (err) {
        const errMsg = (err as Error).message;
        if (errMsg === "RATE_LIMIT") {
          return errorResponse(429, "Trop de requêtes, réessayez plus tard", corsHeaders);
        }
        if (errMsg === "PAYMENT_REQUIRED") {
          return errorResponse(402, "Crédits insuffisants", corsHeaders);
        }
        throw err;
      }

      if (!extractedText) {
        return errorResponse(400, "Aucun texte détecté dans l'image", corsHeaders);
      }
      console.log("Extracted text:", extractedText.substring(0, 100) + "...");
    }

    // Generate content
    const prompt = getPromptForType(validatedContentType, validatedSubject, count);

    console.log(`Generating ${validatedContentType} with Gemini...`);

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user(extractedText) },
        ],
        max_tokens: 4000,
        temperature: 0.5,
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
    const generatedContent = geminiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      return errorResponse(500, "Pas de contenu généré", corsHeaders);
    }

    console.log("Raw AI response:", generatedContent.substring(0, 200));

    // Parse JSON response
    let parsedContent;
    try {
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return errorResponse(500, "Échec de l'analyse de la réponse IA", corsHeaders);
    }

    console.log(`Generated ${validatedContentType} successfully`);

    return successResponse(
      {
        success: true,
        contentType: validatedContentType,
        extractedText: validatedImageBase64 ? extractedText : undefined,
        data: parsedContent,
      },
      corsHeaders
    );
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return errorResponse(500, "Erreur interne du serveur", corsHeaders);
  }
});
