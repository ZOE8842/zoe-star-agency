"use client";

import { useState, useTransition } from "react";
import { updateShowcaseAdmin } from "./actions";

export interface EditRowData {
  id: string;
  display_name: string;
  category: string | null;
  bio: string | null;
  region: string | null;
  language: string | null;
  instagram_url: string | null;
  tiktok_url: string | null;
  brand_safe: boolean;
  public_note: string | null;
}

interface Props {
  row: EditRowData;
  onClose: () => void;
}

const CATEGORIES = [
  "Lifestyle",
  "Beauty",
  "Fashion",
  "Familie",
  "Gaming",
  "Comedy",
  "Talk",
  "Musik",
  "Motivation",
  "Sonstiges",
];

const LANGUAGES = ["de", "en", "tr", "fr", "ar"];
const REGIONS = ["DE", "AT", "CH", "LI", "EU", "OTHER"];

export function ShowcaseEditModal({ row, onClose }: Props) {
  const [form, setForm] = useState({
    category: row.category ?? "",
    bio: row.bio ?? "",
    region: row.region ?? "",
    language: row.language ?? "",
    instagram_url: row.instagram_url ?? "",
    tiktok_url: row.tiktok_url ?? "",
    brand_safe: row.brand_safe,
    public_note: row.public_note ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function save() {
    setError(null);
    startTransition(async () => {
      const r = await updateShowcaseAdmin(row.id, {
        category: form.category || null,
        bio: form.bio || null,
        region: form.region || null,
        language: form.language || null,
        instagram_url: form.instagram_url || null,
        tiktok_url: form.tiktok_url || null,
        brand_safe: form.brand_safe,
        public_note: form.public_note || null,
      });
      if (!r.ok) setError(r.error ?? "Fehler");
      else onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-ink/95 flex items-start justify-center overflow-y-auto p-4 md:p-8">
      <div className="w-full max-w-2xl bg-ink border border-champagne/40 p-6 md:p-8 my-8">
        <div className="flex items-baseline justify-between gap-3 mb-6">
          <div>
            <p className="eyebrow text-champagne mb-1">Edit Showcase</p>
            <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight">
              {row.display_name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="text-cream/45 hover:text-cream text-2xl leading-none"
            aria-label="Schliessen"
          >
            ×
          </button>
        </div>

        <div className="space-y-5">
          <Field label="Kategorie">
            <select
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
            >
              <option value="">— keine —</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Region">
              <select
                value={form.region}
                onChange={(e) => setForm((f) => ({ ...f, region: e.target.value }))}
                className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
              >
                <option value="">— keine —</option>
                {REGIONS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </Field>
            <Field label="Sprache">
              <select
                value={form.language}
                onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}
                className="w-full bg-ink border border-champagne/30 px-3 py-2 text-cream focus:border-champagne focus:outline-none"
              >
                <option value="">— keine —</option>
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Bio (max 240)">
            <textarea
              rows={3}
              maxLength={240}
              value={form.bio}
              onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
              className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none resize-none"
            />
            <p className="text-cream/35 text-[10px] mt-1 text-right">{form.bio.length}/240</p>
          </Field>

          <Field label="TikTok URL">
            <input
              type="url"
              value={form.tiktok_url}
              onChange={(e) => setForm((f) => ({ ...f, tiktok_url: e.target.value }))}
              placeholder="https://www.tiktok.com/@..."
              className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            />
          </Field>

          <Field label="Instagram URL">
            <input
              type="url"
              value={form.instagram_url}
              onChange={(e) => setForm((f) => ({ ...f, instagram_url: e.target.value }))}
              placeholder="https://www.instagram.com/..."
              className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none"
            />
          </Field>

          <Field label="Brand-Safe (Admin-Pruefung)">
            <label className="inline-flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.brand_safe}
                onChange={(e) => setForm((f) => ({ ...f, brand_safe: e.target.checked }))}
                className="w-4 h-4 accent-champagne"
              />
              <span className="text-cream/75 text-sm">Geprueft + freigegeben fuer Brand-Kooperationen</span>
            </label>
          </Field>

          <Field label="Public-Notiz (interne Admin-Notiz)">
            <textarea
              rows={2}
              value={form.public_note}
              onChange={(e) => setForm((f) => ({ ...f, public_note: e.target.value }))}
              placeholder="Interne Notiz · nicht oeffentlich"
              className="w-full bg-transparent border border-champagne/30 px-3 py-2 text-cream placeholder-cream/30 focus:border-champagne focus:outline-none resize-none"
            />
          </Field>

          {error && (
            <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex items-center gap-3 pt-3">
            <button
              type="button"
              onClick={save}
              disabled={isPending}
              className="btn-cta btn-shimmer disabled:opacity-50"
            >
              {isPending ? "Speichere…" : "Speichern"}
              {!isPending && <span className="btn-cta-arrow" aria-hidden>→</span>}
            </button>
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="text-cream/55 hover:text-cream text-[11px] uppercase tracking-[0.25em] disabled:opacity-40"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-2">
        {label}
      </span>
      {children}
    </label>
  );
}
