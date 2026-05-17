"use client";

// Auto-Tracker fuer alle OEFFENTLICHEN Routes (Homepage, /agency, /join etc.).
// Skip: /portal/*, /api/*, /studio, /_next, /admin (= alle internen/Asset-Pfade).
// Mountet im RootLayout - feuert public_page_view bei Pfadwechsel.
//
// Spezial-Hook: /join → zusaetzlich join_open Event fuer Funnel-Tracking.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_COOKIE = "zoe_session_id";
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

function getOrCreateSessionId(): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|;\\s*)${SESSION_COOKIE}=([^;]+)`));
  if (m) return m[1];
  const id = (typeof crypto !== "undefined" && "randomUUID" in crypto)
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36);
  const exp = new Date(Date.now() + SESSION_TTL_DAYS * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${SESSION_COOKIE}=${id}; expires=${exp}; path=/; SameSite=Lax`;
  return id;
}

function fire(event_type: string, path: string, session_id: string) {
  fetch("/api/analytics/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event_type, path, session_id }),
    keepalive: true,
  }).catch(() => { /* silent */ });
}

export function PublicAnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || shouldSkip(pathname)) return;
    const session_id = getOrCreateSessionId();
    fire("public_page_view", pathname, session_id);
    // Funnel-Spezial: /join zaehlt auch als join_open (eigenes Event)
    if (pathname === "/join") {
      fire("join_open", pathname, session_id);
    }
  }, [pathname]);

  return null;
}
