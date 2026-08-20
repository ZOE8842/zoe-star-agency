import { withSentryConfig } from "@sentry/nextjs";

// Supabase-Host aus Env ableiten (statt hardcoded). Erlaubt Wechsel des
// Supabase-Projekts ohne Code-Aenderung. Fallback fuer lokale Builds ohne env.
const supabaseHost = (() => {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!url) return "vvmsftyyijeyshikshsi.supabase.co";
    return new URL(url).hostname;
  } catch {
    return "vvmsftyyijeyshikshsi.supabase.co";
  }
})();

// HTTP-Security-Header-Pack (Phase-4 Security-Pass).
// CSP lief seit dem Security-Pass im Report-Only-Modus. Am 2026-08-20 scharf
// geschaltet: Report-Phase ohne Verstoesse, und im Code gibt es weder iframes
// noch externe Scripts oder Client-Fetches auf fremde Hosts — die Policy
// beschreibt also genau das, was die App ohnehin tut.
// Einziges Inline-Script ist das JSON-LD aus components/JsonLd.tsx, das
// 'unsafe-inline' in script-src abdeckt.
const SECURITY_HEADERS = [
  { key: "X-Frame-Options",        value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy",        value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=(), browsing-topics=()",
  },
  {
    key: "Content-Security-Policy",
    // Erlaubt: self + inline (Next + Tailwind) + Vercel-Insights + Supabase + Sentry-Tunnel + Google-Fonts.
    // images: self + data: + Supabase-Storage. fonts: self + data: + Google-Fonts.
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.vercel-insights.com https://va.vercel-scripts.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      `img-src 'self' data: blob: https://${supabaseHost}`,
      `media-src 'self' data: blob: https://${supabaseHost}`,
      `connect-src 'self' https://${supabaseHost} https://*.sentry.io https://*.ingest.sentry.io https://*.vercel-insights.com`,
      "worker-src 'self' blob:",
      "manifest-src 'self'",
      "frame-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; "),
  },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: supabaseHost },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: SECURITY_HEADERS,
      },
    ];
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
