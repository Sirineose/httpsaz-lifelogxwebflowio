import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, Check, X, ChevronLeft, ChevronRight, Sparkles, Layers, Target, Plus, Loader2, Trash2, Wand2 } from "lucide-react";
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

  // Dialogs
  const [isCreateFlashcardOpen, setIsCreateFlashcardOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  
  // Form states
  const [flashcardFront, setFlashcardFront] = useState("");
  const [flashcardBack, setFlashcardBack] = useState("");
  const [flashcardSubject, setFlashcardSubject] = useState("Général");
  
  // AI generation
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
      className="max-w-3xl mx-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Quiz & Flashcards</h1>
          <p className="text-muted-foreground">Teste tes connaissances et mémorise efficacement.</p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isAIGenerateOpen} onOpenChange={setIsAIGenerateOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-primary flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                Générer avec IA
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Génération IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  Importe une image de ton cours et l'IA génèrera automatiquement des flashcards ou des questions de quiz.
                </p>
                
                <DocumentUpload
                  onFileSelected={(base64) => setSelectedImage(base64)}
                  isLoading={isGenerating}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Type</label>
                    <select
                      value={aiGenerateType}
                      onChange={(e) => setAIGenerateType(e.target.value as "flashcards" | "quiz")}
                      className="prago-input w-full"
                    >
                      <option value="flashcards">Flashcards</option>
                      <option value="quiz">Questions Quiz</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nombre</label>
                    <select
                      value={aiCount}
                      onChange={(e) => setAICount(Number(e.target.value))}
                      className="prago-input w-full"
                    >
                      <option value={3}>3</option>
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Matière</label>
                  <select
                    value={aiSubject}
                    onChange={(e) => setAISubject(e.target.value)}
                    className="prago-input w-full"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
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

                <button
                  onClick={handleAIGenerate}
                  disabled={!selectedImage || isGenerating}
                  className="prago-btn-primary w-full flex items-center justify-center gap-2"
                >
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
                  <label className="text-sm font-medium mb-1 block">Question (recto)</label>
                  <input
                    type="text"
                    value={flashcardFront}
                    onChange={(e) => setFlashcardFront(e.target.value)}
                    className="prago-input w-full"
                    placeholder="Qu'est-ce que...?"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Réponse (verso)</label>
                  <textarea
                    value={flashcardBack}
                    onChange={(e) => setFlashcardBack(e.target.value)}
                    className="prago-input w-full min-h-[80px]"
                    placeholder="La réponse est..."
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Matière</label>
                  <select
                    value={flashcardSubject}
                    onChange={(e) => setFlashcardSubject(e.target.value)}
                    className="prago-input w-full"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <button
                  onClick={handleCreateFlashcard}
                  disabled={!flashcardFront.trim() || !flashcardBack.trim() || isSaving}
                  className="prago-btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Mode Toggle */}
      <div className="flex items-center gap-2 p-1.5 bg-secondary rounded-xl mb-8 w-fit">
        <button
          onClick={() => setMode("quiz")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "quiz" ? "bg-background shadow-prago-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Target className="w-4 h-4" />
          Quiz ({questions.length})
        </button>
        <button
          onClick={() => setMode("flashcards")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
            mode === "flashcards" ? "bg-background shadow-prago-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layers className="w-4 h-4" />
          Flashcards ({flashcards.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : isEmpty ? (
        <div className="prago-card p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
            {mode === "quiz" ? <Target className="w-8 h-8 text-muted-foreground" /> : <Layers className="w-8 h-8 text-muted-foreground" />}
          </div>
          <h3 className="font-display text-lg font-semibold mb-2">
            {mode === "quiz" ? "Aucune question" : "Aucune flashcard"}
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Importe une image de ton cours et l'IA génèrera automatiquement du contenu
          </p>
          <button onClick={() => setIsAIGenerateOpen(true)} className="prago-btn-primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Générer avec IA
          </button>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {mode === "quiz" ? (
            <motion.div key="quiz" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              {!showResult && currentQuestion ? (
                <div className="prago-card p-6 md:p-8">
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-sm text-muted-foreground">Question {currentQuestionIndex + 1}/{questions.length}</span>
                    <div className="flex items-center gap-2">
                      <span className="prago-badge-primary">Score: {score}/{questions.length}</span>
                      <button onClick={() => deleteQuestion(currentQuestion.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="prago-progress mb-8">
                    <div className="prago-progress-bar" style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }} />
                  </div>

                  <h2 className="font-display text-xl md:text-2xl font-semibold mb-6">{currentQuestion.question}</h2>

                  <div className="space-y-3 mb-8">
                    {currentQuestion.options.map((option, index) => {
                      const isCorrect = index === currentQuestion.correct_index;
                      const isSelected = index === selectedAnswer;
                      const showFeedback = selectedAnswer !== null;

                      return (
                        <button
                          key={index}
                          onClick={() => handleAnswer(index)}
                          disabled={selectedAnswer !== null}
                          className={cn(
                            "w-full p-4 rounded-xl text-left transition-all border-2",
                            !showFeedback && "border-border hover:border-primary/50 hover:bg-primary/5",
                            showFeedback && isCorrect && "border-success bg-success/10",
                            showFeedback && isSelected && !isCorrect && "border-destructive bg-destructive/10",
                            showFeedback && !isSelected && !isCorrect && "border-border opacity-50"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                              !showFeedback && "bg-secondary",
                              showFeedback && isCorrect && "bg-success text-white",
                              showFeedback && isSelected && !isCorrect && "bg-destructive text-white"
                            )}>
                              {showFeedback && isCorrect ? <Check className="w-4 h-4" /> : showFeedback && isSelected ? <X className="w-4 h-4" /> : String.fromCharCode(65 + index)}
                            </div>
                            <span className="font-medium">{option}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {selectedAnswer !== null && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <button onClick={nextQuestion} className="prago-btn-primary w-full">
                        {currentQuestionIndex < questions.length - 1 ? "Question suivante" : "Voir le résultat"}
                      </button>
                    </motion.div>
                  )}
                </div>
              ) : showResult ? (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="prago-card p-8 text-center">
                  <div className="w-20 h-20 rounded-2xl prago-gradient-bg flex items-center justify-center mx-auto mb-6">
                    <Brain className="w-10 h-10 text-white" />
                  </div>
                  <h2 className="font-display text-2xl font-bold mb-2">Quiz terminé !</h2>
                  <p className="text-muted-foreground mb-6">Tu as obtenu {score} bonnes réponses sur {questions.length}</p>
                  <div className="text-5xl font-bold prago-gradient-text mb-8">{Math.round((score / questions.length) * 100)}%</div>
                  <button onClick={resetQuiz} className="prago-btn-primary flex items-center gap-2 mx-auto">
                    <RotateCcw className="w-4 h-4" />
                    Recommencer
                  </button>
                </motion.div>
              ) : null}
            </motion.div>
          ) : (
            <motion.div key="flashcards" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              {currentCard && (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-muted-foreground">Carte {currentCardIndex + 1}/{flashcards.length}</span>
                    <div className="flex items-center gap-2">
                      <span className="prago-badge-success">{knownCards.length} maîtrisées</span>
                      <button onClick={() => deleteFlashcard(currentCard.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div onClick={handleFlip} className="relative h-80 cursor-pointer perspective-1000">
                    <motion.div
                      animate={{ rotateY: isFlipped ? 180 : 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 preserve-3d"
                      style={{ transformStyle: "preserve-3d" }}
                    >
                      <div className="absolute inset-0 prago-card p-8 flex items-center justify-center backface-hidden" style={{ backfaceVisibility: "hidden" }}>
                        <div className="text-center">
                          <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
                          <p className="font-display text-xl font-semibold">{currentCard.front}</p>
                          <p className="text-sm text-muted-foreground mt-4">Clique pour révéler la réponse</p>
                        </div>
                      </div>
                      <div className="absolute inset-0 prago-card prago-gradient-border p-8 flex items-center justify-center" style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                        <div className="text-center">
                          <p className="text-lg">{currentCard.back}</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <div className="flex items-center justify-between mt-6">
                    <button onClick={prevCard} disabled={currentCardIndex === 0} className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <div className="flex items-center gap-3">
                      <button onClick={() => nextCard(false)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                        <X className="w-4 h-4" />
                        À revoir
                      </button>
                      <button onClick={() => nextCard(true)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors">
                        <Check className="w-4 h-4" />
                        Maîtrisé
                      </button>
                    </div>
                    <button onClick={() => nextCard(false)} disabled={currentCardIndex === flashcards.length - 1} className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </motion.div>
  );
}
