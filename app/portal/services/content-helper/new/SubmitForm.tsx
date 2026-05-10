"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitContent } from "../actions";

type Kind = "video_link" | "video_file" | "image" | "profile";

export function SubmitForm() {
  const router = useRouter();
  const [kind, setKind] = useState<Kind>("video_link");
  const [sourceUrl, setSourceUrl] = useState("");
  const [storagePath, setStoragePath] = useState("");
  const [note, setNote] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedName, setUploadedName] = useState<string | null>(null);

  const isUploadKind = kind === "video_file" || kind === "image";

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/content-helper/upload", { method: "POST", body: fd });
    const j = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(j.error || "Upload fehlgeschlagen.");
      return;
    }
    setStoragePath(j.storage_path);
    setUploadedName(file.name);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const r = await submitContent({
      kind,
      source_url: isUploadKind ? undefined : sourceUrl,
      video_storage_path: isUploadKind ? storagePath : undefined,
      manual_note: note,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error || "Konnte nicht speichern.");
      return;
    }
    router.push(`/portal/services/content-helper/${r.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-5 md:p-7 space-y-7">
      <div>
        <label className="eyebrow block mb-3">Was reichst du ein?</label>
        <div className="flex flex-wrap gap-2">
          {([
            { v: "video_link", l: "Video-Link" },
            { v: "video_file", l: "Video-Upload" },
            { v: "image", l: "Bild" },
            { v: "profile", l: "Profil-Check" },
          ] as Array<{ v: Kind; l: string }>).map((k) => (
            <button
              key={k.v}
              type="button"
              onClick={() => { setKind(k.v); setStoragePath(""); setUploadedName(null); setSourceUrl(""); }}
              className={`px-4 py-2.5 text-sm border transition-all ${
                kind === k.v
                  ? "border-champagne bg-champagne/10 text-champagne"
                  : "border-champagne/20 text-cream/70 hover:border-champagne/50 hover:text-cream"
              }`}
            >
              {kind === k.v && <span className="mr-1.5">✓</span>}
              {k.l}
            </button>
          ))}
        </div>
      </div>

      {!isUploadKind && (
        <div>
          <label className="eyebrow block mb-2">
            {kind === "profile" ? "TikTok-Profil-URL" : "Video-URL"}
          </label>
          <input
            type="url"
            required
            value={sourceUrl}
            onChange={(e) => setSourceUrl(e.target.value)}
            placeholder={kind === "profile" ? "https://www.tiktok.com/@..." : "https://www.tiktok.com/@.../video/..."}
            className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none"
          />
          <p className="text-cream/35 text-xs mt-2">
            Direkter Link, oeffentlich erreichbar.
          </p>
        </div>
      )}

      {isUploadKind && (
        <div>
          <label className="eyebrow block mb-2">
            {kind === "video_file" ? "Video-Datei" : "Bild-Datei"}
          </label>
          <input
            type="file"
            accept={kind === "video_file"
              ? "video/mp4,video/quicktime,video/webm,video/x-m4v"
              : "image/jpeg,image/png,image/webp,image/gif"}
            onChange={onFile}
            disabled={uploading}
            className="block text-cream/70 text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-champagne/30 file:bg-transparent file:text-champagne file:text-[10px] file:uppercase file:tracking-[0.25em] file:hover:border-champagne file:cursor-pointer"
          />
          {uploading && <p className="text-cream/55 text-xs mt-2">Lade hoch…</p>}
          {uploadedName && !uploading && (
            <p className="text-champagne/85 text-xs italic mt-2">✓ Hochgeladen: {uploadedName}</p>
          )}
          <p className="text-cream/35 text-xs mt-2">
            Max 200 MB. {kind === "video_file" ? "MP4 / MOV / WebM / M4V." : "JPEG / PNG / WebP / GIF."}
          </p>
        </div>
      )}

      <div>
        <label className="eyebrow block mb-2">Hinweis (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          placeholder="Was sollen wir besonders pruefen? Hook? Schnitt? Watchtime-Strategie?"
          className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-champagne/70 text-xs italic">{error}</p>}

      <button
        type="submit"
        disabled={submitting || uploading || (isUploadKind && !storagePath) || (!isUploadKind && !sourceUrl)}
        className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Sende…" : "Einreichen"}
        {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>
    </form>
  );
}
