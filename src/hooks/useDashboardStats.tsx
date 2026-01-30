import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { differenceInMinutes, parseISO, isToday, isYesterday, subDays, format, startOfWeek, endOfWeek } from "date-fns";

interface DashboardStats {
  hoursStudied: number;
  hoursStudiedTrend: number;
  quizCompleted: number;
  quizCompletedTrend: number;
  streakDays: number;
  notesCreated: number;
  notesCreatedTrend: number;
  firstName: string | null;
  recentActivities: {
    title: string;
    subject: string;
    score: number | null;
    time: string;
    type: "quiz" | "note" | "flashcard" | "session";
  }[];
  weeklyProgress: number[];
  weeklyTotal: number;
  weeklyTrend: number;
}

export function useDashboardStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["dashboard-stats", user?.id],
    queryFn: async (): Promise<DashboardStats> => {
      if (!user) {
        return getDefaultStats();
      }

      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
      const lastWeekStart = subDays(weekStart, 7);
      const lastWeekEnd = subDays(weekStart, 1);

      // Fetch all data in parallel
      const [
        profileResult,
        sessionsResult,
        lastWeekSessionsResult,
        quizResult,
        lastWeekQuizResult,
        notesResult,
        lastWeekNotesResult,
        flashcardsResult,
      ] = await Promise.all([
        // Profile
        supabase
          .from("profiles")
          .select("first_name")
          .eq("user_id", user.id)
          .single(),
        
        // This week's study sessions
        supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .gte("session_date", format(weekStart, "yyyy-MM-dd"))
          .lte("session_date", format(weekEnd, "yyyy-MM-dd")),
        
        // Last week's study sessions
        supabase
          .from("study_sessions")
          .select("*")
          .eq("user_id", user.id)
          .gte("session_date", format(lastWeekStart, "yyyy-MM-dd"))
          .lte("session_date", format(lastWeekEnd, "yyyy-MM-dd")),
        
        // This week's quiz questions
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", weekStart.toISOString()),
        
        // Last week's quiz questions
        supabase
          .from("quiz_questions")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", lastWeekStart.toISOString())
          .lt("created_at", weekStart.toISOString()),
        
        // This week's notes
        supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", weekStart.toISOString()),
        
        // Last week's notes
        supabase
          .from("notes")
          .select("*")
          .eq("user_id", user.id)
          .gte("created_at", lastWeekStart.toISOString())
          .lt("created_at", weekStart.toISOString()),
        
        // All flashcards for recent activity
        supabase
          .from("flashcards")
          .select("*")
          .eq("user_id", user.id)
          .order("updated_at", { ascending: false })
          .limit(5),
      ]);

      const profile = profileResult.data;
      const sessions = sessionsResult.data || [];
      const lastWeekSessions = lastWeekSessionsResult.data || [];
      const quizzes = quizResult.data || [];
      const lastWeekQuizzes = lastWeekQuizResult.data || [];
      const notes = notesResult.data || [];
      const lastWeekNotes = lastWeekNotesResult.data || [];
      const flashcards = flashcardsResult.data || [];

      // Calculate hours studied this week
      const hoursStudied = calculateTotalHours(sessions);
      const lastWeekHours = calculateTotalHours(lastWeekSessions);
      const hoursStudiedTrend = lastWeekHours > 0 
        ? Math.round(((hoursStudied - lastWeekHours) / lastWeekHours) * 100)
        : hoursStudied > 0 ? 100 : 0;

      // Quiz count
      const quizCompleted = quizzes.length;
      const lastWeekQuizCount = lastWeekQuizzes.length;
      const quizCompletedTrend = lastWeekQuizCount > 0
        ? Math.round(((quizCompleted - lastWeekQuizCount) / lastWeekQuizCount) * 100)
        : quizCompleted > 0 ? 100 : 0;

      // Notes count
      const notesCreated = notes.length;
      const lastWeekNotesCount = lastWeekNotes.length;
      const notesCreatedTrend = lastWeekNotesCount > 0
        ? Math.round(((notesCreated - lastWeekNotesCount) / lastWeekNotesCount) * 100)
        : notesCreated > 0 ? 100 : 0;

      // Calculate streak
      const streakDays = await calculateStreak(user.id);

      // Weekly progress (hours per day)
      const weeklyProgress = calculateWeeklyProgress(sessions, weekStart);
      const weeklyTotal = hoursStudied;
      const weeklyTrend = hoursStudiedTrend;

      // Recent activities
      const recentActivities = buildRecentActivities(sessions, notes, flashcards);

      return {
        hoursStudied,
        hoursStudiedTrend,
        quizCompleted,
        quizCompletedTrend,
        streakDays,
        notesCreated,
        notesCreatedTrend,
        firstName: profile?.first_name || null,
        recentActivities,
        weeklyProgress,
        weeklyTotal,
        weeklyTrend,
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

function getDefaultStats(): DashboardStats {
  return {
    hoursStudied: 0,
    hoursStudiedTrend: 0,
    quizCompleted: 0,
    quizCompletedTrend: 0,
    streakDays: 0,
    notesCreated: 0,
    notesCreatedTrend: 0,
    firstName: null,
    recentActivities: [],
    weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
    weeklyTotal: 0,
    weeklyTrend: 0,
  };
}

function calculateTotalHours(sessions: any[]): number {
  let totalMinutes = 0;
  
  for (const session of sessions) {
    if (session.start_time && session.end_time) {
      const [startH, startM] = session.start_time.split(":").map(Number);
      const [endH, endM] = session.end_time.split(":").map(Number);
      const minutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (minutes > 0) {
        totalMinutes += minutes;
      }
    }
  }
  
  return Math.round((totalMinutes / 60) * 10) / 10; // Round to 1 decimal
}

function calculateWeeklyProgress(sessions: any[], weekStart: Date): number[] {
  const dailyMinutes = [0, 0, 0, 0, 0, 0, 0]; // Mon to Sun
  
  for (const session of sessions) {
    const sessionDate = parseISO(session.session_date);
    const dayIndex = Math.floor((sessionDate.getTime() - weekStart.getTime()) / (1000 * 60 * 60 * 24));
    
    if (dayIndex >= 0 && dayIndex < 7 && session.start_time && session.end_time) {
      const [startH, startM] = session.start_time.split(":").map(Number);
      const [endH, endM] = session.end_time.split(":").map(Number);
      const minutes = (endH * 60 + endM) - (startH * 60 + startM);
      if (minutes > 0) {
        dailyMinutes[dayIndex] += minutes;
      }
    }
  }
  
  // Convert to percentage (max 3 hours = 100%)
  const maxMinutes = 180;
  return dailyMinutes.map(m => Math.min(100, Math.round((m / maxMinutes) * 100)));
}

async function calculateStreak(userId: string): Promise<number> {
  const { data: sessions } = await supabase
    .from("study_sessions")
    .select("session_date")
    .eq("user_id", userId)
    .order("session_date", { ascending: false });

  if (!sessions || sessions.length === 0) return 0;

  const uniqueDates = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
  
  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const dateStr of uniqueDates) {
    const sessionDate = parseISO(dateStr);
    sessionDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((currentDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === streak || (streak === 0 && diffDays <= 1)) {
      streak++;
      currentDate = sessionDate;
    } else {
      break;
    }
  }

  return streak;
}

function buildRecentActivities(sessions: any[], notes: any[], flashcards: any[]) {
  const activities: DashboardStats["recentActivities"] = [];

  // Add recent sessions
  for (const session of sessions.slice(0, 3)) {
    activities.push({
      title: `Session ${session.subject}`,
      subject: session.topic,
      score: null,
      time: formatRelativeTime(session.created_at),
      type: "session",
    });
  }

  // Add recent notes
  for (const note of notes.slice(0, 2)) {
    activities.push({
      title: note.is_synthesis ? "Synthèse" : "Note",
      subject: note.title,
      score: null,
      time: formatRelativeTime(note.created_at),
      type: "note",
    });
  }

  // Sort by time and take top 5
  return activities.slice(0, 5);
}

function formatRelativeTime(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const diffMinutes = differenceInMinutes(now, date);

  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  if (diffMinutes < 1440) return `Il y a ${Math.floor(diffMinutes / 60)}h`;
  if (isYesterday(date)) return "Hier";
  return format(date, "dd/MM");
}
