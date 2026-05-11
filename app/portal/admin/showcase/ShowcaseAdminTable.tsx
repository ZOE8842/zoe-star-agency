"use client";

import { useState, useTransition } from "react";
import {
  approveShowcase,
  rejectShowcase,
  toggleFeatured,
  deleteShowcaseAdmin,
  updateSortOrder,
} from "./actions";

interface Row {
  id: string;
  profile_id: string;
  display_name: string;
  category: string | null;
  showcase_image: string | null;
  showcase_images?: Array<{ url?: string; position?: number }> | null;
  tiktok_url: string | null;
  instagram_url: string | null;
  is_approved: boolean;
  is_featured: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string | null;
  approved_at: string | null;
}

function countImages(r: Row): number {
  const arr = Array.isArray(r.showcase_images) ? r.showcase_images : [];
  return arr.filter((i) => i?.url && /^https?:\/\//i.test(i.url)).length;
}

export function ShowcaseAdminTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null);
    startTransition(async () => {
      const r = await fn();
      if (!r.ok) setError(r.error ?? "Fehler.");
    });
  }

  return (
    <div>
      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm mb-4">{error}</div>}
      <div className="grid gap-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="border border-champagne/15 hover:border-champagne/30 transition-colors p-4 md:p-5 grid grid-cols-1 md:grid-cols-[80px_1fr_auto] gap-4 md:gap-6 items-center"
          >
            {/* Thumbnail */}
            <div className="w-20 aspect-[3/4] border border-champagne/20 bg-ink overflow-hidden shrink-0">
              {r.showcase_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={r.showcase_image} alt="" loading="lazy" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-cream/30 text-xs">—</div>
              )}
            </div>

            {/* Info */}
            <div className="min-w-0">
              <div className="flex items-baseline gap-2 flex-wrap">
                <p className="font-display italic text-cream text-xl md:text-2xl leading-tight truncate">{r.display_name}</p>
                {countImages(r) < 2 && (
                  <span className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] border border-red-400/40 text-red-300/85">
                    Unvollstaendig {countImages(r)}/2
                  </span>
                )}
                {countImages(r) >= 2 && !r.is_approved && (
                  <span className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] border border-champagne/40 text-champagne">
                    Bereit zur Pruefung
                  </span>
                )}
              </div>
              {r.category && <p className="text-cream/55 text-[11px] uppercase tracking-[0.25em] mt-1">{r.category}</p>}
              <div className="flex flex-wrap gap-2 mt-2 text-[11px]">
                {r.tiktok_url && (
                  <a href={r.tiktok_url} target="_blank" rel="noopener noreferrer" className="text-champagne hover:underline">TikTok ↗</a>
                )}
                {r.instagram_url && (
                  <a href={r.instagram_url} target="_blank" rel="noopener noreferrer" className="text-champagne hover:underline">Instagram ↗</a>
                )}
                <span className="text-cream/35">erstellt {new Date(r.created_at).toLocaleDateString("de-DE")}</span>
                {r.updated_at && r.updated_at !== r.created_at && (
                  <span className="text-cream/35">edit {new Date(r.updated_at).toLocaleDateString("de-DE")}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="number"
                aria-label="Sort-Order"
                defaultValue={r.sort_order}
                onBlur={(e) => {
                  const v = parseInt(e.target.value);
                  if (!Number.isNaN(v) && v !== r.sort_order) {
                    run(() => updateSortOrder(r.id, v));
                  }
                }}
                className="w-16 bg-transparent border border-champagne/20 px-2 py-1 text-cream text-xs text-center"
              />

              {!r.is_approved ? (
                <>
                  <button
                    onClick={() => run(() => approveShowcase(r.id, true))}
                    disabled={isPending}
                    className="px-3 py-1.5 bg-champagne text-ink text-[10px] uppercase tracking-[0.25em] hover:bg-champagne-300 disabled:opacity-50"
                  >
                    Approve + Live
                  </button>
                  <button
                    onClick={() => run(() => approveShowcase(r.id, false))}
                    disabled={isPending}
                    className="px-3 py-1.5 border border-champagne/40 text-champagne text-[10px] uppercase tracking-[0.25em] hover:border-champagne disabled:opacity-50"
                  >
                    Approve only
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => run(() => toggleFeatured(r.id, !r.is_featured))}
                    disabled={isPending}
                    className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50 ${
                      r.is_featured
                        ? "bg-champagne text-ink hover:bg-champagne-300"
                        : "border border-champagne/40 text-champagne hover:border-champagne"
                    }`}
                  >
                    {r.is_featured ? "Live · click to hide" : "Hidden · click to show"}
                  </button>
                  <button
                    onClick={() => run(() => rejectShowcase(r.id))}
                    disabled={isPending}
                    className="px-3 py-1.5 border border-cream/20 text-cream/55 text-[10px] uppercase tracking-[0.25em] hover:border-red-500/40 hover:text-red-300/80 disabled:opacity-50"
                  >
                    Unapprove
                  </button>
                </>
              )}

              <button
                onClick={() => {
                  if (confirm(`Showcase von "${r.display_name}" loeschen?`)) {
                    run(() => deleteShowcaseAdmin(r.id));
                  }
                }}
                disabled={isPending}
                className="px-3 py-1.5 text-red-300/70 hover:text-red-300 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
