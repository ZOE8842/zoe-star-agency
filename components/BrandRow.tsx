// BrandRow — Trust-Element: Sektoren / Brand-Placeholder
// Bevor echte Brand-Logos da sind, zeigen wir Sektor-Kategorien.
// Mobile: horizontal-scroll. Desktop: grid 4-6 cols.

interface BrandRowProps {
  items?: string[];
  caption?: string;
  className?: string;
}

const DEFAULT_ITEMS = ["Beauty", "Fashion", "Lifestyle", "Tech", "Food", "Travel"];

export function BrandRow({
  items = DEFAULT_ITEMS,
  caption = "Erste Kohorte",
  className = "",
}: BrandRowProps) {
  return (
    <div className={className}>
      {caption && (
        <p className="eyebrow mb-4 md:mb-5">{caption}</p>
      )}
      <div className="flex md:grid md:grid-cols-6 gap-3 md:gap-4 overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0 md:overflow-visible no-scrollbar pb-1">
        {items.map((label) => (
          <div
            key={label}
            className="shrink-0 md:shrink min-w-[120px] border border-champagne/15 px-4 py-5 md:py-6 text-center hover:border-champagne/40 transition-colors"
          >
            <p className="text-cream/60 text-xs md:text-sm uppercase tracking-[0.2em]">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
