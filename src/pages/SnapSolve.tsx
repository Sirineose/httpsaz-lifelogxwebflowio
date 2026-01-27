import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, FileText, X, Sparkles, ArrowRight, Image as ImageIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type UploadState = "idle" | "uploading" | "analyzing" | "done";

export default function SnapSolve() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
        simulateUpload();
      };
      reader.readAsDataURL(file);
    }
  };

  const simulateUpload = () => {
    setUploadState("uploading");
    setTimeout(() => {
      setUploadState("analyzing");
      setTimeout(() => {
        setUploadState("done");
        setSolution(`**Analyse de l'exercice**

L'exercice demande de résoudre l'équation suivante :
\`2x² + 5x - 3 = 0\`

**Méthode de résolution : Formule quadratique**

Nous utilisons la formule : x = (-b ± √(b² - 4ac)) / 2a

Avec a = 2, b = 5, c = -3

**Étape 1 : Calculer le discriminant**
Δ = b² - 4ac = 25 - 4(2)(-3) = 25 + 24 = 49

**Étape 2 : Trouver les solutions**
x₁ = (-5 + 7) / 4 = 2/4 = **0.5**
x₂ = (-5 - 7) / 4 = -12/4 = **-3**

**Réponse finale :**
Les solutions sont x = 0.5 et x = -3`);
      }, 2000);
    }, 1500);
  };

  const resetUpload = () => {
    setUploadState("idle");
    setPreview(null);
    setSolution(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto"
    >
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">
          Snap & Solve
        </h1>
        <p className="text-muted-foreground">
          Prends une photo de ton exercice et obtiens la solution détaillée instantanément.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upload Area */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="prago-card prago-gradient-border block cursor-pointer group"
                >
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display font-semibold text-lg mb-2">
                      Glisse ton fichier ici
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      ou clique pour parcourir
                    </p>
                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-4 h-4" />
                        Images
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        PDF
                      </span>
                    </div>
                  </div>
                </label>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button className="prago-card p-4 text-center hover:bg-secondary/50 transition-colors">
                    <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
                    <span className="text-sm font-medium">Prendre une photo</span>
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="prago-card p-4 text-center hover:bg-secondary/50 transition-colors"
                  >
                    <FileText className="w-6 h-6 mx-auto mb-2 text-info" />
                    <span className="text-sm font-medium">Importer un PDF</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="prago-card overflow-hidden"
              >
                <div className="relative">
                  <img
                    src={preview}
                    alt="Preview"
                    className="w-full aspect-[4/3] object-cover"
                  />
                  <button
                    onClick={resetUpload}
                    className="absolute top-3 right-3 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  {uploadState !== "done" && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                        <p className="text-sm font-medium">
                          {uploadState === "uploading" ? "Téléchargement..." : "Analyse en cours..."}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                {uploadState === "done" && (
                  <div className="p-4 border-t border-border">
                    <div className="flex items-center gap-2 text-success">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-sm font-medium">Analyse terminée</span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Solution Area */}
        <div>
          <AnimatePresence mode="wait">
            {solution ? (
              <motion.div
                key="solution"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="prago-card p-6"
              >
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-border">
                  <div className="w-10 h-10 rounded-xl prago-gradient-bg flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold">Solution détaillée</h3>
                    <p className="text-xs text-muted-foreground">Générée par l'IA</p>
                  </div>
                </div>
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-sm">{solution}</div>
                </div>
                <div className="mt-6 pt-4 border-t border-border flex items-center gap-3">
                  <button className="prago-btn-primary flex-1 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Approfondir
                  </button>
                  <button className="prago-btn-secondary">
                    Partager
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="prago-card p-8 h-full flex items-center justify-center"
              >
                <div className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-semibold mb-2">
                    En attente d'un exercice
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Importe une image ou un PDF pour commencer l'analyse.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-8 prago-card p-6 bg-primary/5"
      >
        <h3 className="font-display font-semibold mb-3">💡 Conseils pour de meilleurs résultats</h3>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Assure-toi que l'image est bien éclairée et nette</span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Centre bien l'exercice dans le cadre</span>
          </li>
          <li className="flex items-start gap-2">
            <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
            <span>Évite les reflets et les ombres</span>
          </li>
        </ul>
      </motion.div>
    </motion.div>
  );
}
