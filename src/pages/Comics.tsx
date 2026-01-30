import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Play, Pause, Loader2, Trash2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComics, Comic, ComicPanel } from "@/hooks/useComics";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/DocumentUpload";
import { toast } from "sonner";

const subjects = ["Biologie", "Histoire", "Mathématiques", "Physique", "Français", "Général"];
const emojis = ["🧬", "🏭", "📐", "🍎", "📚", "🎨", "🌍", "⚡", "🔬", "🧪"];

export default function Comics() {
  const { comics, loading, createComic, deleteComic } = useComics();
  const { isGenerating, progress, generateFromImage } = useAIGeneration();
  
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isAIOpen, setIsAIOpen] = useState(false);

  // AI state
  const [aiSubject, setAISubject] = useState("Biologie");
  const [aiPanelCount, setAIPanelCount] = useState(4);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const nextPanel = () => {
    if (selectedComic && currentPanel < selectedComic.panels.length - 1) {
      setCurrentPanel(currentPanel + 1);
    }
  };

  const prevPanel = () => {
    if (currentPanel > 0) {
      setCurrentPanel(currentPanel - 1);
    }
  };

  const handleAIGenerate = async () => {
    if (!selectedImage) {
      toast.error("Sélectionne une image de ton cours");
      return;
    }

    const result = await generateFromImage(
      selectedImage,
      "comic",
      aiSubject,
      { count: aiPanelCount }
    );

    if (!result || !result.title || !result.panels) {
      toast.error("Erreur lors de la génération");
      return;
    }

    const newComic = await createComic({
      title: result.title,
      subject: aiSubject,
      thumbnail: emojis[Math.floor(Math.random() * emojis.length)],
      panels: result.panels as ComicPanel[],
      duration: `${result.panels.length * 2} min`,
    });

    if (newComic) {
      toast.success("BD générée avec succès !");
      setIsAIOpen(false);
      setSelectedImage(null);
      setSelectedComic(newComic);
      setCurrentPanel(0);
    }
  };

  const handleBack = () => {
    setSelectedComic(null);
    setCurrentPanel(0);
    setIsPlaying(false);
  };

  if (selectedComic) {
    const currentPanelData = selectedComic.panels[currentPanel];
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="h-[calc(100vh-7rem)] flex flex-col"
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button onClick={handleBack} className="p-2 rounded-xl hover:bg-secondary transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display text-xl font-semibold">{selectedComic.title}</h1>
              <p className="text-sm text-muted-foreground">{selectedComic.subject}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Panel {currentPanel + 1}/{selectedComic.panels.length}
            </span>
            <button onClick={() => setIsPlaying(!isPlaying)} className="p-2 rounded-xl bg-primary text-primary-foreground">
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button onClick={() => { deleteComic(selectedComic.id); handleBack(); }} className="p-2 rounded-xl hover:bg-destructive/10 text-destructive">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 prago-card overflow-hidden flex items-center justify-center relative">
          {currentPanelData ? (
            <motion.div
              key={currentPanel}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              className="w-full max-w-2xl aspect-[4/3] bg-secondary/50 rounded-xl flex items-center justify-center"
            >
              <div className="text-center p-8">
                <div className="text-6xl mb-4">{selectedComic.thumbnail}</div>
                <p className="text-lg font-medium">{currentPanelData.content}</p>
                {currentPanelData.hasDialog && currentPanelData.dialog && (
                  <div className="mt-4 p-4 bg-background rounded-xl border border-border max-w-sm mx-auto">
                    <p className="text-sm">{currentPanelData.dialog}</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <div className="text-center">
              <p className="text-muted-foreground">Aucun panel disponible</p>
            </div>
          )}

          <button onClick={prevPanel} disabled={currentPanel === 0} className="absolute left-4 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button onClick={nextPanel} disabled={currentPanel === selectedComic.panels.length - 1} className="absolute right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {selectedComic.panels.map((_, index) => (
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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Cours en BD</h1>
        <p className="text-muted-foreground">Apprends des concepts complexes grâce à des bandes dessinées éducatives générées par l'IA.</p>
      </div>

      <div className="prago-card prago-gradient-border p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg mb-1">Génère ta propre BD avec l'IA</h3>
            <p className="text-sm text-muted-foreground">Importe une image de ton cours et l'IA créera une BD éducative personnalisée.</p>
          </div>
          <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-primary w-full md:w-auto">
                <Wand2 className="w-4 h-4 mr-2" />
                Générer avec IA
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Générer une BD avec l'IA
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">Importe une image de ton cours et l'IA créera une BD éducative pour t'aider à apprendre.</p>
                
                <DocumentUpload
                  onFileSelected={(base64) => setSelectedImage(base64)}
                  isLoading={isGenerating}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Matière</label>
                    <select value={aiSubject} onChange={(e) => setAISubject(e.target.value)} className="prago-input w-full">
                      {subjects.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Panels</label>
                    <select value={aiPanelCount} onChange={(e) => setAIPanelCount(Number(e.target.value))} className="prago-input w-full">
                      <option value={4}>4 panels</option>
                      <option value={6}>6 panels</option>
                      <option value={8}>8 panels</option>
                    </select>
                  </div>
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
                  Générer la BD
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold mb-4">Tes BD</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : comics.length === 0 ? (
        <div className="prago-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Aucune BD</h3>
          <p className="text-muted-foreground text-sm mb-4">Importe une image de ton cours et l'IA créera une BD éducative</p>
          <button onClick={() => setIsAIOpen(true)} className="prago-btn-primary">
            <Wand2 className="w-4 h-4 mr-2" />
            Générer avec IA
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {comics.map((comic) => (
            <button
              key={comic.id}
              onClick={() => { setSelectedComic(comic); setCurrentPanel(0); }}
              className="prago-card prago-card-interactive p-4 text-left"
            >
              <div className="aspect-square bg-secondary/50 rounded-xl flex items-center justify-center mb-4">
                <span className="text-5xl">{comic.thumbnail}</span>
              </div>
              <h3 className="font-medium mb-1 line-clamp-1">{comic.title}</h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3">
                <span>{comic.subject}</span>
                <span>•</span>
                <span>{comic.panels.length} panels</span>
                <span>•</span>
                <span>{comic.duration}</span>
              </div>
              {comic.progress > 0 && (
                <div className="prago-progress">
                  <div
                    className={cn("prago-progress-bar", comic.progress === 100 && "bg-success")}
                    style={{ width: `${comic.progress}%` }}
                  />
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
