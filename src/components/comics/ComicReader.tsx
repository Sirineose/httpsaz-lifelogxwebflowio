import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, Play, Pause, Trash2, RotateCcw, Maximize2, Minimize2 } from "lucide-react";
import { Comic } from "@/hooks/useComics";
import { ComicPanelViewer } from "./ComicPanelViewer";
import { cn } from "@/lib/utils";

interface ComicReaderProps {
  comic: Comic;
  onBack: () => void;
  onDelete: () => void;
}

export function ComicReader({ comic, onBack, onDelete }: ComicReaderProps) {
  const [currentPanel, setCurrentPanel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const nextPanel = useCallback(() => {
    if (currentPanel < comic.panels.length - 1) {
      setCurrentPanel(prev => prev + 1);
    } else {
      setIsPlaying(false);
    }
  }, [currentPanel, comic.panels.length]);

  const prevPanel = useCallback(() => {
    if (currentPanel > 0) {
      setCurrentPanel(prev => prev - 1);
    }
  }, [currentPanel]);

  const restartComic = () => {
    setCurrentPanel(0);
    setIsPlaying(false);
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      nextPanel();
    }, 4000);

    return () => clearInterval(timer);
  }, [isPlaying, nextPanel]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        nextPanel();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prevPanel();
      } else if (e.key === "Escape") {
        if (isFullscreen) {
          setIsFullscreen(false);
        } else {
          onBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextPanel, prevPanel, onBack, isFullscreen]);

  const currentPanelData = comic.panels[currentPanel];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "flex flex-col",
        isFullscreen 
          ? "fixed inset-0 z-50 bg-background p-4" 
          : "h-[calc(100vh-7rem)]"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <button 
            onClick={onBack} 
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="font-display text-lg md:text-xl font-semibold line-clamp-1">
              {comic.title}
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground">
              {comic.subject} • {comic.panels.length} panels
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-2">
          <button
            onClick={restartComic}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title="Recommencer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            title={isPlaying ? "Pause" : "Lecture auto"}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors hidden md:flex"
            title={isFullscreen ? "Quitter plein écran" : "Plein écran"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button
            onClick={onDelete}
            className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors"
            title="Supprimer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Comic Panel Viewer */}
      <div className="flex-1 min-h-0 flex items-center justify-center">
        {currentPanelData ? (
          <ComicPanelViewer
            panel={currentPanelData}
            subject={comic.subject}
            panelNumber={currentPanel + 1}
            totalPanels={comic.panels.length}
            onNext={nextPanel}
            onPrev={prevPanel}
            thumbnail={comic.thumbnail}
          />
        ) : (
          <div className="text-center text-muted-foreground">
            Aucun panel disponible
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      <div className="mt-4 flex items-center gap-2 flex-shrink-0">
        {comic.panels.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentPanel(index)}
            className={cn(
              "flex-1 h-2 md:h-3 rounded-full transition-all duration-300",
              index === currentPanel 
                ? "prago-gradient-bg scale-y-125" 
                : index < currentPanel 
                  ? "bg-primary/50" 
                  : "bg-secondary hover:bg-secondary/80"
            )}
          />
        ))}
      </div>

      {/* Keyboard hints */}
      <div className="mt-2 text-center text-xs text-muted-foreground hidden md:block">
        ← → pour naviguer • Espace pour avancer • Échap pour quitter
      </div>
    </motion.div>
  );
}
