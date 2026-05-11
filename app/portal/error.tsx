"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function PortalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Portal-Error]", error);
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "portal");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <main className="min-h-screen bg-ink flex items-center justify-center px-6">
      <div className="text-center max-w-lg">
        <p className="eyebrow mb-6 text-red-400">Error</p>
        <h1 className="heading-display text-4xl md:text-5xl text-cream mb-4">
          Etwas ist <span className="text-champagne">schiefgelaufen.</span>
        </h1>
        <p className="text-cream/60 text-base leading-relaxed mb-8 max-w-md mx-auto">
          Wir konnten deinen Request nicht verarbeiten. Versuch es bitte erneut.
          Wenn das Problem bleibt, melde es im Support.
        </p>

        {error.digest && (
          <p className="text-cream/30 text-xs font-mono mb-8">Error-ID: {error.digest}</p>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={reset} className="btn-primary">Try again</button>
          <Link href="/portal" className="btn-outline">Back to dashboard</Link>
        </div>
      </div>
    </main>
  );
}
