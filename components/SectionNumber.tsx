// SectionNumber — gigantic outline-only edition-marker.
// Atmospheric layer hinter Section-Headlines. KEINE Information,
// nur atmosphäre. Subtil, opacity ~0.10, champagne stroke 2px.

interface Props {
  number: string;
  className?: string;
  rotation?: number;
  /** "ink" stroke champagne (auf Schwarz) | "cream" stroke ink (auf Cream) */
  variant?: "ink" | "cream";
}

export function SectionNumber({
  number,
  className = "",
  rotation = 0,
  variant = "ink",
}: Props) {
  const stroke = variant === "cream" ? "rgb(10, 10, 10)" : "rgb(201, 168, 106)";
  const opacity = variant === "cream" ? 0.08 : 0.10;
  return (
    <span
      aria-hidden
      className={`pointer-events-none select-none font-display italic font-black leading-none whitespace-nowrap ${className}`}
      style={{
        WebkitTextStrokeWidth: "1.5px",
        WebkitTextStrokeColor: stroke,
        color: "transparent",
        opacity,
        transform: `rotate(${rotation}deg)`,
      }}
    >
      {number}
    </span>
  );
}
