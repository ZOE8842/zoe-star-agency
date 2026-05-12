import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

// Teilnahmen-Shortcuts auf der Inbox-Seite. Aggregiert kompakt:
// Events, Match-Anfragen, Push-Anfragen, Academy-Challenges.
// Pro Karte: Eyebrow + Headline (Count) + Link.

export async function ParticipationShortcuts({
  supabase,
  profileId,
}: {
  supabase: SupabaseClient;
  profileId: string;
}) {
  const nowIso = new Date().toISOString();
  const [
    eventSignups,
    matchRequests,
    pushRequests,
    activeChallenge,
  ] = await Promise.all([
    supabase
      .from("event_signups")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", profileId)
      .in("status", ["signed", "confirmed"]),
    supabase
      .from("match_requests")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .in("status", ["requested", "reviewing", "partner_found", "planned"]),
    supabase
      .from("tiktok_push_requests")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profileId)
      .in("status", ["submitted", "reviewed", "selected"]),
    supabase
      .from("academy_challenges")
      .select("id")
      .eq("is_active", true)
      .or(`ends_at.gt.${nowIso},ends_at.is.null`)
      .limit(1)
      .maybeSingle(),
  ]);

  const cards = [
    {
      eyebrow: "Events",
      headline: eventSignups.count ?? 0,
      hint: (eventSignups.count ?? 0) === 0 ? "Nichts angemeldet" : "angemeldet",
      href: "/portal/events",
    },
    {
      eyebrow: "Match",
      headline: matchRequests.count ?? 0,
      hint: (matchRequests.count ?? 0) === 0 ? "Keine Anfrage" : "offen",
      href: "/portal/services/big-match",
    },
    {
      eyebrow: "TikTok Push",
      headline: pushRequests.count ?? 0,
      hint: (pushRequests.count ?? 0) === 0 ? "Keine Wunschzeit" : "in Pruefung",
      href: "/portal/services/tiktok-push",
    },
    {
      eyebrow: "Academy",
      headline: activeChallenge.data ? "Challenge" : "—",
      hint: activeChallenge.data ? "laeuft" : "Keine aktive",
      href: "/portal/academy",
    },
  ];

  return (
    <section className="mb-10 md:mb-12">
      <p className="eyebrow mb-4">Teilnahmen</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((c) => (
          <Link
            key={c.eyebrow}
            href={c.href}
            className="block border border-champagne/15 hover:border-champagne/40 hover:bg-champagne/5 p-4 transition-colors group"
          >
            <p className="text-cream/45 text-[9px] uppercase tracking-[0.25em] mb-2">
              {c.eyebrow}
            </p>
            <p className="font-display italic text-cream group-hover:text-champagne text-2xl md:text-3xl leading-none mb-2 transition-colors">
              {c.headline}
            </p>
            <p className="text-cream/45 text-[10px] uppercase tracking-[0.2em]">
              {c.hint}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
