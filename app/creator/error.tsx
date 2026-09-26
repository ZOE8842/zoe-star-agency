"use client";

// Fehlerseite fuer /creator und /creator/[username].
//
// Warum es sie gibt: Wenn die Datenbank nicht antwortet, warf die
// Creator-Abfrage bis 26.09.2026 kein Signal, sondern lieferte "nichts" —
// und die Seite machte daraus notFound(). Ein Besucher sah 404, obwohl es
// den Creator gibt, und Google sah eine geloeschte Seite.
// Jetzt wirft die Abfrage, Next liefert Status 500 und hier steht, was
// wirklich los ist: eine Stoerung, kein verschwundener Creator.

import { useEffect } from "react";
import Link from "next/link";

export default function CreatorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Landet in Sentry, damit wir sehen wie oft das passiert.
    console.error("[creator] Seite konnte nicht geladen werden:", error);
  }, [error]);

  return (
    <main className="bg-ink min-h-screen flex items-center">
      <div className="container-luxe py-24 text-center">
        <p className="eyebrow mb-5">Kurz nicht erreichbar</p>
        <h1 className="heading-display text-3xl md:text-6xl text-cream mb-5 leading-[0.95]">
          Das laden wir gerade <span className="text-champagne">nicht</span>.
        </h1>
        <p className="text-cream/65 text-sm md:text-lg leading-relaxed max-w-xl mx-auto mb-4">
          Die Creator-Daten sind im Moment nicht abrufbar. Das liegt an uns,
          nicht an dir — und es ist keine gelöschte Seite. Versuch es in einem
          Moment noch einmal.
        </p>
        {error.digest && (
          <p className="text-cream/35 text-xs mb-9">Fehlernummer: {error.digest}</p>
        )}
        <div className="flex flex-wrap gap-4 justify-center">
          <button onClick={reset} className="btn-primary">
            Nochmal versuchen
          </button>
          <Link href="/creator" className="btn-cta-secondary">
            Zur Creator-Liste
          </Link>
        </div>
      </div>
    </main>
  );
}
