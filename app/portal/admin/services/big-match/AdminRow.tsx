"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateBigMatch } from "./actions";

interface Row {
  id: string;
  status: string;
  admin_note: string | null;
  scheduled_for: string | null;
}

const STATUSES = [
  { v: "requested", l: "Angefragt" },
  { v: "in_review", l: "In Pruefung" },
  { v: "partner_found", l: "Partner gefunden" },
  { v: "scheduled", l: "Geplant" },
  { v: "done", l: "Abgeschlossen" },
  { v: "rejected", l: "Abgelehnt" },
];

export function AdminControls({ row }: { row: Row }) {
  const router = useRouter();
  const [status, setStatus] = useState(row.status);
  const [note, setNote] = useState(row.admin_note ?? "");
  const [scheduled, setScheduled] = useState(
    row.scheduled_for ? new Date(row.scheduled_for).toISOString().slice(0, 16) : "",
  );
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setMsg(null);
    const r = await updateBigMatch({
      id: row.id,
      status: status as "requested" | "in_review" | "partner_found" | "scheduled" | "done" | "rejected",
      admin_note: note,
      scheduled_for: scheduled ? new Date(scheduled).toISOString() : null,
    });
    setSaving(false);
    if (!r.ok) return setMsg(r.error || "Fehler.");
    setMsg("Gespeichert.");
    router.refresh();
  }

  return (
    <div className="space-y-3 mt-3 pt-3 border-t border-champagne/10">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-1">Status</p>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full bg-transparent border border-champagne/20 text-cream py-1.5 px-2 text-sm"
          >
            {STATUSES.map((s) => (
              <option key={s.v} value={s.v} className="bg-ink">{s.l}</option>
            ))}
          </select>
        </div>
        <div>
          <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-1">
            Geplant fuer (optional)
          </p>
          <input
            type="datetime-local" value={scheduled}
            onChange={(e) => setScheduled(e.target.value)}
            className="w-full bg-transparent border border-champagne/20 text-cream py-1.5 px-2 text-sm"
          />
        </div>
      </div>
      <div>
        <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-1">
          Interne Notiz
        </p>
        <textarea
          value={note}
          rows={2}
          maxLength={1000}
          onChange={(e) => setNote(e.target.value)}
          placeholder="nur intern sichtbar"
          className="w-full bg-transparent border border-champagne/20 text-cream py-1.5 px-2 text-sm placeholder-cream/30"
        />
      </div>
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={save}
          disabled={saving}
          className="text-champagne hover:text-champagne-300 border border-champagne/40 px-3 py-1 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50"
        >
          {saving ? "Speichere…" : "Speichern"}
        </button>
        {msg && <span className="text-cream/55 text-xs">{msg}</span>}
      </div>
    </div>
  );
}
