"use client";

import { useRef, useState } from "react";
import { compressImageIfNeeded } from "@/lib/imageCompress";

export interface UploadedAttachment {
  path: string;
  name: string;
  size: number;
  mime: string;
}

function formatSize(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentField({
  attachments,
  onChange,
}: {
  attachments: UploadedAttachment[];
  onChange: (next: UploadedAttachment[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setLoading(true);

    // Client-Side Compression bei Bildern (umgeht Vercel 4.5 MB Body-Limit)
    const compressed = await compressImageIfNeeded(file);
    const fd = new FormData();
    fd.append("file", compressed);
    const res = await fetch("/api/messages/upload", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Upload fehlgeschlagen.");
      return;
    }

    onChange([...attachments, data]);
    if (fileInput.current) fileInput.current.value = "";
  }

  function remove(idx: number) {
    onChange(attachments.filter((_, i) => i !== idx));
  }

  return (
    <div>
      <input
        ref={fileInput}
        type="file"
        onChange={handleFile}
        disabled={loading}
        className="hidden"
        accept="image/jpeg,image/png,image/webp,image/gif,application/pdf,application/zip,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      />

      {attachments.length > 0 && (
        <ul className="space-y-2 mb-4">
          {attachments.map((a, i) => (
            <li
              key={a.path}
              className="flex items-center justify-between gap-4 text-sm font-light text-cream/70 py-1"
            >
              <span className="truncate flex-1 min-w-0">
                {a.name}
                <span className="text-cream/30 ml-2">{formatSize(a.size)}</span>
              </span>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-cream/30 hover:text-champagne text-[10px] uppercase tracking-[0.3em] shrink-0"
              >
                Entfernen
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={() => fileInput.current?.click()}
        disabled={loading}
        className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em] inline-flex items-center min-h-[40px] px-1 disabled:opacity-50 transition-colors"
      >
        {loading ? "Lädt…" : "+ Anlage hinzufügen"}
      </button>

      {error && (
        <p className="border-l-2 border-red-500/40 pl-4 text-red-300/80 text-sm mt-3">
          {error}
        </p>
      )}
    </div>
  );
}
