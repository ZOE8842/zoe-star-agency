"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function SupportError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Support-Error]", error);
  }, [error]);

  return (
    <main className="container-luxe py-16 max-w-2xl">
      <p className="eyebrow mb-3">Support</p>
      <h1 className="font-display italic text-cream text-3xl md:text-4xl mb-4">
        Da ging was schief.
      </h1>
      <p className="text-cream/60 text-sm md:text-base leading-relaxed mb-8">
        Wir konnten deine Tickets gerade nicht laden. Versuch es einen
        Moment spaeter erneut oder schreib direkt an die Inbox.
      </p>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-cta btn-shimmer"
        >
          Erneut versuchen
          <span className="btn-cta-arrow" aria-hidden>→</span>
        </button>
        <Link
          href="/portal/inbox/compose"
          className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] inline-flex items-center px-3 py-2 border border-champagne/30"
        >
          Inbox-Nachricht statt Ticket
        </Link>
      </div>
    </main>
  );
}
