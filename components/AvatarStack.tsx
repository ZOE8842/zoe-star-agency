// AvatarStack — Trust-Element fuer Public + Portal
// Zeigt 5-7 ueberlappende Initial-Circles in Champagne-Tones,
// optional Caption rechts ("Roster im Aufbau" / "{N}+ Creator").
// Ohne echte Photos (kommen mit Brand-Shoot).

interface AvatarStackProps {
  items?: { initial: string; tone?: "light" | "mid" | "deep" }[];
  caption?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DEFAULT_STACK: { initial: string; tone?: "light" | "mid" | "deep" }[] = [
  { initial: "N", tone: "deep" },
  { initial: "B", tone: "mid" },
  { initial: "K", tone: "light" },
  { initial: "A", tone: "deep" },
  { initial: "Y", tone: "mid" },
];

const SIZE_MAP = {
  sm: "w-8 h-8 text-xs -ml-2 first:ml-0",
  md: "w-11 h-11 text-sm -ml-3 first:ml-0",
  lg: "w-14 h-14 text-base -ml-4 first:ml-0",
};

const TONE_MAP = {
  light: "bg-champagne/20 border-champagne/50 text-champagne",
  mid:   "bg-champagne/35 border-champagne/70 text-ink",
  deep:  "bg-champagne border-champagne text-ink",
};

export function AvatarStack({
  items = DEFAULT_STACK,
  caption,
  size = "md",
  className = "",
}: AvatarStackProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="flex">
        {items.map((it, i) => (
          <div
            key={i}
            className={`${SIZE_MAP[size]} rounded-full border flex items-center justify-center font-display italic font-bold ${TONE_MAP[it.tone || "mid"]}`}
            style={{ zIndex: items.length - i }}
            aria-hidden
          >
            {it.initial}
          </div>
        ))}
      </div>
      {caption && (
        <div className="min-w-0">
          <p className="text-cream/70 text-sm md:text-[15px] leading-tight">{caption}</p>
        </div>
      )}
    </div>
  );
}
