import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Loader2, Clock, Calendar, Check, X, Wand2 } from "lucide-react";
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
    toast({
      title: "Planning appliqué !",
      description: `${sessionsToCreate.length} sessions ajoutées à ton planning.`,
    });
  };

  const incompleteTopics = exam.topics.filter(t => !t.completed);

  return (
    <div className="prago-card p-6 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-12 h-12 rounded-xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
          <Wand2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="font-display font-semibold text-lg">Génération IA du planning</h3>
          <p className="text-sm text-muted-foreground">
            L'IA crée un planning de révision optimal basé sur tes chapitres et le temps restant
          </p>
        </div>
      </div>

      {!generatedPlan ? (
        <>
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-sm font-medium mb-2 block">Heures par jour</label>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="6"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="flex-1"
                />
                <span className="text-sm font-medium w-12">{hoursPerDay}h</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Heure de début</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="prago-input w-full"
              />
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-secondary/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Chapitres à réviser</span>
              <span className="font-medium">{incompleteTopics.length} / {exam.topics.length}</span>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {incompleteTopics.slice(0, 5).map((topic, i) => (
                <span key={i} className="prago-badge prago-badge-secondary text-xs">
                  {topic.name}
                </span>
              ))}
              {incompleteTopics.length > 5 && (
                <span className="prago-badge prago-badge-secondary text-xs">
                  +{incompleteTopics.length - 5}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={generatePlan}
            disabled={isGenerating || incompleteTopics.length === 0}
            className="prago-btn-primary w-full flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Génération en cours...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Générer mon planning
              </>
            )}
          </button>

          {incompleteTopics.length === 0 && (
            <p className="text-sm text-success text-center mt-3">
              🎉 Tous les chapitres sont terminés !
            </p>
          )}
        </>
      ) : (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* AI Advice */}
            {generatedPlan.advice && (
              <div className="p-4 rounded-xl bg-info/10 border border-info/20">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
                  <div className="prose prose-sm dark:prose-invert">
                    <ReactMarkdown>{generatedPlan.advice}</ReactMarkdown>
                  </div>
                </div>
              </div>
            )}

            {/* Generated Sessions Preview */}
            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
              <p className="text-sm font-medium">{generatedPlan.sessions.length} sessions générées</p>
              {generatedPlan.sessions.map((session, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                >
                  <div className="text-xs text-muted-foreground w-24 flex-shrink-0">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(session.date), "d MMM", { locale: fr })}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {session.startTime} - {session.endTime}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{session.topic}</p>
                    <p className="text-xs text-muted-foreground truncate">{session.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setGeneratedPlan(null)}
                className="prago-btn-ghost flex-1 flex items-center justify-center gap-2"
              >
                <X className="w-4 h-4" />
                Annuler
              </button>
              <button
                onClick={applyPlan}
                className="prago-btn-primary flex-1 flex items-center justify-center gap-2"
              >
                <Check className="w-4 h-4" />
                Appliquer
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
}
