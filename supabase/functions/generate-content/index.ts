import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentType = "flashcards" | "quiz" | "synthesis" | "comic";

interface GenerateRequest {
  imageBase64?: string;
  textContent?: string;
  contentType: ContentType;
  subject?: string;
  guestMode?: boolean;
  options?: {
    count?: number; // Number of items to generate
    title?: string;
  };
}

const getPromptForType = (contentType: ContentType, subject: string, options: any) => {
  const count = options?.count || 5;
  
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

async function extractTextFromImage(imageBase64: string): Promise<string> {
  console.log("Extracting text from image using Gemini...");
  
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) {
    throw new Error("LOVABLE_API_KEY is not configured");
  }

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            {
              type: "text",
              text: "Extrais tout le texte visible dans cette image. Retourne uniquement le texte brut, sans commentaire ni explication. Si c'est un document de cours, un exercice ou des notes, retourne le contenu tel quel."
            },
            {
              type: "image_url",
              image_url: {
                url: imageBase64
              }
            }
          ]
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Gemini API error:", response.status, errorText);
    
    if (response.status === 429) {
      throw new Error("Rate limit exceeded, please try again later");
    }
    if (response.status === 402) {
      throw new Error("Payment required, please add credits");
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

  try {
    const body: GenerateRequest = await req.json();
    const { imageBase64, textContent, contentType, subject, guestMode, options } = body;

    // Auth check for non-guest mode
    if (!guestMode) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    if (!imageBase64 && !textContent) {
      return new Response(
        JSON.stringify({ error: "Image or text content is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!contentType) {
      return new Response(
        JSON.stringify({ error: "Content type is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let extractedText = textContent || "";

    // Extract text from image if provided
    if (imageBase64) {
      console.log("Extracting text from image...");
      extractedText = await extractTextFromImage(imageBase64);
      
      if (!extractedText) {
        return new Response(
          JSON.stringify({ error: "Aucun texte détecté dans l'image" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Extracted text:", extractedText.substring(0, 100) + "...");
    }

    // Generate content with Lovable AI Gateway (Gemini)
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = getPromptForType(contentType, subject || "", options || {});
    
    console.log(`Generating ${contentType} with Gemini...`);

    const geminiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
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
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaye dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (geminiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "Crédits insuffisants." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const generatedContent = geminiData.choices?.[0]?.message?.content;

    if (!generatedContent) {
      return new Response(
        JSON.stringify({ error: "No content generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Raw AI response:", generatedContent.substring(0, 200));

    // Parse JSON response
    let parsedContent;
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response", raw: generatedContent }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generated ${contentType} successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        contentType,
        extractedText: imageBase64 ? extractedText : undefined,
        data: parsedContent,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in generate-content function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
