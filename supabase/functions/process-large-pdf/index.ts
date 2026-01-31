import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ProcessRequest {
  storagePath: string;
  fileName: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: ProcessRequest = await req.json();
    const { storagePath, fileName } = body;

    if (!storagePath) {
      return new Response(
        JSON.stringify({ error: "Storage path is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing large PDF: ${storagePath}`);

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("documents")
      .download(storagePath);

    if (downloadError) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download file from storage" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert to base64 for Gemini
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const dataUrl = `data:application/pdf;base64,${base64}`;

    console.log(`PDF size: ${(arrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB`);

    // Get Lovable API key
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use Gemini 2.5 Flash for text extraction (supports large PDFs with up to 1M tokens context)
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
              { type: "image_url", image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 8000,
        temperature: 0.1,
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
        JSON.stringify({ error: "Erreur du service IA lors de l'extraction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const geminiData = await geminiResponse.json();
    const extractedText = geminiData.choices?.[0]?.message?.content || "";

    if (!extractedText || extractedText.trim().length < 50) {
      return new Response(
        JSON.stringify({ 
          error: "Aucun texte significatif n'a pu être extrait du PDF. Vérifiez que le fichier n'est pas protégé ou corrompu." 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Estimate page count based on content
    const estimatedPageCount = Math.max(1, Math.ceil(extractedText.length / 3000));

    console.log(`Extracted ${extractedText.length} characters (~${estimatedPageCount} pages)`);

    // Clean up - delete file from storage after processing
    await supabase.storage.from("documents").remove([storagePath]);
    console.log("Cleaned up storage file");

    return new Response(
      JSON.stringify({
        extractedText,
        pageCount: estimatedPageCount,
        fileName,
        characterCount: extractedText.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in process-large-pdf function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
