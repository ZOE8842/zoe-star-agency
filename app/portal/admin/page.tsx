import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
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

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  if (!profile || !["manager", "admin"].includes(profile.role)) redirect("/portal");
  const isAdmin = profile.role === "admin";

  const now = new Date();

  // Bei Manager: alle Creator-Queries auf manager_id = self scopen
  const scopedProfiles = supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "creator")
    .eq("status", "active");

  const [
    totalUsersRes,
    activeCreatorsRes,
    openTicketsRes,
    openInvitesRes,
    upcomingEventsRes,
    recentSignupsRes,
    recentInvitesRes,
    recentTicketsRes,
  ] = await Promise.all([
    isAdmin
      ? supabase.from("profiles").select("id", { count: "exact", head: true })
      : supabase.from("profiles").select("id", { count: "exact", head: true }).eq("manager_id", profile.id),
    isAdmin ? scopedProfiles : scopedProfiles.eq("manager_id", profile.id),
    isAdmin
      ? supabase.from("support_tickets").select("id", { count: "exact", head: true })
          .in("status", ["open", "in_progress"])
      : Promise.resolve({ count: 0 }),
    isAdmin
      ? supabase.from("invites").select("id", { count: "exact", head: true }).is("used_at", null)
      : Promise.resolve({ count: 0 }),
    supabase.from("events").select("id", { count: "exact", head: true })
      .eq("status", "open").gte("start_at", now.toISOString()),
    isAdmin
      ? supabase.from("profiles")
          .select("id, display_name, tiktok_username, role, joined_at, avatar_url")
          .order("joined_at", { ascending: false }).limit(5)
      : supabase.from("profiles")
          .select("id, display_name, tiktok_username, role, joined_at, avatar_url")
          .eq("manager_id", profile.id)
          .order("joined_at", { ascending: false }).limit(5),
    isAdmin
      ? supabase.from("invites")
          .select("id, code, intended_role, used_at, expires_at, created_at")
          .order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    isAdmin
      ? supabase.from("support_tickets")
          .select("id, subject, status, created_at, creator_id")
          .order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
  ]);

  const totalUsers = totalUsersRes.count ?? 0;
  const activeCreators = activeCreatorsRes.count ?? 0;
  const openTickets = openTicketsRes.count ?? 0;
  const openInvites = openInvitesRes.count ?? 0;
  const upcomingEvents = upcomingEventsRes.count ?? 0;
  const recentSignups = recentSignupsRes.data ?? [];
  const recentInvites = recentInvitesRes.data ?? [];
  const recentTickets = recentTicketsRes.data ?? [];

  // OPERATIONS-OVERVIEW · alle offenen Anfragen / Reviews zentral
  // Admin-only, kein Manager-Scoping noetig.
  let ops = {
    creators_pending: 0,
    tiktok_push: 0,
    phone_request: 0,
    live_absence: 0,
    content_helper: 0,
    big_match: 0,
    account_analyse: 0,
    live_report: 0,
    showcase_pending: 0,
    dm_queue: 0,
    dm_failed: 0,
  };
  if (isAdmin) {
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const [
      pendingRes, pushRes, phoneRes, absRes, contentRes, matchRes,
      aaRes, lpRes, showcaseRes, dmQueueRes, dmFailRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { head: true, count: "exact" })
        .eq("role", "creator").eq("status", "pending")
        .eq("onboarding_completed", true),
      supabase.from("tiktok_push_requests").select("id", { head: true, count: "exact" })
        .eq("status", "submitted"),
      supabase.from("phone_call_requests").select("id", { head: true, count: "exact" })
        .eq("status", "open"),
      supabase.from("live_absences").select("id", { head: true, count: "exact" })
        .eq("status", "submitted"),
      supabase.from("content_reviews").select("id", { head: true, count: "exact" })
        .in("status", ["submitted", "queued", "processing"]),
      supabase.from("match_requests").select("id", { head: true, count: "exact" })
        .in("status", ["requested", "in_review", "partner_found"]),
      supabase.from("account_analyses").select("id", { head: true, count: "exact" })
        .in("status", ["submitted", "queued", "processing"]),
      supabase.from("live_performance_reports").select("id", { head: true, count: "exact" })
        .in("status", ["submitted", "queued", "processing"]),
      supabase.from("showcase_creators").select("id", { head: true, count: "exact" })
        .eq("is_approved", false),
      supabase.from("platform_notifications").select("id", { head: true, count: "exact" })
        .eq("status", "queued"),
      supabase.from("platform_notifications").select("id", { head: true, count: "exact" })
        .eq("status", "failed"),
    ]);
    ops = {
      creators_pending: pendingRes.count ?? 0,
      tiktok_push: pushRes.count ?? 0,
      phone_request: phoneRes.count ?? 0,
      live_absence: absRes.count ?? 0,
      content_helper: contentRes.count ?? 0,
      big_match: matchRes.count ?? 0,
      account_analyse: aaRes.count ?? 0,
      live_report: lpRes.count ?? 0,
      showcase_pending: showcaseRes.count ?? 0,
      dm_queue: dmQueueRes.count ?? 0,
      dm_failed: dmFailRes.count ?? 0,
    };
  }
  const opsTotal = Object.values(ops).reduce((s, n) => s + n, 0);

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={!isAdmin}
      />

      <main className="container-luxe py-12 md:py-20">
        {/* WELCOME — Admin/Manager mit Datum-Eyebrow */}
        <section className="mb-14 md:mb-20">
          <p className="eyebrow mb-5 md:mb-6">
            {new Date().toLocaleDateString("de-DE", { weekday: "long", day: "2-digit", month: "long" })} · {isAdmin ? "Admin Console" : "Manager Cockpit"}
          </p>
          <h1 className="heading-display text-4xl md:text-6xl leading-[1.05]">
            {isAdmin ? (
              <>System <span className="text-champagne">overview.</span></>
            ) : (
              <>Mein <span className="text-champagne">Roster.</span></>
            )}
          </h1>
          <p className="text-cream/55 text-xs md:text-sm mt-3 italic font-display">{greeting()}.</p>
          <div className="hero-mark" />
        </section>

        {/* STATS */}
        <section className={`grid grid-cols-2 ${isAdmin ? "md:grid-cols-5" : "md:grid-cols-3"} gap-3 md:gap-4 mb-12`}>
          <Stat
            label={isAdmin ? "Users total" : "Mein Roster"}
            value={totalUsers}
            href="/portal/admin/users"
          />
          <Stat label="Active Creators" value={activeCreators} href="/portal/admin/users" />
          {isAdmin && (
            <Stat label="Open Invites" value={openInvites} href="/portal/admin/invites" highlight={openInvites > 0} />
          )}
          <Stat label="Events offen" value={upcomingEvents} href="/portal/admin/events" />
          {isAdmin && (
            <Stat label="Tickets offen" value={openTickets} href="/portal/admin/users" highlight={openTickets > 0} />
          )}
        </section>

        {/* OPERATIONS-COCKPIT — alle offenen Anfragen auf einen Blick */}
        {isAdmin && (
          <section className="mb-12">
            <div className="flex items-baseline justify-between mb-4">
              <p className="eyebrow">Operations · offen ({opsTotal})</p>
              <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                Stand jetzt
              </span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 md:gap-3">
              <OpsTile href="/portal/admin/pending" label="Creator pending" count={ops.creators_pending} />
              <OpsTile href="/portal/admin/services/tiktok-push" label="TikTok-Push" count={ops.tiktok_push} />
              <OpsTile href="/portal/admin/services/phone-requests" label="Telefon" count={ops.phone_request} />
              <OpsTile href="/portal/admin/services/live-absences" label="Abmeldung" count={ops.live_absence} />
              <OpsTile href="/portal/admin/services/content-helper" label="Content-Helfer" count={ops.content_helper} />
              <OpsTile href="/portal/admin/services/big-match" label="Big Match" count={ops.big_match} />
              <OpsTile href="/portal/admin/analyse/account" label="Account-Analyse" count={ops.account_analyse} />
              <OpsTile href="/portal/admin/analyse/live" label="LIVE-Report" count={ops.live_report} />
              <OpsTile href="/portal/admin/showcase" label="Showcase pending" count={ops.showcase_pending} />
              <OpsTile href="/portal/admin/notifications-queue" label="DM-Queue" count={ops.dm_queue} />
              <OpsTile href="/portal/admin/notifications-queue" label="DM-Fail" count={ops.dm_failed} warn={ops.dm_failed > 0} />
            </div>
          </section>
        )}

        {/* QUICK ACTIONS */}
        <section className="mb-12">
          <p className="eyebrow mb-4">Quick actions</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
            <AdminTile href="/portal/admin/users" title={isAdmin ? "Users" : "Roster"} hint={isAdmin ? "Rollen · Status · Sperren" : "Eigene Creator"} />
            {isAdmin && (
              <>
                <AdminTile href="/portal/admin/invites" title="Invites" hint="Codes generieren" />
                <AdminTile href="/portal/admin/showcase" title="Showcase" hint="Creator-Cards · Approve" />
                <AdminTile href="/portal/admin/pending" title="Creator Aufnahme" hint="Pending freigeben" />
                <AdminTile href="/portal/admin/services/big-match" title="Big Match" hint="Match-Anfragen · Queue" />
                <AdminTile href="/portal/admin/notifications-queue" title="TikTok-DM Queue" hint="External-Push · Status · Retry" />
                <AdminTile href="/portal/admin/analyse/account" title="Account Analyse" hint="Profil-Reviews · Queue" />
                <AdminTile href="/portal/admin/analyse/live" title="LIVE Performance" hint="KPI-Reports · Queue" />
                <AdminTile href="/portal/admin/analyse/health" title="Analyse Health" hint="Datenquellen · Errors · Cost" />
                <AdminTile href="/portal/admin/challenges" title="Academy Challenges" hint="Anlegen · Aktivieren · Gewinner" />
                <AdminTile href="/portal/admin/messages" title="Broadcasts" hint="Nachrichten an Gruppen" />
                <AdminTile href="/portal/admin/downloads" title="Downloads" hint="Asset-Library" />
                <AdminTile href="/portal/admin/analytics" title="Analytics" hint="Login · Aktivität" />
              </>
            )}
            <AdminTile href="/portal/admin/events" title="Events" hint={isAdmin ? "CRUD + Anmeldungen" : "Übersicht"} />
          </div>
        </section>

        {/* ACTIVITY FEEDS */}
        <section className={`grid ${isAdmin ? "md:grid-cols-2" : "md:grid-cols-1"} gap-6 mb-8`}>
          {/* Recent Signups */}
          <div className="border border-champagne/15 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow">Neueste Creator</p>
              <Link href="/portal/admin/users" className="text-champagne text-[10px] uppercase tracking-[0.2em] hover:text-champagne-300">Alle →</Link>
            </div>
            {recentSignups.length === 0 ? (
              <p className="editorial-empty">Noch keine Stimmen im Roster.</p>
            ) : (
              <ul className="space-y-3">
                {recentSignups.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    {p.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover border border-champagne/20 shrink-0" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-champagne/10 border border-champagne/20 flex items-center justify-center text-champagne text-xs font-display italic shrink-0">
                        {(p.display_name || "?").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-cream text-sm truncate">{p.display_name}</p>
                      <p className="text-cream/40 text-[10px] truncate">@{p.tiktok_username} · {p.role}</p>
                    </div>
                    <span className="text-cream/30 text-[10px] uppercase tracking-[0.15em] shrink-0">
                      {new Date(p.joined_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Recent Invites — Admin-only */}
          {isAdmin && (
          <div className="border border-champagne/15 p-6">
            <div className="flex items-center justify-between mb-4">
              <p className="eyebrow">Letzte Invites</p>
              <Link href="/portal/admin/invites" className="text-champagne text-[10px] uppercase tracking-[0.2em] hover:text-champagne-300">Alle →</Link>
            </div>
            {recentInvites.length === 0 ? (
              <p className="editorial-empty">Noch keine Einladungen versandt.</p>
            ) : (
              <ul className="space-y-3">
                {recentInvites.map((i) => {
                  const used = !!i.used_at;
                  const expired = i.expires_at && new Date(i.expires_at) < now;
                  const status = used ? "used" : expired ? "expired" : "open";
                  const statusColor = used ? "text-cream/40" : expired ? "text-red-400/70" : "text-champagne";
                  return (
                    <li key={i.id} className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className={`font-mono text-xs truncate ${used ? "text-cream/40 line-through" : "text-cream"}`}>{i.code}</p>
                        <p className="text-cream/40 text-[10px]">{i.intended_role}</p>
                      </div>
                      <span className={`text-[10px] uppercase tracking-[0.2em] shrink-0 ${statusColor}`}>{status}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          )}
        </section>

        {/* Recent Tickets (full-width) — Admin-only */}
        {isAdmin && (
        <section className="border border-champagne/15 p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="eyebrow">Letzte Support-Tickets</p>
            <Link href="/portal/support" className="text-champagne text-[10px] uppercase tracking-[0.2em] hover:text-champagne-300">Alle →</Link>
          </div>
          {recentTickets.length === 0 ? (
            <p className="editorial-empty">Alles ruhig im Support.</p>
          ) : (
            <ul className="space-y-2">
              {recentTickets.map((t) => (
                <li key={t.id} className="flex items-center gap-3 py-2 border-b border-champagne/5 last:border-b-0">
                  <span className={`text-[10px] uppercase tracking-[0.2em] shrink-0 px-2 py-0.5 border ${
                    t.status === "open" ? "border-champagne text-champagne" :
                    t.status === "in_progress" ? "border-cream/40 text-cream/60" :
                    "border-cream/20 text-cream/40"
                  }`}>{t.status}</span>
                  <p className="text-cream text-sm truncate flex-1">{t.subject}</p>
                  <span className="text-cream/30 text-[10px] uppercase tracking-[0.15em] shrink-0">
                    {new Date(t.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
        )}
      </main>
    </>
  );
}

function Stat({ label, value, href, highlight }: { label: string; value: number; href: string; highlight?: boolean }) {
  return (
    <Link
      href={href}
      className={`group card-lift border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15 hover:border-champagne hover:bg-champagne/5"}`}
    >
      <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-4 leading-tight">{label}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl ${highlight ? "text-champagne" : "text-cream group-hover:text-champagne"} transition-colors`}>{value}</p>
    </Link>
  );
}

function OpsTile({ href, label, count, warn }: { href: string; label: string; count: number; warn?: boolean }) {
  const highlight = count > 0;
  const isWarn = warn && count > 0;
  return (
    <Link
      href={href}
      className={`group border p-3 md:p-4 transition-colors ${
        isWarn
          ? "border-red-400/40 bg-red-400/5"
          : highlight
          ? "border-champagne bg-champagne/5"
          : "border-champagne/10 hover:border-champagne/30"
      }`}
    >
      <p className={`text-[9px] uppercase tracking-[0.22em] mb-2 ${highlight ? "text-champagne" : "text-cream/45"}`}>
        {label}
      </p>
      <p className={`font-display italic font-black text-2xl md:text-3xl leading-none ${
        isWarn ? "text-red-300/85" : highlight ? "text-champagne" : "text-cream/55"
      }`}>
        {count}
      </p>
    </Link>
  );
}

function AdminTile({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group card-lift border border-champagne/15 p-6 md:p-7 hover:border-champagne hover:bg-champagne/5"
    >
      <h3 className="font-display italic font-black text-xl md:text-2xl text-cream mb-2 group-hover:text-champagne transition-colors">
        {title}
      </h3>
      <p className="text-cream/45 text-xs leading-relaxed tracking-wide">{hint}</p>
    </Link>
  );
}
