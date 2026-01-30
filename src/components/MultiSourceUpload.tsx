import { useState, useRef } from "react";
import { Camera, FileText, Image as ImageIcon, X, Loader2, File } from "lucide-react";
import { cn } from "@/lib/utils";

interface MultiSourceUploadProps {
  onFileSelected: (base64: string, fileName: string, type: "image" | "pdf") => void;
  isLoading?: boolean;
  className?: string;
  compact?: boolean;
}

export function MultiSourceUpload({
  onFileSelected,
  isLoading = false,
  className,
  compact = false,
}: MultiSourceUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<"image" | "pdf">("image");
  
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File, type: "image" | "pdf") => {
    if (!file) return;
    setFileType(type);
    setFileName(file.name);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      onFileSelected(base64, file.name, type);
    };
    reader.readAsDataURL(file);
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (galleryRef.current) galleryRef.current.value = "";
    if (pdfRef.current) pdfRef.current.value = "";
  };

  if (preview) {
    return (
      <div className={cn("relative rounded-xl border-2 border-border bg-secondary/50 p-4", className)}>
        <button
          onClick={clearFile}
          className="absolute top-2 right-2 p-1 rounded-lg bg-background/80 hover:bg-background z-10"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="flex items-center gap-4">
          {fileType === "image" && preview.startsWith("data:image") ? (
            <img src={preview} alt="Preview" className="w-16 h-16 object-cover rounded-lg" />
          ) : (
            <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
              <File className="w-8 h-8 text-destructive" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{fileName}</p>
            <p className="text-xs text-muted-foreground">Fichier prêt</p>
          </div>
          {isLoading && <Loader2 className="w-5 h-5 animate-spin text-primary" />}
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
