import Link from "next/link";
import type { Warning } from "@/lib/dashboard/aggregator";

const SEVERITY_STYLE: Record<Warning["severity"], string> = {
  high: "border border-red-400/40 bg-red-400/[0.04]",
  medium: "border border-champagne/40 bg-champagne/[0.04]",
};

const SEVERITY_HEADLINE: Record<Warning["severity"], string> = {
  high: "text-red-300",
  medium: "text-champagne",
};

const SEVERITY_LABEL: Record<Warning["severity"], string> = {
  high: "Wichtig",
  medium: "Hinweis",
};

export function WarningsBlock({ items }: { items: Warning[] }) {
  if (items.length === 0) return null;

  return (
    <section className="mb-10 md:mb-12">
      <p className="eyebrow mb-4">Achtung</p>
      <ul className="space-y-3">
        {items.map((w) => (
          <li key={w.id}>
            <Link
              href={w.href}
              className={`${SEVERITY_STYLE[w.severity]} block p-5 md:p-6 hover:border-champagne transition-colors group`}
            >
              <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                <p className={`font-display italic text-lg md:text-xl ${SEVERITY_HEADLINE[w.severity]}`}>
                  {w.headline}
                </p>
                <span className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                  {SEVERITY_LABEL[w.severity]}
                </span>
              </div>
              <p className="text-cream/70 text-sm leading-relaxed mb-2">
                {w.body}
              </p>
              <p className="text-champagne text-[10px] uppercase tracking-[0.25em] group-hover:translate-x-0.5 transition-transform">
                Jetzt regeln →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
