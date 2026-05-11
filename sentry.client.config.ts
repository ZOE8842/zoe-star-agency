// Sentry · Client-Side Error-Tracking
// Wird automatisch via withSentryConfig in next.config.mjs eingebunden.
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance-Monitoring · 10% Sample reicht fuer Soft-Launch
  tracesSampleRate: 0.1,

  // Session-Replay: nur bei Error-Events, nicht generell (Cost-Schutz)
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0.1,

  // Environment-Trennung in Sentry-UI (production / preview / development)
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "development",

  // Release-Version fuer Source-Map-Mapping (Vercel setzt Git-SHA)
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,

  // Standard-Ignores fuer typischen Browser-Noise
  ignoreErrors: [
    "ResizeObserver loop limit exceeded",
    "ResizeObserver loop completed with undelivered notifications",
    "Non-Error promise rejection captured",
    /Network request failed/,
  ],

  integrations: [Sentry.replayIntegration()],
});
