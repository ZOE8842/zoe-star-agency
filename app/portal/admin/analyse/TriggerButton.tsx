"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminTriggerAnalysis } from "./actions";

export function TriggerButton({
  id,
  kind,
  disabled,
}: {
  id: string;
  kind: "account" | "live";
  disabled?: boolean;
}) {
  const router = useRouter();
  const [running, setRunning] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const click = async () => {
    if (running || disabled) return;
    setRunning(true);
    setMsg(null);
    const r = await adminTriggerAnalysis({ id, kind });
    setRunning(false);
    if (!r.ok) {
      setMsg(r.error || "Fehler");
      return;
    }
    setMsg(`Fertig · $${(r.cost_usd ?? 0).toFixed(4)}`);
    router.refresh();
  };

  return (
    <button
      onClick={click}
      disabled={running || disabled}
      className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] disabled:opacity-40 disabled:cursor-not-allowed border border-champagne/40 px-2.5 py-1"
      title={disabled ? "Schon abgeschlossen" : "Manuell starten"}
    >
      {running ? "Laeuft…" : msg ?? "▶ Run"}
    </button>
  );
}
