import { useState, useRef } from "react";
import { uploadImage } from "@/lib/firebase";
import { Loader2, Upload, X } from "lucide-react";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string) => void;
  onClear?: () => void;
  folder?: string;
  label?: string;
}

export function ImageUpload({
  value,
  onChange,
  onClear,
  folder = "general",
  label = "Upload image",
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File must be under 5 MB");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const url = await uploadImage(file, folder);
      onChange(url);
    } catch (err) {
      setError("Upload failed. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
          <img src={value} alt="Preview" className="w-full h-full object-cover" />
          <div className="absolute top-2 right-2 flex gap-1">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="bg-white/90 backdrop-blur rounded-lg px-2 py-1 text-xs text-[hsl(215,80%,22%)] flex items-center gap-1 shadow"
            >
              {uploading ? (
                <Loader2 className="size-3 animate-spin" />
              ) : (
                <Upload className="size-3" />
              )}
              Replace
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="bg-white/90 backdrop-blur rounded-lg p-1 text-rose-600 shadow"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[hsl(215,40%,70%)] text-sm text-[hsl(215,40%,50%)] hover:bg-white/40 hover:border-[hsl(215,80%,32%)] transition-colors w-full justify-center"
        >
          {uploading ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Upload className="size-4" />
          )}
          {uploading ? "Uploading..." : label}
        </button>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}
