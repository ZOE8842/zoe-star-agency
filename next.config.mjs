import { withSentryConfig } from "@sentry/nextjs";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "vvmsftyyijeyshikshsi.supabase.co" },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  // Org + Project: kommen aus Vercel-Envs (SENTRY_ORG / SENTRY_PROJECT)
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,

  // Auth-Token nur fuer Build (Source-Map-Upload).
  // Wenn nicht gesetzt (lokal ohne Token), wird Upload skipped.
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // Source-Maps verbergen vor public, aber zu Sentry uploaden.
  hideSourceMaps: true,

  // Logging des Sentry-Webpack-Plugins minimieren
  silent: !process.env.CI,

  // Tunnel-Route umgeht AdBlocker fuer Browser-Sentry-Calls
  tunnelRoute: "/monitoring",

  // Auto-Tree-Shake fuer kleinere Bundle-Size
  disableLogger: true,
});
