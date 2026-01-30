import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Target, Clock, BookOpen, ChevronRight, Plus, CheckCircle2, Circle, Loader2, Trash2, X, Sparkles, GraduationCap, TrendingUp, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useExams, useStudySessions, Exam, ExamTopic, StudySession } from "@/hooks/useExams";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format, differenceInDays, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { ExamCalendar } from "@/components/exam-prep/ExamCalendar";
import { ExamStats } from "@/components/exam-prep/ExamStats";
import { AIStudyPlanGenerator } from "@/components/exam-prep/AIStudyPlanGenerator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const subjects = ["Mathématiques", "Histoire", "Biologie", "Physique", "Français", "Chimie", "Philosophie", "Anglais", "Économie", "Général"];

export default function ExamPrep() {
  const { exams, loading, createExam, updateExam, deleteExam } = useExams();
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const { sessions, createSession, updateSession, refetch: refetchSessions } = useStudySessions(selectedExam?.id);
  const { sessions: allSessions } = useStudySessions();
  
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("Mathématiques");
  const [examDate, setExamDate] = useState("");
  const [examTopics, setExamTopics] = useState<string[]>([""]);
  
  const [sessionStartTime, setSessionStartTime] = useState("09:00");
  const [sessionEndTime, setSessionEndTime] = useState("10:30");
  const [sessionSubject, setSessionSubject] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionDate, setSessionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (exams.length > 0 && !selectedExam) {
      setSelectedExam(exams[0]);
    }
  }, [exams, selectedExam]);

  const getDaysLeft = (dateStr: string) => {
    try {
      return Math.max(0, differenceInDays(parseISO(dateStr), new Date()));
    } catch {
      return 0;
    }
  };

  const formatExamDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), "d MMMM yyyy", { locale: fr });
    } catch {
      return dateStr;
    }
  };

  const handleCreateExam = async () => {
    if (!examTitle.trim() || !examDate) return;
    setIsSaving(true);
    const topics: ExamTopic[] = examTopics.filter(t => t.trim()).map(name => ({ name, completed: false }));
    const result = await createExam({
      title: examTitle,
      subject: examSubject,
      exam_date: examDate,
      topics,
    });
    setIsSaving(false);
    if (result) {
      setIsCreateExamOpen(false);
      setExamTitle("");
      setExamSubject("Mathématiques");
      setExamDate("");
      setExamTopics([""]);
      setSelectedExam(result);
    }
  };

  const handleCreateSession = async () => {
    if (!sessionSubject.trim() || !sessionTopic.trim() || !selectedExam) return;
    setIsSaving(true);
    await createSession({
      exam_id: selectedExam.id,
      start_time: sessionStartTime,
      end_time: sessionEndTime,
      subject: sessionSubject,
      topic: sessionTopic,
      session_date: sessionDate,
      completed: false,
    });
    setIsSaving(false);
    setIsCreateSessionOpen(false);
    setSessionSubject("");
    setSessionTopic("");
  };

  const handleBulkCreateSessions = async (sessionsToCreate: Omit<StudySession, "id" | "created_at">[]) => {
    for (const session of sessionsToCreate) {
      await createSession(session);
    }
    refetchSessions();
  };

  const toggleTopicComplete = async (exam: Exam, topicIndex: number) => {
    const newTopics = [...exam.topics];
    newTopics[topicIndex] = { ...newTopics[topicIndex], completed: !newTopics[topicIndex].completed };
    const completedCount = newTopics.filter(t => t.completed).length;
    const progress = Math.round((completedCount / newTopics.length) * 100);
    await updateExam(exam.id, { topics: newTopics, progress });
    if (selectedExam?.id === exam.id) {
      setSelectedExam({ ...exam, topics: newTopics, progress });
    }
  };

  const toggleSessionComplete = async (session: StudySession) => {
    await updateSession(session.id, { completed: !session.completed });
  };

  const todaySessions = sessions.filter(s => s.session_date === format(new Date(), "yyyy-MM-dd"));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Préparation Examens</h1>
            <p className="text-muted-foreground">Planifie et réussis tes examens avec l'IA</p>
          </div>
        </div>
        <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
          <DialogTrigger asChild>
            <button className="prago-btn-primary flex items-center gap-2 w-fit shadow-lg">
              <Plus className="w-4 h-4" />
              Ajouter un examen
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white" />
                </div>
                Ajouter un examen
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Titre</label>
                <input type="text" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} className="prago-input w-full" placeholder="Contrôle de Mathématiques" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Matière</label>
                <select value={examSubject} onChange={(e) => setExamSubject(e.target.value)} className="prago-input w-full">
                  {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Date de l'examen</label>
                <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="prago-input w-full" />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Chapitres à réviser</label>
                <div className="space-y-2">
                  {examTopics.map((topic, index) => (
                    <div key={index} className="flex gap-2">
                      <input type="text" value={topic} onChange={(e) => {
                        const newTopics = [...examTopics];
                        newTopics[index] = e.target.value;
                        setExamTopics(newTopics);
                      }} className="prago-input flex-1" placeholder={`Chapitre ${index + 1}`} />
                      {examTopics.length > 1 && (
                        <button onClick={() => setExamTopics(examTopics.filter((_, i) => i !== index))} className="p-2 text-destructive hover:bg-destructive/10 rounded-xl">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button onClick={() => setExamTopics([...examTopics, ""])} className="text-sm text-primary hover:underline mt-2">
                  + Ajouter un chapitre
                </button>
              </div>
              <button onClick={handleCreateExam} disabled={!examTitle.trim() || !examDate || isSaving} className="prago-btn-primary w-full flex items-center justify-center gap-2">
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer l'examen
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="font-display text-xl font-bold mb-2">Aucun examen</h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Ajoute ton premier examen pour commencer à planifier tes révisions avec l'aide de l'IA
          </p>
          <button onClick={() => setIsCreateExamOpen(true)} className="prago-btn-primary shadow-lg">
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un examen
          </button>
        </motion.div>
      ) : (
        <>
          {/* Stats Overview */}
          <ExamStats exams={exams} sessions={allSessions} selectedExam={selectedExam} />

          {/* Premium Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border border-border p-1.5 rounded-2xl inline-flex shadow-sm">
              <TabsTrigger value="overview" className="gap-2 rounded-xl data-[state=active]:prago-gradient-bg data-[state=active]:text-white">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Exams</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2 rounded-xl data-[state=active]:prago-gradient-bg data-[state=active]:text-white">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="ai-planning" className="gap-2 rounded-xl data-[state=active]:prago-gradient-bg data-[state=active]:text-white">
                <Sparkles className="w-4 h-4" />
                <span className="hidden sm:inline">Planning IA</span>
                <span className="sm:hidden">IA</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Exams List */}
                <div className="lg:col-span-1 space-y-4">
                  <h2 className="font-display font-bold text-lg flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    Examens à venir
                  </h2>
                  {exams.map((exam, index) => {
                    const daysLeft = getDaysLeft(exam.exam_date);
                    return (
                      <motion.button
                        key={exam.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => setSelectedExam(exam)}
                        className={cn(
                          "w-full text-left p-5 rounded-2xl transition-all border",
                          selectedExam?.id === exam.id
                            ? "bg-card border-primary/30 shadow-lg ring-2 ring-primary/10"
                            : "bg-card border-border hover:border-primary/20 hover:shadow-md"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div>
                            <h3 className="font-semibold mb-1">{exam.title}</h3>
                            <p className="text-sm text-muted-foreground">{exam.subject}</p>
                          </div>
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            daysLeft <= 3 ? "bg-destructive/10 text-destructive" : daysLeft <= 7 ? "bg-warning/10 text-warning" : "bg-primary/10 text-primary"
                          )}>
                            {daysLeft}j
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <motion.div 
                            className="h-full prago-gradient-bg"
                            initial={{ width: 0 }}
                            animate={{ width: `${exam.progress}%` }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{exam.progress}% préparé</p>
                      </motion.button>
                    );
                  })}
                </div>

                {/* Exam Details */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedExam ? (
                    <>
                      {/* Exam Info Card */}
                      <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                        <div className="p-6 bg-gradient-to-r from-primary/5 to-accent/5 border-b border-border">
                          <div className="flex items-start justify-between">
                            <div>
                              <h2 className="font-display text-xl font-bold mb-1">{selectedExam.title}</h2>
                              <p className="text-muted-foreground">{selectedExam.subject}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <p className="text-3xl font-bold prago-gradient-text">{getDaysLeft(selectedExam.exam_date)}</p>
                                <p className="text-xs text-muted-foreground">jours restants</p>
                              </div>
                              <button onClick={() => { deleteExam(selectedExam.id); setSelectedExam(null); }} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          <div className="grid grid-cols-3 gap-4 mb-6">
                            {[
                              { icon: Calendar, label: "Date", value: formatExamDate(selectedExam.exam_date), color: "text-primary", bg: "bg-primary/10" },
                              { icon: Target, label: "Progression", value: `${selectedExam.progress}%`, color: "text-success", bg: "bg-success/10" },
                              { icon: BookOpen, label: "Chapitres", value: `${selectedExam.topics.filter(t => t.completed).length}/${selectedExam.topics.length}`, color: "text-info", bg: "bg-info/10" },
                            ].map((stat) => (
                              <div key={stat.label} className="p-4 rounded-2xl bg-secondary/30">
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                                  <stat.icon className={cn("w-5 h-5", stat.color)} />
                                </div>
                                <p className="text-lg font-bold">{stat.value}</p>
                                <p className="text-xs text-muted-foreground">{stat.label}</p>
                              </div>
                            ))}
                          </div>

                          <h3 className="font-semibold mb-4 flex items-center gap-2">
                            <Zap className="w-4 h-4 text-warning" />
                            Chapitres à réviser
                          </h3>
                          {selectedExam.topics.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Aucun chapitre défini</p>
                          ) : (
                            <div className="space-y-2">
                              {selectedExam.topics.map((topic, index) => (
                                <motion.button
                                  key={index}
                                  whileHover={{ scale: 1.01 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => toggleTopicComplete(selectedExam, index)}
                                  className={cn(
                                    "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
                                    topic.completed ? "bg-success/10 border-success/20" : "bg-secondary/30 border-transparent hover:border-primary/20"
                                  )}
                                >
                                  <div className="flex items-center gap-3">
                                    {topic.completed ? (
                                      <div className="w-8 h-8 rounded-lg bg-success flex items-center justify-center">
                                        <CheckCircle2 className="w-5 h-5 text-white" />
                                      </div>
                                    ) : (
                                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                        <Circle className="w-5 h-5 text-muted-foreground" />
                                      </div>
                                    )}
                                    <span className={cn("font-medium", topic.completed && "line-through text-muted-foreground")}>
                                      {topic.name}
                                    </span>
                                  </div>
                                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                </motion.button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Today's Sessions */}
                      <div className="bg-card border border-border rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display font-bold flex items-center gap-2">
                            <Clock className="w-5 h-5 text-info" />
                            Sessions du jour
                          </h3>
                          <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
                            <DialogTrigger asChild>
                              <button className="prago-btn-secondary text-sm">
                                <Plus className="w-4 h-4 mr-1" />
                                Ajouter
                              </button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ajouter une session</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Début</label>
                                    <input type="time" value={sessionStartTime} onChange={(e) => setSessionStartTime(e.target.value)} className="prago-input w-full" />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-2 block">Fin</label>
                                    <input type="time" value={sessionEndTime} onChange={(e) => setSessionEndTime(e.target.value)} className="prago-input w-full" />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Date</label>
                                  <input type="date" value={sessionDate} onChange={(e) => setSessionDate(e.target.value)} className="prago-input w-full" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Matière</label>
                                  <input type="text" value={sessionSubject} onChange={(e) => setSessionSubject(e.target.value)} className="prago-input w-full" placeholder="Mathématiques" />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-2 block">Sujet</label>
                                  <input type="text" value={sessionTopic} onChange={(e) => setSessionTopic(e.target.value)} className="prago-input w-full" placeholder="Chapitre 1 - Dérivées" />
                                </div>
                                <button onClick={handleCreateSession} disabled={!sessionSubject.trim() || !sessionTopic.trim() || isSaving} className="prago-btn-primary w-full flex items-center justify-center gap-2">
                                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                  Créer la session
                                </button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        
                        {todaySessions.length === 0 ? (
                          <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                              <Clock className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">Aucune session prévue aujourd'hui</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {todaySessions.map((session) => (
                              <motion.button
                                key={session.id}
                                whileHover={{ scale: 1.01 }}
                                onClick={() => toggleSessionComplete(session)}
                                className={cn(
                                  "w-full flex items-center justify-between p-4 rounded-2xl transition-all border",
                                  session.completed ? "bg-success/10 border-success/20" : "bg-secondary/30 border-transparent hover:border-primary/20"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  {session.completed ? <CheckCircle2 className="w-5 h-5 text-success" /> : <Circle className="w-5 h-5 text-muted-foreground" />}
                                  <div className="text-left">
                                    <p className={cn("font-medium", session.completed && "line-through text-muted-foreground")}>{session.topic}</p>
                                    <p className="text-xs text-muted-foreground">{session.subject}</p>
                                  </div>
                                </div>
                                <span className="text-sm text-muted-foreground">{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                              </motion.button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="bg-card border border-border rounded-3xl p-12 text-center">
                      <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
                        <Target className="w-10 h-10 text-muted-foreground" />
                      </div>
                      <h3 className="font-display font-bold text-lg mb-2">Sélectionne un examen</h3>
                      <p className="text-sm text-muted-foreground">Clique sur un examen dans la liste pour voir les détails</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <ExamCalendar sessions={sessions} onToggleComplete={toggleSessionComplete} />
            </TabsContent>

            {/* AI Planning Tab */}
            <TabsContent value="ai-planning">
              {selectedExam ? (
                <AIStudyPlanGenerator exam={selectedExam} existingSessions={sessions} onSessionsGenerated={handleBulkCreateSessions} />
              ) : (
                <div className="bg-card border border-border rounded-3xl p-12 text-center">
                  <div className="w-20 h-20 rounded-3xl prago-gradient-bg flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">Sélectionne un examen</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    Choisis un examen dans l'onglet "Vue d'ensemble" pour générer un planning de révision avec l'IA
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}
    </motion.div>
  );
}
