// MarqueeTrenner — Section-Divider mit Marquee, full-width.
// "ink" für Schwarz-BG, "cream" für Cream-BG.
// Sparsam einsetzen — max 1 sichtbar gleichzeitig.

import { Marquee } from "./Marquee";

interface Props {
  items: React.ReactNode[];
  variant?: "ink" | "cream";
  className?: string;
}

export function MarqueeTrenner({ items, variant = "ink", className = "" }: Props) {
  const bg = variant === "cream"
    ? "bg-cream text-ink border-y border-ink/10"
    : "bg-ink text-cream border-y border-champagne/15";
  return (
    <div className={`${bg} py-4 md:py-5 ${className}`}>
      <Marquee items={items} separatorStyle="dot" />
    </div>
  );
}
