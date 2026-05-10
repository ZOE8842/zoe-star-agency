"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestLiveReport } from "./actions";

export function LiveReportForm({ hasOpenReport }: { hasOpenReport: boolean }) {
  const router = useRouter();
  const [label, setLabel] = useState("Aktueller Monat");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (hasOpenReport) {
    return (
      <div className="border border-champagne/15 p-5 md:p-7">
        <p className="eyebrow text-champagne mb-3">Ein Report laeuft bereits</p>
        <p className="text-cream/65 text-sm md:text-base leading-relaxed">
          Du hast einen offenen LIVE-Performance-Report. Sobald er fertig ist,
          kannst du einen neuen anfordern. Ergebnis erscheint hier + im
          Activity-Feed deiner Inbox.
        </p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setSubmitting(true);
    const r = await requestLiveReport({
      period_label: label || undefined,
      manual_note: note || undefined,
    });
    setSubmitting(false);
    if (!r.ok) { setError(r.error || "Konnte nicht starten."); return; }
    router.push(`/portal/analyse/live/${r.id}`);
    router.refresh();
  };

  return (
    <form onSubmit={submit} className="border border-champagne/15 p-5 md:p-7 space-y-6">
      <div>
        <label className="eyebrow block mb-2">Zeitraum</label>
        <select
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-3 focus:outline-none"
        >
          <option value="Aktueller Monat" className="bg-ink">Aktueller Monat</option>
          <option value="Letzte 7 Tage" className="bg-ink">Letzte 7 Tage</option>
          <option value="Letzte 30 Tage" className="bg-ink">Letzte 30 Tage</option>
          <option value="Letzter Monat" className="bg-ink">Letzter Monat</option>
        </select>
        <p className="text-cream/35 text-xs mt-2">
          Wir holen passende Backstage-Daten + aktuelle LIVE-Snapshots.
        </p>
      </div>

      <div>
        <label className="eyebrow block mb-2">Was sollen wir besonders pruefen? (optional)</label>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value.slice(0, 500))}
          rows={3}
          maxLength={500}
          placeholder="z.B. Battle-Strategie, Zuschauer-Drop nach 30 min, Tageszeit-Vorschlag, Community-Aufbau"
          className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none resize-none"
        />
      </div>

      {error && <p className="text-champagne/70 text-xs italic">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? "Starte…" : "Report anfordern"}
        {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
      </button>
    </form>
  );
}
