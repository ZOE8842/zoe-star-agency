"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Application {
  id: string;
  tiktok_username: string;
  tiktok_profile_url: string | null;
  tiktok_display_name: string | null;
  contact_method: string;
  telegram_username: string | null;
  language: string | null;
  region: string | null;
  message: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
}

// Defense-in-depth: render-side URL-Sanity-Check.
// API filtert bereits, aber Legacy-Daten oder DB-Direct-Inserts koennen
// unsafe URLs enthalten. Nur https://tiktok.com Hosts erlauben, sonst Fallback.
function safeProfileUrl(url: string | null, username: string): string {
  const fallback = `https://www.tiktok.com/@${encodeURIComponent(username.replace(/^@/, ""))}`;
  if (!url) return fallback;
  try {
    const u = new URL(url);
    if (u.protocol !== "https:") return fallback;
    const h = u.hostname.toLowerCase();
    if (h !== "tiktok.com" && h !== "www.tiktok.com" && !h.endsWith(".tiktok.com")) return fallback;
    return u.toString();
  } catch { return fallback; }
}

const STATUS_OPTIONS = [
  { v: "new",        l: "Neu" },
  { v: "reviewed",   l: "Geprueft" },
  { v: "contacted",  l: "Kontaktiert" },
  { v: "rejected",   l: "Abgelehnt" },
  { v: "onboarded",  l: "Aufgenommen" },
];

export function ApplicationsTable({ applications }: { applications: Application[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [note, setNote] = useState<string>("");
  const [err, setErr] = useState<string | null>(null);

  async function updateStatus(id: string, status: string) {
    const supabase = createClient();
    const { error } = await supabase.from("creator_applications")
      .update({ status })
      .eq("id", id);
    if (error) { setErr(error.message); return; }
    startTransition(() => router.refresh());
  }

  async function saveNote(id: string) {
    const supabase = createClient();
    const { error } = await supabase.from("creator_applications")
      .update({ admin_note: note || null })
      .eq("id", id);
    if (error) { setErr(error.message); return; }
    setEditingId(null);
    setNote("");
    startTransition(() => router.refresh());
  }

  if (applications.length === 0) {
    return (
      <div className="border border-champagne/15 p-10 text-center text-cream/50">
        Keine Anfragen in diesem Filter.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {err && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm">
          {err}
        </div>
      )}
      {applications.map((a) => (
        <article key={a.id} className="border border-champagne/15 p-5 md:p-6">
          <header className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
            <div>
              <a href={safeProfileUrl(a.tiktok_profile_url, a.tiktok_username)}
                target="_blank" rel="noopener noreferrer"
                className="font-display italic text-lg md:text-xl text-cream hover:text-champagne transition-colors">
                @{a.tiktok_username}
              </a>
              {a.tiktok_display_name && (
                <span className="text-cream/50 text-sm ml-3">· {a.tiktok_display_name}</span>
              )}
            </div>
            <div className="text-cream/40 text-xs">
              {new Date(a.created_at).toLocaleString("de-DE", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })}
            </div>
          </header>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-cream/70 mb-4">
            <div>
              <span className="text-cream/40 text-xs uppercase tracking-[0.15em]">Kontakt: </span>
              {a.contact_method}
              {a.telegram_username && ` · @${a.telegram_username}`}
            </div>
            {a.language && (
              <div>
                <span className="text-cream/40 text-xs uppercase tracking-[0.15em]">Sprache: </span>
                {a.language}
              </div>
            )}
            {a.region && (
              <div>
                <span className="text-cream/40 text-xs uppercase tracking-[0.15em]">Region: </span>
                {a.region}
              </div>
            )}
          </div>

          {a.message && (
            <div className="border-l-2 border-champagne/30 pl-4 mb-4 text-cream/80 text-sm whitespace-pre-wrap">
              {a.message}
            </div>
          )}

          {/* Admin-Notiz */}
          <div className="mb-4">
            {editingId === a.id ? (
              <div className="space-y-2">
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  maxLength={1000}
                  placeholder="Admin-Notiz"
                  className="w-full bg-transparent border border-champagne/20 px-3 py-2 text-cream text-sm placeholder-cream/30 focus:border-champagne/50 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveNote(a.id)} disabled={pending}
                    className="px-3 py-1.5 border border-champagne text-champagne text-[11px] uppercase tracking-[0.2em] hover:bg-champagne/10 transition-colors disabled:opacity-50">
                    Speichern
                  </button>
                  <button onClick={() => { setEditingId(null); setNote(""); }}
                    className="px-3 py-1.5 border border-champagne/15 text-cream/50 text-[11px] uppercase tracking-[0.2em] hover:text-cream transition-colors">
                    Abbrechen
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setEditingId(a.id); setNote(a.admin_note ?? ""); }}
                className="text-left w-full"
              >
                <p className="text-cream/40 text-[10px] uppercase tracking-[0.2em] mb-1">Notiz</p>
                <p className="text-cream/70 text-sm">
                  {a.admin_note ?? <span className="text-cream/30 italic">+ Notiz hinzufuegen</span>}
                </p>
              </button>
            )}
          </div>

          {/* Status-Select */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-cream/40 text-[10px] uppercase tracking-[0.2em]">Status:</span>
            {STATUS_OPTIONS.map(opt => (
              <button
                key={opt.v}
                onClick={() => updateStatus(a.id, opt.v)}
                disabled={pending || a.status === opt.v}
                className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.2em] border transition-colors disabled:cursor-not-allowed ${
                  a.status === opt.v
                    ? "border-champagne bg-champagne/10 text-champagne"
                    : "border-champagne/15 text-cream/50 hover:border-champagne/40 hover:text-cream"
                }`}
              >
                {opt.l}
              </button>
            ))}
          </div>
        </article>
      ))}
    </div>
  );
}
