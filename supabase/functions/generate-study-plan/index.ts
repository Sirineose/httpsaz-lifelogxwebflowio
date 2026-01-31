/**
 * Generate Study Plan Edge Function
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
  validateUUID,
  validateNumber,
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

// Allowed fields in request body
const ALLOWED_FIELDS = [
  "examId",
  "examTitle",
  "examSubject",
  "examDate",
  "topics",
  "availableHoursPerDay",
  "preferredStartTime",
  "guestMode",
];

// Limits
const MAX_TOPICS = 50;
const MAX_HOURS_PER_DAY = 12;
const MIN_HOURS_PER_DAY = 0.5;

// Time format regex (HH:MM)
const TIME_REGEX = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;

// Date format regex (YYYY-MM-DD)
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

interface ExamTopic {
  name: string;
  completed: boolean;
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
    const { body, error: parseError } = await safeParseJSON(req, MAX_LENGTHS.json, corsHeaders);
    if (parseError) return parseError;

    // Reject unexpected fields
    const unexpectedError = rejectUnexpectedFields(body!, ALLOWED_FIELDS, corsHeaders);
    if (unexpectedError) return unexpectedError;

    const {
      examId,
      examTitle,
      examSubject,
      examDate,
      topics,
      availableHoursPerDay,
      preferredStartTime,
      guestMode,
    } = body as Record<string, unknown>;

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
      const { error: claimsError, data: claimsData } = await supabase.auth.getClaims(token);

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

    // Validate examId
    const examIdValidation = validateUUID(examId, "examId");
    if (examIdValidation.error) {
      return errorResponse(400, examIdValidation.error, corsHeaders);
    }
    const validatedExamId = examIdValidation.value!;

    // Validate examTitle
    const titleValidation = sanitizeString(examTitle, MAX_LENGTHS.name, "examTitle", { required: true });
    if (titleValidation.error) {
      return errorResponse(400, titleValidation.error, corsHeaders);
    }
    const validatedTitle = titleValidation.value!;

    // Validate examSubject
    const subjectValidation = sanitizeString(examSubject, MAX_LENGTHS.subject, "examSubject", { required: true });
    if (subjectValidation.error) {
      return errorResponse(400, subjectValidation.error, corsHeaders);
    }
    const validatedSubject = subjectValidation.value!;

    // Validate examDate
    const dateValidation = sanitizeString(examDate, 10, "examDate", {
      required: true,
      pattern: DATE_REGEX,
    });
    if (dateValidation.error) {
      return errorResponse(400, "Format de date invalide (YYYY-MM-DD)", corsHeaders);
    }
    const validatedDate = dateValidation.value!;

    // Validate date is in the future
    const examDateObj = new Date(validatedDate);
    if (isNaN(examDateObj.getTime())) {
      return errorResponse(400, "Date d'examen invalide", corsHeaders);
    }

    // Validate topics array
    const topicsValidation = validateArray<ExamTopic>(
      topics,
      "topics",
      (item) => {
        if (typeof item !== "object" || item === null) {
          return { value: null, error: "doit être un objet" };
        }

        const topic = item as Record<string, unknown>;

        const nameValidation = sanitizeString(topic.name, MAX_LENGTHS.name, "name", { required: true });
        if (nameValidation.error) {
          return { value: null, error: nameValidation.error };
        }

        return {
          value: {
            name: nameValidation.value!,
            completed: topic.completed === true,
          },
          error: null,
        };
      },
      { required: true, minLength: 1, maxLength: MAX_TOPICS }
    );

    if (topicsValidation.error) {
      return errorResponse(400, topicsValidation.error, corsHeaders);
    }
    const validatedTopics = topicsValidation.value!;

    // Validate availableHoursPerDay
    const hoursValidation = validateNumber(availableHoursPerDay, "availableHoursPerDay", {
      min: MIN_HOURS_PER_DAY,
      max: MAX_HOURS_PER_DAY,
    });
    if (hoursValidation.error) {
      return errorResponse(400, hoursValidation.error, corsHeaders);
    }
    const validatedHours = hoursValidation.value ?? 2;

    // Validate preferredStartTime
    let validatedStartTime = "18:00";
    if (preferredStartTime) {
      const timeValidation = sanitizeString(preferredStartTime, 5, "preferredStartTime", {
        pattern: TIME_REGEX,
      });
      if (timeValidation.error) {
        return errorResponse(400, "Format d'heure invalide (HH:MM)", corsHeaders);
      }
      validatedStartTime = timeValidation.value || "18:00";
    }

    // =========================================================================
    // CALL AI SERVICE
    // =========================================================================

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return errorResponse(500, "Service IA non configuré", corsHeaders);
    }

    // Filter incomplete topics
    const incompleteTopics = validatedTopics.filter((t) => !t.completed);
    if (incompleteTopics.length === 0) {
      return successResponse(
        {
          sessions: [],
          advice: "Félicitations ! Tu as terminé tous les chapitres. Continue à réviser pour consolider tes acquis.",
        },
        corsHeaders
      );
    }

    const today = new Date();
    const daysRemaining = Math.max(1, Math.ceil((examDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    console.log(`Generating study plan for ${validatedTitle} - ${incompleteTopics.length} topics, ${daysRemaining} days`);

    const systemPrompt = `Tu es PRAGO, un expert en planification de révisions. Tu dois créer un planning de révision optimal.

RÈGLES IMPORTANTES:
- Retourne UNIQUEMENT un objet JSON valide, sans texte avant ou après
- Répartis les chapitres de manière équilibrée sur les jours disponibles
- Prévois des sessions de révision de 45min à 2h maximum
- Alterne les sujets difficiles et faciles
- Inclus des pauses et des sessions de révision synthétique
- Les dates doivent être au format YYYY-MM-DD
- Les heures au format HH:MM

FORMAT DE RÉPONSE (JSON strict):
{
  "sessions": [
    {
      "date": "2026-02-01",
      "startTime": "18:00",
      "endTime": "19:30",
      "subject": "Mathématiques",
      "topic": "Équations différentielles",
      "description": "Première lecture et exercices de base"
    }
  ],
  "advice": "Conseil personnalisé pour l'étudiant"
}`;

    const userPrompt = `Crée un planning de révision pour:
- Examen: ${validatedTitle}
- Matière: ${validatedSubject}
- Date de l'examen: ${validatedDate}
- Jours restants: ${daysRemaining}
- Heures disponibles par jour: ${validatedHours}h
- Heure de début préférée: ${validatedStartTime}
- Date d'aujourd'hui: ${today.toISOString().split("T")[0]}

Chapitres à réviser (${incompleteTopics.length}):
${incompleteTopics.map((t, i) => `${i + 1}. ${t.name}`).join("\n")}

Génère un planning réaliste et efficace.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);

      if (response.status === 429) {
        return errorResponse(429, "Trop de requêtes, réessayez plus tard", corsHeaders);
      }
      if (response.status === 402) {
        return errorResponse(402, "Crédits insuffisants", corsHeaders);
      }
      return errorResponse(500, "Erreur du service IA", corsHeaders);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    console.log("AI response:", content.substring(0, 200));

    // Parse JSON from response
    let planData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return successResponse(
        {
          sessions: [],
          advice: "Je n'ai pas pu générer un planning automatique. Essaie de créer tes sessions manuellement.",
        },
        corsHeaders
      );
    }

    return successResponse(
      {
        sessions: planData.sessions || [],
        advice: planData.advice || "Bonne révision !",
        examId: validatedExamId,
      },
      corsHeaders
    );
  } catch (error) {
    console.error("Error in generate-study-plan:", error);
    return errorResponse(500, "Erreur interne du serveur", corsHeaders);
  }
});
