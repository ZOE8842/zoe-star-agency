// StatsRow — Trust-Element: 3-4 stilvolle Stats
// Wenn echte Zahlen vorliegen → einsetzen. Sonst stilvolle Phase-Indikatoren
// (KEINE erfundenen Reach-/Follower-Zahlen, das wirkt fake).

interface Stat {
  label: string;
  value: string;
  hint?: string;
}

interface StatsRowProps {
  items?: Stat[];
  className?: string;
}

const DEFAULT_STATS: Stat[] = [
  { label: "Phase", value: "01", hint: "Soft-Launch · 2026" },
  { label: "Roster", value: "Aufbau", hint: "Erste Welle" },
  { label: "Standort", value: "Berlin", hint: "Europe-EU" },
  { label: "Modell", value: "Boutique", hint: "Hand-picked" },
];

export function StatsRow({ items = DEFAULT_STATS, className = "" }: StatsRowProps) {
  return (
    <div className={`grid grid-cols-2 md:grid-cols-4 gap-px bg-champagne/15 ${className}`}>
      {items.map((s, i) => (
        <div key={i} className="bg-ink p-5 md:p-6">
          <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">{s.label}</p>
          <p className="font-display italic text-champagne text-3xl md:text-4xl leading-none mb-2">
            {s.value}
          </p>
          {s.hint && (
            <p className="text-cream/40 text-xs leading-tight">{s.hint}</p>
          )}
        </div>
      ))}
    </div>
  );
}
