import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { BookOpen, Sparkles, Loader2, Wand2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useComics, Comic, ComicPanel } from "@/hooks/useComics";
import { useAIGeneration } from "@/hooks/useAIGeneration";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DocumentUpload } from "@/components/DocumentUpload";
import { ComicReader } from "@/components/comics/ComicReader";
import { toast } from "sonner";

const subjectKeys = ["biology", "history", "mathematics", "physics", "french", "general"] as const;
const emojis = ["🧬", "🏭", "📐", "🍎", "📚", "🎨", "🌍", "⚡", "🔬", "🧪"];

export default function Comics() {
  const { t } = useTranslation();
  const { comics, loading, createComic, deleteComic } = useComics();
  const { isGenerating, progress, generateFromImage } = useAIGeneration();
  
  const [selectedComic, setSelectedComic] = useState<Comic | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // AI state
  const [aiSubject, setAISubject] = useState("biology");
  const [aiPanelCount, setAIPanelCount] = useState(4);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleAIGenerate = async () => {
    if (!selectedImage) {
      toast.error(t('comics.selectImage'));
      return;
    }

    const result = await generateFromImage(
      selectedImage,
      "comic",
      t(`comics.subjects.${aiSubject}`),
      { count: aiPanelCount }
    );

    if (!result || !result.title || !result.panels) {
      toast.error(t('comics.error'));
      return;
    }

    const newComic = await createComic({
      title: result.title,
      subject: t(`comics.subjects.${aiSubject}`),
      thumbnail: emojis[Math.floor(Math.random() * emojis.length)],
      panels: result.panels as ComicPanel[],
      duration: `${result.panels.length * 2} min`,
    });

    if (newComic) {
      toast.success(t('comics.success'));
      setIsAIOpen(false);
      setSelectedImage(null);
      setSelectedComic(newComic);
    }
  };

  const handleBack = () => {
    setSelectedComic(null);
  };

  const handleDeleteComic = () => {
    if (selectedComic) {
      deleteComic(selectedComic.id);
      handleBack();
    }
  };

  // Comic Reader View
  if (selectedComic) {
    return (
      <ComicReader
        comic={selectedComic}
        onBack={handleBack}
        onDelete={handleDeleteComic}
      />
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">{t('comics.title')}</h1>
        <p className="text-muted-foreground">{t('comics.subtitle')}</p>
      </div>

      <div className="prago-card prago-gradient-border p-6 mb-8">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold text-lg mb-1">{t('comics.generateTitle')}</h3>
            <p className="text-sm text-muted-foreground">{t('comics.generateDesc')}</p>
          </div>
          <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
            <DialogTrigger asChild>
              <button className="prago-btn-primary w-full md:w-auto">
                <Wand2 className="w-4 h-4 mr-2" />
                {t('comics.generateWithAI')}
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  {t('comics.generateDialogTitle')}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">{t('comics.generateDialogDesc')}</p>
                
                <DocumentUpload
                  onFileSelected={(base64) => setSelectedImage(base64)}
                  isLoading={isGenerating}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('comics.subject')}</label>
                    <select value={aiSubject} onChange={(e) => setAISubject(e.target.value)} className="prago-input w-full">
                      {subjectKeys.map((s) => (
                        <option key={s} value={s}>{t(`comics.subjects.${s}`)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t('comics.panels')}</label>
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
                  {t('comics.generateBtn')}
                </button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <h2 className="font-display text-lg font-semibold mb-4">{t('comics.yourComics')}</h2>
      
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : comics.length === 0 ? (
        <div className="prago-card p-12 text-center">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-display text-lg font-semibold mb-2">{t('comics.noComics')}</h3>
          <p className="text-muted-foreground text-sm mb-4">{t('comics.noComicsDesc')}</p>
          <button onClick={() => setIsAIOpen(true)} className="prago-btn-primary">
            <Wand2 className="w-4 h-4 mr-2" />
            {t('comics.generateWithAI')}
          </button>
        </div>
      ) : (
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
