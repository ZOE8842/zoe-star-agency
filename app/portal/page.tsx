import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AvatarStack } from "@/components/AvatarStack";
import { MonthlyMetricsBlock } from "@/components/dashboard/MonthlyMetricsBlock";
// ZoeAppCodeBox bleibt im Repo (Component existiert), wird aber nicht mehr
// im Dashboard gerendert. Backend-Routes /api/zoe-app/request-code +
// zoe_app_connection_codes Tabelle bleiben als Legacy-Bridge intern.

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Späte Stunde";
  if (h < 11) return "Guten Morgen";
  if (h < 14) return "Mahlzeit";
  if (h < 18) return "Guten Tag";
  if (h < 22) return "Guten Abend";
  return "Späte Stunde";
}

export default async function DashboardPage() {
  const { supabase, profile } = await getAuthedProfile();

  if (profile.role === "admin") redirect("/portal/admin");

  const now = new Date();

  const [
    unreadRes,
    upcomingEventsRes,
    openTicketsRes,
    recentMessagesRes,
    nextEventRes,
    activePushRes,
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
      .from("events")
      .select("id, title, start_at, category")
      .eq("status", "open")
      .gte("start_at", now.toISOString())
      .order("start_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("tiktok_push_requests")
      .select("status")
      .eq("profile_id", profile.id)
      .order("week_start_monday", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const unreadCount = unreadRes.count ?? 0;
  const upcomingEvents = upcomingEventsRes.count ?? 0;
  const openTickets = openTicketsRes.count ?? 0;
  const recentMessages = recentMessagesRes.data ?? [];
  const nextEvent = nextEventRes.data;
  const latestPushStatus = activePushRes.data?.status as string | undefined;

  // Setup-Progress (5 Schritte)
  const profileComplete = !!(profile.display_name && profile.tiktok_username && profile.country && profile.language);
  const avatarSet = !!profile.avatar_url;
  const bioSet = !!profile.bio;
  const firstRead = unreadCount === 0;

  const progressItems = [
    { label: "Profil ausfüllen", done: profileComplete, href: "/portal/profile" },
    { label: "Profilbild setzen", done: avatarSet, href: "/portal/profile" },
    { label: "Bio schreiben", done: bioSet, href: "/portal/profile" },
    { label: "Services entdecken", done: false, href: "/portal/services" },
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
      eyebrow: "Inbox",
      headline: unreadCount === 1 ? "1 ungelesene Nachricht" : `${unreadCount} ungelesene Nachrichten`,
      tagline: "Es wartet etwas auf dich.",
      href: "/portal/inbox",
      cta: "Inbox öffnen",
      accent: String(unreadCount),
    };
  } else if (nextEvent) {
    const dt = new Date(nextEvent.start_at);
    const dateStr = dt.toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" });
    featured = {
      eyebrow: "Event",
      headline: nextEvent.title,
      tagline: `${dateStr} · ${nextEvent.category}`,
      href: "/portal/events",
      cta: "Event ansehen",
      accent: "01",
    };
  } else {
    featured = {
      eyebrow: "Creator Services",
      headline: "Alles ruhig.",
      tagline: "Keine offenen Punkte. Schau dir die Creator Services an oder oeffne dein Postfach.",
      href: "/portal/services",
      cta: "Services oeffnen",
      accent: "—",
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

      {/* ATMOSPHERE — dezent */}
      <div className="atelier-atmosphere" />
      <div className="atelier-grain" />

      <main className="container-luxe relative z-10 py-10 md:py-16 pb-20">

        {/* HERO — kompakter, klar, mit Trust */}
        <section className="relative mb-12 md:mb-16">
          {/* Z-Watermark dezent rechts */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/zoe_monogram_v3.svg"
            alt=""
            className="absolute pointer-events-none select-none opacity-[0.045] hidden md:block"
            style={{ top: "-30px", right: "-60px", width: "360px" }}
          />

          <p className="eyebrow mb-4 stagger-1">Dashboard · {greeting()}</p>

          <div className="flex items-center gap-5 md:gap-6 stagger-2">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-champagne/40 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-champagne/15 border border-champagne/40 flex items-center justify-center text-champagne text-2xl md:text-3xl font-display italic shrink-0">
                {(profile.display_name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="heading-display text-cream text-4xl md:text-6xl leading-[1.0]">
                Hi, <span className="text-champagne">{firstName}.</span>
              </h1>
              <div className="flex items-center gap-3 mt-3">
                <span className="inline-block px-2.5 py-0.5 border border-champagne/40 text-champagne text-[10px] uppercase tracking-[0.25em]">
                  {profile.role}
                </span>
                <span className="text-cream/45 text-sm truncate">@{profile.tiktok_username}</span>
              </div>
            </div>
          </div>
        </section>

        {/* MONTHLY METRICS — Empty-State bis Sync laeuft */}
        <MonthlyMetricsBlock supabase={supabase} profileId={profile.id} />

        {/* TODAY — Featured + Side-Cards (kompakt) */}
        <section className="mb-12 md:mb-16">
          <div className="grid md:grid-cols-3 gap-4 md:gap-5">
            {/* Featured — span 2 */}
            <Link
              href={featured.href}
              className="card-featured md:col-span-2 p-7 md:p-10 group transition-all duration-500 hover:bg-champagne/5"
            >
              <p className="eyebrow mb-5">{featured.eyebrow}</p>
              <p className="font-display italic text-champagne text-6xl md:text-8xl leading-[0.9] mb-4 md:mb-5">
                {featured.accent}
              </p>
              <h2 className="text-cream text-2xl md:text-3xl font-medium leading-snug mb-2">
                {featured.headline}
              </h2>
              <p className="text-cream/60 text-sm md:text-base mb-7 max-w-[44ch]">
                {featured.tagline}
              </p>
              <span className="btn-cta">
                {featured.cta}
                <span className="btn-cta-arrow" aria-hidden>→</span>
              </span>
            </Link>

            {/* Side Cards stack */}
            <div className="space-y-4 md:space-y-5">
              <ServiceLink
                href="/portal/services/tiktok-push"
                eyebrow="TikTok Push"
                label={
                  latestPushStatus === "selected"
                    ? "Ausgewaehlt"
                    : latestPushStatus === "submitted" || latestPushStatus === "reviewed"
                    ? "Eingereicht"
                    : "Wunschzeit eintragen"
                }
                hint={
                  latestPushStatus === "selected"
                    ? "Naechste Woche"
                    : latestPushStatus === "submitted" || latestPushStatus === "reviewed"
                    ? "Pruefung laeuft"
                    : "Naechste Woche"
                }
              />
              <SideCard href="/portal/events" eyebrow="Events" value={upcomingEvents}
                hint={upcomingEvents === 0 ? "—" : "offen"} />
              <SideCard href="/portal/support" eyebrow="Support" value={openTickets}
                hint={openTickets === 0 ? "Keine offen" : "in Bearbeitung"}
                muted={openTickets === 0} />
            </div>
          </div>
        </section>

        {/* RECENT MESSAGES — Editorial line-list (nur wenn welche da) */}
        {recentMessages.length > 0 && (
          <section className="mb-12 md:mb-16">
            <div className="flex items-baseline justify-between mb-5 md:mb-6">
              <p className="eyebrow">Letzte Nachrichten</p>
              <Link href="/portal/inbox" className="text-cream/50 text-[11px] uppercase tracking-[0.25em] hover:text-champagne transition-colors">
                Alle →
              </Link>
            </div>
            <ul>
              {recentMessages.map((m) => (
                <li key={m.id} className="border-t border-champagne/10 last:border-b">
                  <Link
                    href="/portal/inbox"
                    className="flex items-baseline justify-between gap-6 py-4 md:py-5 group hover:bg-champagne/[0.03] -mx-2 px-2 transition-colors"
                  >
                    <span className="text-cream text-base md:text-lg truncate group-hover:text-champagne transition-colors">
                      {m.subject || "(ohne Betreff)"}
                    </span>
                    <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] shrink-0">
                      {new Date(m.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* AKTIONEN — klare CTAs als Tile-Grid (nicht italic-Liste) */}
        <section className="mb-12 md:mb-16">
          <p className="eyebrow mb-5 md:mb-6">Aktionen</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
            {[
              { href: "/portal/services", label: "Creator Services" },
              { href: "/portal/inbox/compose", label: "Nachricht senden" },
              { href: "/portal/events", label: "Events" },
              { href: "/portal/downloads", label: "Downloads" },
              { href: "/portal/support", label: "Support" },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="border border-champagne/15 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-all duration-300 text-cream text-sm md:text-base font-medium min-h-[80px] inline-flex items-center justify-center text-center leading-tight"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        {/* TRUST-LAYER — wer ist im Roster, was ist Phase */}
        <section className="border-t border-champagne/10 pt-10 md:pt-12 mb-8">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <p className="eyebrow mb-3">ZOE Roster</p>
              <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-5 max-w-[44ch]">
                Du bist Teil der ersten Welle der ZOE Star Agency. TikTok Elite Agency Club Deutschland. Persönliches Creator-Management mit LIVE-Fokus.
              </p>
              <AvatarStack size="md" caption="Roster im Aufbau" />
            </div>
            <div className="grid grid-cols-2 gap-px bg-champagne/15">
              <div className="bg-ink p-5">
                <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">Phase</p>
                <p className="font-display italic text-champagne text-3xl leading-none mb-1">01</p>
                <p className="text-cream/40 text-xs">Soft-Launch · 2026</p>
              </div>
              <div className="bg-ink p-5">
                <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-2">Standort</p>
                <p className="font-display italic text-champagne text-3xl leading-none mb-1">DE</p>
                <p className="text-cream/40 text-xs">Creator-Management</p>
              </div>
            </div>
          </div>
        </section>

        {/* SETUP — nur wenn unvollständig */}
        {progressDone < progressItems.length && (
          <section className="card-featured p-6 md:p-8 mt-10">
            <div className="flex items-baseline justify-between mb-5">
              <div>
                <p className="eyebrow mb-1">Dein Setup</p>
                <p className="text-cream/55 text-sm">Noch {progressItems.length - progressDone} Schritte bis fertig.</p>
              </div>
              <span className="text-champagne font-display italic text-3xl">{progressPct}%</span>
            </div>
            <div className="h-px bg-champagne/15 mb-5 overflow-hidden">
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
                    <span className={p.done ? "line-through" : ""}>{p.label}</span>
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

function ServiceLink({ href, eyebrow, label, hint }: { href: string; eyebrow: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group block border border-champagne/20 hover:border-champagne hover:bg-champagne/5 p-5 md:p-6 transition-all duration-300"
    >
      <p className="text-cream/50 text-[10px] uppercase tracking-[0.25em] mb-3">{eyebrow}</p>
      <p className="font-display italic text-cream group-hover:text-champagne text-2xl md:text-3xl leading-tight transition-colors">
        {label}
      </p>
      <p className="text-cream/45 text-xs mt-3">{hint}</p>
    </Link>
  );
}

function SideCard({ href, eyebrow, value, hint, muted }: { href: string; eyebrow: string; value: number; hint: string; muted?: boolean }) {
  return (
    <Link
      href={href}
      className={`group block border p-5 md:p-6 transition-all duration-300 ${
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
      <p className="text-cream/45 text-xs mt-3">{hint}</p>
    </Link>
  );
}
