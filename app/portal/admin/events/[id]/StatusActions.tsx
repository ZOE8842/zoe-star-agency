"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminSetEventStatus } from "../actions";

const STATUSES = ["draft", "open", "closed", "completed"] as const;
const STATUS_LABEL: Record<string, string> = {
  draft: "Entwurf",
  open: "Offen",
  closed: "Geschlossen",
  completed: "Beendet",
};

export function StatusActions({
  eventId,
  current,
}: {
  eventId: string;
  current: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function switchTo(status: string) {
    setError(null);
    startTransition(async () => {
      const r = await adminSetEventStatus(eventId, status);
      if (!r.ok) setError(r.error ?? "Fehler.");
      router.refresh();
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            type="button"
            disabled={isPending || s === current}
            onClick={() => switchTo(s)}
            className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border transition-colors ${
              s === current
                ? "bg-champagne text-ink border-champagne"
                : "border-champagne/20 text-cream/55 hover:border-champagne/60 hover:text-cream disabled:opacity-40"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>
      {error && <p className="text-red-300/85 text-xs">{error}</p>}
    </div>
  );
}
