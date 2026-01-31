import { useState, useRef } from "react";
import { Camera, FileText, Image as ImageIcon, X, Loader2, File, Upload, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface MultiSourceUploadProps {
  onFileSelected: (base64: string, fileName: string, type: "image" | "pdf") => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
  maxPdfSizeMB?: number;
}

const MAX_DIRECT_SIZE = 10 * 1024 * 1024; // 10MB for direct base64

export function MultiSourceUpload({
  onFileSelected,
  isLoading = false,
  className,
  compact = false,
  maxPdfSizeMB = 50,
}: MultiSourceUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number>(0);
  const [fileType, setFileType] = useState<"image" | "pdf">("image");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [isProcessingLarge, setIsProcessingLarge] = useState(false);
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const handleFile = async (file: File, type: "image" | "pdf") => {
    if (!file) return;
    
    setError(null);
    setFileType(type);
    setFileName(file.name);
    setFileSize(file.size);
    setUploadProgress(0);
    setProcessingStatus("");
    
    // Check file size for PDFs
    if (type === "pdf") {
      const maxSize = maxPdfSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        setError(`Fichier trop volumineux (max ${maxPdfSizeMB}MB)`);
        setPreview("error");
        return;
      }

      // Handle large PDFs differently
      if (file.size > MAX_DIRECT_SIZE) {
        await handleLargePDF(file);
        return;
      }
    }

    // Standard handling for images and small PDFs
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onFileSelected(base64, file.name, type);
    };
    reader.readAsDataURL(file);
  };

  const handleLargePDF = async (file: File) => {
    setIsProcessingLarge(true);
    setPreview("processing");
    
    try {
      // Step 1: Upload to storage
      setProcessingStatus("Upload du fichier...");
      setUploadProgress(10);
      
      const storagePath = `pdfs/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error("Erreur lors de l'upload: " + uploadError.message);
      }
      
      setUploadProgress(40);
      setProcessingStatus("Extraction du texte...");

      // Step 2: Process with edge function
      const { data, error: processError } = await supabase.functions.invoke("process-large-pdf", {
        body: { storagePath, fileName: file.name },
      });

      if (processError) {
        throw processError;
      }

      setUploadProgress(100);
      setProcessingStatus("Terminé !");
      
      // Create a synthetic base64 with extracted text for compatibility
      const extractedContent = data.extractedText || "";
      const syntheticBase64 = `data:text/plain;base64,${btoa(unescape(encodeURIComponent(extractedContent)))}`;
      
      setPreview(syntheticBase64);
      onFileSelected(syntheticBase64, file.name, "pdf");
      
    } catch (err: any) {
      console.error("Error processing large PDF:", err);
      setError(err.message || "Erreur lors du traitement du PDF");
      setPreview("error");
    } finally {
      setIsProcessingLarge(false);
    }
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    setFileSize(0);
    setError(null);
    setUploadProgress(0);
    setProcessingStatus("");
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-xl border-2 border-border bg-secondary/50 p-4", className)}>
        <button
          onClick={clearFile}
          disabled={isProcessingLarge || isLoading}
          className="absolute top-2 right-2 p-1 rounded-lg bg-background/80 hover:bg-background z-10 disabled:opacity-50"
        >
          <X className="w-4 h-4" />
        </button>
        
        <div className="flex items-center gap-4">
          {preview === "error" ? (
            <div className="w-16 h-16 rounded-lg bg-destructive/20 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
          ) : preview === "processing" || isProcessingLarge ? (
            <div className="w-16 h-16 rounded-lg bg-primary/20 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
            </div>
          ) : fileType === "image" && preview.startsWith("data:image") ? (
            <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
              <File className="w-8 h-8 text-destructive" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">
              {fileSize > 0 && formatFileSize(fileSize)}
              {error && <span className="text-destructive ml-2">{error}</span>}
              {!error && !isProcessingLarge && !isLoading && " • Fichier prêt"}
            </p>
            
            {isProcessingLarge && (
              <div className="mt-2 space-y-1">
                <p className="text-xs text-muted-foreground">{processingStatus}</p>
                <Progress value={uploadProgress} className="h-1.5" />
              </div>
            )}
          </div>
          
          {isLoading && !isProcessingLarge && (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "image")}
        className="hidden"
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "image")}
        className="hidden"
      />
      <input
        ref={pdfRef}
        type="file"
        accept="application/pdf"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0], "pdf")}
        className="hidden"
      />

      <div className={cn("grid gap-3", compact ? "grid-cols-3" : "grid-cols-3")}>
        <button
          onClick={() => pdfRef.current?.click()}
          className="prago-card p-4 text-center hover:bg-secondary/50 transition-colors"
        >
          <FileText className="w-6 h-6 mx-auto mb-2 text-destructive" />
          <span className="text-sm font-medium">PDF</span>
          <span className="block text-xs text-muted-foreground mt-0.5">
            jusqu'à {maxPdfSizeMB}MB
          </span>
        </button>
        <button
          onClick={() => cameraRef.current?.click()}
          className="prago-card p-4 text-center hover:bg-secondary/50 transition-colors"
        >
          <Camera className="w-6 h-6 mx-auto mb-2 text-primary" />
          <span className="text-sm font-medium">Photo</span>
        </button>
        <button
          onClick={() => galleryRef.current?.click()}
          className="prago-card p-4 text-center hover:bg-secondary/50 transition-colors"
        >
          <ImageIcon className="w-6 h-6 mx-auto mb-2 text-info" />
          <span className="text-sm font-medium">Galerie</span>
        </button>
      </div>
    </div>
  );
}
