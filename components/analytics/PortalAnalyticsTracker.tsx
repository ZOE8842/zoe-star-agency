"use client";

// Auto-Tracker fuer Portal-Page-Views.
// Mounts auf jeder Portal-Seite (via Layout) und sendet beim Pfadwechsel
// einen page_view-Event. Dedupe via session_id (cookie) + Server-Window.

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const SESSION_COOKIE = "zoe_session_id";
const SESSION_TTL_DAYS = 365;

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

interface Props {
  eventType?: "page_view" | "portal_open" | "admin_open" | "creator_dashboard_open";
  fireOnce?: boolean;
}

export function PortalAnalyticsTracker({ eventType = "page_view", fireOnce = false }: Props) {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    const session_id = getOrCreateSessionId();
    const payload = { event_type: eventType, path: pathname, session_id };
    // beacon-style (fire-and-forget, kein await)
    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => { /* silent */ });
    // fireOnce: nur 1x pro Mount (nicht bei jedem Pfadwechsel)
    // (Standard-Hook reagiert bei jedem Pfadwechsel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, fireOnce ? [] : [pathname, eventType]);

  return null;
}
