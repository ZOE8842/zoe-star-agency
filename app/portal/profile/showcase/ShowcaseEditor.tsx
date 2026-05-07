"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { upsertShowcase, deleteOwnShowcase } from "./actions";
import { CreatorShowcaseCard } from "@/components/CreatorShowcaseCard";

interface ShowcaseRow {
  id: string;
  display_name: string;
  category: string | null;
  showcase_image: string | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
}

export function ShowcaseEditor({ initial }: { initial: ShowcaseRow | null }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial?.display_name ?? "");
  const [category, setCategory] = useState(initial?.category ?? "");
  const [tiktok, setTiktok] = useState(initial?.tiktok_url ?? "");
  const [instagram, setInstagram] = useState(initial?.instagram_url ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.showcase_image ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setInfo(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/showcase/upload", { method: "POST", body: fd });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(json.error || "Upload fehlgeschlagen.");
      return;
    }
    setImageUrl(json.showcase_image);
    setInfo("Bild hochgeladen. Speichern nicht vergessen.");
  }

  async function handleImageRemove() {
    setError(null);
    setInfo(null);
    const res = await fetch("/api/showcase/upload", { method: "DELETE" });
    if (res.ok) {
      setImageUrl("");
      setInfo("Bild entfernt.");
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setInfo(null);
    setSaving(true);
    const result = await upsertShowcase({
      display_name: displayName,
      category,
      showcase_image: imageUrl,
      tiktok_url: tiktok,
      instagram_url: instagram,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error || "Speichern fehlgeschlagen.");
      return;
    }
    setInfo("Gespeichert. Status: Pending Review (Admin muss freigeben).");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("Showcase wirklich loeschen?")) return;
    setError(null);
    setInfo(null);
    const result = await deleteOwnShowcase();
    if (!result.ok) {
      setError(result.error || "Loeschen fehlgeschlagen.");
      return;
    }
    setDisplayName("");
    setCategory("");
    setTiktok("");
    setInstagram("");
    setImageUrl("");
    setInfo("Showcase geloescht.");
    router.refresh();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
      {/* Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div>
          <label className="eyebrow block mb-2">Display Name</label>
          <input
            type="text"
            required
            maxLength={80}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="z.B. ZOE Star Agency"
          />
        </div>

        <div>
          <label className="eyebrow block mb-2">Kategorie</label>
          <input
            type="text"
            maxLength={60}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="z.B. Beauty · Creator / Match Night · Berlin"
          />
        </div>

        <div>
          <label className="eyebrow block mb-2">Showcase-Bild</label>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageUpload}
              className="block text-cream/65 text-sm file:mr-4 file:py-2 file:px-4 file:border file:border-champagne/30 file:bg-transparent file:text-champagne file:text-[10px] file:uppercase file:tracking-[0.25em] file:hover:border-champagne file:cursor-pointer"
            />
            {uploading && <span className="text-cream/55 text-xs">Lade hoch…</span>}
            {imageUrl && !uploading && (
              <button
                type="button"
                onClick={handleImageRemove}
                className="text-red-300/70 hover:text-red-300 text-[10px] uppercase tracking-[0.25em]"
              >
                Bild entfernen
              </button>
            )}
          </div>
          <p className="text-cream/40 text-xs mt-2">JPEG, PNG, WebP. Max 5 MB. Idealerweise hochformat 3:4.</p>
        </div>

        <div>
          <label className="eyebrow block mb-2">TikTok-URL</label>
          <input
            type="url"
            value={tiktok}
            onChange={(e) => setTiktok(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="https://www.tiktok.com/@deinhandle"
          />
        </div>

        <div>
          <label className="eyebrow block mb-2">Instagram-URL</label>
          <input
            type="url"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            className="w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            placeholder="https://www.instagram.com/deinhandle"
          />
        </div>

        {error && (
          <div className="border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-300 text-sm">
            {error}
          </div>
        )}
        {info && (
          <div className="border border-champagne/30 bg-champagne/5 px-4 py-3 text-champagne text-sm">
            {info}
          </div>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-cta btn-shimmer disabled:opacity-50">
            {saving ? "Speichere…" : "Speichern"}
            <span className="btn-cta-arrow" aria-hidden>→</span>
          </button>
          {initial && (
            <button
              type="button"
              onClick={handleDelete}
              className="text-red-300/70 hover:text-red-300 text-[10px] uppercase tracking-[0.25em] px-3 py-2"
            >
              Loeschen
            </button>
          )}
        </div>

        <p className="text-cream/40 text-xs leading-relaxed pt-2 border-t border-champagne/10">
          Hinweis: Nach jedem Edit ist die Showcase-Card automatisch wieder im
          Pending-Status. Admin muss neu freigeben.
        </p>
      </form>

      {/* Preview */}
      <div>
        <p className="eyebrow mb-4">Live-Preview</p>
        <div className="max-w-[320px]">
          <CreatorShowcaseCard
            displayName={displayName || "Display Name"}
            category={category || undefined}
            imageSrc={imageUrl || undefined}
            platform={tiktok ? "tiktok" : instagram ? "instagram" : null}
            visual="champagne"
          />
        </div>
        <p className="text-cream/40 text-xs mt-4 max-w-[320px]">
          So sieht deine Card auf der Public-Site aus. Plattform-Link wird
          automatisch gewählt (TikTok bevorzugt, sonst Instagram).
        </p>
      </div>
    </div>
  );
}
