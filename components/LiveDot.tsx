// LiveDot — pulsing champagne-dot mit optional caption.
// Gentle 2.4s ease-out pulse, kein Neon, kein flackern.

interface LiveDotProps {
  label?: string;
  /** Sub-text rechts vom Label, zB "Berlin · 2026" */
  meta?: string;
  className?: string;
}

export function LiveDot({ label = "Live now", meta, className = "" }: LiveDotProps) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className="live-dot" aria-hidden />
      <span className="text-champagne text-[10px] uppercase tracking-[0.3em] font-medium">
        {label}
      </span>
      {meta && (
        <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em]">
          {meta}
        </span>
      )}
    </span>
  );
}
