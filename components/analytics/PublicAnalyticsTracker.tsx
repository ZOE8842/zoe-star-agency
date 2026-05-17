"use client";

// Auto-Tracker fuer alle OEFFENTLICHEN Routes (Homepage, /agency, /join etc.).
// Skip: /portal/*, /api/*, /studio, /_next, /admin (= alle internen/Asset-Pfade).
// Mountet im RootLayout - feuert public_page_view bei Pfadwechsel.
//
// Marketing-Metadata:
//   - locale: zoe_public_lang Cookie
//   - referrer: document.referrer (nur bei initial Page-Load wertvoll)
//   - utm_*: aus aktueller URL-Query (sticky innerhalb der Session-Lifetime
//     waere komplexer; wir tracken pro Page-View die aktuell sichtbare URL)
//
// Spezial-Hook: /join → zusaetzlich join_open Event fuer Funnel-Tracking.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_COOKIE = "zoe_session_id";
const LOCALE_COOKIE  = "zoe_public_lang";
const SESSION_TTL_DAYS = 365;

const SKIP_PREFIXES = ["/portal", "/api", "/studio", "/_next", "/admin", "/share"];
const SKIP_EXACT = ["/sitemap.xml", "/robots.txt"];

function shouldSkip(pathname: string): boolean {
  if (SKIP_EXACT.includes(pathname)) return true;
  for (const p of SKIP_PREFIXES) {
    if (pathname === p || pathname.startsWith(p + "/")) return true;
  }
  return false;
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? decodeURIComponent(m[1]) : null;
}

function getOrCreateSessionId(): string {
  if (typeof document === "undefined") return "";
  const existing = readCookie(SESSION_COOKIE);
  if (existing) return existing;
  const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const exp = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE}=${id}; expires=${exp}; path=/; SameSite=Lax`;
  return id;
}

interface FirePayload {
  event_type: string;
  path: string;
  session_id: string;
  locale: string | null;
  referrer: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

function fire(p: FirePayload) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(p),
    keepalive: true,
  }).catch(() => { /* silent */ });
}

export function PublicAnalyticsTracker() {
  const pathname = usePathname();

  // UTM lesen wir client-side direkt aus window.location.search statt aus
  // useSearchParams() - useSearchParams zwingt sonst alle statisch
  // gerenderten Pages in CSR-Bailout (Next-Build-Fail bei /about etc.).
  useEffect(() => {
    if (!pathname || shouldSkip(pathname)) return;
    const session_id = getOrCreateSessionId();
    const locale     = readCookie(LOCALE_COOKIE);
    const referrer   = typeof document !== "undefined" ? (document.referrer || null) : null;

    const sp = typeof window !== "undefined"
      ? new URLSearchParams(window.location.search)
      : null;
    const utm_source   = sp?.get("utm_source")   ?? null;
    const utm_medium   = sp?.get("utm_medium")   ?? null;
    const utm_campaign = sp?.get("utm_campaign") ?? null;
    const utm_content  = sp?.get("utm_content")  ?? null;
    const utm_term     = sp?.get("utm_term")     ?? null;

    const base = {
      path: pathname, session_id, locale, referrer,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
    };

    fire({ event_type: "public_page_view", ...base });
    if (pathname === "/join") {
      fire({ event_type: "join_open", ...base });
    }
  }, [pathname]);

  return null;
}
