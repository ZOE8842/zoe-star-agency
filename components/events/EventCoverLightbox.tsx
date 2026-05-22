"use client";

import { useEffect, useState } from "react";

interface Props {
  src: string;
  alt?: string;
}

/**
 * Event-Cover · klickbar mit Lightbox.
 * - Thumb: object-contain auf dunklem Background (kein Cropping)
 * - Click → Fullscreen-Overlay, dort overflow-auto · zoom via pinch/scroll
 * - Close: X, ESC, Klick außerhalb des Bildes
 */
export function EventCoverLightbox({ src, alt = "" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    // Body-Scroll-Lock
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Bild groß öffnen"
        className="block w-full border border-champagne/15 mb-8 bg-black/40 active:opacity-80 hover:border-champagne/40 transition-all cursor-pointer relative group"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="w-full h-auto max-h-[70vh] object-contain mx-auto"
        />
        {/* Click-Hint Badge · zeigt Tappability */}
        <span className="absolute top-2 right-2 text-[10px] uppercase tracking-[0.2em] px-2 py-1 bg-black/70 border border-champagne/40 text-champagne/85 group-hover:bg-black/90">
          🔍 Vollbild
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[9999] bg-black/95 flex items-start justify-center overflow-auto"
          onClick={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(false); }}
            aria-label="Schließen"
            className="fixed top-4 right-4 z-[10000] w-11 h-11 inline-flex items-center justify-center text-champagne text-3xl leading-none bg-black/60 border border-champagne/40 rounded-full active:opacity-70"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            onClick={(e) => e.stopPropagation()}
            className="max-w-none w-auto h-auto md:max-w-[95vw] md:max-h-[95vh] m-auto"
            style={{ touchAction: "pinch-zoom" }}
          />
        </div>
      )}
    </>
  );
}
