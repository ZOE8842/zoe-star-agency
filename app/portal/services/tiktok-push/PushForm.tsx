"use client";

// Creator-Form: bis zu 3 Wunschzeiten fuer naechste Woche eintragen.
// Editorial Brand-Look — keine harte Validation, weiche Hints.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { submitPushRequest, cancelPushRequest } from "./actions";

interface SlotRow {
  id: string;          // local row-id
  date: string;        // YYYY-MM-DD
  time: string;        // HH:MM
  duration_min: number;
}

interface Props {
  weekRange: string;
  weekKey: string;
  weekDays: { date: string; label: string }[];
  existing: ExistingRequest | null;
  history: HistoryRow[];
}

export interface ExistingRequest {
  id: string;
  status: string;
  requested_slots: SlotRow[];
  note: string | null;
  created_at: string;
}

export interface HistoryRow {
  id: string;
  week_start_monday: string;
  status: string;
  requested_slots: SlotRow[];
  created_at: string;
}

const STATUS_LABEL: Record<string, string> = {
  submitted: "Eingereicht",
  reviewed: "Geprueft",
  selected: "Ausgewaehlt",
  not_selected: "Nicht ausgewaehlt",
  cancelled: "Storniert",
};

const STATUS_TONE: Record<string, string> = {
  submitted: "border border-champagne/40 text-champagne",
  reviewed: "border border-cream/30 text-cream/80",
  selected: "bg-champagne text-ink",
  not_selected: "border border-cream/15 text-cream/45",
  cancelled: "border border-cream/15 text-cream/45",
};

function emptyRow(): SlotRow {
  return {
    id: Math.random().toString(36).slice(2, 9),
    date: "",
    time: "20:00",
    duration_min: 90,
  };
}

