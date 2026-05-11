"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  toggleChallengeActive, extendChallenge, reviewSubmission,
} from "../actions";

export function ToggleActive({ id, active }: { id: string; active: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    await toggleChallengeActive(id, !active);
    setBusy(false);
    router.refresh();
  }
  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border ${
        active ? "border-champagne bg-champagne text-ink" : "border-champagne/40 text-champagne"
      } disabled:opacity-50`}
    >
      {busy ? "…" : active ? "Aktiv · pausieren" : "Aktivieren + Push"}
    </button>
  );
}

export function ExtendButton({ id, currentEnd }: { id: string; currentEnd: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  async function extend(days: number) {
    setBusy(true);
    const base = currentEnd ? new Date(currentEnd) : new Date();
    const next = new Date(base.getTime() + days * 86400000);
    await extendChallenge(id, next.toISOString());
    setBusy(false);
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2">
      <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em]">Verlaengern:</span>
      <button onClick={() => extend(3)} disabled={busy} className="text-champagne hover:text-champagne-300 border border-champagne/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50">+3 Tage</button>
      <button onClick={() => extend(7)} disabled={busy} className="text-champagne hover:text-champagne-300 border border-champagne/30 px-2.5 py-1 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50">+7 Tage</button>
    </div>
  );
}

export function ReviewButtons({ submission_id }: { submission_id: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  async function run(status: "approved" | "rejected" | "winner") {
    setBusy(status); setMsg(null);
    const r = await reviewSubmission({ submission_id, status });
    setBusy(null);
    if (!r.ok) return setMsg(r.error || "Fehler.");
    router.refresh();
  }
  return (
    <div className="flex items-center gap-2 flex-wrap text-[10px] uppercase tracking-[0.25em]">
      <button onClick={() => run("approved")} disabled={!!busy}
        className="text-champagne hover:text-champagne-300 border border-champagne/30 px-2.5 py-1 disabled:opacity-50">
        {busy === "approved" ? "…" : "✓ Approve"}
      </button>
      <button onClick={() => run("winner")} disabled={!!busy}
        className="text-ink bg-champagne hover:bg-champagne-300 px-2.5 py-1 disabled:opacity-50">
        {busy === "winner" ? "…" : "🏆 Winner"}
      </button>
      <button onClick={() => run("rejected")} disabled={!!busy}
        className="text-red-300/85 hover:text-red-300 border border-red-400/30 px-2.5 py-1 disabled:opacity-50">
        {busy === "rejected" ? "…" : "✕ Reject"}
      </button>
      {msg && <span className="text-red-300/85 normal-case tracking-normal">{msg}</span>}
    </div>
  );
}
