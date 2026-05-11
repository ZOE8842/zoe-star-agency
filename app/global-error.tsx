"use client";

// Global-Error-Boundary fuer Root-Layout-Fehler (App-Router).
// Faengt Errors die durch alle anderen error.tsx durchrutschen
// und meldet sie an Sentry.

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.withScope((scope) => {
      scope.setTag("boundary", "global");
      Sentry.captureException(error);
    });
  }, [error]);

  return (
    <html lang="de">
      <body style={{ margin: 0, padding: 0, background: "#0a0a0a", color: "#f5e8d5", fontFamily: "Georgia, serif" }}>
        <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
          <div style={{ textAlign: "center", maxWidth: "520px" }}>
            <p style={{ fontSize: "10px", letterSpacing: "0.25em", textTransform: "uppercase", color: "#c9a86a", marginBottom: "24px" }}>
              Unerwarteter Fehler
            </p>
            <h1 style={{ fontSize: "36px", fontStyle: "italic", lineHeight: 1.1, marginBottom: "16px" }}>
              Etwas ist <span style={{ color: "#c9a86a" }}>schiefgelaufen.</span>
            </h1>
            <p style={{ fontSize: "16px", color: "rgba(216, 201, 176, 0.7)", lineHeight: 1.55, marginBottom: "32px" }}>
              Wir haben den Fehler automatisch erfasst und schauen ihn uns an.
              Du kannst die Seite neu laden oder zur Startseite zurueck.
            </p>
            {error.digest && (
              <p style={{ fontSize: "11px", fontFamily: "monospace", color: "rgba(122, 112, 98, 0.7)", marginBottom: "24px" }}>
                Error-ID: {error.digest}
              </p>
            )}
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={reset}
                style={{ background: "#c9a86a", color: "#0a0a0a", border: 0, padding: "14px 28px", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: "bold", cursor: "pointer" }}
              >
                Neu laden
              </button>
              <a
                href="/"
                style={{ background: "transparent", color: "#c9a86a", border: "1px solid rgba(201, 168, 106, 0.4)", padding: "14px 28px", fontSize: "11px", letterSpacing: "0.25em", textTransform: "uppercase", fontWeight: "bold", textDecoration: "none" }}
              >
                Zur Startseite
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
