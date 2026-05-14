"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin/events] route error:", error);
  }, [error]);

  return (
    <main className="container-luxe py-16 max-w-2xl">
      <p className="eyebrow mb-3 text-red-300">Fehler · Event-Verwaltung</p>
      <h1 className="heading-display text-3xl md:text-4xl mb-4">
        Die Seite konnte nicht geladen werden.
      </h1>
      <p className="text-cream/65 text-sm leading-relaxed mb-8">
        {error.message || "Unbekannter Fehler."}
        {error.digest && (
          <span className="text-cream/35 text-xs block mt-2 font-mono">
            digest: {error.digest}
          </span>
        )}
      </p>
      <div className="flex gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => reset()}
          className="btn-primary text-[10px] py-3 px-7"
        >
          Erneut versuchen
        </button>
        <a
          href="/portal/admin"
          className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em] py-3"
        >
          Zurueck zum Admin-Dashboard →
        </a>
      </div>
    </main>
  );
}
