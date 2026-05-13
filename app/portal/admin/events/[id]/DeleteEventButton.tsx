"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { adminDeleteEvent } from "../actions";

export function DeleteEventButton({ eventId, title }: { eventId: string; title: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function confirmDelete() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const r = await adminDeleteEvent(eventId);
      if (!r.ok) {
        setError(r.error ?? "Fehler beim Loeschen.");
        setConfirming(false);
        return;
      }
      router.push("/portal/admin/events");
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={confirmDelete}
        disabled={isPending}
        className={`px-4 py-2 text-[10px] uppercase tracking-[0.25em] border transition-colors disabled:opacity-50 ${
          confirming
            ? "bg-red-500/15 border-red-500/60 text-red-200"
            : "border-red-500/30 text-red-300/85 hover:border-red-500/60 hover:bg-red-500/10"
        }`}
      >
        {isPending
          ? "Loesche..."
          : confirming
          ? `Wirklich loeschen? "${title.slice(0, 30)}${title.length > 30 ? "..." : ""}"`
          : "Event loeschen"}
      </button>
      {confirming && !isPending && (
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="text-cream/45 hover:text-cream text-[10px] uppercase tracking-[0.25em] ml-3"
        >
          Abbrechen
        </button>
      )}
      {error && <p className="text-red-300/85 text-xs">{error}</p>}
    </div>
  );
}
