import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ContentType = "flashcards" | "quiz" | "synthesis" | "comic";

interface GenerationOptions {
  count?: number;
  title?: string;
}

interface FlashcardData {
  front: string;
  back: string;
}

interface QuizData {
  question: string;
  options: string[];
  correct_index: number;
}

interface SynthesisData {
  title: string;
  content: string;
  tags: string[];
}

interface ComicPanelData {
  id: number;
  content: string;
  hasDialog: boolean;
  dialog?: string;
}

interface ComicData {
  title: string;
  panels: ComicPanelData[];
}

type GeneratedData = {
  flashcards?: FlashcardData[];
  questions?: QuizData[];
  title?: string;
  content?: string;
  tags?: string[];
  panels?: ComicPanelData[];
};

function isGuestMode(): boolean {
  return localStorage.getItem("prago_guest_mode") === "true";
}

export function useAIGeneration() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<string>("");

  const generateFromImage = async (
    imageBase64: string,
    contentType: ContentType,
    subject?: string,
    options?: GenerationOptions
  ): Promise<GeneratedData | null> => {
    setIsGenerating(true);
    setProgress("Extraction du texte de l'image...");

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          imageBase64,
          contentType,
          subject,
          guestMode: isGuestMode(),
          options,
        },
      });

      if (error) {
        console.error("Error generating content:", error);
        toast.error("Erreur lors de la génération");
        return null;
      }

      if (!data.success) {
        toast.error(data.error || "Erreur lors de la génération");
        return null;
      }

      setProgress("Contenu généré !");
      return data.data;
    } catch (err) {
      console.error("Generation error:", err);
      toast.error("Erreur lors de la génération");
      return null;
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  const generateFromText = async (
    textContent: string,
    contentType: ContentType,
    subject?: string,
    options?: GenerationOptions
  ): Promise<GeneratedData | null> => {
    setIsGenerating(true);
    setProgress("Génération en cours...");

    try {
      const { data, error } = await supabase.functions.invoke("generate-content", {
        body: {
          textContent,
          contentType,
          subject,
          guestMode: isGuestMode(),
          options,
        },
      });

      if (error) {
        console.error("Error generating content:", error);
        toast.error("Erreur lors de la génération");
        return null;
      }

      if (!data.success) {
        toast.error(data.error || "Erreur lors de la génération");
        return null;
      }

      setProgress("Contenu généré !");
      return data.data;
    } catch (err) {
      console.error("Generation error:", err);
      toast.error("Erreur lors de la génération");
      return null;
    } finally {
      setIsGenerating(false);
      setProgress("");
    }
  };

  return {
    isGenerating,
    progress,
    generateFromImage,
    generateFromText,
  };
}
