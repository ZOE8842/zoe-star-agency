"use client";

import { useState, useTransition } from "react";
import { adminUpdateAbsenceStatus } from "./actions";
import {
  ABSENCE_REASON_LABEL,
  ABSENCE_STATUS_LABEL,
  ABSENCE_STATUS_TONE,
  type AbsenceReason,
} from "@/lib/services/absence";

interface Row {
  id: string;
  profile_id: string;
  display_name: string | null;
  tiktok_username: string | null;
  reason: string;
  period_start: string;
  period_end: string;
  status: string;
  note: string | null;
  created_at: string;
}

const STATUS_OPTIONS = [
  { value: "submitted", label: "Eingereicht" },
  { value: "seen", label: "Gesehen" },
  { value: "resolved", label: "Geklaert" },
];

export function AdminAbsenceTable({ rows }: { rows: Row[] }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const change = (id: string, status: string) => {
    setError(null);
    startTransition(async () => {
      const r = await adminUpdateAbsenceStatus(id, status as never);
      if (!r.ok) setError(r.error ?? "Fehler.");
    });
  };

  if (rows.length === 0) {
    return <p className="text-cream/45 italic font-display text-lg">Keine Meldungen.</p>;
  }

  return (
    <div>
      {error && <div className="border border-red-500/40 bg-red-500/10 px-4 py-2 text-red-300 text-sm mb-4">{error}</div>}
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="border border-champagne/15 hover:border-champagne/30 transition-colors p-4 md:p-5 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-3 mb-2 flex-wrap">
                <p className="font-display italic text-cream text-lg md:text-xl">
                  {r.display_name || r.tiktok_username || "—"}
                </p>
                {r.tiktok_username && <span className="text-cream/45 text-sm">@{r.tiktok_username}</span>}
                <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${ABSENCE_STATUS_TONE[r.status] ?? ""}`}>
                  {ABSENCE_STATUS_LABEL[r.status] ?? r.status}
                </span>
              </div>
              <p className="text-cream/65 text-sm">
                {ABSENCE_REASON_LABEL[r.reason as AbsenceReason] ?? r.reason}
              </p>
              <p className="text-cream/45 text-xs mt-1">
                {new Date(r.period_start).toLocaleDateString("de-DE")}
                {" – "}
                {new Date(r.period_end).toLocaleDateString("de-DE")}
              </p>
              {r.note && <p className="text-cream/50 text-xs italic mt-2">„{r.note}"</p>}
            </div>
            <div className="flex md:flex-col items-start gap-2 md:gap-1.5">
              <select
                value={r.status}
                onChange={(e) => change(r.id, e.target.value)}
                disabled={isPending}
                className="bg-transparent border border-champagne/30 hover:border-champagne text-cream text-xs px-2 py-1.5 focus:outline-none focus:border-champagne"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-ink">{o.label}</option>
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
