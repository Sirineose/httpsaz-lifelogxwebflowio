import { useState } from "react";
import { motion } from "framer-motion";
import { BookOpen, ChevronLeft, ChevronRight, Sparkles, Play, Pause, Plus, Loader2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComics, Comic, ComicPanel } from "@/hooks/useComics";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const subjects = ["Biologie", "Histoire", "Mathématiques", "Physique", "Français", "Général"];
const emojis = ["🧬", "🏭", "📐", "🍎", "📚", "🎨", "🌍", "⚡", "🔬", "🧪"];

export default function Comics() {
  const { comics, loading, createComic, updateComic, deleteComic } = useComics();
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [currentPanel, setCurrentPanel] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [comicTitle, setComicTitle] = useState("");
  const [comicSubject, setComicSubject] = useState("Biologie");
  const [comicEmoji, setComicEmoji] = useState("📚");
  const [comicConcept, setComicConcept] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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

  const handleCreateComic = async () => {
    if (!comicTitle.trim() || !comicConcept.trim()) return;
    setIsSaving(true);
    
    // Generate simple panels from concept
    const panels: ComicPanel[] = [
      { id: 1, content: `Introduction: ${comicTitle}`, hasDialog: true, dialog: "Découvrons ensemble ce concept !" },
      { id: 2, content: comicConcept, hasDialog: true, dialog: "Voici l'explication..." },
      { id: 3, content: "Exemple pratique", hasDialog: true, dialog: "Regardons un exemple concret" },
      { id: 4, content: "Résumé et conclusion", hasDialog: true, dialog: "Maintenant tu as compris !" },
    ];
    
    const result = await createComic({
      title: comicTitle,
      subject: comicSubject,
      thumbnail: comicEmoji,
      panels,
      duration: `${panels.length * 2} min`,
    });
    
    setIsSaving(false);
    if (result) {
      setIsCreateOpen(false);
      setComicTitle("");
      setComicSubject("Biologie");
      setComicEmoji("📚");
      setComicConcept("");
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
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
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
              Panel {currentPanel + 1}/{selectedComic.panels.length}
            </span>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="p-2 rounded-xl bg-primary text-primary-foreground"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { deleteComic(selectedComic.id); handleBack(); }}
              className="p-2 rounded-xl hover:bg-destructive/10 text-destructive"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Comic Viewer */}
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
            disabled={currentPanel === selectedComic.panels.length - 1}
            className="absolute right-4 p-3 rounded-full bg-background/80 backdrop-blur-sm hover:bg-background transition-colors disabled:opacity-50"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Progress */}
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
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-primary w-full md:w-auto">
                Créer une BD
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Créer une nouvelle BD</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Titre</label>
                  <input
                    type="text"
                    value={comicTitle}
                    onChange={(e) => setComicTitle(e.target.value)}
                    className="prago-input w-full"
                    placeholder="Les bases de l'ADN"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Matière</label>
                  <select
                    value={comicSubject}
                    onChange={(e) => setComicSubject(e.target.value)}
                    className="prago-input w-full"
                  >
                    {subjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Emoji</label>
                  <div className="flex flex-wrap gap-2">
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setComicEmoji(emoji)}
                        className={cn(
                          "w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-colors",
                          comicEmoji === emoji ? "bg-primary/20 ring-2 ring-primary" : "bg-secondary hover:bg-secondary/80"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Concept à expliquer</label>
                  <textarea
                    value={comicConcept}
                    onChange={(e) => setComicConcept(e.target.value)}
                    className="prago-input w-full min-h-[100px]"
                    placeholder="Décris le concept que tu veux apprendre en BD..."
                  />
                </div>
                <button
                  onClick={handleCreateComic}
                  disabled={!comicTitle.trim() || !comicConcept.trim() || isSaving}
                  className="prago-btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Créer la BD
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Comics Grid */}
      <h2 className="font-display text-lg font-semibold mb-4">Tes BD</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : comics.length === 0 ? (
        <div className="prago-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">Aucune BD</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Crée ta première BD éducative pour commencer à apprendre visuellement
          </p>
          <button 
            onClick={() => setIsCreateOpen(true)}
            className="prago-btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer une BD
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
      )}
    </motion.div>
  );
}
