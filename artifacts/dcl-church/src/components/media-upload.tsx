import { useState, useRef } from "react";
import { uploadMedia, isStorageConfigured, type MediaKind } from "@/lib/firebase";
import { Loader2, Upload, X, Image, Video, Music, FileText, Link } from "lucide-react";
import { Input } from "@/components/ui/input";

const MAX_SIZES: Record<MediaKind, number> = {
  image: 5 * 1024 * 1024,
  video: 100 * 1024 * 1024,
  audio: 20 * 1024 * 1024,
  document: 20 * 1024 * 1024,
};

const ACCEPT: Record<string, string> = {
  image: "image/*",
  video: "video/*",
  audio: "audio/*",
  document: "*/*",
  all: "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx",
};

interface MediaUploadProps {
  value?: string | null;
  mediaType?: MediaKind | null;
  onChange: (url: string, kind: MediaKind) => void;
  onClear?: () => void;
  folder?: string;
  accept?: "image" | "video" | "audio" | "document" | "all";
  label?: string;
}

export function MediaUpload({
  value,
  mediaType,
  onChange,
  onClear,
  folder = "general",
  accept = "all",
  label = "Upload file",
}: MediaUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useUrl, setUseUrl] = useState(false);
  const [urlInput, setUrlInput] = useState(value ?? "");
  const inputRef = useRef<HTMLInputElement>(null);
  const storageReady = isStorageConfigured();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    let kind: MediaKind = "document";
    if (file.type.startsWith("image/")) kind = "image";
    else if (file.type.startsWith("video/")) kind = "video";
    else if (file.type.startsWith("audio/")) kind = "audio";

    const maxSize = MAX_SIZES[kind];
    if (file.size > maxSize) {
      setError(`File too large. Max size: ${Math.round(maxSize / 1024 / 1024)} MB`);
      return;
    }

    setError(null);
    setUploading(true);
    try {
      const { url, kind: detectedKind } = await uploadMedia(file, folder);
      onChange(url, detectedKind);
    } catch (err) {
      setError("Upload failed. Please try again or use a URL instead.");
      console.error(err);
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleUrlSubmit() {
    if (!urlInput.trim()) return;
    let kind: MediaKind = "document";
    const lower = urlInput.toLowerCase();
    if (/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/.test(lower)) kind = "image";
    else if (/\.(mp4|mov|webm|avi|mkv)(\?|$)/.test(lower)) kind = "video";
    else if (/\.(mp3|wav|ogg|m4a|aac)(\?|$)/.test(lower)) kind = "audio";
    else if (mediaType) kind = mediaType;
    onChange(urlInput.trim(), kind);
    setUseUrl(false);
  }

  if (useUrl || !storageReady) {
    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Input
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            className="bg-white/70"
          />
          <button
            type="button"
            onClick={handleUrlSubmit}
            className="px-3 py-2 rounded-lg bg-[hsl(215,80%,32%)] text-white text-sm"
          >
            Use
          </button>
          {storageReady && (
            <button
              type="button"
              onClick={() => setUseUrl(false)}
              className="px-3 py-2 rounded-lg border text-sm"
            >
              Upload
            </button>
          )}
        </div>
        {!storageReady && (
          <p className="text-[10px] text-amber-600">
            Firebase Storage not configured — paste a URL instead.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT[accept]}
        className="hidden"
        onChange={handleFile}
      />

      {value ? (
        <div className="rounded-xl overflow-hidden border bg-white/50">
          <MediaPreview url={value} kind={mediaType ?? "document"} />
          <div className="flex gap-1 p-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
              className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/80 text-xs text-[hsl(215,80%,22%)] border hover:bg-white transition-colors"
            >
              {uploading ? <Loader2 className="size-3 animate-spin" /> : <Upload className="size-3" />}
              Replace
            </button>
            <button
              type="button"
              onClick={() => setUseUrl(true)}
              className="flex items-center gap-1 py-1.5 px-2 rounded-lg bg-white/80 text-xs text-[hsl(215,80%,22%)] border hover:bg-white transition-colors"
            >
              <Link className="size-3" />
              URL
            </button>
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                className="p-1.5 rounded-lg bg-white/80 text-rose-600 border hover:bg-white transition-colors"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[hsl(215,40%,70%)] text-sm text-[hsl(215,40%,50%)] hover:bg-white/40 hover:border-[hsl(215,80%,32%)] transition-colors justify-center"
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Upload className="size-4" />
            )}
            {uploading ? "Uploading..." : label}
          </button>
          <button
            type="button"
            onClick={() => setUseUrl(true)}
            className="flex items-center gap-1 px-3 py-3 rounded-xl border border-dashed border-[hsl(215,40%,70%)] text-[hsl(215,40%,50%)] hover:bg-white/40 transition-colors text-sm"
            title="Use URL instead"
          >
            <Link className="size-4" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

function MediaPreview({ url, kind }: { url: string; kind: MediaKind }) {
  if (kind === "image") {
    return (
      <img src={url} alt="Preview" className="w-full max-h-48 object-cover" />
    );
  }
  if (kind === "video") {
    return (
      <video src={url} controls className="w-full max-h-48 bg-black" />
    );
  }
  if (kind === "audio") {
    return (
      <div className="p-3 bg-gradient-to-r from-[hsl(215,80%,32%)] to-[hsl(199,89%,45%)]">
        <audio src={url} controls className="w-full" />
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 p-3 text-sm text-[hsl(215,80%,22%)] hover:bg-white/50"
    >
      <FileText className="size-4" />
      View document
    </a>
  );
}

export function mediaKindIcon(kind: MediaKind | null | undefined) {
  switch (kind) {
    case "image": return Image;
    case "video": return Video;
    case "audio": return Music;
    default: return FileText;
  }
}
