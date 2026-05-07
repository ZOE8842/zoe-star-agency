// Marquee — kontinuierlicher Lauftext, langsam + elegant.
// Zwei Tracks duplicate-rendered → seamless loop.
// Pause on hover. prefers-reduced-motion respected.

import React from "react";

interface MarqueeProps {
  items: React.ReactNode[];
  className?: string;
  separator?: React.ReactNode;
  /** Trennzeichen-Style. "dot" = champagne-dot, "slash" = "·" */
  separatorStyle?: "dot" | "slash" | "none";
}

export function Marquee({
  items,
  className = "",
  separator,
  separatorStyle = "dot",
}: MarqueeProps) {
  const sep =
    separator ??
    (separatorStyle === "dot" ? (
      <span className="inline-block w-1 h-1 rounded-full bg-champagne/50 align-middle" aria-hidden />
    ) : separatorStyle === "slash" ? (
      <span className="text-champagne/40" aria-hidden>·</span>
    ) : null);

  // Doppelter Track fuer seamless loop
  const renderTrack = (key: string) => (
    <div key={key} className="marquee-track items-center" aria-hidden={key === "b"}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          <span className="inline-flex items-center gap-3 whitespace-nowrap">{item}</span>
          {sep && <span className="inline-flex items-center" aria-hidden>{sep}</span>}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div className={`marquee ${className}`}>
      {renderTrack("a")}
      {renderTrack("b")}
    </div>
  );
}
