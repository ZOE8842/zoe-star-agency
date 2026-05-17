"use client";

// Badge-Sync: liest unread-count vom Backend und setzt navigator.setAppBadge.
// Trigger:
//   - bei Mount (Page-Load)
//   - bei window.onfocus (User kommt zurueck)
//   - poll alle 60s wenn Tab sichtbar
//
// Skip wenn:
//   - kein eingeloggter User
//   - Browser hat keinen Badge-Support
//
// Fail-silent: keine User-sichtbaren Errors, alles in console.warn.

import { useEffect, useRef } from "react";

const POLL_MS = 60_000;

interface Props {
  loggedIn?: boolean;
}

export function BadgeSync({ loggedIn }: Props) {
  const lastSyncRef = useRef<number>(0);

  useEffect(() => {
    if (!loggedIn) return;
    if (typeof navigator === "undefined") return;
    const hasBadge = "setAppBadge" in navigator;
    if (!hasBadge) return; // Browser ohne Badge-API → silent skip

    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    async function syncBadge() {
      if (cancelled) return;
      // throttle: maximal alle 5s
      const now = Date.now();
      if (now - lastSyncRef.current < 5000) return;
      lastSyncRef.current = now;
      try {
        const r = await fetch("/api/notifications/list?limit=1", { credentials: "include" });
        if (!r.ok) return;
        const json = (await r.json()) as { unread?: number };
        const n = typeof json.unread === "number" ? json.unread : 0;
        const nav = navigator as Navigator & {
          setAppBadge?: (n?: number) => Promise<void>;
          clearAppBadge?: () => Promise<void>;
        };
        if (n > 0) await nav.setAppBadge?.(n);
        else       await nav.clearAppBadge?.();
      } catch { /* silent */ }
    }

    void syncBadge();
    function onFocus() { void syncBadge(); }
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void syncBadge();
    });
    intervalId = setInterval(() => {
      if (document.visibilityState === "visible") void syncBadge();
    }, POLL_MS);

    return () => {
      cancelled = true;
      window.removeEventListener("focus", onFocus);
      if (intervalId) clearInterval(intervalId);
    };
  }, [loggedIn]);

  return null;
}
