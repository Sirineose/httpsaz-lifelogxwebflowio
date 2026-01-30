import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface Note {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  is_synthesis: boolean;
  created_at: string;
  updated_at: string;
}

const GUEST_NOTES_KEY = "prago_guest_notes";

function getGuestNotes(): Note[] {
  try {
    const stored = localStorage.getItem(GUEST_NOTES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestNotes(notes: Note[]) {
  localStorage.setItem(GUEST_NOTES_KEY, JSON.stringify(notes));
}

function isGuestMode(): boolean {
  return localStorage.getItem("prago_guest_mode") === "true";
}

export function useNotes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuest = isGuestMode() && !user;

  const fetchNotes = async () => {
    if (isGuest) {
      setNotes(getGuestNotes());
      setLoading(false);
      return;
    }

    if (!user) {
      setNotes([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setNotes(data || []);
    } catch (error: any) {
      console.error("Error fetching notes:", error);
      toast.error("Erreur lors du chargement des notes");
    } finally {
      setLoading(false);
    }
  };

  const createNote = async (note: Omit<Note, "id" | "created_at" | "updated_at">) => {
    if (isGuest) {
      const newNote: Note = {
        ...note,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedNotes = [newNote, ...getGuestNotes()];
      saveGuestNotes(updatedNotes);
      setNotes(updatedNotes);
      toast.success("Note créée (mode invité)");
      return newNote;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("notes")
        .insert({
          ...note,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setNotes((prev) => [data, ...prev]);
      toast.success("Note créée avec succès");
      return data;
    } catch (error: any) {
      console.error("Error creating note:", error);
      toast.error("Erreur lors de la création de la note");
      return null;
    }
  };

  const updateNote = async (id: string, updates: Partial<Note>) => {
    if (isGuest) {
      const guestNotes = getGuestNotes();
      const updatedNotes = guestNotes.map((note) =>
        note.id === id ? { ...note, ...updates, updated_at: new Date().toISOString() } : note
      );
      saveGuestNotes(updatedNotes);
      setNotes(updatedNotes);
      toast.success("Note mise à jour");
      return true;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return false;
    }

    try {
      const { error } = await supabase
        .from("notes")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setNotes((prev) =>
        prev.map((note) => (note.id === id ? { ...note, ...updates } : note))
      );
      toast.success("Note mise à jour");
      return true;
    } catch (error: any) {
      console.error("Error updating note:", error);
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  const deleteNote = async (id: string) => {
    if (isGuest) {
      const guestNotes = getGuestNotes();
      const updatedNotes = guestNotes.filter((note) => note.id !== id);
      saveGuestNotes(updatedNotes);
      setNotes(updatedNotes);
      toast.success("Note supprimée");
      return true;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return false;
    }

    try {
      const { error } = await supabase
        .from("notes")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setNotes((prev) => prev.filter((note) => note.id !== id));
      toast.success("Note supprimée");
      return true;
    } catch (error: any) {
      console.error("Error deleting note:", error);
      toast.error("Erreur lors de la suppression");
      return false;
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user]);

  return {
    notes,
    loading,
    createNote,
    updateNote,
    deleteNote,
    refetch: fetchNotes,
  };
}
