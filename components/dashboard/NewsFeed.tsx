import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

// Dashboard-News-Feed — zeigt Birthday-Reminders, Creator-Joins, System-Hinweise.
// Sichtbar fuer Creator + Admin + Manager. Datenquelle: dashboard_news.

interface NewsRow {
  id: string;
  type: "birthday_today" | "birthday_tomorrow" | "creator_joined" | "event" | "system";
  title: string;
  body: string | null;
  profile_id: string | null;
  tiktok_username: string | null;
  tiktok_url: string | null;
  visible_from: string;
  visible_until: string | null;
  created_at: string;
}

const TYPE_TONE: Record<NewsRow["type"], string> = {
  birthday_today: "border-champagne/40 bg-champagne/[0.04]",
  birthday_tomorrow: "border-champagne/25",
  creator_joined: "border-champagne/30 bg-champagne/[0.02]",
  event: "border-blue-400/30 bg-blue-400/[0.03]",
  system: "border-cream/15",
};

function relativeAge(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} h`;
  const d = Math.floor(h / 24);
  return `vor ${d} t`;
}

export async function NewsFeed({ supabase }: { supabase: SupabaseClient }) {
  // i18n: Title + Empty-State lokalisieren (Rest bleibt aus DB)
  const { loadLocale } = await import("@/lib/i18n");
  const { t } = await loadLocale();
  const newsTitle = t("dashboard.news_title");
  const emptyNews = t("dashboard.empty_no_news");
  // SQL-Filter sind tricky bei .or() + .is.null + .gt() in der Supabase-JS-API
  // (Reihenfolge der Klauseln kann zu unerwarteten Resultaten fuehren).
  // Wir holen die letzten 50 Eintraege und filtern Visibility in JS.
  const { data } = await supabase
    .from("dashboard_news")
    .select("id, type, title, body, profile_id, tiktok_username, tiktok_url, visible_from, visible_until, created_at")
    .order("created_at", { ascending: false })
    .limit(50);

  const now = Date.now();
  const allRows = (data as NewsRow[] | null) ?? [];
  const visibleRows = allRows.filter((r) => {
    const fromOk = !r.visible_from || new Date(r.visible_from).getTime() <= now;
    const untilOk = !r.visible_until || new Date(r.visible_until).getTime() > now;
    return fromOk && untilOk;
  });
  const rows = visibleRows.slice(0, 8);

  if (rows.length === 0) {
    return (
      <section className="mb-12 md:mb-16">
        <p className="eyebrow mb-4">{newsTitle}</p>
        <div className="border border-champagne/15 p-6 md:p-7">
          <p className="font-display italic text-cream/45 text-lg">{emptyNews}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-16">
      <div className="flex items-baseline justify-between mb-5">
        <p className="eyebrow">{newsTitle}</p>
        <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
          {rows.length}
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((r, idx) => (
          <li
            key={r.id}
            // Mobile cap: max 5, Desktop: bis 8 (Index 5-7 nur ab md+)
            className={idx >= 5 ? "hidden md:block" : ""}
          >
            <div className={`border p-4 md:p-5 ${TYPE_TONE[r.type] ?? "border-cream/15"}`}>
              <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                <p className="text-cream text-base md:text-lg leading-tight">
                  {r.title}
                </p>
                <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] shrink-0">
                  {relativeAge(r.created_at)}
                </span>
              </div>
              {r.body && (
                <p className="text-cream/55 text-sm leading-relaxed mb-2">
                  {r.body}
                </p>
              )}
              {r.tiktok_url && (
                <Link
                  href={r.tiktok_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-1"
                >
                  Auf TikTok folgen ↗
                </Link>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
