import { useState, useRef } from "react";
import { Upload, FileText, X, Loader2, AlertCircle, CheckCircle2, FileWarning } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { Progress } from "@/components/ui/progress";

interface LargePDFUploadProps {
  onFileProcessed: (result: { extractedText: string; pageCount: number; fileName: string }) => void;
  onProcessing?: (isProcessing: boolean) => void;
  isLoading?: boolean;
  className?: string;
  maxSizeMB?: number;
}

const MAX_BASE64_SIZE = 10 * 1024 * 1024; // 10MB for direct base64
const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

export function LargePDFUpload({
  onFileProcessed,
  onProcessing,
  isLoading = false,
  className,
  maxSizeMB = 50, // 50MB max par défaut
}: LargePDFUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{ name: string; size: number } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = async (file: File) => {
    if (!file) return;

    setError(null);
    setPreview({ name: file.name, size: file.size });

    // Vérifier le type
    if (file.type !== "application/pdf") {
      setError("Seuls les fichiers PDF sont acceptés");
      return;
    }

    // Vérifier la taille
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      setError(`Le fichier est trop volumineux (max ${maxSizeMB}MB)`);
      return;
    }

    setIsUploading(true);
    onProcessing?.(true);
    setUploadProgress(0);

    try {
      // Pour les petits fichiers, utiliser directement base64
      if (file.size <= MAX_BASE64_SIZE) {
        setProcessingStatus("Lecture du fichier...");
        const base64 = await readFileAsBase64(file);
        setUploadProgress(30);
        
        setProcessingStatus("Extraction du texte en cours...");
        const result = await processSmallPDF(base64, file.name);
        setUploadProgress(100);
        
        onFileProcessed(result);
      } else {
        // Pour les gros fichiers, upload vers Storage puis traiter
        setProcessingStatus("Upload du fichier volumineux...");
        const storagePath = await uploadToStorage(file);
        setUploadProgress(40);
        
        setProcessingStatus("Traitement du PDF...");
        const result = await processLargePDF(storagePath, file.name);
        setUploadProgress(100);
        
        onFileProcessed(result);
      }
      
      setProcessingStatus("Terminé !");
    } catch (err: any) {
      console.error("Error processing PDF:", err);
      setError(err.message || "Erreur lors du traitement du PDF");
    } finally {
      setIsUploading(false);
      onProcessing?.(false);
    }
  };

  const readFileAsBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const uploadToStorage = async (file: File): Promise<string> => {
    const fileName = `pdfs/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from("documents")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw new Error("Erreur lors de l'upload: " + error.message);
    return data.path;
  };

  const processSmallPDF = async (base64: string, fileName: string) => {
    const isGuest = localStorage.getItem("prago_guest_mode") === "true";
    
    const requestBody = {
      pdfBase64: base64,
      guestMode: isGuest,
    };

    let data;
    if (isGuest) {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-image`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Erreur lors du traitement");
      }
      data = await response.json();
    } else {
      const result = await supabase.functions.invoke("analyze-image", {
        body: requestBody,
      });
      if (result.error) throw result.error;
      data = result.data;
    }

    return {
      extractedText: data.extractedText || data.solution || "",
      pageCount: 1, // Estimation pour les petits fichiers
      fileName,
    };
  };

  const processLargePDF = async (storagePath: string, fileName: string) => {
    const result = await supabase.functions.invoke("process-large-pdf", {
      body: { storagePath, fileName },
    });

    if (result.error) throw result.error;
    return result.data;
  };

  const clearFile = () => {
    setPreview(null);
    setError(null);
    setUploadProgress(0);
    setProcessingStatus("");
    if (inputRef.current) inputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className={cn("w-full", className)}>
      {preview ? (
        <div className="relative rounded-xl border-2 border-border bg-secondary/50 p-6">
          <button
            onClick={clearFile}
            disabled={isUploading || isLoading}
            className="absolute top-3 right-3 p-1.5 rounded-lg bg-background/80 hover:bg-background disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4 mb-4">
            <div className={cn(
              "w-14 h-14 rounded-xl flex items-center justify-center",
              error ? "bg-destructive/20" : "bg-primary/20"
            )}>
              {error ? (
                <FileWarning className="w-7 h-7 text-destructive" />
              ) : (
                <FileText className="w-7 h-7 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium truncate">{preview.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatFileSize(preview.size)}
              </p>
            </div>
          </div>

          {error ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ) : isUploading || isLoading ? (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{processingStatus || "Traitement en cours..."}</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          ) : uploadProgress === 100 ? (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 text-success text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>PDF traité avec succès !</span>
            </div>
          ) : null}
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            "relative rounded-xl border-2 border-dashed p-10 cursor-pointer transition-all text-center",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            className="hidden"
          />
          
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg mb-1">
                Importe ton cours PDF
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                Glisse ton fichier ou clique pour parcourir
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-sm">
                <FileText className="w-4 h-4 text-destructive" />
                <span>PDF jusqu'à {maxSizeMB}MB acceptés</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
