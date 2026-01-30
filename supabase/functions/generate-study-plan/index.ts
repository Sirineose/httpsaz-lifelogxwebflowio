import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ExamTopic {
  name: string;
  completed: boolean;
}

interface GeneratePlanRequest {
  examId: string;
  examTitle: string;
  examSubject: string;
  examDate: string;
  topics: ExamTopic[];
  availableHoursPerDay?: number;
  preferredStartTime?: string;
  guestMode?: boolean;
}

interface StudySessionSuggestion {
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  topic: string;
  description: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: GeneratePlanRequest = await req.json();
    const { 
      examId, 
      examTitle, 
      examSubject, 
      examDate, 
      topics, 
      availableHoursPerDay = 2,
      preferredStartTime = "18:00",
      guestMode 
    } = body;

    // Allow guest mode without authentication
    if (!guestMode) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { error: claimsError } = await supabase.auth.getClaims(token);
      
      if (claimsError) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Filter incomplete topics
    const incompleteTopics = topics.filter(t => !t.completed);
    if (incompleteTopics.length === 0) {
      return new Response(
        JSON.stringify({ 
          sessions: [],
          advice: "Félicitations ! Tu as terminé tous les chapitres. Continue à réviser pour consolider tes acquis."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date();
    const exam = new Date(examDate);
    const daysRemaining = Math.max(1, Math.ceil((exam.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    console.log(`Generating study plan for ${examTitle} - ${incompleteTopics.length} topics, ${daysRemaining} days`);

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
- Examen: ${examTitle}
- Matière: ${examSubject}
- Date de l'examen: ${examDate}
- Jours restants: ${daysRemaining}
- Heures disponibles par jour: ${availableHoursPerDay}h
- Heure de début préférée: ${preferredStartTime}
- Date d'aujourd'hui: ${today.toISOString().split('T')[0]}

Chapitres à réviser (${incompleteTopics.length}):
${incompleteTopics.map((t, i) => `${i + 1}. ${t.name}`).join('\n')}

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
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaye dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    
    console.log("AI response:", content.substring(0, 200));

    // Parse JSON from response
    let planData;
    try {
      // Try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        planData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ 
          sessions: [],
          advice: "Je n'ai pas pu générer un planning automatique. Essaie de créer tes sessions manuellement."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        sessions: planData.sessions || [],
        advice: planData.advice || "Bonne révision !",
        examId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-study-plan:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
