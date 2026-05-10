// Activity-Feed-Block fuer /portal/inbox Hub.
// Zeigt System-Posts: Creator live / Match-Anfrage / Event / neue Lektion.

import type { SupabaseClient } from "@supabase/supabase-js";

interface ActivityRow {
  id: string;
  type: string;
  actor_id: string | null;
  payload: Record<string, unknown>;
  created_at: string;
}

interface Props {
  supabase: SupabaseClient;
}

const TYPE_LABEL: Record<string, string> = {
  creator_live: "Creator LIVE",
  match_call: "Match-Anfrage",
  event_started: "Event gestartet",
  academy_lesson: "Neue Academy-Lektion",
  tiktok_push_selected: "Push-Slot bestaetigt",
  agency_news: "Agency Update",
  creator_joined: "Neuer Creator",
};

const TYPE_DOT: Record<string, string> = {
  creator_live: "bg-red-400",
  match_call: "bg-champagne",
  event_started: "bg-blue-400",
  academy_lesson: "bg-emerald-400",
  tiktok_push_selected: "bg-champagne",
  agency_news: "bg-cream/55",
  creator_joined: "bg-cream/55",
};

function formatRelative(d: Date): string {
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days} d`;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "2-digit" });
}

export async function ActivityFeed({ supabase }: Props) {
  const { data } = await supabase
    .from("activity_feed")
    .select("id, type, actor_id, payload, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  const rows = (data as ActivityRow[]) ?? [];

  // actor_id Profile-Lookup batched
  const actorIds = Array.from(new Set(rows.map((r) => r.actor_id).filter(Boolean) as string[]));
  const profileMap = new Map<string, { display_name: string | null; tiktok_username: string | null }>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, tiktok_username")
      .in("id", actorIds);
    for (const p of profiles ?? []) profileMap.set(p.id, p);
  }

  if (rows.length === 0) {
    return (
      <section className="border border-champagne/10 p-5 md:p-6">
        <p className="eyebrow mb-3">Activity-Feed</p>
        <p className="text-cream/45 text-sm italic">
          Hier erscheint was im Network passiert — Creator LIVE,
          Match-Anfragen, Events, neue Academy-Lektionen.
        </p>
      </section>
    );
  }

  return (
    <section className="border border-champagne/15 p-5 md:p-6">
      <div className="flex items-baseline justify-between mb-4">
        <p className="eyebrow">Activity</p>
        <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
          {rows.length} {rows.length === 1 ? "Eintrag" : "Eintraege"}
        </span>
      </div>
      <ul className="space-y-3">
        {rows.map((r) => {
          const actor = r.actor_id ? profileMap.get(r.actor_id) : null;
          const dot = TYPE_DOT[r.type] || "bg-cream/30";
          const label = TYPE_LABEL[r.type] || r.type;
          const headline = (r.payload?.headline as string) || label;
          const subline = r.payload?.subline as string | undefined;
          return (
            <li key={r.id} className="flex gap-3 items-start">
              <span className={`shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <p className="text-cream text-sm md:text-base">
                    {headline}
                  </p>
                  <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] shrink-0">
                    {formatRelative(new Date(r.created_at))}
                  </span>
                </div>
                {subline && (
                  <p className="text-cream/55 text-xs mt-0.5 leading-relaxed">{subline}</p>
                )}
                {actor && (
                  <p className="text-cream/35 text-[11px] mt-0.5">
                    {actor.display_name || `@${actor.tiktok_username}`}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
