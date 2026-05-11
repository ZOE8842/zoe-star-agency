"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChallenge } from "../actions";

const CATEGORIES = [
  "live-grundlagen",
  "battles-matches",
  "watchtime",
  "community-aufbau",
  "wachstum",
  "technik",
  "account-sicherheit",
  "tiktok-geschenke",
  "tiktok-regeln",
  "agentur-standards",
  "live-psychologie",
  "profil-optimierung",
  "analyse-verstehen",
];

export function ChallengeForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [body_md, setBody] = useState("");
  const [reward_label, setReward] = useState("+100 XP");
  const [category_slug, setCategory] = useState("");
  const [starts_at, setStartsAt] = useState(toLocalIso(new Date()));
  const [ends_at, setEndsAt] = useState(toLocalIso(new Date(Date.now() + 7 * 86400000)));
  const [is_active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setError(null); setBusy(true);
    const r = await createChallenge({
      slug, title, description, body_md, category_slug,
      reward_label,
      starts_at: starts_at ? new Date(starts_at).toISOString() : null,
      ends_at: ends_at ? new Date(ends_at).toISOString() : null,
      is_active,
    });
    setBusy(false);
    if (!r.ok) return setError(r.error || "Fehler.");
    router.push(`/portal/admin/challenges/${r.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-5 md:p-7 space-y-6">
      <Field label="Titel *">
        <input
          type="text" required maxLength={120} value={title}
          onChange={(e) => { setTitle(e.target.value); if (!slug) setSlug(""); }}
          placeholder="z.B. Mai · Watchtime Push"
          className={inputCls}
        />
      </Field>
      <Field label="Slug (optional, sonst aus Titel)">
        <input
          type="text" maxLength={80} value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="mai-watchtime-push"
          className={inputCls + " font-mono text-sm"}
        />
      </Field>
      <Field label="Beschreibung (kurz) *">
        <textarea
          required rows={2} maxLength={500} value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Hol dir 3 Streams mit ueber 20 min Watchtime in dieser Woche."
          className={inputCls + " resize-none"}
        />
      </Field>
      <Field label="Aufgabe / Regeln (optional, Markdown)">
        <textarea
          rows={4} value={body_md}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Details, Wertung, Spielregeln…"
          className={inputCls + " resize-none font-mono text-sm"}
        />
      </Field>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Reward-Label">
          <input
            type="text" maxLength={60} value={reward_label}
            onChange={(e) => setReward(e.target.value)}
            placeholder="+100 XP / +Premium-Slot / 50€"
            className={inputCls}
          />
        </Field>
        <Field label="Kategorie (optional)">
          <select value={category_slug} onChange={(e) => setCategory(e.target.value)} className={selectCls}>
            <option value="">— ohne —</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <Field label="Start">
          <input type="datetime-local" value={starts_at} onChange={(e) => setStartsAt(e.target.value)} className={inputCls} />
        </Field>
        <Field label="Ende">
          <input type="datetime-local" value={ends_at} onChange={(e) => setEndsAt(e.target.value)} className={inputCls} />
        </Field>
      </div>
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox" checked={is_active}
          onChange={(e) => setActive(e.target.checked)}
          className="mt-1 accent-champagne"
        />
        <span className="text-cream text-sm">
          Sofort aktivieren · pusht eine Inbox-Notification an alle aktiven Creator
        </span>
      </label>

      {error && <p className="text-red-300/85 text-sm">{error}</p>}

      <button type="submit" disabled={busy} className="btn-cta btn-shimmer disabled:opacity-40">
        {busy ? "Speichere…" : "Challenge anlegen"}
        {!busy && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>
    </form>
  );
}

function toLocalIso(d: Date): string {
  const tz = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

const inputCls = "w-full bg-transparent border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none text-base";
const selectCls = "w-full bg-ink border border-champagne/30 px-4 py-3 text-cream focus:border-champagne focus:outline-none";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      {children}
    </div>
  );
}
