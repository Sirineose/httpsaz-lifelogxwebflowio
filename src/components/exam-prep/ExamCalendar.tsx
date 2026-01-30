import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, startOfWeek, addDays, isSameDay, parseISO, addWeeks, subWeeks } from "date-fns";
import { fr } from "date-fns/locale";
import { StudySession } from "@/hooks/useExams";

interface ExamCalendarProps {
  sessions: StudySession[];
  onSessionClick?: (session: StudySession) => void;
  onToggleComplete?: (session: StudySession) => void;
}

export function ExamCalendar({ sessions, onSessionClick, onToggleComplete }: ExamCalendarProps) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  
  const getSessionsForDay = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return sessions.filter(s => s.session_date === dateStr);
  };

  const formatTime = (time: string) => time.slice(0, 5);

  return (
    <div className="prago-card p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-display font-semibold">Calendrier de révision</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">
            {format(weekStart, "d MMM", { locale: fr })} - {format(addDays(weekStart, 6), "d MMM yyyy", { locale: fr })}
          </span>
          <button
            onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {/* Days header */}
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={cn(
              "text-center py-2 rounded-lg text-xs font-medium",
              isSameDay(day, new Date()) && "bg-primary/10 text-primary"
            )}
          >
            <div className="uppercase text-muted-foreground">{format(day, "EEE", { locale: fr })}</div>
            <div className="text-lg mt-1">{format(day, "d")}</div>
          </div>
        ))}

        {/* Sessions grid */}
        {weekDays.map((day) => {
          const daySessions = getSessionsForDay(day);
          return (
            <div
              key={`sessions-${day.toISOString()}`}
              className={cn(
                "min-h-[100px] rounded-lg p-1 space-y-1",
                isSameDay(day, new Date()) ? "bg-primary/5" : "bg-secondary/30"
              )}
            >
              {daySessions.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="text-xs text-muted-foreground">-</span>
                </div>
              ) : (
                daySessions.map((session) => (
                  <motion.button
                    key={session.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onToggleComplete?.(session)}
                    className={cn(
                      "w-full p-2 rounded-lg text-left text-xs transition-all",
                      session.completed
                        ? "bg-success/20 border border-success/30"
                        : "bg-background border border-border hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center gap-1 text-muted-foreground mb-1">
                      {session.completed ? (
                        <CheckCircle2 className="w-3 h-3 text-success" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{formatTime(session.start_time)}</span>
                    </div>
                    <p className={cn(
                      "font-medium truncate",
                      session.completed && "line-through text-muted-foreground"
                    )}>
                      {session.topic}
                    </p>
                  </motion.button>
                ))
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
