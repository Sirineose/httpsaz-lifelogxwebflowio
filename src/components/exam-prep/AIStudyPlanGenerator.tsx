import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Clock, Calendar, Check, X, Wand2, Brain, Zap, Target, BookOpen, TrendingUp, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Exam, StudySession } from "@/hooks/useExams";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import ReactMarkdown from "react-markdown";

interface AIStudyPlanGeneratorProps {
  exam: Exam;
  onSessionsGenerated: (sessions: Omit<StudySession, "id" | "created_at">[]) => void;
  existingSessions: StudySession[];
}

interface GeneratedSession {
  date: string;
  startTime: string;
  endTime: string;
  subject: string;
  topic: string;
  description: string;
}

export function AIStudyPlanGenerator({ exam, onSessionsGenerated, existingSessions }: AIStudyPlanGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPlan, setGeneratedPlan] = useState<{
    sessions: GeneratedSession[];
    advice: string;
  } | null>(null);
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [startTime, setStartTime] = useState("18:00");
  const [step, setStep] = useState<"config" | "preview">("config");
  const { toast } = useToast();

  const isGuest = !supabase.auth && localStorage.getItem('prago_guest_mode') === 'true';

  const generatePlan = async () => {
    setIsGenerating(true);
    setGeneratedPlan(null);

    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-study-plan`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          examId: exam.id,
          examTitle: exam.title,
          examSubject: exam.subject,
          examDate: exam.exam_date,
          topics: exam.topics,
          availableHoursPerDay: hoursPerDay,
          preferredStartTime: startTime,
          guestMode: isGuest,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erreur lors de la génération");
      }

      const data = await response.json();
      setGeneratedPlan({
        sessions: data.sessions || [],
        advice: data.advice || "",
      });
      setStep("preview");
    } catch (error: any) {
      console.error("Error generating plan:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible de générer le planning",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const applyPlan = () => {
    if (!generatedPlan) return;

    const sessionsToCreate = generatedPlan.sessions.map((s) => ({
      exam_id: exam.id,
      session_date: s.date,
      start_time: s.startTime,
      end_time: s.endTime,
      subject: s.subject,
      topic: s.topic,
      completed: false,
    }));

    onSessionsGenerated(sessionsToCreate);
    setGeneratedPlan(null);
    setStep("config");
    toast({
      title: "Planning appliqué ! 🎉",
      description: `${sessionsToCreate.length} sessions ajoutées à ton planning.`,
    });
  };

  const incompleteTopics = exam.topics.filter(t => !t.completed);
  const allCompleted = incompleteTopics.length === 0;

  return (
    <div className="space-y-6">
      {/* Premium Header Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl"
      >
        {/* Gradient Header */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/10 to-transparent rounded-full -translate-y-1/2 translate-x-1/3" />
          
          <div className="relative p-8">
            <div className="flex items-start gap-5">
              <motion.div 
                animate={{ 
                  boxShadow: ["0 0 20px rgba(139, 92, 246, 0.3)", "0 0 40px rgba(139, 92, 246, 0.5)", "0 0 20px rgba(139, 92, 246, 0.3)"]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-16 h-16 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0"
              >
                <Brain className="w-8 h-8 text-white" />
              </motion.div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h2 className="font-display text-2xl font-bold">Planificateur IA</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-primary/20 text-primary">Beta</span>
                </div>
                <p className="text-muted-foreground max-w-lg">
                  Notre IA analyse ton examen, le temps restant et tes disponibilités pour créer un planning de révision personnalisé et optimal.
                </p>
              </div>
            </div>

            {/* Exam Info */}
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: BookOpen, label: "Examen", value: exam.title, color: "text-primary" },
                { icon: Calendar, label: "Date", value: format(parseISO(exam.exam_date), "d MMM", { locale: fr }), color: "text-info" },
                { icon: Target, label: "À réviser", value: `${incompleteTopics.length} chapitres`, color: "text-warning" },
                { icon: TrendingUp, label: "Progression", value: `${exam.progress}%`, color: "text-success" },
              ].map((stat) => (
                <div key={stat.label} className="p-4 rounded-2xl bg-background/50 backdrop-blur-sm border border-border/50">
                  <stat.icon className={cn("w-5 h-5 mb-2", stat.color)} />
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                  <p className="font-semibold text-sm truncate">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Configuration or Preview */}
        <AnimatePresence mode="wait">
          {step === "config" && !allCompleted && (
            <motion.div
              key="config"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-8 border-t border-border"
            >
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Zap className="w-5 h-5 text-warning" />
                Configure ton planning
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Hours per day */}
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Clock className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">Temps par jour</p>
                        <p className="text-xs text-muted-foreground">Heures de révision</p>
                      </div>
                    </div>
                    <span className="text-2xl font-bold prago-gradient-text">{hoursPerDay}h</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="6"
                    value={hoursPerDay}
                    onChange={(e) => setHoursPerDay(Number(e.target.value))}
                    className="w-full accent-primary"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground mt-2">
                    <span>1h</span>
                    <span>6h</span>
                  </div>
                </div>

                {/* Start time */}
                <div className="p-5 rounded-2xl bg-secondary/30 border border-border">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-info/10 flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="font-medium">Heure de début</p>
                      <p className="text-xs text-muted-foreground">Début des sessions</p>
                    </div>
                  </div>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="prago-input w-full text-center text-lg font-medium"
                  />
                </div>
              </div>

              {/* Topics to review */}
              <div className="mb-8">
                <p className="text-sm font-medium mb-3">Chapitres à planifier</p>
                <div className="flex flex-wrap gap-2">
                  {incompleteTopics.map((topic, i) => (
                    <motion.span
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="px-3 py-1.5 rounded-full text-sm bg-primary/10 text-primary border border-primary/20"
                    >
                      {topic.name}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={generatePlan}
                disabled={isGenerating}
                className="w-full py-4 rounded-2xl prago-gradient-bg text-white font-semibold text-lg flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    L'IA génère ton planning...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Générer mon planning optimal
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          {step === "preview" && generatedPlan && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="p-8 border-t border-border"
            >
              {/* AI Advice */}
              {generatedPlan.advice && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-5 rounded-2xl bg-gradient-to-r from-info/10 to-primary/5 border border-info/20"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center flex-shrink-0">
                      <Brain className="w-5 h-5 text-info" />
                    </div>
                    <div>
                      <p className="font-semibold mb-2 text-info">Conseil de l'IA</p>
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        <ReactMarkdown>{generatedPlan.advice}</ReactMarkdown>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Sessions Preview */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Sessions générées
                  </h3>
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-success/10 text-success">
                    {generatedPlan.sessions.length} sessions
                  </span>
                </div>
                
                <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2">
                  {generatedPlan.sessions.map((session, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-secondary/30 border border-border hover:border-primary/20 transition-colors"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex flex-col items-center justify-center text-primary">
                        <span className="text-xs font-medium">{format(parseISO(session.date), "MMM", { locale: fr })}</span>
                        <span className="text-lg font-bold leading-none">{format(parseISO(session.date), "d")}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{session.topic}</p>
                        <p className="text-xs text-muted-foreground truncate">{session.description}</p>
                      </div>
                      <div className="text-right text-sm">
                        <p className="font-medium">{session.startTime}</p>
                        <p className="text-xs text-muted-foreground">{session.endTime}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4">
                <button
                  onClick={() => { setStep("config"); setGeneratedPlan(null); }}
                  className="flex-1 py-3 rounded-xl border border-border bg-secondary/50 font-medium flex items-center justify-center gap-2 hover:bg-secondary transition-colors"
                >
                  <X className="w-4 h-4" />
                  Modifier
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={applyPlan}
                  className="flex-1 py-3 rounded-xl prago-gradient-bg text-white font-medium flex items-center justify-center gap-2 shadow-lg"
                >
                  <Check className="w-4 h-4" />
                  Appliquer le planning
                </motion.button>
              </div>
            </motion.div>
          )}

          {allCompleted && (
            <motion.div
              key="completed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 border-t border-border text-center"
            >
              <div className="w-20 h-20 rounded-3xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-10 h-10 text-success" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Félicitations ! 🎉</h3>
              <p className="text-muted-foreground max-w-sm mx-auto">
                Tu as terminé tous les chapitres de cet examen. Continue à réviser pour consolider tes acquis.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
