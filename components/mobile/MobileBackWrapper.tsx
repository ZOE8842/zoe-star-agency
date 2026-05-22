"use client";

import { useEffect, useRef, useCallback, useState, ReactNode } from "react";
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
  const currentDragX = useRef<number>(0);  // ref-mirror für onTouchEnd
  const [dragX, setDragX] = useState(0);   // state für Re-Render der Page-Transform

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
      if (t.clientX < 35) {
        startX.current = t.clientX;
        startY.current = t.clientY;
        startT.current = Date.now();
        currentDragX.current = 0;
      } else {
        startX.current = null;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (startX.current === null) return;
      const t = e.touches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
      const dy = t.clientY - (startY.current ?? 0);
      // Nur rechts-Drag UND deutlich horizontal
      if (dx > 0 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        const clamped = Math.min(dx, 400);
        currentDragX.current = clamped;
        setDragX(clamped);
      }
    };

    const onTouchEnd = () => {
      if (startX.current === null) {
        if (currentDragX.current !== 0) {
          currentDragX.current = 0;
          setDragX(0);
        }
        return;
      }
      const dt = Date.now() - startT.current;
      const finalDx = currentDragX.current;
      startX.current = null;
      startY.current = null;
      currentDragX.current = 0;
      // Trigger wenn >100px ODER schnelle Bewegung (>0.5 px/ms) + >60px
      const fastSwipe = dt > 0 && finalDx / dt > 0.5 && finalDx > 60;
      if (finalDx > 100 || fastSwipe) {
        // Page zieht visuell weiter raus während router back lädt
        setDragX(window.innerWidth);
        setTimeout(() => {
          goBack();
        }, 50);
      } else {
        setDragX(0);
      }
    };

    const onTouchCancel = () => {
      startX.current = null;
      startY.current = null;
      currentDragX.current = 0;
      setDragX(0);
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    document.addEventListener("touchcancel", onTouchCancel, { passive: true });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
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

      {/* Edge-Indicator wenn Drag aktiv */}
      {dragX > 10 && (
        <div
          aria-hidden
          className="md:hidden fixed top-1/2 left-2 z-[60] text-champagne/80 text-2xl pointer-events-none -translate-y-1/2"
          style={{ opacity: Math.min(1, dragX / 100) }}
        >
          ←
        </div>
      )}

      {/* Children-Wrapper · folgt dem Finger live, snap-back ohne Trigger */}
      <div
        style={{
          transform: dragX > 0 ? `translateX(${dragX}px)` : undefined,
          transition: dragX > 0 ? "none" : "transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
          opacity: dragX > 0 ? Math.max(0.45, 1 - dragX / 600) : 1,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </>
  );
}
