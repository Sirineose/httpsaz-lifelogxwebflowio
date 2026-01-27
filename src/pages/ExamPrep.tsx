import { useState } from "react";
import { motion } from "framer-motion";
import { Calendar, Target, Clock, BookOpen, ChevronRight, Plus, CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

interface Exam {
  id: string;
  title: string;
  subject: string;
  date: string;
  daysLeft: number;
  progress: number;
  topics: { name: string; completed: boolean }[];
}

const exams: Exam[] = [
  {
    id: "1",
    title: "Contrôle de Mathématiques",
    subject: "Mathématiques",
    date: "15 Février 2024",
    daysLeft: 5,
    progress: 65,
    topics: [
      { name: "Dérivées", completed: true },
      { name: "Intégrales", completed: true },
      { name: "Équations différentielles", completed: false },
      { name: "Suites numériques", completed: false },
    ],
  },
  {
    id: "2",
    title: "Dissertation Histoire",
    subject: "Histoire",
    date: "22 Février 2024",
    daysLeft: 12,
    progress: 30,
    topics: [
      { name: "Révolution française", completed: true },
      { name: "Napoléon", completed: false },
      { name: "Restauration", completed: false },
    ],
  },
];

const studyPlan = [
  { time: "09:00 - 10:30", subject: "Mathématiques", topic: "Équations différentielles", completed: true },
  { time: "10:45 - 12:00", subject: "Histoire", topic: "Napoléon et l'Empire", completed: false },
  { time: "14:00 - 15:30", subject: "Mathématiques", topic: "Suites numériques", completed: false },
  { time: "16:00 - 17:00", subject: "Quiz de révision", topic: "Toutes matières", completed: false },
];

export default function ExamPrep() {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(exams[0]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            Préparation aux Examens
          </h1>
          <p className="text-muted-foreground text-sm">
            Planifie et suis ta préparation pour réussir tes examens
          </p>
        </div>
        <button className="prago-btn-primary flex items-center gap-2 w-fit">
          <Plus className="w-4 h-4" />
          Ajouter un examen
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Exams List */}
        <div className="lg:col-span-1 space-y-4">
          <h2 className="font-display font-semibold mb-2">Examens à venir</h2>
          {exams.map((exam) => (
            <button
              key={exam.id}
              onClick={() => setSelectedExam(exam)}
              className={cn(
                "w-full text-left p-4 rounded-xl transition-all",
                selectedExam?.id === exam.id
                  ? "prago-card border-primary/30"
                  : "prago-card hover:border-primary/20"
              )}
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <h3 className="font-medium mb-1">{exam.title}</h3>
                  <p className="text-sm text-muted-foreground">{exam.subject}</p>
                </div>
                <span
                  className={cn(
                    "prago-badge",
                    exam.daysLeft <= 3 ? "prago-badge-warning" : "prago-badge-primary"
                  )}
                >
                  {exam.daysLeft}j
                </span>
              </div>
              <div className="prago-progress">
                <div className="prago-progress-bar" style={{ width: `${exam.progress}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">{exam.progress}% préparé</p>
            </button>
          ))}
        </div>

        {/* Exam Details */}
        <div className="lg:col-span-2 space-y-6">
          {selectedExam && (
            <>
              {/* Exam Info */}
              <div className="prago-card p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="font-display text-xl font-semibold mb-1">{selectedExam.title}</h2>
                    <p className="text-muted-foreground">{selectedExam.subject}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold prago-gradient-text">{selectedExam.daysLeft}</p>
                    <p className="text-sm text-muted-foreground">jours restants</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <Calendar className="w-5 h-5 text-primary mb-2" />
                    <p className="text-sm font-medium">{selectedExam.date}</p>
                    <p className="text-xs text-muted-foreground">Date de l'examen</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <Target className="w-5 h-5 text-success mb-2" />
                    <p className="text-sm font-medium">{selectedExam.progress}%</p>
                    <p className="text-xs text-muted-foreground">Progression</p>
                  </div>
                  <div className="p-4 rounded-xl bg-secondary/50">
                    <BookOpen className="w-5 h-5 text-info mb-2" />
                    <p className="text-sm font-medium">{selectedExam.topics.length}</p>
                    <p className="text-xs text-muted-foreground">Chapitres</p>
                  </div>
                </div>

                <h3 className="font-medium mb-3">Chapitres à réviser</h3>
                <div className="space-y-2">
                  {selectedExam.topics.map((topic, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-xl",
                        topic.completed ? "bg-success/10" : "bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {topic.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-success" />
                        ) : (
                          <Circle className="w-5 h-5 text-muted-foreground" />
                        )}
                        <span className={cn("text-sm", topic.completed && "line-through text-muted-foreground")}>
                          {topic.name}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Study Plan */}
              <div className="prago-card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-semibold">Planning du jour</h3>
                  <button className="text-sm text-primary hover:underline">Modifier</button>
                </div>
                <div className="space-y-3">
                  {studyPlan.map((session, index) => (
                    <div
                      key={index}
                      className={cn(
                        "flex items-center gap-4 p-3 rounded-xl",
                        session.completed ? "bg-success/10" : "bg-secondary/50"
                      )}
                    >
                      <div className="flex items-center gap-2 text-muted-foreground w-32 flex-shrink-0">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">{session.time}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{session.subject}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.topic}</p>
                      </div>
                      {session.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                      ) : (
                        <button className="prago-btn-ghost text-xs py-1 px-3">Commencer</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </motion.div>
  );
}
