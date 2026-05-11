"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { retryPlatformNotification, cancelPlatformNotification } from "./actions";

export function RowActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function run(action: "retry" | "cancel") {
    setBusy(true);
    setMsg(null);
    const r = action === "retry"
      ? await retryPlatformNotification(id)
      : await cancelPlatformNotification(id);
    setBusy(false);
    if (!r.ok) return setMsg(r.error || "Fehler.");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.25em]">
      {["failed", "skipped"].includes(status) && (
        <button
          onClick={() => run("retry")}
          disabled={busy}
          className="text-champagne hover:text-champagne-300 border border-champagne/40 px-2.5 py-1 disabled:opacity-50"
        >
          {busy ? "…" : "▶ Retry"}
        </button>
      )}
      {["queued", "failed"].includes(status) && (
        <button
          onClick={() => run("cancel")}
          disabled={busy}
          className="text-cream/50 hover:text-red-300/80 border border-cream/20 px-2.5 py-1 disabled:opacity-50"
        >
          {busy ? "…" : "✕ Skip"}
        </button>
      )}
      {msg && <span className="text-red-300/85 normal-case tracking-normal">{msg}</span>}
    </div>
  );
}
