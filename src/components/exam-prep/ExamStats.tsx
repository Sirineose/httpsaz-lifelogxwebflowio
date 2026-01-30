import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Target, BookOpen, TrendingUp, CheckCircle2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { Exam, StudySession } from "@/hooks/useExams";
import { differenceInDays, parseISO } from "date-fns";

interface ExamStatsProps {
  exams: Exam[];
  sessions: StudySession[];
  selectedExam?: Exam | null;
}

export function ExamStats({ exams, sessions, selectedExam }: ExamStatsProps) {
  const stats = useMemo(() => {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.completed).length;
    
    // Calculate total study time in hours
    const totalMinutes = sessions.reduce((acc, session) => {
      const [startH, startM] = session.start_time.split(':').map(Number);
      const [endH, endM] = session.end_time.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      return acc + (endMinutes - startMinutes);
    }, 0);
    
    const completedMinutes = sessions.filter(s => s.completed).reduce((acc, session) => {
      const [startH, startM] = session.start_time.split(':').map(Number);
      const [endH, endM] = session.end_time.split(':').map(Number);
      return acc + ((endH * 60 + endM) - (startH * 60 + startM));
    }, 0);

    // Topics stats
    const allTopics = exams.flatMap(e => e.topics);
    const completedTopics = allTopics.filter(t => t.completed).length;

    // Upcoming exams
    const upcomingExams = exams.filter(e => {
      try {
        return differenceInDays(parseISO(e.exam_date), new Date()) >= 0;
      } catch {
        return false;
      }
    });

    // Average progress
    const avgProgress = exams.length > 0 
      ? Math.round(exams.reduce((acc, e) => acc + e.progress, 0) / exams.length)
      : 0;

    return {
      totalSessions,
      completedSessions,
      totalHours: Math.round(totalMinutes / 60 * 10) / 10,
      completedHours: Math.round(completedMinutes / 60 * 10) / 10,
      totalTopics: allTopics.length,
      completedTopics,
      upcomingExamsCount: upcomingExams.length,
      avgProgress,
      sessionCompletionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0,
    };
  }, [exams, sessions]);

  const statCards = [
    {
      icon: Clock,
      label: "Temps étudié",
      value: `${stats.completedHours}h`,
      subValue: `/ ${stats.totalHours}h planifié`,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      icon: CheckCircle2,
      label: "Sessions",
      value: `${stats.completedSessions}`,
      subValue: `/ ${stats.totalSessions} complétées`,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: BookOpen,
      label: "Chapitres",
      value: `${stats.completedTopics}`,
      subValue: `/ ${stats.totalTopics} révisés`,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: Target,
      label: "Progression",
      value: `${stats.avgProgress}%`,
      subValue: "moyenne globale",
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="prago-card p-4"
        >
          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bgColor)}>
            <stat.icon className={cn("w-5 h-5", stat.color)} />
          </div>
          <p className="text-2xl font-bold">{stat.value}</p>
          <p className="text-xs text-muted-foreground">{stat.subValue}</p>
          <p className="text-sm font-medium mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  );
}
