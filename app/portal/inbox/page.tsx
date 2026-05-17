import Link from "next/link";
import { createClient as createSrClient } from "@supabase/supabase-js";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ActivityFeed } from "@/components/inbox/ActivityFeed";
import { SystemNotificationsList } from "@/components/inbox/SystemNotificationsList";
import { InboxRealtime } from "@/components/inbox/InboxRealtime";
import { ParticipationShortcuts } from "@/components/inbox/ParticipationShortcuts";
import { GroupConversationList } from "@/components/inbox/GroupConversationList";
import { loadProfileLabels, formatPartnerLabel } from "@/lib/inbox/profile-labels";

export const dynamic = "force-dynamic";

type TabKey = "messages" | "groups" | "system" | "activity";

interface Props {
  searchParams: Promise<{ q?: string; tab?: string }>;
}

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

export default async function InboxPage({ searchParams }: Props) {
  const { supabase, profile } = await getAuthedProfile();
  const { loadLocale } = await import("@/lib/i18n");
  const { t } = await loadLocale();
  const params = await searchParams;
  const query = (params.q || "").trim();
  const tabRaw = params.tab as TabKey | undefined;
  const tab: TabKey =
    tabRaw === "system" || tabRaw === "activity" || tabRaw === "groups"
      ? tabRaw
      : "messages";

  // System-Tab geoeffnet → alle eigenen unread-Notifications als gelesen markieren.
  // Erfolgt VOR den Counts, damit das Badge im selben Render aktualisiert ist.
  if (tab === "system") {
    await supabase
      .from("notifications")
      .update({ status: "read", read_at: new Date().toISOString() })
      .eq("user_id", profile.id)
      .eq("status", "unread");
  }

  // Nur fuer Messages-Tab laden — andere Tabs brauchen das nicht
  let messages: Array<{
    id: string;
    subject: string;
    category: string;
    sent_at: string;
    requires_ack: boolean;
    sender_id: string | null;
    recipient_id: string | null;
    recipient_group: string | null;
    body: string;
  }> = [];
  let readMap = new Map<string, { read_at: string | null; acknowledged_at: string | null }>();
  let senderMap = new Map<string, string>();
  let unreadCount = 0;

  if (tab === "messages") {
    let req = supabase
      .from("messages")
      .select("id, subject, category, sent_at, requires_ack, sender_id, recipient_id, recipient_group, body")
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`)
      .order("sent_at", { ascending: false })
      .limit(80);
    if (query) req = req.or(`subject.ilike.%${query}%,body.ilike.%${query}%`);

    const { data: msgData } = await req;
    messages = (msgData as typeof messages) ?? [];

    const { data: reads } = await supabase
      .from("message_reads")
      .select("message_id, read_at, acknowledged_at")
      .eq("reader_id", profile.id);
    readMap = new Map((reads ?? []).map((r) => [r.message_id, r]));

    // Profiles-RLS blockt Creator von fremden Profilen → Service-Role-Lookup.
    // Liefert nur display_name + tiktok_username + role (keine PII).
    const senderIds = messages.map((m) => m.sender_id).filter((id): id is string => !!id);
    const labelMap = await loadProfileLabels(senderIds);
    labelMap.forEach((p, id) => senderMap.set(id, formatPartnerLabel(p)));
    unreadCount = messages.filter((m) => !readMap.has(m.id)).length;
  }

  // Unread-Counts fuer Tab-Badges. Fuer den Nachrichten-Tab brauchen wir
  // echtes "unread" (Messages MINUS message_reads), nicht die Gesamt-Zahl
  // aller Messages. HEAD-Count ohne JOIN haette ALLE Messages gezaehlt
  // (auch bereits gelesene Broadcasts) → Badge blieb stale.
  const [msgIdsRes, { count: sysUnreadCount }, groupCountRes] = await Promise.all([
    supabase
      .from("messages")
      .select("id")
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`)
      .order("sent_at", { ascending: false })
      .limit(200),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "unread"),
    // Tab-Badge: Service-Role-Read mit explizitem profile-id-Filter.
    // user-cookie + RLS-JOIN auf conversations liefert conversation=null
    // (siehe Live-Befund Diagnostics a6aa480). Service-Role + hart
    // gefilterte profile_id ist sicher.
    createSrClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )
      .from("conversation_members")
      .select("conversation_id, last_read_at, conversation:conversations(last_message_at,type)")
      .eq("profile_id", profile.id),
  ]);
  const allMsgIds = (msgIdsRes.data ?? []).map((m) => m.id);
  // message_reads MUSS via .in(allMsgIds) gefiltert werden — sonst kann
  // PostgREST bei unsortierten Result-Sets cappen und der frisch eingefuegte
  // Broadcast-Read fehlt → Badge bleibt stale.
  const { data: readRows } = allMsgIds.length
    ? await supabase
        .from("message_reads")
        .select("message_id")
        .eq("reader_id", profile.id)
        .in("message_id", allMsgIds)
    : { data: [] };
  const readMsgIds = new Set((readRows ?? []).map((r) => r.message_id));
  const msgUnreadCount = allMsgIds.filter((id) => !readMsgIds.has(id)).length;

  // Gruppen-Unread: pro Member-Row pruefen ob last_message_at > last_read_at
  type GroupRow = {
    last_read_at: string | null;
    conversation: { last_message_at: string | null; type: string } | null;
  };
  const groupUnread = ((groupCountRes.data as unknown) as GroupRow[] | null ?? []).filter((r) => {
    if (!r.conversation || r.conversation.type === "dm") return false;
    if (!r.conversation.last_message_at) return false;
    if (!r.last_read_at) return true;
    return new Date(r.conversation.last_message_at) > new Date(r.last_read_at);
  }).length;

  const TABS: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "messages", label: "Nachrichten", count: msgUnreadCount ?? 0 },
    { key: "groups", label: "Gruppen", count: groupUnread },
    { key: "system", label: "System", count: sysUnreadCount ?? 0 },
    { key: "activity", label: "Aktivitaet", count: 0 },
  ];

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

      <InboxRealtime userId={profile.id} />

      <main className="container-luxe py-12 md:py-16 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-6 mb-6 flex-wrap">
          <div>
            <p className="eyebrow mb-3">{t("nav.inbox")}</p>
            <h1 className="font-display italic text-cream text-4xl md:text-6xl leading-[0.95] tracking-[-0.02em]">
              {t("nav.inbox")}.
            </h1>
          </div>
          <Link
            href="/portal/inbox/compose"
            className="shrink-0 mt-3 text-cream/60 hover:text-champagne text-[10px] uppercase tracking-[0.3em] inline-flex items-center min-h-[40px] px-3 border border-cream/15 hover:border-champagne transition"
          >
            Verfassen
          </Link>
        </div>

        {/* TEILNAHMEN — kompakte Shortcuts zu Events/Match/Push/Academy */}
        <ParticipationShortcuts supabase={supabase} profileId={profile.id} />

        {/* TABS — Nachrichten / System / Aktivitaet */}
        <div className="flex border-b border-champagne/15 mb-8 -mx-2 overflow-x-auto">
          {TABS.map((t) => {
            const active = t.key === tab;
            const href = t.key === "messages" ? "/portal/inbox" : `/portal/inbox?tab=${t.key}`;
            return (
              <Link
                key={t.key}
                href={href}
                className={`px-3 py-3 text-[11px] uppercase tracking-[0.25em] transition-colors whitespace-nowrap inline-flex items-center gap-2 ${
                  active
                    ? "text-champagne border-b-2 border-champagne -mb-px"
                    : "text-cream/45 hover:text-cream"
                }`}
              >
                {t.label}
                {t.count > 0 && (
                  <span className={`px-1.5 py-0.5 text-[9px] tracking-normal ${
                    active ? "bg-champagne text-ink" : "bg-champagne/15 text-champagne"
                  }`}>
                    {t.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {tab === "messages" && (
          <>
            <p className="text-cream/45 text-sm mb-8">
              {messages.length} {messages.length === 1 ? "Nachricht" : "Nachrichten"}
              {unreadCount > 0 && (
                <span className="text-champagne"> · {unreadCount} ungelesen</span>
              )}
              {query && <span className="text-cream/35"> · Suche „{query}"</span>}
            </p>

            <form method="get" action="/portal/inbox" className="mb-10">
              <div className="relative">
                <input
                  type="search"
                  name="q"
                  defaultValue={query}
                  placeholder="Im Postfach suchen…"
                  className="w-full bg-transparent border-b border-cream/[0.08] focus:border-champagne/60 px-0 py-3 text-cream/85 text-base font-light focus:outline-none placeholder-cream/30 transition-colors"
                />
                {query && (
                  <Link
                    href="/portal/inbox"
                    className="absolute right-0 top-1/2 -translate-y-1/2 text-cream/40 hover:text-champagne text-[10px] uppercase tracking-[0.3em]"
                  >
                    Zuruecksetzen
                  </Link>
                )}
              </div>
            </form>

            {messages.length === 0 && (
              <div className="border border-champagne/15 p-8 text-center">
                <p className="font-display italic text-cream/45 text-xl mb-2">
                  Noch kein Chat.
                </p>
                <p className="text-cream/35 text-sm">
                  Schreib{" "}
                  <Link href="/portal/inbox/compose" className="text-champagne hover:underline">
                    ZOE Management direkt
                  </Link>.
                </p>
              </div>
            )}

            <ul className="divide-y divide-cream/[0.05]">
              {messages.map((msg) => {
                const readInfo = readMap.get(msg.id);
                const unread = !readInfo;
                const needsAck = msg.requires_ack && !readInfo?.acknowledged_at;
                const isBroadcast = msg.recipient_group != null;
                const partnerLabel = isBroadcast
                  ? "ZOE Broadcast"
                  : msg.sender_id === profile.id
                  ? "Gesendet"
                  : msg.sender_id
                  ? senderMap.get(msg.sender_id) || "—"
                  : "—";
                const initial = (partnerLabel || "?").slice(0, 1).toUpperCase();
                const preview = msg.subject || msg.body.slice(0, 80);

                return (
                  <li key={msg.id}>
                    <Link
                      href={`/portal/inbox/${msg.id}`}
                      className="group block py-4 md:py-5 transition-colors hover:bg-cream/[0.015]"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar-Bubble */}
                        <div className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full border flex items-center justify-center font-display italic text-base transition-colors ${
                          unread
                            ? "border-champagne/60 bg-champagne/10 text-champagne"
                            : "border-cream/15 bg-cream/[0.03] text-cream/55"
                        }`}>
                          {initial}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                            <p className={`text-sm md:text-base ${unread ? "text-cream font-medium" : "text-cream/70"}`}>
                              {partnerLabel}
                            </p>
                            <div className="flex items-center gap-2 shrink-0 text-[10px] uppercase tracking-[0.25em]">
                              {needsAck && <span className="text-champagne">Bestaetigen</span>}
                              <span className="text-cream/30">{formatRelative(new Date(msg.sent_at))}</span>
                            </div>
                          </div>
                          <p className={`text-sm leading-snug line-clamp-1 ${unread ? "text-cream/75" : "text-cream/45"}`}>
                            {preview}
                          </p>
                        </div>

                        {unread && (
                          <span
                            className="shrink-0 w-1.5 h-1.5 rounded-full bg-champagne"
                            aria-label="ungelesen"
                          />
                        )}
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
        )}

        {tab === "groups" && (
          <div>
            <div className="flex items-baseline justify-between gap-3 mb-6 flex-wrap">
              <p className="text-cream/45 text-sm">
                Gruppen-Chats. Admin erstellt Gruppen + Mitglieder.
              </p>
              {(profile.role === "admin" || profile.role === "manager") && (
                <Link
                  href="/portal/admin/inbox/groups/new"
                  className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] inline-flex items-center gap-1 px-3 py-2 border border-champagne/30"
                >
                  + Neue Gruppe
                </Link>
              )}
            </div>
            <GroupConversationList supabase={supabase} profileId={profile.id} />
          </div>
        )}

        {tab === "system" && (
          <div>
            <p className="text-cream/45 text-sm mb-6">
              System-Hinweise und automatische Statusmeldungen.
            </p>
            <SystemNotificationsList supabase={supabase} userId={profile.id} />
          </div>
        )}

        {tab === "activity" && (
          <div>
            <p className="text-cream/45 text-sm mb-6">
              Was im ZOE-Network passiert.
            </p>
            <ActivityFeed supabase={supabase} />
          </div>
        )}
      </main>
    </>
  );
}
