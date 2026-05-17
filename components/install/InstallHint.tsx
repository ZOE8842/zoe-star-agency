"use client";

// Mobile-only Hinweis-Karte zum Hinzufuegen der ZOE-Webapp zum Homescreen.
// - Erscheint erst 8s nach Mount (nicht aufdringlich)
// - Erscheint nicht in der installierten PWA (display-mode standalone)
// - Erscheint nur auf iOS und Android (UA-Check)
// - Dismiss persistiert in localStorage, kommt nicht wieder
// - Plattform-spezifische Anleitung (Safari Share vs Chrome Install)
// - Bottom-Card mit Burgund-Accent, kein Modal-Spam

import { useEffect, useState } from "react";

const STORAGE_KEY = "zoe_install_hint_dismissed_v1";
const SHOW_DELAY_MS = 8000;

function detectPlatform(): "ios" | "android" | "other" {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent.toLowerCase();
  if (/iphone|ipad|ipod/.test(ua)) return "ios";
  if (/android/.test(ua)) return "android";
  return "other";
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  if (window.matchMedia("(display-mode: standalone)").matches) return true;
  // iOS-Spezial: navigator.standalone (kein Standard, nur Safari)
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return nav.standalone === true;
}

export function InstallHint() {
  const [show, setShow] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    if (isStandalone()) return;
    try { if (localStorage.getItem(STORAGE_KEY) === "1") return; } catch { /* ignore */ }
    const p = detectPlatform();
    if (p === "other") return;
    setPlatform(p);
    const timer = setTimeout(() => setShow(true), SHOW_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  function dismiss() {
    setShow(false);
    try { localStorage.setItem(STORAGE_KEY, "1"); } catch { /* ignore */ }
  }

  if (!show) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:hidden pointer-events-none">
      <div
        role="region"
        aria-label="ZOE Star Agency als App speichern"
        className="pointer-events-auto border border-champagne/30 bg-ink/95 backdrop-blur-sm shadow-2xl px-4 py-3 flex items-start gap-3"
      >
        <div className="flex-1 text-cream/90 text-xs leading-snug">
          <p className="font-display italic text-sm text-champagne mb-1">
            ZOE⭐ als App speichern
          </p>
          <p>
            {platform === "ios"
              ? "Safari → Teilen → „Zum Home-Bildschirm“"
              : "Chrome-Menue → „Installieren“ oder „Zum Startbildschirm“"}
          </p>
        </div>
        <button
          onClick={dismiss}
          className="text-cream/50 hover:text-cream text-base leading-none px-2 py-0.5 -mt-0.5"
          aria-label="Hinweis schliessen"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
