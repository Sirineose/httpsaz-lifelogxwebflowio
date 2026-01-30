import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, Check, X, ChevronLeft, ChevronRight, Sparkles, Layers, Target, Plus, Loader2, Trash2, Wand2, Trophy, Zap, BookOpen, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useFlashcards, useQuizQuestions } from "@/hooks/useFlashcards";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/DocumentUpload";
import { toast } from "sonner";

type Mode = "quiz" | "flashcards";

const subjects = ["Général", "Mathématiques", "Histoire", "Biologie", "Physique", "Français"];

export default function QuizFlashcards() {
  const { flashcards, loading: loadingFlashcards, createFlashcard, updateFlashcard, deleteFlashcard } = useFlashcards();
  const { questions, loading: loadingQuestions, createQuestion, deleteQuestion } = useQuizQuestions();
  const { isGenerating, progress, generateFromImage } = useAIGeneration();
  
  const [mode, setMode] = useState<Mode>("quiz");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<string[]>([]);

  const [isCreateFlashcardOpen, setIsCreateFlashcardOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");
  const [flashcardSubject, setFlashcardSubject] = useState("Général");
  
  const [aiSubject, setAISubject] = useState("Général");
  const [aiCount, setAICount] = useState(5);
  const [aiGenerateType, setAIGenerateType] = useState<"flashcards" | "quiz">("flashcards");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  const [isSaving, setIsSaving] = useState(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentCard = flashcards[currentCardIndex];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (currentQuestion && index === currentQuestion.correct_index) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
  };

  const handleFlip = () => setIsFlipped(!isFlipped);

  const nextCard = async (known: boolean) => {
    if (currentCard) {
      if (known && !knownCards.includes(currentCard.id)) {
        setKnownCards([...knownCards, currentCard.id]);
        await updateFlashcard(currentCard.id, { is_known: true });
      }
    }
    setIsFlipped(false);
    if (currentCardIndex < flashcards.length - 1) {
      setTimeout(() => setCurrentCardIndex(currentCardIndex + 1), 200);
    }
  };

  const prevCard = () => {
    setIsFlipped(false);
    if (currentCardIndex > 0) {
      setTimeout(() => setCurrentCardIndex(currentCardIndex - 1), 200);
    }
  };

  const handleCreateFlashcard = async () => {
    if (!flashcardFront.trim() || !flashcardBack.trim()) return;
    setIsSaving(true);
    const result = await createFlashcard({
      front: flashcardFront,
      back: flashcardBack,
      subject: flashcardSubject,
      deck_name: "Mes flashcards",
    });
    setIsSaving(false);
    if (result) {
      setIsCreateFlashcardOpen(false);
      setFlashcardFront("");
      setFlashcardBack("");
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedImage) {
      toast.error("Sélectionne une image de ton cours");
      return;
    }

    const result = await generateFromImage(selectedImage, aiGenerateType, aiSubject, { count: aiCount });

    if (!result) return;

    if (aiGenerateType === "flashcards" && result.flashcards) {
      for (const fc of result.flashcards) {
        await createFlashcard({
          front: fc.front,
          back: fc.back,
          subject: aiSubject,
          deck_name: "Généré par IA",
        });
      }
      toast.success(`${result.flashcards.length} flashcards créées !`);
      setMode("flashcards");
    } else if (aiGenerateType === "quiz" && result.questions) {
      for (const q of result.questions) {
        await createQuestion({
          question: q.question,
          options: q.options,
          correct_index: q.correct_index,
          subject: aiSubject,
          quiz_name: "Généré par IA",
        });
      }
      toast.success(`${result.questions.length} questions créées !`);
      setMode("quiz");
    }

    setIsAIGenerateOpen(false);
    setSelectedImage(null);
  };

  const loading = mode === "quiz" ? loadingQuestions : loadingFlashcards;
  const isEmpty = mode === "quiz" ? questions.length === 0 : flashcards.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Premium Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg">
            <Brain className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Quiz & Flashcards</h1>
            <p className="text-muted-foreground">Apprentissage intelligent et mémorisation</p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Dialog open={isAIGenerateOpen} onOpenChange={setIsAIGenerateOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-primary flex items-center gap-2 shadow-lg">
                <Wand2 className="w-4 h-4" />
                Générer avec IA
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  Génération IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-5 mt-4">
                <p className="text-sm text-muted-foreground">
                  Importe une image de ton cours et l'IA génèrera automatiquement des flashcards ou des questions de quiz.
                </p>
                
                <DocumentUpload onFileSelected={(base64) => setSelectedImage(base64)} isLoading={isGenerating} />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Type</label>
                    <select value={aiGenerateType} onChange={(e) => setAIGenerateType(e.target.value as "flashcards" | "quiz")} className="prago-input w-full">
                      <option value="flashcards">Flashcards</option>
                      <option value="quiz">Questions Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Nombre</label>
                    <select value={aiCount} onChange={(e) => setAICount(Number(e.target.value))} className="prago-input w-full">
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Matière</label>
                  <select value={aiSubject} onChange={(e) => setAISubject(e.target.value)} className="prago-input w-full">
                    {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>

                {isGenerating && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 animate-spin text-primary" />
                      <span className="text-sm">{progress}</span>
                    </div>
                  </div>
                )}

                <button onClick={handleAIGenerate} disabled={!selectedImage || isGenerating} className="prago-btn-primary w-full flex items-center justify-center gap-2">
                  {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                  Générer
                </button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isCreateFlashcardOpen} onOpenChange={setIsCreateFlashcardOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-secondary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Manuel
              </button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer manuellement</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Question (recto)</label>
                  <input type="text" value={flashcardFront} onChange={(e) => setFlashcardFront(e.target.value)} className="prago-input w-full" placeholder="Qu'est-ce que...?" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Réponse (verso)</label>
                  <textarea value={flashcardBack} onChange={(e) => setFlashcardBack(e.target.value)} className="prago-input w-full min-h-[80px]" placeholder="La réponse est..." />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Matière</label>
                  <select value={flashcardSubject} onChange={(e) => setFlashcardSubject(e.target.value)} className="prago-input w-full">
                    {subjects.map((s) => (<option key={s} value={s}>{s}</option>))}
                  </select>
                </div>
                <button onClick={handleCreateFlashcard} disabled={!flashcardFront.trim() || !flashcardBack.trim() || isSaving} className="prago-btn-primary w-full flex items-center justify-center gap-2">
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Premium Mode Toggle */}
      <div className="flex items-center gap-1 p-1.5 bg-card border border-border rounded-2xl mb-8 w-fit shadow-sm">
        <button
          onClick={() => setMode("quiz")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
            mode === "quiz" ? "prago-gradient-bg text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Target className="w-4 h-4" />
          Quiz ({questions.length})
        </button>
        <button
          onClick={() => setMode("flashcards")}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all",
            mode === "flashcards" ? "prago-gradient-bg text-white shadow-md" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
          )}
        >
          <Layers className="w-4 h-4" />
          Flashcards ({flashcards.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : isEmpty ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card border border-border rounded-3xl p-12 text-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
            {mode === "quiz" ? <Target className="w-10 h-10 text-muted-foreground" /> : <Layers className="w-10 h-10 text-muted-foreground" />}
          </div>
          <h3 className="font-display text-xl font-bold mb-2">
            {mode === "quiz" ? "Aucune question" : "Aucune flashcard"}
          </h3>
          <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
            Importe une image de ton cours et l'IA génèrera automatiquement du contenu
          </p>
          <button onClick={() => setIsAIGenerateOpen(true)} className="prago-btn-primary shadow-lg">
            <Wand2 className="w-4 h-4 mr-2" />
            Générer avec IA
          </button>
        </motion.div>
      ) : (
        <AnimatePresence mode="wait">
          {mode === "quiz" ? (
            <motion.div key="quiz" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {!showResult && currentQuestion ? (
                <div className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl">
                  {/* Quiz Header */}
                  <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1}/{questions.length}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10">
                          <Star className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium">{score}</span>
                        </div>
                        <button onClick={() => deleteQuestion(currentQuestion.id)} className="p-2 rounded-lg hover:bg-destructive/10 text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-secondary overflow-hidden">
                      <motion.div 
                        className="h-full prago-gradient-bg"
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Question */}
                  <div className="p-8">
                    <h2 className="font-display text-xl md:text-2xl font-bold mb-8">{currentQuestion.question}</h2>

                    <div className="space-y-3 mb-8">
                      {currentQuestion.options.map((option, index) => {
                        const isCorrect = index === currentQuestion.correct_index;
                        const isSelected = index === selectedAnswer;
                        const showFeedback = selectedAnswer !== null;

                        return (
                          <motion.button
                            key={index}
                            whileHover={!showFeedback ? { scale: 1.01 } : {}}
                            whileTap={!showFeedback ? { scale: 0.99 } : {}}
                            onClick={() => handleAnswer(index)}
                            disabled={selectedAnswer !== null}
                            className={cn(
                              "w-full p-5 rounded-2xl text-left transition-all border-2",
                              !showFeedback && "border-border hover:border-primary/50 hover:bg-primary/5",
                              showFeedback && isCorrect && "border-success bg-success/10",
                              showFeedback && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                              showFeedback && !isSelected && !isCorrect && "border-border opacity-40"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold",
                                !showFeedback && "bg-secondary",
                                showFeedback && isCorrect && "bg-success text-white",
                                showFeedback && isSelected && !isCorrect && "bg-destructive text-white"
                              )}>
                                {showFeedback && isCorrect ? <Check className="w-5 h-5" /> : showFeedback && isSelected ? <X className="w-5 h-5" /> : String.fromCharCode(65 + index)}
                              </div>
                              <span className="font-medium">{option}</span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>

                    {selectedAnswer !== null && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <button onClick={nextQuestion} className="prago-btn-primary w-full shadow-lg">
                          {currentQuestionIndex < questions.length - 1 ? "Question suivante" : "Voir le résultat"}
                        </button>
                      </motion.div>
                    )}
                  </div>
                </div>
              ) : showResult ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-card border border-border rounded-3xl p-10 text-center shadow-xl"
                >
                  <div className="w-24 h-24 rounded-3xl prago-gradient-bg flex items-center justify-center mx-auto mb-6 shadow-lg">
                    <Trophy className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="font-display text-3xl font-bold mb-2">Quiz terminé !</h2>
                  <p className="text-muted-foreground mb-6">Tu as obtenu</p>
                  <div className="text-6xl font-bold prago-gradient-text mb-8">{score}/{questions.length}</div>
                  <button onClick={resetQuiz} className="prago-btn-primary inline-flex items-center gap-2 shadow-lg">
                    <RotateCcw className="w-4 h-4" />
                    Recommencer
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="flashcards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {currentCard && (
                <div className="space-y-6">
                  {/* Progress */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Carte {currentCardIndex + 1}/{flashcards.length}</span>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-success/10">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm font-medium text-success">{knownCards.length} maîtrisées</span>
                    </div>
                  </div>

                  {/* Flashcard */}
                  <motion.div
                    onClick={handleFlip}
                    className="relative cursor-pointer perspective-1000"
                    style={{ perspective: 1000 }}
                  >
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.6 }}
                      style={{ transformStyle: "preserve-3d" }}
                      className="relative"
                    >
                      <div className={cn(
                        "bg-card border border-border rounded-3xl p-10 min-h-[350px] flex items-center justify-center shadow-xl",
                        isFlipped && "invisible"
                      )}>
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <BookOpen className="w-8 h-8 text-primary" />
                          </div>
                          <p className="font-display text-xl md:text-2xl font-bold">{currentCard.front}</p>
                          <p className="text-sm text-muted-foreground mt-4">Clique pour voir la réponse</p>
                        </div>
                      </div>
                      <div 
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br from-primary/10 to-accent/10 border border-primary/20 rounded-3xl p-10 min-h-[350px] flex items-center justify-center shadow-xl",
                          !isFlipped && "invisible"
                        )}
                        style={{ transform: "rotateY(180deg)", backfaceVisibility: "hidden" }}
                      >
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-2xl prago-gradient-bg flex items-center justify-center mx-auto mb-6">
                            <Sparkles className="w-8 h-8 text-white" />
                          </div>
                          <p className="text-xl md:text-2xl font-medium">{currentCard.back}</p>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4">
                    <button onClick={prevCard} disabled={currentCardIndex === 0} className="p-4 rounded-2xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-all">
                      <ChevronLeft className="w-6 h-6" />
                    </button>
                    <button onClick={() => nextCard(false)} className="px-8 py-4 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive/20 font-medium transition-all">
                      <X className="w-5 h-5 mr-2 inline" />
                      À revoir
                    </button>
                    <button onClick={() => nextCard(true)} className="px-8 py-4 rounded-2xl bg-success/10 text-success hover:bg-success/20 font-medium transition-all">
                      <Check className="w-5 h-5 mr-2 inline" />
                      Maîtrisé
                    </button>
                    <button onClick={() => setCurrentCardIndex(Math.min(currentCardIndex + 1, flashcards.length - 1))} disabled={currentCardIndex === flashcards.length - 1} className="p-4 rounded-2xl bg-secondary hover:bg-secondary/80 disabled:opacity-50 transition-all">
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
