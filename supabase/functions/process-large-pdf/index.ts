/**
 * Process Large PDF Edge Function
 * 
 * SECURITY: This function implements OWASP best practices:
 * - Rate limiting (IP + User based)
 * - Input validation & sanitization
 * - Authentication required (no guest mode for large files)
 * - Secure file handling
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
const ALLOWED_FIELDS = ["storagePath", "fileName"];

// Storage path pattern (user_id/timestamp_filename)
const STORAGE_PATH_REGEX = /^[0-9a-f-]{36}\/\d+_[\w.-]+$/i;

// Maximum file size (50MB)
const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
    // RATE LIMITING (stricter for large file processing)
    // =========================================================================
    const rateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, undefined, corsHeaders);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }

    // =========================================================================
    // AUTHENTICATION (required - no guest mode for large files)
    // =========================================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return errorResponse(401, "Non autorisé", corsHeaders);
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

    if (claimsError || !claimsData?.claims) {
      return errorResponse(401, "Non autorisé", corsHeaders);
    }

    userId = claimsData.claims.sub as string;

    // Re-check rate limit with user ID
    const userRateLimitResponse = checkRateLimit(req, RATE_LIMITS.ai, userId, corsHeaders);
    if (userRateLimitResponse) {
      return userRateLimitResponse;
    }

    // =========================================================================
    // PARSE & VALIDATE JSON BODY
    // =========================================================================
    const { body, error: parseError } = await safeParseJSON(req, MAX_LENGTHS.json, corsHeaders);
    if (parseError) return parseError;

    // Reject unexpected fields
    const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS, corsHeaders);
    if (unexpectedError) return unexpectedError;

    const { storagePath, fileName } = body as Record<string, unknown>;

    // =========================================================================
    // INPUT VALIDATION
    // =========================================================================

    // Validate storagePath
    const pathValidation = sanitizeString(storagePath, MAX_LENGTHS.filename * 2, "storagePath", {
      required: true,
      pattern: STORAGE_PATH_REGEX,
    });
    if (pathValidation.error) {
      return errorResponse(400, "Chemin de fichier invalide", corsHeaders);
    }
    const validatedPath = pathValidation.value!;

    // Security: Ensure the path belongs to the authenticated user
    if (!validatedPath.startsWith(`${userId}/`)) {
      console.warn(`User ${userId} attempted to access file at ${validatedPath}`);
      return errorResponse(403, "Accès refusé à ce fichier", corsHeaders);
    }

    // Validate fileName
    const nameValidation = sanitizeString(fileName, MAX_LENGTHS.filename, "fileName", {
      required: true,
    });
    if (nameValidation.error) {
      return errorResponse(400, nameValidation.error, corsHeaders);
    }
    const validatedFileName = nameValidation.value!;

    // =========================================================================
    // DOWNLOAD & PROCESS FILE
    // =========================================================================

    // Use service role for storage access
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    console.log(`Processing large PDF: ${validatedPath}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(validatedPath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      return errorResponse(404, "Fichier non trouvé", corsHeaders);
    }

    // Check file size
    const arrayBuffer = await fileData.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_FILE_SIZE) {
      // Clean up
      await supabase.storage.from("documents").remove([validatedPath]);
      return errorResponse(413, "Fichier trop volumineux (max 50MB)", corsHeaders);
    }

    // Convert to base64 for Gemini
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );
    const dataUrl = `data:application/pdf;base64,${base64}`;

    console.log(`PDF size: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // =========================================================================
    // CALL AI SERVICE
    // =========================================================================

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      // Clean up
      await supabase.storage.from("documents").remove([validatedPath]);
      return errorResponse(500, "Service IA non configuré", corsHeaders);
    }

    console.log("Extracting text from large PDF using Gemini...");

    const extractionPrompt = `Tu es un expert en extraction de texte de documents PDF.
    
Extrais TOUT le texte de ce document PDF, page par page.
Structure ta réponse ainsi :
- Garde la structure du document (titres, sous-titres, paragraphes)
- Numérote les pages si possible
- Préserve les listes, tableaux et formules
- N'ajoute pas de commentaires, retourne uniquement le contenu du document

Le document semble être un cours ou du matériel éducatif. Sois exhaustif dans l'extraction.`;

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: extractionPrompt },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 8000,
        temperature: 0.1,
      }),
    });

    // Clean up storage file regardless of result
    await supabase.storage.from("documents").remove([validatedPath]);
    console.log("Cleaned up storage file");

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

    if (!extractedText || extractedText.trim().length < 50) {
      return errorResponse(
        400,
        "Aucun texte significatif n'a pu être extrait du PDF. Vérifiez que le fichier n'est pas protégé ou corrompu.",
        corsHeaders
      );
    }

    // Estimate page count based on content
    const estimatedPageCount = Math.max(1, Math.ceil(extractedText.length / 3000));

    console.log(`Extracted ${extractedText.length} characters (~${estimatedPageCount} pages)`);

    return successResponse(
      {
        extractedText,
        pageCount: estimatedPageCount,
        fileName: validatedFileName,
        characterCount: extractedText.length,
      },
      corsHeaders
    );
  } catch (error) {
    console.error("Error in process-large-pdf function:", error);
    return errorResponse(500, "Erreur interne du serveur", corsHeaders);
  }
});
