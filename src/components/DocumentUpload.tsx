import { useState, useRef } from "react";
import { Upload, FileImage, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DocumentUploadProps {
  onFileSelected: (base64: string, fileName: string) => void;
  isLoading?: boolean;
  accept?: string;
  className?: string;
}

export function DocumentUpload({
  onFileSelected,
  isLoading = false,
  accept = "image/*",
  className,
}: DocumentUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setPreview(base64);
      setFileName(file.name);
      onFileSelected(base64, file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearFile = () => {
    setPreview(null);
    setFileName(null);
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className={cn("w-full", className)}>
      {preview ? (
        <div className="relative rounded-xl border-2 border-border bg-secondary/50 p-4">
          <button
            onClick={clearFile}
            className="absolute top-2 right-2 p-1 rounded-lg bg-background/80 hover:bg-background"
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-4">
            {preview.startsWith("data:image") ? (
              <img
                src={preview}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
              />
            ) : (
              <div className="w-20 h-20 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{fileName}</p>
              <p className="text-xs text-muted-foreground">Fichier prêt</p>
            </div>
            {isLoading && (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
          </div>
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
            "relative rounded-xl border-2 border-dashed p-8 cursor-pointer transition-all text-center",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-secondary/50"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            onChange={handleChange}
            className="hidden"
          />
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
              {accept.includes("image") ? (
                <FileImage className="w-6 h-6 text-muted-foreground" />
              ) : (
                <Upload className="w-6 h-6 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm">
                Glisse un fichier ou clique pour choisir
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {accept.includes("image") ? "Images (PNG, JPG, WEBP)" : "PDF ou images"}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
