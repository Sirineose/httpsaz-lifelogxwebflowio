import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Camera, FileText, X, Sparkles, Image as ImageIcon, Loader2, File, Zap, CheckCircle2, ArrowRight, Target, Clock, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import ReactMarkdown from "react-markdown";

type UploadState = "idle" | "uploading" | "analyzing" | "done";
type FileType = "image" | "pdf";

const features = [
  { icon: Zap, label: "Résolution instantanée", color: "text-warning" },
  { icon: Target, label: "Explications détaillées", color: "text-primary" },
  { icon: Lightbulb, label: "Conseils personnalisés", color: "text-success" },
];

export default function SnapSolve() {
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [preview, setPreview] = useState<string | null>(null);
  const [fileType, setFileType] = useState<FileType>("image");
  const [fileName, setFileName] = useState<string | null>(null);
  const [solution, setSolution] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: FileType = "image") => {
    const file = e.target.files?.[0];
    if (file) {
      setFileType(type);
      setFileName(file.name);
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        setPreview(base64);
        await analyzeFile(base64, type);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFile = async (fileBase64: string, type: FileType) => {
    setUploadState("uploading");
    const isGuest = !user && localStorage.getItem('prago_guest_mode') === 'true';

    try {
      setUploadState("analyzing");
      
      let data;
      const requestBody = type === "pdf" 
        ? { pdfBase64: fileBase64, guestMode: isGuest }
        : { imageBase64: fileBase64, guestMode: isGuest };
        
      if (isGuest) {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        if (!response.ok) throw new Error("API error");
        data = await response.json();
      } else {
        const result = await supabase.functions.invoke("analyze-image", {
          body: requestBody,
        });
        if (result.error) throw result.error;
        data = result.data;
      }

      setExtractedText(data.extractedText);
      setSolution(data.solution);
      setUploadState("done");
    } catch (error) {
      console.error("Error analyzing image:", error);
      toast({
        title: "Erreur",
        description: "Impossible d'analyser l'image. Réessayez.",
        variant: "destructive",
      });
      setUploadState("idle");
      setPreview(null);
    }
  };

  const resetUpload = () => {
    setUploadState("idle");
    setPreview(null);
    setFileName(null);
    setSolution(null);
    setExtractedText(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (pdfInputRef.current) pdfInputRef.current.value = "";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto"
    >
      {/* Premium Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg">
            <Camera className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">Snap & Solve</h1>
            <p className="text-muted-foreground">Résolution instantanée par IA</p>
          </div>
        </div>
        
        {/* Feature Pills */}
        <div className="flex flex-wrap gap-2">
          {features.map((feature) => (
            <div key={feature.label} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 text-sm">
              <feature.icon className={cn("w-4 h-4", feature.color)} />
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Area */}
        <div className="space-y-4">
          <AnimatePresence mode="wait">
            {!preview ? (
              <motion.div
                key="upload"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                {/* Hidden inputs */}
                <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => handleFileChange(e, "image")} className="hidden" />
                <input ref={imageInputRef} type="file" accept="image/*" onChange={(e) => handleFileChange(e, "image")} className="hidden" />
                <input ref={pdfInputRef} type="file" accept="application/pdf" onChange={(e) => handleFileChange(e, "pdf")} className="hidden" />

                {/* Main upload area */}
                <div
                  onClick={() => imageInputRef.current?.click()}
                  className="relative overflow-hidden rounded-3xl border-2 border-dashed border-border hover:border-primary/50 bg-card cursor-pointer group transition-all"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <div className="relative p-12 text-center">
                    <motion.div 
                      whileHover={{ scale: 1.1, rotate: 5 }}
                      className="w-20 h-20 rounded-3xl prago-gradient-bg flex items-center justify-center mx-auto mb-6 shadow-lg"
                    >
                      <Upload className="w-10 h-10 text-white" />
                    </motion.div>
                    <h3 className="font-display font-bold text-xl mb-2">
                      Dépose ton exercice ici
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      ou clique pour parcourir tes fichiers
                    </p>
                    <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                        <ImageIcon className="w-4 h-4" />
                        Images
                      </span>
                      <span className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary">
                        <File className="w-4 h-4" />
                        PDF
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions - Premium Cards */}
                <div className="grid grid-cols-3 gap-4 mt-6">
                  {[
                    { icon: File, label: "PDF", color: "text-destructive", bg: "bg-destructive/10", onClick: () => pdfInputRef.current?.click() },
                    { icon: Camera, label: "Photo", color: "text-primary", bg: "bg-primary/10", onClick: () => cameraInputRef.current?.click() },
                    { icon: ImageIcon, label: "Galerie", color: "text-info", bg: "bg-info/10", onClick: () => imageInputRef.current?.click() },
                  ].map((action) => (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={action.onClick}
                      className="bg-card border border-border rounded-2xl p-5 text-center hover:border-primary/30 hover:shadow-lg transition-all"
                    >
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3", action.bg)}>
                        <action.icon className={cn("w-6 h-6", action.color)} />
                      </div>
                      <span className="text-sm font-medium">{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl"
              >
                <div className="relative">
                  {fileType === "pdf" ? (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-destructive/10 to-destructive/5 flex flex-col items-center justify-center gap-4">
                      <div className="w-20 h-20 rounded-2xl bg-destructive/20 flex items-center justify-center">
                        <File className="w-10 h-10 text-destructive" />
                      </div>
                      <p className="text-sm font-medium text-muted-foreground">{fileName}</p>
                    </div>
                  ) : (
                    <img src={preview} alt="Preview" className="w-full aspect-[4/3] object-cover" />
                  )}
                  <button
                    onClick={resetUpload}
                    className="absolute top-4 right-4 w-10 h-10 rounded-xl bg-background/90 backdrop-blur-sm flex items-center justify-center hover:bg-background transition-colors shadow-lg"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  {uploadState !== "done" && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 rounded-2xl prago-gradient-bg flex items-center justify-center mx-auto mb-4 shadow-lg">
                          <Loader2 className="w-8 h-8 animate-spin text-white" />
                        </div>
                        <p className="font-medium mb-1">
                          {uploadState === "uploading" ? "Téléchargement..." : "Analyse IA en cours..."}
                        </p>
                        <p className="text-sm text-muted-foreground">Cela prend quelques secondes</p>
                      </div>
                    </div>
                  )}
                </div>
                {uploadState === "done" && (
                  <div className="p-4 border-t border-border bg-success/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      </div>
                      <div>
                        <p className="font-medium text-success">Analyse terminée !</p>
                        <p className="text-xs text-muted-foreground">Solution générée avec succès</p>
                      </div>
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
                className="bg-card border border-border rounded-3xl overflow-hidden shadow-xl"
              >
                <div className="p-6 border-b border-border bg-gradient-to-r from-primary/5 to-accent/5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl prago-gradient-bg flex items-center justify-center shadow-lg">
                      <Sparkles className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-lg">Solution détaillée</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Clock className="w-3 h-3" />
                        Générée par l'IA
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="p-6 max-h-[500px] overflow-y-auto">
                  {extractedText && (
                    <div className="mb-6 p-4 bg-secondary/50 rounded-xl border border-border">
                      <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-2">
                        <FileText className="w-3 h-3" />
                        Texte extrait
                      </p>
                      <p className="text-sm">{extractedText.substring(0, 200)}{extractedText.length > 200 ? "..." : ""}</p>
                    </div>
                  )}
                  
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{solution}</ReactMarkdown>
                  </div>
                </div>
                
                <div className="p-4 border-t border-border bg-secondary/30">
                  <button 
                    onClick={resetUpload}
                    className="prago-btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Nouvel exercice
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="placeholder"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-card border border-border rounded-3xl h-full min-h-[400px] flex items-center justify-center"
              >
                <div className="text-center p-8">
                  <div className="w-20 h-20 rounded-3xl bg-secondary flex items-center justify-center mx-auto mb-6">
                    <Sparkles className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <h3 className="font-display font-bold text-lg mb-2">
                    En attente d'un exercice
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Importe une image ou un PDF pour commencer l'analyse intelligente.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Tips Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mt-10 p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-card to-accent/5 border border-border"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-warning/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-warning" />
          </div>
          <h3 className="font-display font-bold">Conseils pour de meilleurs résultats</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            "Assure-toi que l'image est bien éclairée et nette",
            "Centre bien l'exercice dans le cadre",
            "Évite les reflets et les ombres",
          ].map((tip, index) => (
            <div key={index} className="flex items-start gap-3 p-3 rounded-xl bg-background/50">
              <ArrowRight className="w-4 h-4 mt-0.5 text-primary flex-shrink-0" />
              <span className="text-sm">{tip}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
