import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Camera, 
  Image as ImageIcon, 
  FileText, 
  Sparkles,
  Loader2,
  BookOpen,
  Brain,
  StickyNote,
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface QuickUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ContentType = "flashcards" | "quiz" | "synthesis" | "comic";

const contentTypes: { id: ContentType; label: string; icon: React.ElementType; description: string }[] = [
  { id: "flashcards", label: "Flashcards", icon: Layers, description: "Cartes de révision" },
  { id: "quiz", label: "Quiz", icon: Brain, description: "Questions à choix multiple" },
  { id: "synthesis", label: "Synthèse", icon: StickyNote, description: "Résumé structuré" },
  { id: "comic", label: "BD", icon: BookOpen, description: "Cours en bande dessinée" },
];

export function QuickUploadModal({ isOpen, onClose }: QuickUploadModalProps) {
  const [step, setStep] = useState<"upload" | "type">("upload");
  const [fileData, setFileData] = useState<{ base64: string; fileName: string; type: string } | null>(null);
  const [selectedType, setSelectedType] = useState<ContentType | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast({
        title: "Fichier trop volumineux",
        description: "La taille maximum est de 20 Mo.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setFileData({
        base64,
        fileName: file.name,
        type: file.type,
      });
      setStep("type");
    };
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!fileData || !selectedType) return;

    setIsGenerating(true);
    const isGuest = !user && localStorage.getItem("prago_guest_mode") === "true";

    try {
      const payload = {
        fileBase64: fileData.base64,
        fileName: fileData.fileName,
        contentType: selectedType,
        guestMode: isGuest,
      };

      let result;
      if (isGuest) {
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-content`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }
        );
        if (!response.ok) throw new Error("API error");
        result = await response.json();
      } else {
        const { data, error } = await supabase.functions.invoke("generate-content", {
          body: payload,
        });
        if (error) throw error;
        result = data;
      }

      toast({
        title: "Contenu généré !",
        description: `Tes ${selectedType === "flashcards" ? "flashcards" : selectedType === "quiz" ? "questions de quiz" : selectedType === "synthesis" ? "synthèses" : "BD"} ont été créées.`,
      });

      // Navigate to the appropriate page
      const routes: Record<ContentType, string> = {
        flashcards: "/quiz",
        quiz: "/quiz",
        synthesis: "/notes",
        comic: "/comics",
      };
      
      onClose();
      resetModal();
      navigate(routes[selectedType]);
    } catch (error) {
      console.error("Generation error:", error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le contenu. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const resetModal = () => {
    setStep("upload");
    setFileData(null);
    setSelectedType(null);
    setIsGenerating(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetModal, 300);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 100, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 100, scale: 0.95 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-md bg-card rounded-t-3xl sm:rounded-2xl shadow-2xl border border-border overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-display font-semibold">Importer un document</h2>
                <p className="text-xs text-muted-foreground">
                  {step === "upload" ? "Choisis ta source" : "Que veux-tu générer ?"}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <AnimatePresence mode="wait">
              {step === "upload" ? (
                <motion.div
                  key="upload"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  {/* Hidden inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <input
                    ref={cameraInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handleFileSelect}
                    className="hidden"
                  />

                  {/* Upload options */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-primary/50 hover:bg-secondary/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Prendre une photo</p>
                      <p className="text-sm text-muted-foreground">Utiliser l'appareil photo</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "image/*";
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-info/50 hover:bg-secondary/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-info/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <ImageIcon className="w-6 h-6 text-info" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Galerie</p>
                      <p className="text-sm text-muted-foreground">Choisir une image existante</p>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.accept = "application/pdf";
                        fileInputRef.current.removeAttribute("capture");
                        fileInputRef.current.click();
                      }
                    }}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-border hover:border-warning/50 hover:bg-secondary/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <FileText className="w-6 h-6 text-warning" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">Document PDF</p>
                      <p className="text-sm text-muted-foreground">Importer un fichier PDF</p>
                    </div>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="type"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* File preview */}
                  {fileData && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      {fileData.type.startsWith("image") ? (
                        <img
                          src={fileData.base64}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                          <FileText className="w-6 h-6 text-warning" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{fileData.fileName}</p>
                        <p className="text-xs text-muted-foreground">Prêt pour la génération</p>
                      </div>
                      <button
                        onClick={() => {
                          setStep("upload");
                          setFileData(null);
                        }}
                        className="p-2 rounded-lg hover:bg-secondary transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}

                  {/* Content type selection */}
                  <div className="grid grid-cols-2 gap-3">
                    {contentTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all",
                          selectedType === type.id
                            ? "border-primary bg-primary/10"
                            : "border-border hover:border-primary/50 hover:bg-secondary/50"
                        )}
                      >
                        <type.icon
                          className={cn(
                            "w-6 h-6",
                            selectedType === type.id ? "text-primary" : "text-muted-foreground"
                          )}
                        />
                        <div className="text-center">
                          <p className="font-medium text-sm">{type.label}</p>
                          <p className="text-xs text-muted-foreground">{type.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Generate button */}
                  <button
                    onClick={handleGenerate}
                    disabled={!selectedType || isGenerating}
                    className="w-full prago-btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Génération en cours...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        Générer avec l'IA
                      </>
                    )}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Safe area for mobile */}
          <div className="h-safe-area-inset-bottom" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
