import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, RotateCcw, Check, X, ChevronLeft, ChevronRight, Sparkles, Layers, Target, Upload, Image, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type Mode = "quiz" | "flashcards";
type CreateMode = "none" | "photo" | "pdf";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct: number;
}

interface Flashcard {
  id: number;
  front: string;
  back: string;
}

interface UploadedFile {
  name: string;
  type: string;
  preview?: string;
}

const quizQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "Quelle est la dérivée de f(x) = x² ?",
    options: ["f'(x) = x", "f'(x) = 2x", "f'(x) = x²", "f'(x) = 2"],
    correct: 1,
  },
  {
    id: 2,
    question: "En quelle année a débuté la Révolution française ?",
    options: ["1776", "1789", "1792", "1804"],
    correct: 1,
  },
  {
    id: 3,
    question: "Quel organite est responsable de la respiration cellulaire ?",
    options: ["Noyau", "Ribosome", "Mitochondrie", "Réticulum endoplasmique"],
    correct: 2,
  },
];

const flashcards: Flashcard[] = [
  { id: 1, front: "Qu'est-ce que la photosynthèse ?", back: "Processus par lequel les plantes convertissent la lumière en énergie chimique, produisant du glucose et de l'oxygène à partir de CO₂ et d'eau." },
  { id: 2, front: "Quelle est la formule de l'aire d'un cercle ?", back: "A = πr² où r est le rayon du cercle." },
  { id: 3, front: "Qui a écrit 'Les Misérables' ?", back: "Victor Hugo, publié en 1862." },
];

