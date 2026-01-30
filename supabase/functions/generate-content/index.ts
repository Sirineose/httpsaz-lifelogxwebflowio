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

async function extractTextFromImage(imageBase64: string, visionApiKey: string): Promise<string> {
  const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  
  const visionResponse = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${visionApiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Data },
            features: [
              { type: "TEXT_DETECTION" },
              { type: "DOCUMENT_TEXT_DETECTION" },
            ],
          },
        ],
      }),
    }
  );

  if (!visionResponse.ok) {
    throw new Error("Vision API error");
  }

  const visionData = await visionResponse.json();
  return visionData.responses?.[0]?.fullTextAnnotation?.text || 
         visionData.responses?.[0]?.textAnnotations?.[0]?.description || 
         "";
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
      const visionApiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
      if (!visionApiKey) {
        return new Response(
          JSON.stringify({ error: "Vision service not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log("Extracting text from image...");
      extractedText = await extractTextFromImage(imageBase64, visionApiKey);
      
      if (!extractedText) {
        return new Response(
          JSON.stringify({ error: "Aucun texte détecté dans l'image" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.log("Extracted text:", extractedText.substring(0, 100) + "...");
    }

    // Generate content with Mistral
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = getPromptForType(contentType, subject || "", options || {});
    
    console.log(`Generating ${contentType} with Mistral...`);

    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: prompt.system },
          { role: "user", content: prompt.user(extractedText) },
        ],
        max_tokens: 4000,
        temperature: 0.5,
      }),
    });

    if (!mistralResponse.ok) {
      const errorText = await mistralResponse.text();
      console.error("Mistral API error:", errorText);
      return new Response(
        JSON.stringify({ error: "AI service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const mistralData = await mistralResponse.json();
    const generatedContent = mistralData.choices?.[0]?.message?.content;

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
