"use client";

// Push-Setup-Client. Registriert Service Worker, verwaltet Permission-Flow,
// synct subscription mit Backend. Mountet sich automatisch im Layout (still),
// rendert NULL UI. Die optionale Permission-Karte ist eine separate Komponente.
//
// Flow:
// 1) Service-Worker registrieren (sw.js)
// 2) Wenn User eingeloggt + Permission=granted + noch keine Subscription
//    -> Subscribe + POST an /api/push/subscribe
// 3) Wenn Permission=denied -> nichts tun (kein erneutes Fragen)
// 4) Wenn Permission=default -> warten auf explizite User-Geste (PermissionHint)
//
// Browser-Support:
// - Chrome/Android: full Push + Badge
// - Safari/iOS: Push nur fuer installierte PWA (iOS 16.4+)
// - Desktop Safari: Push funktional, aber Standalone-Constraint variabel

import { useEffect } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  // Explicit ArrayBuffer-Backend vermeidet TS-Mismatch mit SharedArrayBuffer
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

interface PushSetupProps {
  /** Nur wenn true wird automatisch subscribed wenn Permission=granted */
  loggedIn?: boolean;
}

export function PushSetup({ loggedIn }: PushSetupProps) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    if (!("PushManager" in window)) return;

    let aborted = false;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        if (aborted) return;
        if (!loggedIn) return;
        if (!VAPID_PUBLIC_KEY) {
          console.warn("[push] NEXT_PUBLIC_VAPID_PUBLIC_KEY fehlt — Subscribe deaktiviert");
          return;
        }
        if (Notification.permission !== "granted") return;

        const existing = await reg.pushManager.getSubscription();
        if (existing) return; // schon synct

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
        });
        if (aborted) return;

        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(sub.toJSON()),
        });
      } catch (e) {
        console.warn("[push] setup failed", e instanceof Error ? e.message : e);
      }
    })();

    return () => { aborted = true; };
  }, [loggedIn]);

  return null;
}
