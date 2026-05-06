"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export function AvatarUploader({
  currentUrl,
  displayName,
}: {
  currentUrl: string | null;
  displayName: string;
}) {
  const router = useRouter();
  const fileInput = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentUrl);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initials = displayName
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (file.size > 2 * 1024 * 1024) {
      setError("Datei zu gross. Max 2 MB.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Nur JPEG, PNG oder WebP.");
      return;
    }

    // Sofort lokale Preview anzeigen
    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    const res = await fetch("/api/profile/avatar", {
      method: "POST",
      body: formData,
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Upload fehlgeschlagen.");
      setPreviewUrl(currentUrl);
      setLoading(false);
      return;
    }

    setPreviewUrl(data.avatar_url);
    setLoading(false);
    router.refresh();
  }

  async function handleRemove() {
    setLoading(true);
    setError(null);
    const res = await fetch("/api/profile/avatar", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Loeschen fehlgeschlagen.");
      setLoading(false);
      return;
    }
    setPreviewUrl(null);
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="border border-champagne/15 p-6 md:p-8 mb-6">
      <p className="eyebrow mb-4">Profilbild</p>

      <div className="flex items-center gap-5">
        {/* Avatar-Anzeige */}
        <div className="shrink-0">
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Avatar"
              className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border border-champagne/30"
            />
          ) : (
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-champagne/10 border border-champagne/30 flex items-center justify-center">
              <span className="font-display italic text-champagne text-2xl md:text-3xl">
                {initials || "?"}
              </span>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex-1 min-w-0">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFile}
            disabled={loading}
            className="hidden"
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={loading}
              className="text-[10px] uppercase tracking-[0.2em] border border-champagne/40 hover:border-champagne hover:bg-champagne/5 text-cream py-2 px-4 transition disabled:opacity-50"
            >
              {loading ? "Laedt..." : previewUrl ? "Aendern" : "Hochladen"}
            </button>
            {previewUrl && (
              <button
                type="button"
                onClick={handleRemove}
                disabled={loading}
                className="text-[10px] uppercase tracking-[0.2em] border border-cream/20 hover:border-red-500/60 hover:text-red-300 text-cream/60 py-2 px-4 transition disabled:opacity-50"
              >
                Entfernen
              </button>
            )}
          </div>
          <p className="text-cream/40 text-xs mt-3 leading-relaxed">
            JPEG, PNG oder WebP · max 2 MB · quadratisch empfohlen
          </p>
        </div>
      </div>

      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm mt-4">
          {error}
        </div>
      )}
    </div>
  );
}
