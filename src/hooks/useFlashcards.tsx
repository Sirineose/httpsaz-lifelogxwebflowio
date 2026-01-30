import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Flashcard {
  id: string;
  deck_name: string;
  front: string;
  back: string;
  is_known: boolean;
  subject: string;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  quiz_name: string;
  question: string;
  options: string[];
  correct_index: number;
  subject: string;
  created_at: string;
}

const GUEST_FLASHCARDS_KEY = "prago_guest_flashcards";
const GUEST_QUESTIONS_KEY = "prago_guest_questions";

function isGuestMode(): boolean {
  return localStorage.getItem("prago_guest_mode") === "true";
}

function getGuestFlashcards(): Flashcard[] {
  try {
    const stored = localStorage.getItem(GUEST_FLASHCARDS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestFlashcards(flashcards: Flashcard[]) {
  localStorage.setItem(GUEST_FLASHCARDS_KEY, JSON.stringify(flashcards));
}

function getGuestQuestions(): QuizQuestion[] {
  try {
    const stored = localStorage.getItem(GUEST_QUESTIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestQuestions(questions: QuizQuestion[]) {
  localStorage.setItem(GUEST_QUESTIONS_KEY, JSON.stringify(questions));
}

export function useFlashcards() {
  const { user } = useAuth();
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuest = isGuestMode() && !user;

  const fetchFlashcards = async () => {
    if (isGuest) {
      setFlashcards(getGuestFlashcards());
      setLoading(false);
      return;
    }

    if (!user) {
      setFlashcards([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("flashcards")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFlashcards(data || []);
    } catch (error: any) {
      console.error("Error fetching flashcards:", error);
      toast.error("Erreur lors du chargement des flashcards");
    } finally {
      setLoading(false);
    }
  };

  const createFlashcard = async (flashcard: Omit<Flashcard, "id" | "created_at" | "updated_at" | "is_known">) => {
    if (isGuest) {
      const newFlashcard: Flashcard = {
        ...flashcard,
        id: crypto.randomUUID(),
        is_known: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedFlashcards = [newFlashcard, ...getGuestFlashcards()];
      saveGuestFlashcards(updatedFlashcards);
      setFlashcards(updatedFlashcards);
      toast.success("Flashcard créée (mode invité)");
      return newFlashcard;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("flashcards")
        .insert({
          ...flashcard,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setFlashcards((prev) => [data, ...prev]);
      toast.success("Flashcard créée avec succès");
      return data;
    } catch (error: any) {
      console.error("Error creating flashcard:", error);
      toast.error("Erreur lors de la création");
      return null;
    }
  };

  const updateFlashcard = async (id: string, updates: Partial<Flashcard>) => {
    if (isGuest) {
      const guestFlashcards = getGuestFlashcards();
      const updatedFlashcards = guestFlashcards.map((card) =>
        card.id === id ? { ...card, ...updates, updated_at: new Date().toISOString() } : card
      );
      saveGuestFlashcards(updatedFlashcards);
      setFlashcards(updatedFlashcards);
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("flashcards")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setFlashcards((prev) =>
        prev.map((card) => (card.id === id ? { ...card, ...updates } : card))
      );
      return true;
    } catch (error: any) {
      console.error("Error updating flashcard:", error);
      return false;
    }
  };

  const deleteFlashcard = async (id: string) => {
    if (isGuest) {
      const guestFlashcards = getGuestFlashcards();
      const updatedFlashcards = guestFlashcards.filter((card) => card.id !== id);
      saveGuestFlashcards(updatedFlashcards);
      setFlashcards(updatedFlashcards);
      toast.success("Flashcard supprimée");
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("flashcards")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setFlashcards((prev) => prev.filter((card) => card.id !== id));
      toast.success("Flashcard supprimée");
      return true;
    } catch (error: any) {
      console.error("Error deleting flashcard:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchFlashcards();
  }, [user]);

  return {
    flashcards,
    loading,
    createFlashcard,
    updateFlashcard,
    deleteFlashcard,
    refetch: fetchFlashcards,
  };
}

export function useQuizQuestions() {
  const { user } = useAuth();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuest = isGuestMode() && !user;

  const fetchQuestions = async () => {
    if (isGuest) {
      setQuestions(getGuestQuestions());
      setLoading(false);
      return;
    }

    if (!user) {
      setQuestions([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      console.error("Error fetching quiz questions:", error);
      toast.error("Erreur lors du chargement des questions");
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async (question: Omit<QuizQuestion, "id" | "created_at">) => {
    if (isGuest) {
      const newQuestion: QuizQuestion = {
        ...question,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      const updatedQuestions = [newQuestion, ...getGuestQuestions()];
      saveGuestQuestions(updatedQuestions);
      setQuestions(updatedQuestions);
      toast.success("Question créée (mode invité)");
      return newQuestion;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("quiz_questions")
        .insert({
          ...question,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setQuestions((prev) => [data, ...prev]);
      toast.success("Question créée avec succès");
      return data;
    } catch (error: any) {
      console.error("Error creating question:", error);
      toast.error("Erreur lors de la création");
      return null;
    }
  };

  const deleteQuestion = async (id: string) => {
    if (isGuest) {
      const guestQuestions = getGuestQuestions();
      const updatedQuestions = guestQuestions.filter((q) => q.id !== id);
      saveGuestQuestions(updatedQuestions);
      setQuestions(updatedQuestions);
      toast.success("Question supprimée");
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("quiz_questions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      toast.success("Question supprimée");
      return true;
    } catch (error: any) {
      console.error("Error deleting question:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [user]);

  return {
    questions,
    loading,
    createQuestion,
    deleteQuestion,
    refetch: fetchQuestions,
  };
}
