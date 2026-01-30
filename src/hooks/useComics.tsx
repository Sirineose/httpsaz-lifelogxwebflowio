import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ComicPanel {
  id: number;
  content: string;
  hasDialog: boolean;
  dialog?: string;
}

export interface Comic {
  id: string;
  title: string;
  subject: string;
  thumbnail: string;
  panels: ComicPanel[];
  progress: number;
  duration: string;
  created_at: string;
  updated_at: string;
}

const GUEST_COMICS_KEY = "prago_guest_comics";

function isGuestMode(): boolean {
  return localStorage.getItem("prago_guest_mode") === "true";
}

function getGuestComics(): Comic[] {
  try {
    const stored = localStorage.getItem(GUEST_COMICS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestComics(comics: Comic[]) {
  localStorage.setItem(GUEST_COMICS_KEY, JSON.stringify(comics));
}

export function useComics() {
  const { user } = useAuth();
  const [comics, setComics] = useState<Comic[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuest = isGuestMode() && !user;

  const fetchComics = async () => {
    if (isGuest) {
      setComics(getGuestComics());
      setLoading(false);
      return;
    }

    if (!user) {
      setComics([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("comics")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      const formattedComics = (data || []).map((comic: any) => ({
        ...comic,
        panels: Array.isArray(comic.panels) ? (comic.panels as unknown as ComicPanel[]) : [],
      }));
      
      setComics(formattedComics);
    } catch (error: any) {
      console.error("Error fetching comics:", error);
      toast.error("Erreur lors du chargement des BD");
    } finally {
      setLoading(false);
    }
  };

  const createComic = async (comic: Omit<Comic, "id" | "created_at" | "updated_at" | "progress">) => {
    if (isGuest) {
      const newComic: Comic = {
        ...comic,
        id: crypto.randomUUID(),
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const updatedComics = [newComic, ...getGuestComics()];
      saveGuestComics(updatedComics);
      setComics(updatedComics);
      toast.success("BD créée (mode invité)");
      return newComic;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("comics")
        .insert({
          title: comic.title,
          subject: comic.subject,
          thumbnail: comic.thumbnail,
          duration: comic.duration,
          panels: JSON.parse(JSON.stringify(comic.panels)),
          user_id: user.id,
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      const formattedComic: Comic = {
        id: data.id,
        title: data.title,
        subject: data.subject,
        thumbnail: data.thumbnail || '📚',
        duration: data.duration || '5 min',
        progress: data.progress || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        panels: Array.isArray(data.panels) ? (data.panels as unknown as ComicPanel[]) : [],
      };
      
      setComics((prev) => [formattedComic, ...prev]);
      toast.success("BD créée avec succès");
      return formattedComic;
    } catch (error: any) {
      console.error("Error creating comic:", error);
      toast.error("Erreur lors de la création de la BD");
      return null;
    }
  };

  const updateComic = async (id: string, updates: Partial<Comic>) => {
    if (isGuest) {
      const guestComics = getGuestComics();
      const updatedComics = guestComics.map((comic) =>
        comic.id === id ? { ...comic, ...updates, updated_at: new Date().toISOString() } : comic
      );
      saveGuestComics(updatedComics);
      setComics(updatedComics);
      return true;
    }

    if (!user) return false;

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subject !== undefined) updateData.subject = updates.subject;
      if (updates.thumbnail !== undefined) updateData.thumbnail = updates.thumbnail;
      if (updates.duration !== undefined) updateData.duration = updates.duration;
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.panels !== undefined) updateData.panels = JSON.parse(JSON.stringify(updates.panels));

      const { error } = await supabase
        .from("comics")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setComics((prev) =>
        prev.map((comic) => (comic.id === id ? { ...comic, ...updates } : comic))
      );
      return true;
    } catch (error: any) {
      console.error("Error updating comic:", error);
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  const deleteComic = async (id: string) => {
    if (isGuest) {
      const guestComics = getGuestComics();
      const updatedComics = guestComics.filter((comic) => comic.id !== id);
      saveGuestComics(updatedComics);
      setComics(updatedComics);
      toast.success("BD supprimée");
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("comics")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setComics((prev) => prev.filter((comic) => comic.id !== id));
      toast.success("BD supprimée");
      return true;
    } catch (error: any) {
      console.error("Error deleting comic:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchComics();
  }, [user]);

  return {
    comics,
    loading,
    createComic,
    updateComic,
    deleteComic,
    refetch: fetchComics,
  };
}
