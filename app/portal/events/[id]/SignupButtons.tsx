"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signupForEvent, cancelEventSignup } from "./actions";

export function SignupButtons({
  eventId,
  signedUp,
  disabled,
  disabledReason,
}: {
  eventId: string;
  signedUp: boolean;
  disabled: boolean;
  disabledReason?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function doSignup() {
    setError(null);
    startTransition(async () => {
      const r = await signupForEvent(eventId);
      if (!r.ok) setError(r.error ?? "Fehler.");
      router.refresh();
    });
  }

  function doCancel() {
    setError(null);
    startTransition(async () => {
      const r = await cancelEventSignup(eventId);
      if (!r.ok) setError(r.error ?? "Fehler.");
      router.refresh();
    });
  }

  if (disabled && !signedUp) {
    return (
      <p className="text-cream/45 text-sm">{disabledReason ?? "Anmeldung aktuell nicht moeglich."}</p>
    );
  }

  return (
    <div className="space-y-2">
      {signedUp ? (
        <div className="flex items-center gap-4 flex-wrap">
          <span className="px-3 py-1.5 bg-champagne text-ink text-[10px] uppercase tracking-[0.25em]">
            Angemeldet
          </span>
          <button
            type="button"
            onClick={doCancel}
            disabled={isPending}
            className="text-cream/55 hover:text-red-300 text-[10px] uppercase tracking-[0.25em] disabled:opacity-40"
          >
            {isPending ? "Storniere…" : "Anmeldung stornieren"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={doSignup}
          disabled={isPending}
          className="btn-cta btn-shimmer disabled:opacity-50"
        >
          {isPending ? "Sende…" : "Jetzt anmelden"}
          {!isPending && <span className="btn-cta-arrow" aria-hidden>→</span>}
        </button>
      )}
      {error && <p className="text-red-300/85 text-xs">{error}</p>}
    </div>
  );
}
