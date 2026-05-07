import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Späte Stunde";
  if (h < 11) return "Guten Morgen";
  if (h < 14) return "Mahlzeit";
  if (h < 18) return "Guten Tag";
  if (h < 22) return "Guten Abend";
  return "Späte Stunde";
}

function editionMarker(): string {
  // Mai 2026 → Edit. 05/26
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const y = String(d.getFullYear()).slice(-2);
  return `Edit. ${m}/${y}`;
}

export default async function DashboardPage() {
  const { supabase, profile } = await getAuthedProfile();

  if (profile.role === "admin") redirect("/portal/admin");

  const now = new Date();
  const weekFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  const [
    unreadRes,
    upcomingEventsRes,
    weekSlotsRes,
    openTicketsRes,
    recentMessagesRes,
    nextSlotRes,
    nextEventRes,
  ] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`),
    supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .gte("start_at", now.toISOString()),
    supabase
      .from("slots")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", profile.id)
      .gte("start_at", now.toISOString())
      .lte("start_at", weekFromNow.toISOString()),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", profile.id)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("messages")
      .select("id, subject, sent_at, sender_id")
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`)
      .order("sent_at", { ascending: false })
      .limit(3),
    supabase
      .from("slots")
      .select("id, start_at, status")
      .eq("creator_id", profile.id)
      .gte("start_at", now.toISOString())
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("events")
      .select("id, title, start_at, category")
      .eq("status", "open")
      .gte("start_at", now.toISOString())
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const unreadCount = unreadRes.count ?? 0;
  const upcomingEvents = upcomingEventsRes.count ?? 0;
  const weekSlots = weekSlotsRes.count ?? 0;
  const openTickets = openTicketsRes.count ?? 0;
  const recentMessages = recentMessagesRes.data ?? [];
  const nextSlot = nextSlotRes.data;
  const nextEvent = nextEventRes.data;

  // Setup-Progress (5 Schritte)
  const profileComplete = !!(profile.display_name && profile.tiktok_username && profile.country && profile.language);
  const avatarSet = !!profile.avatar_url;
  const bioSet = !!profile.bio;
  const firstSlot = (weekSlotsRes.count ?? 0) > 0 || !!nextSlot;
  const firstRead = unreadCount === 0;

  const progressItems = [
    { label: "Profil ausfüllen", done: profileComplete, href: "/portal/profile" },
    { label: "Profilbild setzen", done: avatarSet, href: "/portal/profile" },
    { label: "Bio schreiben", done: bioSet, href: "/portal/profile" },
    { label: "Ersten Slot anmelden", done: firstSlot, href: "/portal/slots" },
    { label: "Inbox checken", done: firstRead, href: "/portal/inbox" },
  ];
  const progressDone = progressItems.filter((p) => p.done).length;
  const progressPct = Math.round((progressDone / progressItems.length) * 100);

  const firstName = profile.display_name?.split(" ")[0] || "Creator";

  // Featured-Direction: was ist das Wichtigste JETZT?
  type Featured = {
    eyebrow: string;
    headline: string;
    tagline: string;
    href: string;
    cta: string;
    accent: string;
  };
  let featured: Featured;
  if (unreadCount > 0) {
    featured = {
      eyebrow: "Heute · Inbox",
      headline: unreadCount === 1 ? "Eine ungelesene Nachricht." : `${unreadCount} ungelesene Nachrichten.`,
      tagline: "Es wartet etwas auf dich. Lies, was gemeint ist.",
      href: "/portal/inbox",
      cta: "Inbox öffnen",
      accent: String(unreadCount),
    };
  } else if (nextSlot) {
    const dt = new Date(nextSlot.start_at);
    const dateStr = dt.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
    const timeStr = dt.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" });
    featured = {
      eyebrow: "Heute · Dein Termin",
      headline: dateStr,
      tagline: `${timeStr} Uhr — du bist eingetragen. Status: ${nextSlot.status}.`,
      href: "/portal/slots",
      cta: "Slot ansehen",
      accent: timeStr,
    };
  } else if (nextEvent) {
    const dt = new Date(nextEvent.start_at);
    const dateStr = dt.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
    featured = {
      eyebrow: "Bald · Event",
      headline: nextEvent.title,
      tagline: `${dateStr} · ${nextEvent.category}. Anmeldung möglich.`,
      href: "/portal/events",
      cta: "Event ansehen",
      accent: "01",
    };
  } else {
    featured = {
      eyebrow: "Heute",
      headline: "Stille.",
      tagline: "Keine offenen Punkte. Setze einen Slot oder schau in die Events.",
      href: "/portal/slots",
      cta: "Slot eintragen",
      accent: "00",
    };
  }

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      {/* ATMOSPHERE */}
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />
      <div className="atelier-vignette" />

      <main className="container-luxe relative z-10 py-14 md:py-24 pb-24">

        {/* AKT I — COVER */}
        <section className="relative mb-20 md:mb-32">
          {/* Z-Watermark */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zoe_monogram_v3.svg"
            alt=""
            className="atelier-watermark hidden md:block"
            style={{ top: "-40px", right: "-60px", width: "420px" }}
          />

          <p className="volume-marker text-sm tracking-[0.25em] mb-6 md:mb-8 stagger-1">
            {editionMarker()} · {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>

          <div className="grid md:grid-cols-[1fr_auto] gap-8 md:gap-12 items-end">
            <div className="min-w-0">
              <h1 className="heading-display text-cream text-6xl md:text-8xl lg:text-9xl leading-[0.95] stagger-2">
                {firstName}<span className="text-champagne">.</span>
              </h1>
              <p className="text-cream/65 text-lg md:text-xl italic font-display mt-5 md:mt-7 stagger-3">
                {greeting()}, Stimme.
              </p>
              <div className="flex items-center gap-3 mt-6 stagger-4">
                <span className="inline-block px-3 py-1 border border-champagne/40 text-champagne text-[10px] uppercase tracking-[0.3em]">
                  {profile.role}
                </span>
                <span className="text-cream/40 text-sm">@{profile.tiktok_username}</span>
              </div>
            </div>

            {/* Avatar overlap */}
            <div className="shrink-0 stagger-3">
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={profile.avatar_url}
                  alt=""
                  className="w-24 h-24 md:w-36 md:h-36 rounded-full object-cover border border-champagne/40 shadow-2xl"
                />
              ) : (
                <div className="w-24 h-24 md:w-36 md:h-36 rounded-full bg-champagne/10 border border-champagne/40 flex items-center justify-center text-champagne text-4xl md:text-6xl font-display italic shadow-2xl">
                  {(profile.display_name || "?").slice(0, 1).toUpperCase()}
                </div>
              )}
            </div>
          </div>

          <div className="hairline-divider mt-12 md:mt-16 stagger-5" />
        </section>

        {/* AKT II — TODAY */}
        <section className="mb-20 md:mb-28">
          <p className="eyebrow mb-6 md:mb-8">Heute</p>

          <div className="grid md:grid-cols-3 gap-5 md:gap-6">
            {/* Featured Card — span 2 */}
            <Link
              href={featured.href}
              className="card-featured md:col-span-2 p-7 md:p-12 group transition-all duration-500 hover:bg-champagne/5"
            >
              <p className="eyebrow mb-6 md:mb-8">{featured.eyebrow}</p>

              <p className="font-display italic text-champagne text-7xl md:text-9xl leading-[0.95] mb-4 md:mb-6">
                {featured.accent}
              </p>

              <h2 className="font-display italic text-cream text-3xl md:text-5xl leading-tight mb-3 md:mb-5 max-w-[28ch]">
                {featured.headline}
              </h2>

              <p className="text-cream/55 text-base md:text-lg leading-relaxed italic font-display max-w-[42ch] mb-8">
                {featured.tagline}
              </p>

              <span className="inline-flex items-center gap-3 text-champagne text-[11px] uppercase tracking-[0.3em] font-medium border-b border-champagne/40 pb-1 group-hover:border-champagne transition-colors">
                {featured.cta}
                <span aria-hidden className="transition-transform duration-500 group-hover:translate-x-1">→</span>
              </span>
            </Link>

            {/* Side Cards stack */}
            <div className="space-y-5 md:space-y-6">
              <SideCard
                href="/portal/slots"
                eyebrow="Diese Woche"
                value={weekSlots}
                hint={weekSlots === 0 ? "Keine Slots geplant" : weekSlots === 1 ? "Slot geplant" : "Slots geplant"}
              />
              <SideCard
                href="/portal/events"
                eyebrow="Events offen"
                value={upcomingEvents}
                hint={upcomingEvents === 0 ? "—" : "Anmeldung möglich"}
              />
              <SideCard
                href="/portal/support"
                eyebrow="Tickets"
                value={openTickets}
                hint={openTickets === 0 ? "Alles ruhig" : "in Bearbeitung"}
                muted={openTickets === 0}
              />
            </div>
          </div>

          {/* Recent Messages — Editorial line-list */}
          {recentMessages.length > 0 && (
            <div className="mt-12 md:mt-16">
              <div className="flex items-baseline justify-between mb-6">
                <p className="eyebrow">Korrespondenz</p>
                <Link href="/portal/inbox" className="text-cream/45 text-[10px] uppercase tracking-[0.25em] hover:text-champagne transition-colors">
                  Alle →
                </Link>
              </div>
              <ul>
                {recentMessages.map((m) => (
                  <li key={m.id} className="border-t border-champagne/10 last:border-b">
                    <Link
                      href="/portal/inbox"
                      className="flex items-baseline justify-between gap-6 py-5 group hover:bg-champagne/[0.03] -mx-2 px-2 transition-colors"
                    >
                      <span className="font-display italic text-cream text-lg md:text-xl truncate group-hover:text-champagne transition-colors">
                        {m.subject || "(ohne Betreff)"}
                      </span>
                      <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] shrink-0">
                        {new Date(m.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        {/* AKT III — WERKSTATT */}
        <section className="mb-20 md:mb-24">
          <p className="eyebrow mb-6 md:mb-8">Werkstatt</p>
          <ul className="border-t border-champagne/15">
            {[
              { href: "/portal/slots", label: "Slot eintragen", hint: "Live-Termin reservieren" },
              { href: "/portal/inbox/compose", label: "Nachricht verfassen", hint: "An ZOE oder Manager" },
              { href: "/portal/events", label: "Events ansehen", hint: "Offene Anmeldungen" },
              { href: "/portal/downloads", label: "Downloads", hint: "Brand-Assets · Templates" },
              { href: "/portal/support", label: "Support", hint: "Hilfe oder Anliegen" },
            ].map((item) => (
              <li key={item.href} className="border-b border-champagne/15">
                <Link
                  href={item.href}
                  className="group flex items-baseline justify-between gap-6 py-6 md:py-7 -mx-2 px-2 hover:bg-champagne/[0.03] transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display italic text-cream text-2xl md:text-3xl group-hover:text-champagne transition-colors">
                      {item.label}
                    </p>
                    <p className="text-cream/40 text-xs md:text-sm mt-1 italic">{item.hint}</p>
                  </div>
                  <span aria-hidden className="text-champagne/60 text-2xl md:text-3xl transition-all duration-500 group-hover:text-champagne group-hover:translate-x-1">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* AKT IV — SETUP (nur wenn unvollständig) */}
        {progressDone < progressItems.length && (
          <section className="card-featured p-7 md:p-10 mb-8">
            <div className="flex items-baseline justify-between mb-6">
              <div>
                <p className="eyebrow mb-2">Dein Setup</p>
                <p className="font-display italic text-cream/55 text-sm md:text-base">Noch ein paar Schritte bis zur Bühne.</p>
              </div>
              <span className="text-champagne font-display italic text-3xl md:text-4xl">{progressPct}%</span>
            </div>
            <div className="h-px bg-champagne/15 mb-6 overflow-hidden">
              <div className="h-full bg-champagne transition-all duration-700" style={{ width: `${progressPct}%` }} />
            </div>
            <ul className="space-y-1">
              {progressItems.map((p) => (
                <li key={p.label}>
                  <Link
                    href={p.href}
                    className={`flex items-center gap-3 text-sm md:text-base py-2 transition-colors ${p.done ? "text-cream/45" : "text-cream hover:text-champagne"}`}
                  >
                    <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[10px] shrink-0 ${p.done ? "border-champagne bg-champagne text-ink" : "border-champagne/30"}`}>
                      {p.done ? "✓" : ""}
                    </span>
                    <span className={p.done ? "line-through italic" : "italic font-display"}>{p.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </>
  );
}

function SideCard({ href, eyebrow, value, hint, muted }: { href: string; eyebrow: string; value: number; hint: string; muted?: boolean }) {
  return (
    <Link
      href={href}
      className={`group block border p-5 md:p-6 transition-all duration-500 ${
        muted
          ? "border-champagne/10 hover:border-champagne/30"
          : "border-champagne/20 hover:border-champagne hover:bg-champagne/5"
      }`}
    >
      <p className="text-cream/50 text-[10px] uppercase tracking-[0.25em] mb-3">{eyebrow}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl leading-none transition-colors ${
        muted ? "text-cream/40" : "text-cream group-hover:text-champagne"
      }`}>
        {value}
      </p>
      <p className="text-cream/40 text-xs mt-3 italic">{hint}</p>
    </Link>
  );
}
