"use client";

import { createElement, useEffect, useRef, useState, type ReactNode } from "react";

// MotionReveal — pure CSS + IntersectionObserver (kein framer-motion).
// Audit P3-11: Public-Pages laden jetzt KEIN framer-motion Bundle mehr.
// Verhalten identisch zur framer-motion-Variante:
//   - initial opacity-0 + translate-y-4
//   - bei Viewport-Enter (20% sichtbar) → opacity-1 + translate-y-0
//   - prefers-reduced-motion respektiert (sofort sichtbar)
//   - delay konfigurierbar
//   - viewport: once (eintritt einmalig)

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "h1" | "h2" | "p";
}

export function MotionReveal({ children, delay = 0, className = "", as = "div" }: Props) {
  const ref = useRef<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && typeof window.matchMedia === "function") {
      setReduced(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => {
    if (reduced) {
      setVisible(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [reduced]);

  const style: React.CSSProperties = reduced
    ? {}
    : {
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(16px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s`,
        willChange: visible ? "auto" : "opacity, transform",
      };

  return createElement(as, { ref, className, style }, children);
}

interface StaggerProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function MotionStagger({ children, staggerDelay = 0.08, className }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <MotionReveal key={i} delay={i * staggerDelay}>
          {child}
        </MotionReveal>
      ))}
    </div>
  );
}
