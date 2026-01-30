import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Target, Clock, BookOpen, ChevronRight, Plus, CheckCircle2, Circle, Loader2, Trash2, X, Sparkles, BarChart3 } from "lucide-react";
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
  
  // All sessions for stats
  const { sessions: allSessions } = useStudySessions();
  
  const [isCreateExamOpen, setIsCreateExamOpen] = useState(false);
  const [isCreateSessionOpen, setIsCreateSessionOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  
  // Exam form
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("Mathématiques");
  const [examDate, setExamDate] = useState("");
  const [examTopics, setExamTopics] = useState<string[]>([""]);
  
  // Session form
  const [sessionStartTime, setSessionStartTime] = useState("09:00");
  const [sessionEndTime, setSessionEndTime] = useState("10:30");
  const [sessionSubject, setSessionSubject] = useState("");
  const [sessionTopic, setSessionTopic] = useState("");
  const [sessionDate, setSessionDate] = useState(format(new Date(), "yyyy-MM-dd"));
  
  const [isSaving, setIsSaving] = useState(false);

  // Auto-select first exam
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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-1">
            Préparation aux Examens
          </h1>
          <p className="text-muted-foreground text-sm">
            Planifie et suis ta préparation pour réussir tes examens
          </p>
        </div>
        <Dialog open={isCreateExamOpen} onOpenChange={setIsCreateExamOpen}>
          <DialogTrigger asChild>
            <button className="prago-btn-primary flex items-center gap-2 w-fit">
              <Plus className="w-4 h-4" />
              Ajouter un examen
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ajouter un examen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Titre</label>
                <input
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="prago-input w-full"
                  placeholder="Contrôle de Mathématiques"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Matière</label>
                <select
                  value={examSubject}
                  onChange={(e) => setExamSubject(e.target.value)}
                  className="prago-input w-full"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Date de l'examen</label>
                <input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="prago-input w-full"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Chapitres à réviser</label>
                <div className="space-y-2">
                  {examTopics.map((topic, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={topic}
                        onChange={(e) => {
                          const newTopics = [...examTopics];
                          newTopics[index] = e.target.value;
                          setExamTopics(newTopics);
                        }}
                        className="prago-input flex-1"
                        placeholder={`Chapitre ${index + 1}`}
                      />
                      {examTopics.length > 1 && (
                        <button
                          onClick={() => setExamTopics(examTopics.filter((_, i) => i !== index))}
                          className="p-2 text-destructive hover:bg-destructive/10 rounded-lg"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setExamTopics([...examTopics, ""])}
                  className="text-sm text-primary hover:underline mt-2"
                >
                  + Ajouter un chapitre
                </button>
              </div>
              <button
                onClick={handleCreateExam}
                disabled={!examTitle.trim() || !examDate || isSaving}
                className="prago-btn-primary w-full flex items-center justify-center gap-2"
              >
                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                Créer l'examen
              </button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {exams.length === 0 ? (
        <div className="prago-card p-12 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Aucun examen</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Ajoute ton premier examen pour commencer à planifier tes révisions
          </p>
          <button 
            onClick={() => setIsCreateExamOpen(true)}
            className="prago-btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un examen
          </button>
        </div>
      ) : (
        <>
          {/* Stats Overview */}
          <ExamStats exams={exams} sessions={allSessions} selectedExam={selectedExam} />

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-flex">
              <TabsTrigger value="overview" className="gap-2">
                <Target className="w-4 h-4" />
                <span className="hidden sm:inline">Vue d'ensemble</span>
                <span className="sm:hidden">Exams</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="gap-2">
                <Calendar className="w-4 h-4" />
                Calendrier
              </TabsTrigger>
              <TabsTrigger value="ai-planning" className="gap-2">
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
                  <h2 className="font-display font-semibold">Examens à venir</h2>
                  {exams.map((exam) => {
                    const daysLeft = getDaysLeft(exam.exam_date);
                    return (
                      <button
                        key={exam.id}
                        onClick={() => setSelectedExam(exam)}
                        className={cn(
                          "w-full text-left p-4 rounded-xl transition-all",
                          selectedExam?.id === exam.id
                            ? "prago-card border-primary/30 ring-2 ring-primary/20"
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
                              daysLeft <= 3 ? "prago-badge-warning" : daysLeft <= 7 ? "prago-badge-info" : "prago-badge-primary"
                            )}
                          >
                            {daysLeft}j
                          </span>
                        </div>
                        <div className="prago-progress">
                          <div className="prago-progress-bar" style={{ width: `${exam.progress}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">{exam.progress}% préparé</p>
                      </button>
                    );
                  })}
                </div>

                {/* Exam Details */}
                <div className="lg:col-span-2 space-y-6">
                  {selectedExam ? (
                    <>
                      {/* Exam Info Card */}
                      <div className="prago-card p-6">
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <h2 className="font-display text-xl font-semibold mb-1">{selectedExam.title}</h2>
                            <p className="text-muted-foreground">{selectedExam.subject}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="text-right">
                              <p className="text-2xl font-bold prago-gradient-text">{getDaysLeft(selectedExam.exam_date)}</p>
                              <p className="text-sm text-muted-foreground">jours restants</p>
                            </div>
                            <button
                              onClick={() => { deleteExam(selectedExam.id); setSelectedExam(null); }}
                              className="p-2 rounded-lg hover:bg-destructive/10 text-destructive"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="p-4 rounded-xl bg-secondary/50">
                            <Calendar className="w-5 h-5 text-primary mb-2" />
                            <p className="text-sm font-medium">{formatExamDate(selectedExam.exam_date)}</p>
                            <p className="text-xs text-muted-foreground">Date de l'examen</p>
                          </div>
                          <div className="p-4 rounded-xl bg-secondary/50">
                            <Target className="w-5 h-5 text-success mb-2" />
                            <p className="text-sm font-medium">{selectedExam.progress}%</p>
                            <p className="text-xs text-muted-foreground">Progression</p>
                          </div>
                          <div className="p-4 rounded-xl bg-secondary/50">
                            <BookOpen className="w-5 h-5 text-info mb-2" />
                            <p className="text-sm font-medium">{selectedExam.topics.filter(t => t.completed).length} / {selectedExam.topics.length}</p>
                            <p className="text-xs text-muted-foreground">Chapitres</p>
                          </div>
                        </div>

                        <h3 className="font-medium mb-3">Chapitres à réviser</h3>
                        {selectedExam.topics.length === 0 ? (
                          <p className="text-sm text-muted-foreground">Aucun chapitre défini</p>
                        ) : (
                          <div className="space-y-2">
                            {selectedExam.topics.map((topic, index) => (
                              <button
                                key={index}
                                onClick={() => toggleTopicComplete(selectedExam, index)}
                                className={cn(
                                  "w-full flex items-center justify-between p-3 rounded-xl transition-colors",
                                  topic.completed ? "bg-success/10" : "bg-secondary/50 hover:bg-secondary"
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
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Today's Sessions */}
                      <div className="prago-card p-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="font-display font-semibold">Sessions du jour</h3>
                          <Dialog open={isCreateSessionOpen} onOpenChange={setIsCreateSessionOpen}>
                            <DialogTrigger asChild>
                              <button className="text-sm text-primary hover:underline">+ Ajouter</button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Ajouter une session d'étude</DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Début</label>
                                    <input
                                      type="time"
                                      value={sessionStartTime}
                                      onChange={(e) => setSessionStartTime(e.target.value)}
                                      className="prago-input w-full"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-sm font-medium mb-1 block">Fin</label>
                                    <input
                                      type="time"
                                      value={sessionEndTime}
                                      onChange={(e) => setSessionEndTime(e.target.value)}
                                      className="prago-input w-full"
                                    />
                                  </div>
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Date</label>
                                  <input
                                    type="date"
                                    value={sessionDate}
                                    onChange={(e) => setSessionDate(e.target.value)}
                                    className="prago-input w-full"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Matière</label>
                                  <input
                                    type="text"
                                    value={sessionSubject}
                                    onChange={(e) => setSessionSubject(e.target.value)}
                                    className="prago-input w-full"
                                    placeholder="Mathématiques"
                                  />
                                </div>
                                <div>
                                  <label className="text-sm font-medium mb-1 block">Sujet</label>
                                  <input
                                    type="text"
                                    value={sessionTopic}
                                    onChange={(e) => setSessionTopic(e.target.value)}
                                    className="prago-input w-full"
                                    placeholder="Équations différentielles"
                                  />
                                </div>
                                <button
                                  onClick={handleCreateSession}
                                  disabled={!sessionSubject.trim() || !sessionTopic.trim() || isSaving}
                                  className="prago-btn-primary w-full flex items-center justify-center gap-2"
                                >
                                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                  Ajouter
                                </button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                        {todaySessions.length === 0 ? (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            Aucune session prévue aujourd'hui
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {todaySessions.map((session) => (
                              <div
                                key={session.id}
                                className={cn(
                                  "flex items-center gap-4 p-3 rounded-xl",
                                  session.completed ? "bg-success/10" : "bg-secondary/50"
                                )}
                              >
                                <div className="flex items-center gap-2 text-muted-foreground w-32 flex-shrink-0">
                                  <Clock className="w-4 h-4" />
                                  <span className="text-xs">{session.start_time.slice(0, 5)} - {session.end_time.slice(0, 5)}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium truncate">{session.subject}</p>
                                  <p className="text-xs text-muted-foreground truncate">{session.topic}</p>
                                </div>
                                {session.completed ? (
                                  <CheckCircle2 className="w-5 h-5 text-success flex-shrink-0" />
                                ) : (
                                  <button 
                                    onClick={() => toggleSessionComplete(session)}
                                    className="prago-btn-ghost text-xs py-1 px-3"
                                  >
                                    Terminer
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="prago-card p-12 text-center">
                      <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-display text-lg font-semibold mb-2">Sélectionne un examen</h3>
                      <p className="text-muted-foreground text-sm">
                        Choisis un examen dans la liste pour voir les détails
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Calendar Tab */}
            <TabsContent value="calendar">
              <ExamCalendar 
                sessions={sessions} 
                onToggleComplete={toggleSessionComplete}
              />
            </TabsContent>

            {/* AI Planning Tab */}
            <TabsContent value="ai-planning">
              {selectedExam ? (
                <AIStudyPlanGenerator
                  exam={selectedExam}
                  onSessionsGenerated={handleBulkCreateSessions}
                  existingSessions={sessions}
                />
              ) : (
                <div className="prago-card p-12 text-center">
                  <Sparkles className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-display text-lg font-semibold mb-2">Sélectionne un examen</h3>
                  <p className="text-muted-foreground text-sm">
                    Choisis un examen pour générer un planning de révision intelligent
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
