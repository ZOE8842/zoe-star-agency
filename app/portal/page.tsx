import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return "Spät unterwegs";
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
  const weekFromNow = new Date(Date.now() + 7 * 24 * 3600 * 1000);

  // Counts + recent items parallel
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
  const firstRead = unreadCount === 0; // simpler proxy: alle gelesen

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

      <main className="container-luxe py-12 md:py-20">
        {/* WELCOME — editorial, mit Datum-Eyebrow + Hairline-Mark */}
        <section className="mb-14 md:mb-20">
          <p className="eyebrow mb-5 md:mb-6">
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
          </p>
          <div className="flex items-start gap-5 md:gap-6">
            {profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt=""
                className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border border-champagne/30 shrink-0"
              />
            ) : (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-champagne/10 border border-champagne/30 flex items-center justify-center text-champagne text-2xl font-display italic shrink-0">
                {(profile.display_name || "?").slice(0, 1).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-cream/55 text-xs md:text-sm mb-1 italic font-display">{greeting()},</p>
              <h1 className="heading-display text-4xl md:text-6xl leading-[1.05]">
                {firstName}<span className="text-champagne">.</span>
              </h1>
              <p className="text-cream/50 text-sm mt-3 truncate">
                <span className="inline-block px-2 py-0.5 border border-champagne/30 text-champagne text-[10px] uppercase tracking-[0.25em] mr-2 align-middle">
                  {profile.role}
                </span>
                @{profile.tiktok_username}
              </p>
            </div>
          </div>
          <div className="hero-mark" />
        </section>

        {/* QUICK STATS */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-12">
          <StatCard href="/portal/inbox" eyebrow="Inbox" value={unreadCount} hint={unreadCount === 0 ? "alles gelesen" : "Nachrichten"} highlight={unreadCount > 0} />
          <StatCard href="/portal/slots" eyebrow="Slots diese Woche" value={weekSlots} hint={weekSlots === 0 ? "keine geplant" : "geplant"} />
          <StatCard href="/portal/events" eyebrow="Events offen" value={upcomingEvents} hint={upcomingEvents === 0 ? "—" : "Anmeldung möglich"} />
          <StatCard href="/portal/support" eyebrow="Tickets" value={openTickets} hint={openTickets === 0 ? "keine offen" : "in Bearbeitung"} highlight={openTickets > 0} />
        </section>

        {/* QUICK ACTIONS */}
        <section className="mb-12">
          <p className="eyebrow mb-4">Quick actions</p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <ActionCard href="/portal/slots" label="Slot eintragen" />
            <ActionCard href="/portal/events" label="Events ansehen" />
            <ActionCard href="/portal/inbox" label="Inbox öffnen" />
            <ActionCard href="/portal/downloads" label="Downloads" />
            <ActionCard href="/portal/support" label="Support" />
          </div>
        </section>

        {/* NEXT-UP + ACTIVITY */}
        <section className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Next Slot / Event */}
          <div className="border border-champagne/15 p-6">
            <p className="eyebrow mb-4">Als nächstes</p>
            {nextSlot ? (
              <div className="mb-4">
                <p className="text-cream/50 text-[10px] uppercase tracking-[0.2em] mb-1">Dein Slot</p>
                <p className="font-display italic text-xl text-cream">
                  {new Date(nextSlot.start_at).toLocaleString("de-DE", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} Uhr
                </p>
                <p className="text-cream/50 text-xs mt-1">Status: {nextSlot.status}</p>
              </div>
            ) : (
              <p className="editorial-empty mb-4">
                Keine Termine in Sicht. Du entscheidest, wann.{" "}
                <Link href="/portal/slots" className="text-champagne hover:underline not-italic">Slot eintragen →</Link>
              </p>
            )}
            {nextEvent && (
              <div className="border-t border-champagne/10 pt-4">
                <p className="text-cream/50 text-[10px] uppercase tracking-[0.2em] mb-1">Nächstes Event</p>
                <p className="font-display italic text-lg text-cream truncate">{nextEvent.title}</p>
                <p className="text-cream/50 text-xs mt-1">
                  {new Date(nextEvent.start_at).toLocaleString("de-DE", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })} Uhr · {nextEvent.category}
                </p>
              </div>
            )}
          </div>

          {/* Recent Messages */}
          <div className="border border-champagne/15 p-6">
            <p className="eyebrow mb-4">Letzte Nachrichten</p>
            {recentMessages.length === 0 ? (
              <p className="editorial-empty">Stille Inbox. Wenn etwas wichtig ist, erfährst du es hier zuerst.</p>
            ) : (
              <ul className="space-y-3">
                {recentMessages.map((m) => (
                  <li key={m.id} className="border-b border-champagne/5 pb-3 last:border-b-0 last:pb-0">
                    <Link href="/portal/inbox" className="block hover:text-champagne transition-colors">
                      <p className="text-cream text-sm font-medium truncate">{m.subject || "(ohne Betreff)"}</p>
                      <p className="text-cream/40 text-xs mt-1">
                        {new Date(m.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        {/* SETUP-PROGRESS */}
        {progressDone < progressItems.length && (
          <section className="border border-champagne/15 p-6 md:p-8 mb-8">
            <div className="flex items-center justify-between mb-5">
              <p className="eyebrow">Dein Setup</p>
              <span className="text-champagne font-display italic text-2xl">{progressPct}%</span>
            </div>
            <div className="h-1 bg-champagne/10 mb-6 overflow-hidden">
              <div className="h-full bg-champagne transition-all duration-500" style={{ width: `${progressPct}%` }} />
            </div>
            <ul className="space-y-2">
              {progressItems.map((p) => (
                <li key={p.label}>
                  <Link
                    href={p.href}
                    className={`flex items-center gap-3 text-sm py-1 transition-colors ${p.done ? "text-cream/50" : "text-cream hover:text-champagne"}`}
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

function StatCard({ href, eyebrow, value, hint, highlight }: { href: string; eyebrow: string; value: number; hint: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`group card-lift border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15 hover:border-champagne hover:bg-champagne/5"}`}
    >
      <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-4 leading-tight">{eyebrow}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl ${highlight ? "text-champagne" : "text-cream group-hover:text-champagne"} transition-colors`}>{value}</p>
      <p className="text-cream/40 text-[10px] mt-3 leading-tight tracking-wide">{hint}</p>
    </Link>
  );
}

function ActionCard({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="card-lift border border-champagne/15 hover:border-champagne hover:bg-champagne/5 p-4 text-cream text-xs md:text-sm font-medium inline-flex items-center justify-center min-h-[72px] text-center leading-tight"
    >
      {label}
    </Link>
  );
}
