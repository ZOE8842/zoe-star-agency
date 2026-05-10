"use client";

import { useState, useTransition } from "react";
import { adminUpdatePushStatus } from "./actions";

interface SlotEntry {
  date: string;
  time: string;
  duration_min: number;
}

interface Row {
  id: string;
  profile_id: string;
  display_name: string | null;
  tiktok_username: string | null;
  week_start_monday: string;
  status: string;
  requested_slots: SlotEntry[];
  note: string | null;
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
  cancelled: "border border-cream/15 text-cream/45 line-through",
};

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "submitted", label: "Eingereicht" },
  { value: "reviewed", label: "Geprueft" },
  { value: "selected", label: "Ausgewaehlt" },
  { value: "not_selected", label: "Nicht ausgewaehlt" },
  { value: "cancelled", label: "Storniert" },
];

function formatSlotCell(s: SlotEntry): string {
  const d = new Date(`${s.date}T${s.time}:00`);
  if (Number.isNaN(d.getTime())) return `${s.date} ${s.time}`;
  return `${d.toLocaleDateString("de-DE", { weekday: "short", day: "2-digit", month: "2-digit" })} · ${s.time} (${s.duration_min}m)`;
}

export function AdminPushTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (id: string, status: string) => {
    setError(null);
    startTransition(async () => {
      const r = await adminUpdatePushStatus(id, status as never);
      if (!r.ok) setError(r.error ?? "Fehler.");
    });
  };

  if (rows.length === 0) {
    return (
      <p className="text-cream/45 italic font-display text-lg">
        Keine Push-Anfragen.
      </p>
    );
  }

  return (
    <div>
      {error && (
        <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm mb-4">
          {error}
        </div>
      )}
      <div className="space-y-3">
        {rows.map((r) => (
          <div
            key={r.id}
            className="border border-champagne/15 hover:border-champagne/30 transition-colors p-4 md:p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4"
          >
            <div className="min-w-0">
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <p className="font-display italic text-cream text-lg md:text-xl">
                  {r.display_name || r.tiktok_username || "—"}
                </p>
                {r.tiktok_username && (
                  <span className="text-cream/45 text-sm">@{r.tiktok_username}</span>
                )}
                <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[r.status] ?? ""}`}>
                  {STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-2">
                Woche ab {new Date(r.week_start_monday).toLocaleDateString("de-DE")}
              </p>
              <ul className="text-cream/75 text-sm space-y-1">
                {r.requested_slots?.map((s, i) => (
                  <li key={i}>· {formatSlotCell(s)}</li>
                ))}
              </ul>
              {r.note && (
                <p className="text-cream/50 text-xs italic mt-2">„{r.note}"</p>
              )}
            </div>
            <div className="flex md:flex-col items-start gap-2 md:gap-1.5">
              <select
                value={r.status}
                onChange={(e) => change(r.id, e.target.value)}
                disabled={isPending}
                className="bg-transparent border border-champagne/30 hover:border-champagne text-cream text-xs px-2 py-1.5 focus:outline-none focus:border-champagne"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-ink">
                    {o.label}
                  </option>
                ))}
              </select>
              <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                {new Date(r.created_at).toLocaleDateString("de-DE")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