export default function QuizFlashcards() {
  const [mode, setMode] = useState<Mode>("quiz");
  const [createMode, setCreateMode] = useState<CreateMode>("none");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<number[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const currentQuestion = quizQuestions[currentQuestionIndex];
  const currentCard = flashcards[currentCardIndex];

  const handleAnswer = (index: number) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(index);
    if (index === currentQuestion.correct) {
      setScore(score + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestionIndex < quizQuestions.length - 1) {
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

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const nextCard = (known: boolean) => {
    if (known) {
      setKnownCards([...knownCards, currentCard.id]);
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

  const handleFileSelect = (type: "photo" | "pdf") => {
    setCreateMode(type);
    if (fileInputRef.current) {
      fileInputRef.current.accept = type === "photo" ? "image/*" : ".pdf";
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles: UploadedFile[] = [];
    
    Array.from(files).forEach((file) => {
      const fileData: UploadedFile = {
        name: file.name,
        type: file.type,
      };

      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (event) => {
          fileData.preview = event.target?.result as string;
          setUploadedFiles((prev) => [...prev, fileData]);
        };
        reader.readAsDataURL(file);
      } else {
        newFiles.push(fileData);
      }
    });

    if (newFiles.length > 0) {
      setUploadedFiles((prev) => [...prev, ...newFiles]);
    }

    // Reset input
    e.target.value = "";
  };

  const removeFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (uploadedFiles.length === 0) {
      toast({
        title: "Aucun fichier",
        description: "Ajoute au moins une photo ou un PDF pour générer du contenu.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate AI processing
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    toast({
      title: "Contenu généré !",
      description: `${mode === "quiz" ? "Quiz" : "Flashcards"} créés à partir de ${uploadedFiles.length} fichier(s).`,
    });
    
    setIsProcessing(false);
    setUploadedFiles([]);
    setCreateMode("none");
  };

  const cancelCreate = () => {
    setCreateMode("none");
    setUploadedFiles([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Quiz & Flashcards
        </h1>
        <p className="text-muted-foreground">
          Teste tes connaissances et mémorise efficacement.
        </p>
      </div>

      {/* Mode Toggle + Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 p-1.5 bg-secondary rounded-xl w-fit">
          <button
            onClick={() => setMode("quiz")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "quiz" ? "bg-background shadow-prago-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Target className="w-4 h-4" />
            Quiz
          </button>
          <button
            onClick={() => setMode("flashcards")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              mode === "flashcards" ? "bg-background shadow-prago-sm" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="w-4 h-4" />
            Flashcards
          </button>
        </div>

        {/* Create from file buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleFileSelect("photo")}
            className="prago-btn-secondary text-sm"
          >
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Créer depuis</span> Photo
          </button>
          <button
            onClick={() => handleFileSelect("pdf")}
            className="prago-btn-secondary text-sm"
          >
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Créer depuis</span> PDF
          </button>
        </div>
      </div>

      {/* Upload Panel */}
      <AnimatePresence>
        {uploadedFiles.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-8"
          >
            <div className="prago-card p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Upload className="w-4 h-4 text-primary" />
                  Fichiers à analyser
                </h3>
                <span className="text-sm text-muted-foreground">
                  {uploadedFiles.length} fichier(s)
                </span>
              </div>

              {/* Files Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                {uploadedFiles.map((file, index) => (
                  <div
                    key={index}
                    className="relative group rounded-xl border border-border overflow-hidden bg-secondary/30"
                  >
                    {file.preview ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-24 object-cover"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center">
                        <FileText className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                    <div className="p-2">
                      <p className="text-xs truncate">{file.name}</p>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {/* Add more button */}
                <button
                  onClick={() => handleFileSelect(createMode === "pdf" ? "pdf" : "photo")}
                  className="h-24 rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-1 transition-colors"
                >
                  <Plus className="w-5 h-5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Ajouter</span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={handleGenerate}
                  disabled={isProcessing}
                  className="prago-btn-primary flex-1 disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Génération en cours...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Générer {mode === "quiz" ? "le quiz" : "les flashcards"}
                    </>
                  )}
                </button>
                <button
                  onClick={cancelCreate}
                  className="prago-btn-ghost"
                >
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {mode === "quiz" ? (
          <motion.div
            key="quiz"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            {!showResult ? (
              <div className="prago-card p-6 md:p-8">
                {/* Progress */}
                <div className="flex items-center justify-between mb-6">
                  <span className="text-sm text-muted-foreground">
                    Question {currentQuestionIndex + 1}/{quizQuestions.length}
                  </span>
                  <span className="prago-badge-primary">
                    Score: {score}/{quizQuestions.length}
                  </span>
                </div>
                <div className="prago-progress mb-8">
                  <div
                    className="prago-progress-bar"
                    style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
                  />
                </div>

                {/* Question */}
                <h2 className="font-display text-xl md:text-2xl font-semibold mb-6">
                  {currentQuestion.question}
                </h2>

                {/* Options */}
                <div className="space-y-3 mb-8">
                  {currentQuestion.options.map((option, index) => {
                    const isCorrect = index === currentQuestion.correct;
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
                          <div
                            className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium",
                              !showFeedback && "bg-secondary",
                              showFeedback && isCorrect && "bg-success text-white",
                              showFeedback && isSelected && !isCorrect && "bg-destructive text-white"
                            )}
                          >
                            {showFeedback && isCorrect ? (
                              <Check className="w-4 h-4" />
                            ) : showFeedback && isSelected ? (
                              <X className="w-4 h-4" />
                            ) : (
                              String.fromCharCode(65 + index)
                            )}
                          </div>
                          <span className="font-medium">{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Next Button */}
                {selectedAnswer !== null && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <button onClick={nextQuestion} className="prago-btn-primary w-full">
                      {currentQuestionIndex < quizQuestions.length - 1 ? "Question suivante" : "Voir le résultat"}
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="prago-card p-8 text-center"
              >
                <div className="w-20 h-20 rounded-2xl prago-gradient-bg flex items-center justify-center mx-auto mb-6">
                  <Brain className="w-10 h-10 text-white" />
                </div>
                <h2 className="font-display text-2xl font-bold mb-2">Quiz terminé !</h2>
                <p className="text-muted-foreground mb-6">
                  Tu as obtenu {score} bonnes réponses sur {quizQuestions.length}
                </p>
                <div className="text-5xl font-bold prago-gradient-text mb-8">
                  {Math.round((score / quizQuestions.length) * 100)}%
                </div>
                <button onClick={resetQuiz} className="prago-btn-primary flex items-center gap-2 mx-auto">
                  <RotateCcw className="w-4 h-4" />
                  Recommencer
                </button>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="flashcards"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Progress */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-muted-foreground">
                Carte {currentCardIndex + 1}/{flashcards.length}
              </span>
              <span className="prago-badge-success">
                {knownCards.length} maîtrisées
              </span>
            </div>

            {/* Card */}
            <div
              onClick={handleFlip}
              className="relative h-80 cursor-pointer perspective-1000"
            >
              <motion.div
                animate={{ rotateY: isFlipped ? 180 : 0 }}
                transition={{ duration: 0.4 }}
                className="absolute inset-0 preserve-3d"
                style={{ transformStyle: "preserve-3d" }}
              >
                {/* Front */}
                <div
                  className="absolute inset-0 prago-card p-8 flex items-center justify-center backface-hidden"
                  style={{ backfaceVisibility: "hidden" }}
                >
                  <div className="text-center">
                    <Sparkles className="w-8 h-8 text-primary mx-auto mb-4" />
                    <p className="font-display text-xl font-semibold">{currentCard.front}</p>
                    <p className="text-sm text-muted-foreground mt-4">Clique pour révéler la réponse</p>
                  </div>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 prago-card prago-gradient-border p-8 flex items-center justify-center"
                  style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                >
                  <div className="text-center">
                    <p className="text-lg">{currentCard.back}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-between mt-6">
              <button
                onClick={prevCard}
                disabled={currentCardIndex === 0}
                className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={() => nextCard(false)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors"
                >
                  <X className="w-4 h-4" />
                  À revoir
                </button>
                <button
                  onClick={() => nextCard(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 text-success hover:bg-success/20 transition-colors"
                >
                  <Check className="w-4 h-4" />
                  Maîtrisé
                </button>
              </div>

              <button
                onClick={() => nextCard(false)}
                disabled={currentCardIndex === flashcards.length - 1}
                className="p-3 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
