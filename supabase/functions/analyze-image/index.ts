import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AnalyzeRequest {
  imageBase64?: string;
  pdfBase64?: string;
  subject?: string;
  guestMode?: boolean;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body: AnalyzeRequest = await req.json();
    const { imageBase64, pdfBase64, subject, guestMode } = body;

    // Allow guest mode without authentication
    if (!guestMode) {
      // Verify authentication for non-guest requests
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
    }

    // Check if we have either image or PDF
    const fileBase64 = imageBase64 || pdfBase64;
    const isPdf = !!pdfBase64;
    
    if (!fileBase64) {
      return new Response(
        JSON.stringify({ error: "Image or PDF is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get Lovable API key for Gemini
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not set");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Extracting text from ${isPdf ? "PDF" : "image"} using Gemini...`);

    // Determine the content type based on file type
    const mimeType = isPdf ? "application/pdf" : fileBase64.split(";")[0]?.split(":")[1] || "image/jpeg";
    const extractionPrompt = isPdf
      ? "Extrais tout le texte visible dans ce document PDF. Retourne uniquement le texte brut, sans commentaire ni explication. Si c'est un document de cours, un exercice ou des notes, retourne le contenu tel quel."
      : "Extrais tout le texte visible dans cette image. Retourne uniquement le texte brut, sans commentaire ni explication. Si c'est un document de cours, un exercice ou des notes, retourne le contenu tel quel.";

    // Build the content array for Gemini - handle both PDF and image
    const contentArray: Array<{type: string; text?: string; image_url?: {url: string}; file?: {data: string; mimeType: string}}> = [
      {
        type: "text",
        text: extractionPrompt
      }
    ];

    if (isPdf) {
      // For PDF, use the file format that Gemini supports
      const base64Data = fileBase64.includes(",") ? fileBase64.split(",")[1] : fileBase64;
      contentArray.push({
        type: "file",
        file: {
          data: base64Data,
          mimeType: "application/pdf"
        }
      });
    } else {
      contentArray.push({
        type: "image_url",
        image_url: {
          url: fileBase64
        }
      });
    }

    // Step 1: Extract text from image/PDF using Gemini 2.5 Flash Lite (cheapest)
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
            content: contentArray
          }
        ],
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
          JSON.stringify({ error: "Crédits insuffisants, contacte l'administrateur." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      return new Response(
        JSON.stringify({ error: "Erreur du service IA" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.choices?.[0]?.message?.content || "";

    console.log("Extracted text:", extractedText.substring(0, 100) + "...");

    if (!extractedText || extractedText.trim().length === 0) {
      return new Response(
        JSON.stringify({ 
          error: "Aucun texte détecté dans l'image. Assure-toi que l'image est nette et bien éclairée." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Step 2: Generate solution with Gemini (same API key, different model for better reasoning)
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

    console.log("Calling Gemini for solution...");

    const solutionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Voici le texte extrait de l'exercice :\n\n${extractedText}\n\nRésous cet exercice de manière détaillée.` },
        ],
        max_tokens: 3000,
        temperature: 0.3,
      }),
    });

    if (!solutionResponse.ok) {
      const errorText = await solutionResponse.text();
      console.error("Gemini solution API error:", solutionResponse.status, errorText);
      
      if (solutionResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "Trop de requêtes, réessaye dans quelques instants." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (solutionResponse.status === 402) {
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

    const solutionData = await solutionResponse.json();
    const solution = solutionData.choices?.[0]?.message?.content;

    if (!solution) {
      console.error("No solution from Gemini:", solutionData);
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
