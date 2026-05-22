"use client";

import { useEffect, useRef, useCallback, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface Props {
  /** Wo hin springen wenn keine Browser-History vorhanden ist */
  fallbackHref?: string;
  /** Label für den sichtbaren Back-Button (Mobile) */
  label?: string;
  /** Komplette Page-Inhalte */
  children: ReactNode;
}

/**
 * MobileBackWrapper · iOS-PWA / Android-Mobile-Back-Lösung
 *
 * Liefert zwei UX-Pfade zurück:
 *  1. Sichtbarer Back-Button (groß, oben links, nur Mobile · md:hidden)
 *  2. Edge-Swipe vom linken Screen-Rand → router.back()
 *
 * - Edge-Threshold: Touch muss bei x < 25 px starten
 * - Swipe-Threshold: dx > 80 px UND |dx| > |dy|*2 (klar horizontal)
 * - Timer-Threshold: dt < 800 ms (= klare Geste, kein Slow-Drag)
 * - Passive Touch-Listeners → kein Konflikt mit Scroll
 * - Mobile-only (button md:hidden + Swipe wirkt auch Desktop nicht
 *   weil Maus keine touchstart-Events feuert)
 *
 * Fallback wenn window.history.length <= 1:
 *   router.push(fallbackHref)
 */
export function MobileBackWrapper({
  fallbackHref = "/portal/admin",
  label = "Zurück",
  children,
}: Props) {
  const router = useRouter();
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startT = useRef<number>(0);

  const goBack = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  }, [router, fallbackHref]);

  useEffect(() => {
    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      // Edge-Zone erweitert auf 35px (vorher 25)
      if (t.clientX < 35) {
        startX.current = t.clientX;
        startY.current = t.clientY;
        startT.current = Date.now();
      } else {
        startX.current = null;
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (startX.current === null) return;
      const end = e.changedTouches[0];
      if (!end) {
        startX.current = null;
        return;
      }
      const dx = end.clientX - startX.current;
      const dy = end.clientY - (startY.current ?? 0);
      const dt = Date.now() - startT.current;
      const sx = startX.current;
      startX.current = null;
      startY.current = null;
      // Weichere Thresholds:
      //   dx > 60 (vorher 80) · schnellere Reaktion
      //   |dx| > |dy| * 1.2 (vorher × 2) · toleranter bei leicht diagonalen Wischen
      //   dt < 1200 (vorher 800) · auch langsamere Gesten akzeptieren
      //   sx < 35 · Edge-Start bestätigt
      if (sx < 35 && dx > 60 && Math.abs(dx) > Math.abs(dy) * 1.2 && dt < 1200) {
        goBack();
      }
    };

    const onTouchCancel = () => {
      startX.current = null;
      startY.current = null;
    };

    // Listener auf document statt window · greift auch in nested scroll containers
    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
      document.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [goBack]);

  return (
    <>
      {/* Sichtbarer Back-Button · nur Mobile */}
      <button
        onClick={goBack}
        type="button"
        className="md:hidden inline-flex items-center gap-2 text-cream/85 hover:text-cream active:opacity-60 py-2 px-3 -ml-3 mb-2 transition-opacity"
        aria-label="Zurück"
      >
        <span className="text-champagne text-base leading-none">←</span>
        <span className="text-[11px] uppercase tracking-[0.22em]">{label}</span>
      </button>

      {/* Unsichtbare Edge-Detector-Zone · fixed am linken Viewport-Rand
          Greift auch wenn Page ganz unten gescrollt ist · z-Index hoch
          aber unter modaler Overlays. touchAction: pan-y damit vertikales
          Scroll-Through nicht blockiert wird. */}
      <div
        aria-hidden
        className="md:hidden fixed top-0 left-0 h-[100dvh] w-[35px] z-[40] pointer-events-none"
        style={{ touchAction: "pan-y" }}
      />

      {children}
    </>
  );
}
