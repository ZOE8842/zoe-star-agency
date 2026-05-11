// Sentry · Server-Side (Node-Runtime, App-Router Server-Components + API-Routes)
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,

  tracesSampleRate: 0.1,
  environment: process.env.VERCEL_ENV || "development",
  release: process.env.VERCEL_GIT_COMMIT_SHA,

  // NEXT_REDIRECT + NEXT_NOT_FOUND sind Control-Flow-Throws, keine
  // echten Errors. ignoreErrors matcht aber nur .message, nicht
  // .digest — daher beforeSend mit Digest-Check.
  beforeSend(event, hint) {
    const err = hint?.originalException as { digest?: unknown; message?: unknown } | undefined;
    const digest = typeof err?.digest === "string" ? err.digest : "";
    const message = typeof err?.message === "string" ? err.message : "";
    if (
      digest === "NEXT_REDIRECT" ||
      digest === "NEXT_NOT_FOUND" ||
      digest.startsWith("NEXT_REDIRECT;") ||
      message === "NEXT_REDIRECT" ||
      message === "NEXT_NOT_FOUND"
    ) {
      return null;
    }
    return event;
  },
});
