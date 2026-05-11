"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { approvePendingCreator, rejectPendingCreator } from "./actions";

export function ApproveButtons({ profileId }: { profileId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(kind: "approve" | "reject") {
    setBusy(kind);
    setMsg(null);
    const r = kind === "approve"
      ? await approvePendingCreator(profileId)
      : await rejectPendingCreator(profileId);
    setBusy(null);
    if (!r.ok) return setMsg(r.error || "Fehler.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => run("approve")}
        disabled={!!busy}
        className="text-ink bg-champagne hover:bg-champagne-300 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50"
      >
        {busy === "approve" ? "…" : "✓ Approve"}
      </button>
      <button
        onClick={() => run("reject")}
        disabled={!!busy}
        className="text-red-300/85 hover:text-red-300 border border-red-400/30 px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] disabled:opacity-50"
      >
        {busy === "reject" ? "…" : "✕ Reject"}
      </button>
      {msg && <span className="text-red-300/85 text-xs">{msg}</span>}
    </div>
  );
}
