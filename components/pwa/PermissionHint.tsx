"use client";

// Dezente Permission-Karte fuer Push-Notifications.
// Nur sichtbar wenn:
//   - mobile (md:hidden)
//   - Service-Worker + Push verfuegbar
//   - Notification.permission === "default" (noch nie gefragt)
//   - User eingeloggt
//   - Nicht zuvor dismissed (localStorage v1)
//   - 4s Delay nach Mount (nicht aufdringlich)
//
// Klick "Aktivieren" -> Notification.requestPermission() + Subscribe via
// derselben Logik wie PushSetup. Klick "Spaeter" -> dismiss persistent.

import { useEffect, useState } from "react";

const STORAGE_KEY = "zoe_push_hint_dismissed_v1";
const SHOW_DELAY_MS = 4000;

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(b64: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (b64.length % 4)) % 4);
  const base64 = (b64 + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

interface Props {
  /** Nur eingeloggte User bekommen den Hint */
  loggedIn?: boolean;
}

export function PermissionHint({ loggedIn }: Props) {
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loggedIn) return;
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;
    if (typeof Notification === "undefined") return;
    if (Notification.permission !== "default") return;
    try { if (localStorage.getItem(STORAGE_KEY) === "1") return; } catch { /* ignore */ }

    const timer = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, [loggedIn]);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  }

  async function enable() {
    if (busy) return;
    setBusy(true);
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") { dismiss(); return; }
      if (!VAPID_PUBLIC_KEY) { dismiss(); return; }

      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sub.toJSON()),
      });
    } catch (e) {
      console.warn("[push hint] enable failed", e instanceof Error ? e.message : e);
    } finally {
      setBusy(false);
      setShow(false);
    }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden pointer-events-none">
      <div
        role="region"
        aria-label="Push-Mitteilungen aktivieren"
        className="pointer-events-auto border border-champagne/30 bg-ink/95 backdrop-blur-sm shadow-2xl px-4 py-3 flex items-start gap-3"
      >
        <div className="flex-1 text-cream/90 text-xs leading-snug">
          <p className="font-display italic text-sm text-champagne mb-1">
            Bleib auf dem Laufenden
          </p>
          <p>Push aktivieren fuer Nachrichten, Ranking + Analyse.</p>
        </div>
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={enable}
            disabled={busy}
            className="px-3 py-1.5 border border-champagne text-champagne text-[10px] uppercase tracking-[0.2em] hover:bg-champagne/10 transition-colors disabled:opacity-50"
          >
            {busy ? "..." : "Aktivieren"}
          </button>
          <button
            onClick={dismiss}
            className="px-3 py-1 text-cream/50 hover:text-cream text-[10px] uppercase tracking-[0.2em]"
          >
            Spaeter
          </button>
        </div>
      </div>
    </div>
  );
}
