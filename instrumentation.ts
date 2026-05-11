// Next.js Instrumentation Hook · laedt Sentry-Server/Edge-Configs
// passend zur jeweiligen Runtime. Wird beim Server-Start aufgerufen.
import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

// Globale Error-Handler-Bridge fuer App-Router Server-Components.
// Wrapper statt Re-Export, damit Type-Mismatch ausgeschlossen ist
// (Next.js 16 erwartet exakt diese Signatur).
export async function onRequestError(
  error: unknown,
  request: Parameters<typeof Sentry.captureRequestError>[1],
  context: Parameters<typeof Sentry.captureRequestError>[2],
) {
  await Sentry.captureRequestError(error, request, context);
}
