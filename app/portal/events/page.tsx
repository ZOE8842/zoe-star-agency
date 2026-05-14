import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

interface SearchProps {
  searchParams: Promise<{ tab?: string }>;
}

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  category: string;
  start_at: string;
  end_at: string | null;
  status: string;
  cover_image_url: string | null;
  source: string | null;
  prize_description: string | null;
  registration_url: string | null;
  rules: string | null;
  winners: Array<{ display_name?: string; rank?: number; note?: string }> | null;
  visibility_mode: string | null;
  requires_registration: boolean | null;
  target_categories: string[] | null;
  target_languages: string[] | null;
}

export default async function EventsPage({ searchParams }: SearchProps) {
  const { supabase, profile } = await getAuthedProfile();
  const sp = await searchParams;
  const tab = sp.tab === "tiktok" ? "tiktok" : sp.tab === "past" ? "past" : "agency";

  const now = new Date().toISOString();

  let query = supabase
    .from("events")
    .select(
      "id, title, description, category, start_at, end_at, status, cover_image_url, source, prize_description, registration_url, rules, winners, visibility_mode, requires_registration, target_categories, target_languages",
    )
    .in("status", ["open", "closed", "archived"])
    .order("start_at", { ascending: tab === "past" ? false : true })
    .limit(40);

  if (tab === "tiktok") {
    query = query.eq("source", "tiktok").gte("end_at", now);
  } else if (tab === "agency") {
    query = query.or(`source.eq.agency,source.is.null`);
    // upcoming + ongoing
    query = query.gte("end_at", now);
  } else {
    // past — alle Events deren end_at vorbei
    query = query.lt("end_at", now);
  }

  const { data: events } = await query;
  const allRows = (events as EventRow[]) ?? [];

  // Sichtbarkeits-Filter: visibility_mode='all' fuer alle, 'selected' nur
  // wenn Creator in event_allowed_profiles steht. Admin/Manager sieht alles.
  const isStaff = profile.role === "admin" || profile.role === "manager";
  let allowedEventIds = new Set<string>();
  if (!isStaff && allRows.some((e) => e.visibility_mode === "selected")) {
    const selectedIds = allRows.filter((e) => e.visibility_mode === "selected").map((e) => e.id);
    const { data: allowedFor } = selectedIds.length > 0
      ? await supabase
          .from("event_allowed_profiles")
          .select("event_id")
          .eq("profile_id", profile.id)
          .in("event_id", selectedIds)
      : { data: [] };
    allowedEventIds = new Set((allowedFor ?? []).map((r) => r.event_id));
  }
  // V2-5 · Zielgruppen-Filter (Category + Language). Staff sieht immer alles.
  // Wenn target_categories/target_languages gesetzt sind, muss profile.category
  // bzw. profile.language matchen (AND-Logik wenn beide gesetzt).
  const myCategory = (profile as { category?: string | null }).category ?? null;
  const myLanguage = (profile as { language?: string | null }).language ?? null;

  const rows = allRows.filter((e) => {
    if (isStaff) return true;
    if (e.visibility_mode === "selected" && !allowedEventIds.has(e.id)) return false;
    if (Array.isArray(e.target_categories) && e.target_categories.length > 0) {
      if (!myCategory || !e.target_categories.includes(myCategory)) return false;
    }
    if (Array.isArray(e.target_languages) && e.target_languages.length > 0) {
      if (!myLanguage || !e.target_languages.includes(myLanguage)) return false;
    }
    return true;
  });

  const { data: signups } = await supabase
    .from("event_signups")
    .select("event_id, status")
    .eq("creator_id", profile.id);
  const signupMap = new Map((signups || []).map((s) => [s.event_id, s.status]));

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-12 md:py-16 max-w-3xl">
        <p className="eyebrow mb-3">Events</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          Was im <span className="text-champagne">Network passiert.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl">
          Offizielle TikTok-Events und unsere internen Agency-Events.
          Vergangene Gewinner als Inspiration.
        </p>

        <div className="flex border-b border-champagne/15 mb-10 -mx-2 overflow-x-auto">
          <TabLink href="/portal/events?tab=agency" active={tab === "agency"} label="Agency Events" />
          <TabLink href="/portal/events?tab=tiktok" active={tab === "tiktok"} label="TikTok Events" />
          <TabLink href="/portal/events?tab=past" active={tab === "past"} label="Vergangene · Gewinner" />
        </div>

        {rows.length === 0 && (
          <div className="border border-champagne/15 p-8 md:p-10 text-center">
            <p className="font-display italic text-cream/45 text-xl mb-2">
              {tab === "past"
                ? "Noch keine vergangenen Events."
                : tab === "tiktok"
                ? "Aktuell keine offiziellen TikTok-Events."
                : "Aktuell keine Agency-Events."}
            </p>
            <p className="text-cream/35 text-sm">
              {tab === "past"
                ? "Sobald Events laufen + abgeschlossen sind, erscheinen Gewinner hier."
                : "Sobald Management neue Events plant, erscheinen sie hier."}
            </p>
          </div>
        )}

        <div className="grid gap-4 md:gap-5">
          {rows.map((ev) => {
            const userSignup = signupMap.get(ev.id);
            const startDate = new Date(ev.start_at);
            const endDate = ev.end_at ? new Date(ev.end_at) : null;
            const isPast = endDate ? endDate < new Date() : false;
            return (
              <article
                key={ev.id}
                className="border border-champagne/15 hover:border-champagne/30 transition-colors p-5 md:p-7"
              >
                {ev.cover_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ev.cover_image_url}
                    alt=""
                    className="w-full aspect-[16/7] object-cover border border-champagne/10 mb-5"
                  />
                )}
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <span className="text-cream/55 text-[11px] uppercase tracking-[0.25em]">
                    {ev.source === "tiktok" ? "TikTok Event" : "Agency Event"}
                    {ev.category && <> · {ev.category}</>}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {ev.status === "closed" && (
                      <span className="text-[10px] uppercase tracking-[0.25em] px-2 py-0.5 border border-cream/25 text-cream/65">
                        Geschlossen
                      </span>
                    )}
                    {ev.status === "archived" && (
                      <span className="text-[10px] uppercase tracking-[0.25em] px-2 py-0.5 border border-cream/20 text-cream/55">
                        Beendet
                      </span>
                    )}
                    {userSignup && !isPast && (
                      <span className="text-[10px] uppercase tracking-[0.25em] text-champagne">
                        {userSignup === "confirmed" ? "Bestaetigt" : userSignup}
                      </span>
                    )}
                  </div>
                </div>

                <h2 className="font-display italic text-cream text-2xl md:text-3xl leading-tight mb-3">
                  {ev.title}
                </h2>

                {ev.description && (
                  <p className="text-cream/65 text-sm md:text-base leading-relaxed mb-4">
                    {ev.description}
                  </p>
                )}

                <p className="text-cream/45 text-xs uppercase tracking-[0.2em] mb-4">
                  {startDate.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  {endDate && (
                    <>
                      {" — "}
                      {endDate.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                    </>
                  )}
                </p>

                {ev.prize_description && (
                  <div className="border-l-2 border-champagne/40 pl-3 mb-4">
                    <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-1">Gewinn</p>
                    <p className="text-cream/75 text-sm">{ev.prize_description}</p>
                  </div>
                )}

                {Array.isArray(ev.winners) && ev.winners.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-champagne/10">
                    <p className="eyebrow mb-2">Gewinner</p>
                    <ul className="space-y-1">
                      {ev.winners.slice(0, 5).map((w, i) => (
                        <li key={i} className="text-cream/75 text-sm">
                          {w.rank && <span className="text-champagne mr-2">#{w.rank}</span>}
                          {w.display_name || "—"}
                          {w.note && <span className="text-cream/45 text-xs ml-2">{w.note}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="mt-5 flex items-center gap-3 flex-wrap">
                  {ev.source === "tiktok" && ev.registration_url && !isPast && (
                    <a
                      href={ev.registration_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-cta btn-shimmer"
                    >
                      Auf TikTok teilnehmen
                      <span className="btn-cta-arrow" aria-hidden>↗</span>
                    </a>
                  )}
                  {ev.source !== "tiktok" && ev.requires_registration !== false && !userSignup && ev.status === "open" && !isPast && (
                    <Link href={`/portal/events/${ev.id}`} className="btn-cta btn-shimmer">
                      Anmelden
                      <span className="btn-cta-arrow" aria-hidden>→</span>
                    </Link>
                  )}
                  {ev.source !== "tiktok" && ev.requires_registration === false && (
                    <span className="text-cream/45 text-[10px] uppercase tracking-[0.25em] px-3 py-2 border border-cream/15">
                      Nur Info
                    </span>
                  )}
                  <Link
                    href={`/portal/events/${ev.id}`}
                    className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
                  >
                    Details →
                  </Link>
                </div>
              </article>
            );
          })}
        </div>

        {tab !== "past" && (
          <p className="text-cream/35 text-xs mt-12 leading-relaxed">
            Hinweis: Live-Rankings werden waehrend laufender Events nicht
            oeffentlich angezeigt. Gewinner erscheinen nach Event-Ende
            unter „Vergangene · Gewinner".
          </p>
        )}
      </main>
    </>
  );
}

function TabLink({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className={`px-3 py-3 text-[11px] uppercase tracking-[0.25em] transition-colors whitespace-nowrap ${
        active
          ? "text-champagne border-b-2 border-champagne -mb-px"
          : "text-cream/45 hover:text-cream"
      }`}
    >
      {label}
    </Link>
  );
}
