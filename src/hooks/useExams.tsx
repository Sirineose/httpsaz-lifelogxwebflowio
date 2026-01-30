import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface ExamTopic {
  name: string;
  completed: boolean;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  exam_date: string;
  topics: ExamTopic[];
  progress: number;
  created_at: string;
  updated_at: string;
}

export interface StudySession {
  id: string;
  exam_id: string | null;
  start_time: string;
  end_time: string;
  subject: string;
  topic: string;
  session_date: string;
  completed: boolean;
  created_at: string;
}

const GUEST_EXAMS_KEY = "prago_guest_exams";
const GUEST_SESSIONS_KEY = "prago_guest_sessions";

function isGuestMode(): boolean {
  return localStorage.getItem("prago_guest_mode") === "true";
}

function getGuestExams(): Exam[] {
  try {
    const stored = localStorage.getItem(GUEST_EXAMS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestExams(exams: Exam[]) {
  localStorage.setItem(GUEST_EXAMS_KEY, JSON.stringify(exams));
}

function getGuestSessions(): StudySession[] {
  try {
    const stored = localStorage.getItem(GUEST_SESSIONS_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveGuestSessions(sessions: StudySession[]) {
  localStorage.setItem(GUEST_SESSIONS_KEY, JSON.stringify(sessions));
}

export function useExams() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuest = isGuestMode() && !user;

  const fetchExams = async () => {
    if (isGuest) {
      setExams(getGuestExams().sort((a, b) => new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()));
      setLoading(false);
      return;
    }

    if (!user) {
      setExams([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .order("exam_date", { ascending: true });

      if (error) throw error;
      
      const formattedExams = (data || []).map((exam: any) => ({
        ...exam,
        topics: Array.isArray(exam.topics) ? (exam.topics as unknown as ExamTopic[]) : [],
      }));
      
      setExams(formattedExams);
    } catch (error: any) {
      console.error("Error fetching exams:", error);
      toast.error("Erreur lors du chargement des examens");
    } finally {
      setLoading(false);
    }
  };

  const createExam = async (exam: Omit<Exam, "id" | "created_at" | "updated_at" | "progress">) => {
    if (isGuest) {
      const newExam: Exam = {
        ...exam,
        id: crypto.randomUUID(),
        progress: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      const guestExams = getGuestExams();
      const updatedExams = [...guestExams, newExam].sort((a, b) => 
        new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
      );
      saveGuestExams(updatedExams);
      setExams(updatedExams);
      toast.success("Examen créé (mode invité)");
      return newExam;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("exams")
        .insert({
          title: exam.title,
          subject: exam.subject,
          exam_date: exam.exam_date,
          topics: JSON.parse(JSON.stringify(exam.topics)),
          user_id: user.id,
          progress: 0,
        })
        .select()
        .single();

      if (error) throw error;
      
      const formattedExam: Exam = {
        id: data.id,
        title: data.title,
        subject: data.subject,
        exam_date: data.exam_date,
        progress: data.progress || 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        topics: Array.isArray(data.topics) ? (data.topics as unknown as ExamTopic[]) : [],
      };
      
      setExams((prev) => [...prev, formattedExam].sort((a, b) => 
        new Date(a.exam_date).getTime() - new Date(b.exam_date).getTime()
      ));
      toast.success("Examen créé avec succès");
      return formattedExam;
    } catch (error: any) {
      console.error("Error creating exam:", error);
      toast.error("Erreur lors de la création de l'examen");
      return null;
    }
  };

  const updateExam = async (id: string, updates: Partial<Exam>) => {
    if (isGuest) {
      const guestExams = getGuestExams();
      const updatedExams = guestExams.map((exam) =>
        exam.id === id ? { ...exam, ...updates, updated_at: new Date().toISOString() } : exam
      );
      saveGuestExams(updatedExams);
      setExams(updatedExams);
      return true;
    }

    if (!user) return false;

    try {
      const updateData: any = {};
      if (updates.title !== undefined) updateData.title = updates.title;
      if (updates.subject !== undefined) updateData.subject = updates.subject;
      if (updates.exam_date !== undefined) updateData.exam_date = updates.exam_date;
      if (updates.progress !== undefined) updateData.progress = updates.progress;
      if (updates.topics !== undefined) updateData.topics = JSON.parse(JSON.stringify(updates.topics));

      const { error } = await supabase
        .from("exams")
        .update(updateData)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setExams((prev) =>
        prev.map((exam) => (exam.id === id ? { ...exam, ...updates } : exam))
      );
      return true;
    } catch (error: any) {
      console.error("Error updating exam:", error);
      toast.error("Erreur lors de la mise à jour");
      return false;
    }
  };

  const deleteExam = async (id: string) => {
    if (isGuest) {
      const guestExams = getGuestExams();
      const updatedExams = guestExams.filter((exam) => exam.id !== id);
      saveGuestExams(updatedExams);
      setExams(updatedExams);
      // Also delete associated sessions
      const guestSessions = getGuestSessions();
      saveGuestSessions(guestSessions.filter((s) => s.exam_id !== id));
      toast.success("Examen supprimé");
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("exams")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setExams((prev) => prev.filter((exam) => exam.id !== id));
      toast.success("Examen supprimé");
      return true;
    } catch (error: any) {
      console.error("Error deleting exam:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchExams();
  }, [user]);

  return {
    exams,
    loading,
    createExam,
    updateExam,
    deleteExam,
    refetch: fetchExams,
  };
}

export function useStudySessions(examId?: string) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [loading, setLoading] = useState(true);

  const isGuest = isGuestMode() && !user;

  const fetchSessions = async () => {
    if (isGuest) {
      let guestSessions = getGuestSessions();
      if (examId) {
        guestSessions = guestSessions.filter((s) => s.exam_id === examId);
      }
      setSessions(guestSessions.sort((a, b) => {
        const dateCompare = a.session_date.localeCompare(b.session_date);
        if (dateCompare !== 0) return dateCompare;
        return a.start_time.localeCompare(b.start_time);
      }));
      setLoading(false);
      return;
    }

    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("session_date", { ascending: true })
        .order("start_time", { ascending: true });

      if (examId) {
        query = query.eq("exam_id", examId);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSessions(data || []);
    } catch (error: any) {
      console.error("Error fetching study sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async (session: Omit<StudySession, "id" | "created_at">) => {
    if (isGuest) {
      const newSession: StudySession = {
        ...session,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
      };
      const guestSessions = getGuestSessions();
      const updatedSessions = [...guestSessions, newSession];
      saveGuestSessions(updatedSessions);
      setSessions((prev) => [...prev, newSession]);
      toast.success("Session d'étude créée (mode invité)");
      return newSession;
    }

    if (!user) {
      toast.error("Vous devez être connecté");
      return null;
    }

    try {
      const { data, error } = await supabase
        .from("study_sessions")
        .insert({
          ...session,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      setSessions((prev) => [...prev, data]);
      toast.success("Session d'étude créée");
      return data;
    } catch (error: any) {
      console.error("Error creating session:", error);
      toast.error("Erreur lors de la création");
      return null;
    }
  };

  const updateSession = async (id: string, updates: Partial<StudySession>) => {
    if (isGuest) {
      const guestSessions = getGuestSessions();
      const updatedSessions = guestSessions.map((session) =>
        session.id === id ? { ...session, ...updates } : session
      );
      saveGuestSessions(updatedSessions);
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? { ...session, ...updates } : session))
      );
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("study_sessions")
        .update(updates)
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setSessions((prev) =>
        prev.map((session) => (session.id === id ? { ...session, ...updates } : session))
      );
      return true;
    } catch (error: any) {
      console.error("Error updating session:", error);
      return false;
    }
  };

  const deleteSession = async (id: string) => {
    if (isGuest) {
      const guestSessions = getGuestSessions();
      const updatedSessions = guestSessions.filter((session) => session.id !== id);
      saveGuestSessions(updatedSessions);
      setSessions((prev) => prev.filter((session) => session.id !== id));
      return true;
    }

    if (!user) return false;

    try {
      const { error } = await supabase
        .from("study_sessions")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;
      setSessions((prev) => prev.filter((session) => session.id !== id));
      return true;
    } catch (error: any) {
      console.error("Error deleting session:", error);
      return false;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [user, examId]);

  return {
    sessions,
    loading,
    createSession,
    updateSession,
    deleteSession,
    refetch: fetchSessions,
  };
}
