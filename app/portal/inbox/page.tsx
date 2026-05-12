import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ActivityFeed } from "@/components/inbox/ActivityFeed";
import { SystemNotificationsList } from "@/components/inbox/SystemNotificationsList";
import { InboxRealtime } from "@/components/inbox/InboxRealtime";
import { ParticipationShortcuts } from "@/components/inbox/ParticipationShortcuts";

export const dynamic = "force-dynamic";

type TabKey = "messages" | "system" | "activity";

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
  const params = await searchParams;
  const query = (params.q || "").trim();
  const tabRaw = params.tab as TabKey | undefined;
  const tab: TabKey = tabRaw === "system" || tabRaw === "activity" ? tabRaw : "messages";

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

    const senderIds = Array.from(new Set(messages.map((m) => m.sender_id).filter(Boolean) as string[]));
    if (senderIds.length > 0) {
      const { data: senders } = await supabase
        .from("profiles")
        .select("id, display_name, role")
        .in("id", senderIds);
      (senders ?? []).forEach((s) => {
        // Admin-Sender als "ZOE Management" anzeigen, Creator mit Display-Name
        const label = s.role === "admin" || s.role === "manager"
          ? "ZOE Management"
          : s.display_name || "Creator";
        senderMap.set(s.id, label);
      });
    }
    unreadCount = messages.filter((m) => !readMap.has(m.id)).length;
  }

  // Unread-Counts fuer Tab-Badges (immer laden, leichtgewichtig)
  const [{ count: msgUnreadCount }, { count: sysUnreadCount }] = await Promise.all([
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profile.id)
      .eq("status", "unread"),
  ]);

  const TABS: Array<{ key: TabKey; label: string; count: number }> = [
    { key: "messages", label: "Nachrichten", count: msgUnreadCount ?? 0 },
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
            <p className="eyebrow mb-3">Postfach</p>
            <h1 className="font-display italic text-cream text-4xl md:text-6xl leading-[0.95] tracking-[-0.02em]">
              Inbox.
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
                  Keine Nachrichten.
                </p>
                <p className="text-cream/35 text-sm">
                  Sobald jemand schreibt, taucht es hier auf. Du kannst auch selbst{" "}
                  <Link href="/portal/inbox/compose" className="text-champagne hover:underline">
                    eine Nachricht verfassen
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

                return (
                  <li key={msg.id}>
                    <Link
                      href={`/portal/inbox/${msg.id}`}
                      className="group block py-6 md:py-7 transition-colors hover:bg-cream/[0.015]"
                    >
                      <div className="flex items-start gap-4">
                        <div className="shrink-0 w-1 self-stretch">
                          {unread && (
                            <span
                              className="block w-1 h-1 rounded-full bg-champagne mt-3"
                              aria-label="ungelesen"
                            />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2 text-[10px] uppercase tracking-[0.25em] flex-wrap">
                            <span className="text-cream/55">{partnerLabel}</span>
                            {needsAck && (
                              <span className="text-champagne">Bestaetigen</span>
                            )}
                            <span className="text-cream/30 ml-auto">
                              {formatRelative(new Date(msg.sent_at))}
                            </span>
                          </div>

                          <h2
                            className={`font-display italic text-xl md:text-2xl mb-2 leading-tight tracking-[-0.01em] transition-colors ${
                              unread ? "text-cream group-hover:text-champagne" : "text-cream/70 group-hover:text-cream"
                            }`}
                          >
                            {msg.subject || "(ohne Betreff)"}
                          </h2>

                          <p className="text-cream/45 text-sm leading-relaxed line-clamp-2">
                            {msg.body}
                          </p>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </>
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
