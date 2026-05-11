"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { submitBigMatch, BIG_MATCH_OPTIONS } from "./actions";

const O = BIG_MATCH_OPTIONS;

export function BigMatchForm({ blocked }: { blocked: boolean }) {
  const router = useRouter();
  const [desired_date, setDate] = useState("");
  const [desired_time, setTime] = useState("");
  const [own_level, setOwn] = useState("");
  const [match_type, setType] = useState("");
  const [opp, setOpp] = useState("");
  const [lang, setLang] = useState("Deutsch");
  const [country, setCountry] = useState("DE");
  const [goal, setGoal] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (blocked) {
    return (
      <div className="border border-champagne/15 p-5 md:p-7">
        <p className="eyebrow text-champagne mb-3">2 offene Anfragen — Warteschlange voll</p>
        <p className="text-cream/65 text-sm md:text-base leading-relaxed">
          Du hast schon 2 Big-Match-Anfragen in Bearbeitung. Sobald eine
          davon geplant oder abgeschlossen ist, kannst du eine neue
          einreichen.
        </p>
      </div>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    if (!own_level) return setError("Bitte dein eigenes Level waehlen.");
    if (!match_type) return setError("Bitte Match-Art waehlen.");
    setSubmitting(true);
    const r = await submitBigMatch({
      desired_date: desired_date || null,
      desired_time: desired_time || null,
      own_level,
      match_type,
      desired_opponent_level: opp || null,
      language: lang || null,
      country: country || null,
      goal: goal || null,
      message: message || null,
    });
    setSubmitting(false);
    if (!r.ok) return setError(r.error || "Konnte nicht senden.");
    router.refresh();
    setDate(""); setTime(""); setOwn(""); setType("");
    setOpp(""); setGoal(""); setMessage("");
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-5 md:p-7 space-y-7">
      <p className="eyebrow text-champagne">Big Match anfragen</p>

      <div className="grid md:grid-cols-2 gap-5">
        <div>
          <label className="eyebrow block mb-2">Wunsch-Datum</label>
          <input
            type="date" value={desired_date} min={today}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-3 focus:outline-none"
          />
        </div>
        <div>
          <label className="eyebrow block mb-2">Wunsch-Uhrzeit</label>
          <input
            type="text" maxLength={24} value={desired_time}
            placeholder="z.B. 20-22 Uhr"
            onChange={(e) => setTime(e.target.value)}
            className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-3 placeholder-cream/25 focus:outline-none"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Select label="Dein Level *" value={own_level} onChange={setOwn} options={O.own_levels} />
        <Select label="Match-Art *" value={match_type} onChange={setType} options={O.match_types} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Select label="Gegner-Staerke" value={opp} onChange={setOpp} options={O.opponent_levels} />
        <Select label="Ziel" value={goal} onChange={setGoal} options={O.goals} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <Select label="Sprache" value={lang} onChange={setLang} options={O.languages} />
        <Select label="Land / Region" value={country} onChange={setCountry} options={O.countries} />
      </div>

      <div>
        <label className="eyebrow block mb-2">Nachricht an ZOE (optional)</label>
        <textarea
          value={message}
          rows={3}
          maxLength={500}
          placeholder="Was sollen wir bei der Gegner-Suche beachten?"
          onChange={(e) => setMessage(e.target.value)}
          className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-champagne/70 text-xs italic">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Sende…" : "Big Match anfragen"}
        {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>

      <p className="text-cream/45 text-xs leading-relaxed pt-2 border-t border-champagne/10">
        ZOE prueft passende Gegner. Du bekommst Bescheid sobald ein Match
        steht oder wir noch Infos brauchen. Keine Garantie — wir bauen
        nur Matches die wirklich Sinn ergeben.
      </p>
    </form>
  );
}

function Select({
  label, value, onChange, options,
}: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="eyebrow block mb-2">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-3 focus:outline-none"
      >
        <option value="" className="bg-ink">— bitte waehlen —</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-ink">{o}</option>
        ))}
      </select>
    </div>
  );
}
