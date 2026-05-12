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
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from("dashboard_news")
    .select("id, type, title, body, profile_id, tiktok_username, tiktok_url, visible_from, visible_until, created_at")
    .lte("visible_from", nowIso)
    .or(`visible_until.is.null,visible_until.gt.${nowIso}`)
    .order("created_at", { ascending: false })
    .limit(8);

  const rows = (data as NewsRow[] | null) ?? [];

  if (rows.length === 0) {
    return (
      <section className="mb-12 md:mb-16">
        <p className="eyebrow mb-4">News &amp; Infos</p>
        <div className="border border-champagne/15 p-6 md:p-7">
          <p className="font-display italic text-cream/45 text-lg">
            Alles ruhig im Network.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-12 md:mb-16">
      <p className="eyebrow mb-5">News &amp; Infos</p>
      <ul className="space-y-3">
        {rows.map((r) => (
          <li key={r.id}>
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
