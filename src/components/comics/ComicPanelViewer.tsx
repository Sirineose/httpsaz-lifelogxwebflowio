import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Loader2, ImageOff } from "lucide-react";
import { ComicPanel } from "@/hooks/useComics";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface ComicPanelViewerProps {
  panel: ComicPanel;
  subject: string;
  panelNumber: number;
  totalPanels: number;
  onNext: () => void;
  onPrev: () => void;
  thumbnail: string;
}

export function ComicPanelViewer({
  panel,
  subject,
  panelNumber,
  totalPanels,
  onNext,
  onPrev,
  thumbnail,
}: ComicPanelViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const generateImage = async () => {
      if (!panel.content) return;
      
      setIsLoading(true);
      setImageError(false);

      try {
        const { data, error } = await supabase.functions.invoke("generate-comic-image", {
          body: {
            panelDescription: panel.content,
            subject,
            guestMode: localStorage.getItem("prago_guest_mode") === "true",
          },
        });

        if (error) throw error;

        if (data?.imageUrl) {
          setImageUrl(data.imageUrl);
        } else {
          setImageError(true);
        }
      } catch (err) {
        console.error("Error generating panel image:", err);
        setImageError(true);
      } finally {
        setIsLoading(false);
      }
    };

    generateImage();
  }, [panel.content, subject]);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={panelNumber}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-2xl"
        >
          {/* Panel Frame - Comic Style */}
          <div className="relative bg-white dark:bg-slate-900 rounded-lg border-4 border-slate-800 dark:border-slate-600 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden">
            {/* Panel Number Badge */}
            <div className="absolute top-3 left-3 z-20 bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full shadow-md">
              {panelNumber}/{totalPanels}
            </div>

            {/* Image Area */}
            <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900">
              {isLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-10 h-10 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Génération de l'illustration...</span>
                </div>
              ) : imageUrl && !imageError ? (
                <img
                  src={imageUrl}
                  alt={panel.content}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                  {imageError ? (
                    <ImageOff className="w-12 h-12 text-muted-foreground" />
                  ) : (
                    <span className="text-7xl">{thumbnail}</span>
                  )}
                  <p className="text-center text-sm text-muted-foreground max-w-xs">
                    {panel.content}
                  </p>
                </div>
              )}

              {/* Halftone overlay for comic effect */}
              <div 
                className="absolute inset-0 opacity-[0.03] pointer-events-none mix-blend-multiply"
                style={{
                  backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)',
                  backgroundSize: '4px 4px',
                }}
              />
            </div>

            {/* Dialog Bubble */}
            {panel.hasDialog && panel.dialog && (
              <div className="relative p-4">
                <div className="relative bg-white dark:bg-slate-800 border-2 border-slate-800 dark:border-slate-600 rounded-2xl p-4 shadow-md">
                  {/* Speech bubble tail */}
                  <div className="absolute -top-3 left-8 w-4 h-4 bg-white dark:bg-slate-800 border-l-2 border-t-2 border-slate-800 dark:border-slate-600 rotate-45" />
                  
                  <p className="text-sm md:text-base font-comic leading-relaxed relative z-10">
                    {panel.dialog}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      <button
        onClick={onPrev}
        disabled={panelNumber === 1}
        className={cn(
          "absolute left-2 md:left-4 p-3 rounded-full transition-all",
          "bg-background/90 backdrop-blur-sm border-2 border-slate-800 shadow-lg",
          "hover:bg-primary hover:text-primary-foreground hover:scale-110",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-background/90"
        )}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>

      <button
        onClick={onNext}
        disabled={panelNumber === totalPanels}
        className={cn(
          "absolute right-2 md:right-4 p-3 rounded-full transition-all",
          "bg-background/90 backdrop-blur-sm border-2 border-slate-800 shadow-lg",
          "hover:bg-primary hover:text-primary-foreground hover:scale-110",
          "disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:bg-background/90"
        )}
      >
        <ChevronRight className="w-6 h-6" />
      </button>
    </div>
  );
}
