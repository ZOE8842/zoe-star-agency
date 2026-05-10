"use client";

// HeroParallax v8 — passiver Scroll-Listener, RAF-throttled +
// IntersectionObserver fuer Battery-Pause wenn Hero out-of-view.
//
// Setzt drei CSS-Variablen auf dem Wrapper:
//   --hero-scroll-y    0..1     Scroll-Progress (fuer Parallax-Tiers)
//   --hero-anim-state  running|paused (atmosphere-Layer aus wenn unsichtbar)
//
// Mobile reduziert Parallax-Distanz via media-query in globals.css.
// prefers-reduced-motion: gar kein Listener, gar keine Bewegung,
// alle Atmosphere-Animationen via @media in CSS deaktiviert.

import { useEffect, useRef, type ReactNode } from "react";

interface HeroParallaxProps {
  children: ReactNode;
}

export function HeroParallax({ children }: HeroParallaxProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof window === "undefined") return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    let raf = 0;
    let pending = false;

    const update = () => {
      pending = false;
      const rect = el.getBoundingClientRect();
      const total = rect.height || 1;
      const progress = Math.max(0, Math.min(1, -rect.top / total));
      el.style.setProperty("--hero-scroll-y", progress.toFixed(3));
    };

    const onScroll = () => {
      if (pending) return;
      pending = true;
      raf = window.requestAnimationFrame(update);
    };

    // Battery-Saving: pausiert alle Atmosphere-Anims wenn Hero unsichtbar.
    let observer: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            el.style.setProperty(
              "--hero-anim-state",
              entry.isIntersecting ? "running" : "paused",
            );
          }
        },
        { rootMargin: "0px", threshold: 0 },
      );
      observer.observe(el);
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      if (observer) observer.disconnect();
    };
  }, []);

  return (
    <div ref={ref} className="hero-parallax-root">
      {children}
    </div>
  );
}
