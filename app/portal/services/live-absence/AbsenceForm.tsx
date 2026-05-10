"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitAbsence } from "./actions";
import {
  ABSENCE_REASONS,
  ABSENCE_REASON_LABEL,
  ABSENCE_STATUS_LABEL,
  ABSENCE_STATUS_TONE,
  type AbsenceReason,
} from "@/lib/services/absence";

interface HistoryRow {
  id: string;
  reason: string;
  period_start: string;
  period_end: string;
  status: string;
  note: string | null;
  created_at: string;
}

interface Props {
  history: HistoryRow[];
}

function todayISO(offset: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function AbsenceForm({ history }: Props) {
  const router = useRouter();
  const [reason, setReason] = useState<AbsenceReason | "">("");
  const [start, setStart] = useState(() => todayISO(0));
  const [end, setEnd] = useState(() => todayISO(0));
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const ready = useMemo(
    () => !!reason && !!start && !!end && start <= end,
    [reason, start, end],
  );

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting || !reason) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const r = await submitAbsence({
      reason,
      period_start: start,
      period_end: end,
      note: note || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error || "Konnte nicht speichern.");
      return;
    }
    setInfo("Bescheid gegeben. Wir haben dich vermerkt.");
    setNote("");
    setReason("");
    router.refresh();
  };

  return (
    <>
      <section className="border border-champagne/15 p-5 md:p-7 mb-10">
        <p className="eyebrow mb-5">Sag uns kurz Bescheid</p>

        <form onSubmit={submit} className="space-y-7">
          <div>
            <label className="eyebrow text-cream/65 mb-2.5 block">Grund</label>
            <div className="flex flex-wrap gap-2">
              {ABSENCE_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setReason(r)}
                  className={`px-4 py-2.5 text-sm border transition-all ${
                    reason === r
                      ? "border-champagne bg-champagne/10 text-champagne"
                      : "border-champagne/20 text-cream/70 hover:border-champagne/50 hover:text-cream"
                  }`}
                >
                  {reason === r && <span className="mr-1.5">✓</span>}
                  {ABSENCE_REASON_LABEL[r]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="eyebrow text-cream/65 mb-2.5 block">Von</label>
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
                className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none"
              />
            </div>
            <div>
              <label className="eyebrow text-cream/65 mb-2.5 block">Bis</label>
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="eyebrow text-cream/65 mb-2.5 block">
              Nachricht {reason === "sonstiges" ? "(empfohlen)" : "(optional)"}
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 240))}
              rows={3}
              maxLength={240}
              placeholder="Was wir wissen sollten."
              className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none resize-none"
            />
          </div>

          {error && <p className="text-champagne/70 text-xs italic">{error}</p>}
          {info && <p className="text-champagne/85 text-xs italic">{info}</p>}

          <button
            type="submit"
            disabled={!ready || submitting}
            className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Sende…" : "Abmelden"}
            {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
          </button>
        </form>
      </section>

      {history.length > 0 && (
        <section>
          <p className="eyebrow mb-4">Deine Meldungen</p>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="border-t border-champagne/10 last:border-b py-3 flex items-baseline justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-cream text-sm md:text-base">
                    {ABSENCE_REASON_LABEL[h.reason as AbsenceReason] ?? h.reason}
                  </p>
                  <p className="text-cream/45 text-xs">
                    {new Date(h.period_start).toLocaleDateString("de-DE")}
                    {" – "}
                    {new Date(h.period_end).toLocaleDateString("de-DE")}
                  </p>
                  {h.note && <p className="text-cream/55 text-xs italic mt-1">„{h.note}"</p>}
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${ABSENCE_STATUS_TONE[h.status] ?? ""}`}>
                  {ABSENCE_STATUS_LABEL[h.status] ?? h.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
