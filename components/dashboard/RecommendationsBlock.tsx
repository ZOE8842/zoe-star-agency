import Link from "next/link";
import type { Recommendation } from "@/lib/dashboard/aggregator";
import { loadLocale } from "@/lib/i18n";

export async function RecommendationsBlock({ items }: { items: Recommendation[] }) {
  if (items.length === 0) return null;
  const { t } = await loadLocale();

  return (
    <section className="mb-12 md:mb-16">
      <p className="eyebrow mb-5">{t("dashboard.recommendations_title")}</p>
      <ul className="grid md:grid-cols-2 gap-3 md:gap-4">
        {items.map((r) => (
          <li key={r.id}>
            <Link
              href={r.href}
              className="block border border-champagne/15 hover:border-champagne/50 hover:bg-champagne/5 p-5 md:p-6 transition-colors group"
            >
              <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">
                {r.eyebrow}
              </p>
              <p className="font-display italic text-cream text-xl md:text-2xl leading-tight mb-2 group-hover:text-champagne transition-colors">
                {r.headline}
              </p>
              <p className="text-cream/55 text-sm leading-relaxed">
                {r.body}
              </p>
              <p className="text-champagne/70 text-[10px] uppercase tracking-[0.25em] mt-4 group-hover:translate-x-0.5 transition-transform">
                Ansehen →
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
