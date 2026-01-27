import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Play, Pause } from "lucide-react";
import { cn } from "@/lib/utils";

interface Comic {
  id: string;
  title: string;
  subject: string;
  panels: number;
  duration: string;
  progress: number;
  thumbnail: string;
}

const comics: Comic[] = [
  {
    id: "1",
    title: "Les bases de l'ADN",
    subject: "Biologie",
    panels: 12,
    duration: "8 min",
    progress: 75,
    thumbnail: "🧬",
  },
  {
    id: "2",
    title: "La Révolution Industrielle",
    subject: "Histoire",
    panels: 15,
    duration: "12 min",
    progress: 0,
    thumbnail: "🏭",
  },
  {
    id: "3",
    title: "Le théorème de Pythagore",
    subject: "Mathématiques",
    panels: 8,
    duration: "5 min",
    progress: 100,
    thumbnail: "📐",
  },
  {
    id: "4",
    title: "Les lois de Newton",
    subject: "Physique",
    panels: 10,
    duration: "7 min",
    progress: 30,
    thumbnail: "🍎",
  },
];

const comicPanels = [
  { id: 1, content: "Panel 1: Introduction au concept", hasDialog: true },
  { id: 2, content: "Panel 2: Explication détaillée", hasDialog: true },
  { id: 3, content: "Panel 3: Exemple visuel", hasDialog: false },
  { id: 4, content: "Panel 4: Application pratique", hasDialog: true },
];

export default function Comics() {
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const nextPanel = () => {
    if (currentPanel < comicPanels.length - 1) {
      setCurrentPanel(currentPanel + 1);
    }
  };

  const prevPanel = () => {
    if (currentPanel > 0) {
      setCurrentPanel(currentPanel - 1);
    }
  };

  if (selectedComic) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-[calc(100vh-7rem)] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSelectedComic(null)}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-xl font-semibold">{selectedComic.title}</h1>
              <p className="text-sm text-muted-foreground">{selectedComic.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Panel {currentPanel + 1}/{comicPanels.length}
            </span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-primary text-primary-foreground"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Comic Viewer */}
        <div className="flex-1 prago-card overflow-hidden flex items-center justify-center relative">
          <motion.div
            key={currentPanel}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="w-full max-w-2xl aspect-[4/3] bg-secondary/50 rounded-xl flex items-center justify-center"
          >
            <div className="text-center p-8">
              <div className="text-6xl mb-4">{selectedComic.thumbnail}</div>
              <p className="text-lg font-medium">{comicPanels[currentPanel].content}</p>
              {comicPanels[currentPanel].hasDialog && (
                <div className="mt-4 p-4 bg-background rounded-xl border border-border max-w-sm mx-auto">
                  <p className="text-sm">
                    "Voici l'explication de ce concept important..."
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Navigation */}
          <button
            onClick={prevPanel}
            disabled={currentPanel === 0}
            className="absolute left-4 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextPanel}
            disabled={currentPanel === comicPanels.length - 1}
            className="absolute right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="mt-4 flex items-center gap-2">
          {comicPanels.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentPanel(index)}
              className={cn(
                "flex-1 h-2 rounded-full transition-colors",
                index === currentPanel ? "prago-gradient-bg" : index < currentPanel ? "bg-primary/50" : "bg-secondary"
              )}
            />
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Cours en BD
        </h1>
        <p className="text-muted-foreground">
          Apprends des concepts complexes grâce à des bandes dessinées éducatives générées par l'IA.
        </p>
      </div>

      {/* Generate New */}
      <div className="prago-card prago-gradient-border p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg mb-1">
              Génère ta propre BD
            </h3>
            <p className="text-sm text-muted-foreground">
              Décris un concept que tu veux apprendre et l'IA créera une BD éducative personnalisée.
            </p>
          </div>
          <button className="prago-btn-primary w-full md:w-auto">
            Créer une BD
          </button>
        </div>
      </div>

      {/* Comics Grid */}
      <h2 className="font-display text-lg font-semibold mb-4">Tes BD</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {comics.map((comic) => (
          <button
            key={comic.id}
            onClick={() => setSelectedComic(comic)}
            className="prago-card prago-card-interactive p-4 text-left"
          >
            <div className="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center mb-4">
              <span className="text-5xl">{comic.thumbnail}</span>
            </div>
            <h3 className="font-medium mb-1 line-clamp-1">{comic.title}</h3>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
              <span>{comic.subject}</span>
              <span>•</span>
              <span>{comic.panels} panels</span>
              <span>•</span>
              <span>{comic.duration}</span>
            </div>
            {comic.progress > 0 && (
              <div className="prago-progress">
                <div
                  className={cn(
                    "prago-progress-bar",
                    comic.progress === 100 && "bg-success"
                  )}
                  style={{ width: `${comic.progress}%` }}
                />
              </div>
            )}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
