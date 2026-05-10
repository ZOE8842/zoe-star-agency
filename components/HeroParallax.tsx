"use client";

// HeroParallax — passiver Scroll-Listener, RAF-throttled.
// Setzt --hero-scroll-y (0..1) auf dem Wrapper-Element waehrend der
// Hero-Bereich im Viewport ist. CSS nutzt die Variable fuer dezente
// Y-Translation auf .hero-glow-mesh. Mobile reduziert via media-query.
// prefers-reduced-motion: kein Listener, keine Bewegung.

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

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div ref={ref} className="hero-parallax-root">
      {children}
    </div>
  );
}
