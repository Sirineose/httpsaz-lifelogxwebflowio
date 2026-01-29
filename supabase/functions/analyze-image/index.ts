import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  imageBase64: string;
  subject?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authentication
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: AnalyzeRequest = await req.json();
    const { imageBase64, subject } = body;

    if (!imageBase64) {
      return new Response(
        JSON.stringify({ error: "Image is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Google Cloud Vision API key
    const visionApiKey = Deno.env.get("GOOGLE_CLOUD_VISION_API_KEY");
    if (!visionApiKey) {
      console.error("GOOGLE_CLOUD_VISION_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "Vision service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Remove data URL prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    console.log("Calling Google Cloud Vision API...");

    // Step 1: Extract text from image using Google Cloud Vision
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
      const errorText = await visionResponse.text();
      console.error("Vision API error:", errorText);
      return new Response(
        JSON.stringify({ error: "Vision service error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const visionData = await visionResponse.json();
    const extractedText = visionData.responses?.[0]?.fullTextAnnotation?.text || 
                          visionData.responses?.[0]?.textAnnotations?.[0]?.description || 
                          "";

    console.log("Extracted text:", extractedText.substring(0, 100) + "...");

    if (!extractedText) {
      return new Response(
        JSON.stringify({ 
          error: "Aucun texte détecté dans l'image. Assure-toi que l'image est nette et bien éclairée." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Send extracted text to Mistral for solution
    const mistralApiKey = Deno.env.get("MISTRAL_API_KEY");
    if (!mistralApiKey) {
      console.error("MISTRAL_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `Tu es PRAGO, un assistant pédagogique expert en résolution d'exercices.
${subject ? `Tu es spécialisé en ${subject}.` : ""}

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

    console.log("Calling Mistral API for solution...");

    const mistralResponse = await fetch("https://api.mistral.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${mistralApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-large-latest",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici le texte extrait de l'exercice :\n\n${extractedText}\n\nRésous cet exercice de manière détaillée.` },
        ],
        max_tokens: 3000,
        temperature: 0.3,
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
    const solution = mistralData.choices?.[0]?.message?.content;

    if (!solution) {
      console.error("No solution from Mistral:", mistralData);
      return new Response(
        JSON.stringify({ error: "No solution generated" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Solution generated successfully");

    return new Response(
      JSON.stringify({
        extractedText,
        solution,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in analyze-image function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
