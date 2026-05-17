import Link from "next/link";
import type { QueueItem } from "@/lib/dashboard/aggregator";
import { loadLocale } from "@/lib/i18n";

const URGENCY_TONE: Record<QueueItem["urgency"], string> = {
  now: "border-l-2 border-champagne",
  soon: "border-l-2 border-champagne/50",
  info: "border-l-2 border-cream/15",
};

export async function TodayQueue({ items }: { items: QueueItem[] }) {
  const { t } = await loadLocale();
  const title = t("dashboard.today_queue_title");
  const empty = t("dashboard.empty_no_queue");

  if (items.length === 0) {
    return (
      <section className="mb-12 md:mb-16">
        <div className="flex items-baseline justify-between mb-5">
          <p className="eyebrow">{title}</p>
        </div>
        <div className="border border-champagne/15 p-6 md:p-7">
          <p className="font-display italic text-cream/45 text-xl">{empty}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">{title}</p>
        <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
          {items.length}
        </span>
      </div>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.id}>
            <Link
              href={item.href}
              className={`group block bg-champagne/[0.02] hover:bg-champagne/5 ${URGENCY_TONE[item.urgency]} pl-5 pr-4 py-4 md:py-5 transition-colors`}
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-1">
                    {item.eyebrow}
                  </p>
                  <p className="text-cream text-base md:text-lg leading-tight group-hover:text-champagne transition-colors">
                    {item.headline}
                  </p>
                </div>
                <div className="flex items-baseline gap-3 shrink-0">
                  {item.hint && (
                    <span className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                      {item.hint}
                    </span>
                  )}
                  <span className="text-champagne/60 group-hover:text-champagne group-hover:translate-x-0.5 transition-all">→</span>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