export function PushForm({ weekRange, weekKey, weekDays, existing, history }: Props) {
  const router = useRouter();
  const [rows, setRows] = useState<SlotRow[]>(() => {
    if (existing?.requested_slots?.length) {
      return existing.requested_slots.map((s) => ({
        id: Math.random().toString(36).slice(2, 9),
        date: s.date,
        time: s.time,
        duration_min: s.duration_min ?? 90,
      }));
    }
    return [emptyRow()];
  });
  const [note, setNote] = useState(existing?.note ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const editable = !existing || ["submitted", "reviewed"].includes(existing.status);
  const canAdd = rows.length < 3 && editable;

  const allValid = useMemo(() => {
    if (rows.length === 0) return false;
    return rows.every(
      (r) =>
        /^\d{4}-\d{2}-\d{2}$/.test(r.date) &&
        /^\d{2}:\d{2}$/.test(r.time) &&
        r.duration_min >= 30 &&
        r.duration_min <= 240,
    );
  }, [rows]);

  const update = (id: string, patch: Partial<SlotRow>) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const addRow = () => setRows((rs) => [...rs, emptyRow()]);
  const removeRow = (id: string) =>
    setRows((rs) => (rs.length === 1 ? rs : rs.filter((r) => r.id !== id)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setError(null);
    setInfo(null);
    setSubmitting(true);
    const r = await submitPushRequest({
      slots: rows.map((row) => ({
        date: row.date,
        time: row.time,
        duration_min: row.duration_min,
      })),
      note: note || undefined,
    });
    setSubmitting(false);
    if (!r.ok) {
      setError(r.error || "Konnte nicht speichern.");
      return;
    }
    setInfo("Wunschzeiten eingereicht. Du bekommst Bescheid sobald wir geprueft haben.");
    router.refresh();
  };

  const cancel = async () => {
    if (!existing) return;
    if (!confirm("Wunsch fuer diese Woche stornieren?")) return;
    const r = await cancelPushRequest(existing.id);
    if (!r.ok) {
      setError(r.error || "Konnte nicht stornieren.");
      return;
    }
    setInfo("Storniert.");
    router.refresh();
  };

  return (
    <>
      <section className="border border-champagne/15 p-5 md:p-7 mb-10">
        <div className="flex items-baseline justify-between gap-3 mb-4">
          <p className="eyebrow">Naechste Woche</p>
          <span className="text-cream/55 text-[11px] uppercase tracking-[0.2em]">{weekRange}</span>
        </div>

        {existing && (
          <div className="mb-5 flex items-center gap-3">
            <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[existing.status] ?? ""}`}>
              {STATUS_LABEL[existing.status] ?? existing.status}
            </span>
            <span className="text-cream/45 text-xs">
              eingereicht am {new Date(existing.created_at).toLocaleDateString("de-DE")}
            </span>
          </div>
        )}

        <form onSubmit={submit} className="space-y-5">
          {rows.map((row, i) => (
            <div key={row.id} className="grid grid-cols-1 md:grid-cols-[1fr_120px_120px_auto] gap-3 md:gap-4 items-end">
              <div>
                <label className="eyebrow text-cream/65 mb-1.5 block">Tag {i + 1}</label>
                <select
                  value={row.date}
                  onChange={(e) => update(row.id, { date: e.target.value })}
                  disabled={!editable}
                  className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none disabled:opacity-50"
                >
                  <option value="" className="bg-ink">— Tag waehlen —</option>
                  {weekDays.map((d) => (
                    <option key={d.date} value={d.date} className="bg-ink">{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="eyebrow text-cream/65 mb-1.5 block">Uhrzeit</label>
                <input
                  type="time"
                  value={row.time}
                  onChange={(e) => update(row.id, { time: e.target.value })}
                  disabled={!editable}
                  className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div>
                <label className="eyebrow text-cream/65 mb-1.5 block">Dauer min</label>
                <input
                  type="number"
                  min={30}
                  max={240}
                  step={15}
                  value={row.duration_min}
                  onChange={(e) => update(row.id, { duration_min: parseInt(e.target.value) || 0 })}
                  disabled={!editable}
                  className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 focus:outline-none disabled:opacity-50"
                />
              </div>
              <div className="flex items-center justify-end pb-1">
                {rows.length > 1 && editable && (
                  <button
                    type="button"
                    onClick={() => removeRow(row.id)}
                    className="text-cream/40 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
                  >
                    entfernen
                  </button>
                )}
              </div>
            </div>
          ))}

          {canAdd && (
            <button
              type="button"
              onClick={addRow}
              className="text-champagne hover:text-champagne-300 text-[11px] uppercase tracking-[0.25em]"
            >
              + Weitere Wunschzeit
            </button>
          )}

          <div className="pt-2">
            <label className="eyebrow text-cream/65 mb-1.5 block">Hinweis (optional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value.slice(0, 240))}
              maxLength={240}
              disabled={!editable}
              placeholder="z.B. Match-Partner schon angefragt"
              className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream py-2.5 placeholder-cream/25 focus:outline-none disabled:opacity-50"
            />
          </div>

          <p className="text-cream/35 text-xs leading-relaxed">
            Maximal drei Wunschzeiten. Mo 00:00 – So 18:00. Keine Garantie —
            meist werden zwei ausgewaehlt, mit Glueck drei. Du musst mindestens
            15 Minuten vorher LIVE sein.
          </p>

          {error && (
            <p className="text-champagne/70 text-xs italic">{error}</p>
          )}
          {info && (
            <p className="text-champagne/85 text-xs italic">{info}</p>
          )}

          <div className="flex items-center gap-3 pt-2">
            {editable && (
              <button
                type="submit"
                disabled={!allValid || submitting}
                className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting ? "Sende…" : existing ? "Aktualisieren" : "Einreichen"}
                {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
              </button>
            )}
            {existing && editable && (
              <button
                type="button"
                onClick={cancel}
                className="text-cream/55 hover:text-champagne text-[10px] uppercase tracking-[0.25em] px-3 py-2"
              >
                Stornieren
              </button>
            )}
          </div>
        </form>
      </section>

      {history.length > 0 && (
        <section>
          <p className="eyebrow mb-4">Vergangene Wochen</p>
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h.id} className="border-t border-champagne/10 last:border-b py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-cream text-sm md:text-base">
                    Woche ab {new Date(h.week_start_monday).toLocaleDateString("de-DE")}
                  </p>
                  <p className="text-cream/40 text-xs">
                    {h.requested_slots?.length ?? 0} Wunsch{(h.requested_slots?.length ?? 0) === 1 ? "" : "e"}
                  </p>
                </div>
                <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[h.status] ?? ""}`}>
                  {STATUS_LABEL[h.status] ?? h.status}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
