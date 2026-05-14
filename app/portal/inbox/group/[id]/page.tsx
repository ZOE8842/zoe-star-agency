import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { markConversationRead } from "@/lib/inbox/conversations";
import { loadProfileLabels, formatPartnerLabel } from "@/lib/inbox/profile-labels";
import { GroupReplyForm } from "./GroupReplyForm";
import { GroupMembersDisclosure, type GroupMemberInfo } from "@/components/inbox/GroupMembersDisclosure";
import { GroupAckButton } from "@/components/inbox/GroupAckButton";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// Service-Role-Bypass nach Auth-Check: User-Cookie-RLS auf conversations
// braucht conv_admin_all (admin) ODER cm_self_read (Member). In seltenen
// Faellen greift die RLS-policy nicht direkt nach Insert (Caching/Replica) →
// Conversation wirkt fuer Admin wie 404. Service-Role nach Auth-Check ist
// safe weil wir Membership/Role explizit selbst pruefen.
function srClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export default async function GroupChatPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await getAuthedProfile();
  const isAdmin = profile.role === "admin";
  const isManager = profile.role === "manager";
  const isStaff = isAdmin || isManager;
  const sr = srClient();

  // Member-Gate via Service-Role
  const { data: member } = await sr
    .from("conversation_members")
    .select("id, role")
    .eq("conversation_id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!member && !isStaff) notFound();

  const { data: conv } = await sr
    .from("conversations")
    .select("id, type, title, created_at, last_message_at")
    .eq("id", id)
    .maybeSingle();
  if (!conv) notFound();

  // Messages laden — Service-Role, weil messages-RLS fuer Creator nur
  // eigene direct + broadcasts liefert; Gruppen-Messages wuerden gefiltert.
  const { data: msgs } = await sr
    .from("messages")
    .select("id, sender_id, body, sent_at, requires_ack")
    .eq("conversation_id", id)
    .order("sent_at", { ascending: true })
    .limit(200);

  // V2 · Acknowledge-Status: fuer alle requires_ack-Messages in der Liste
  // pruefen ob aktueller User schon acked hat + Gesamt-Ack-Count fuer Staff.
  const ackMsgIds = (msgs ?? []).filter((m) => m.requires_ack).map((m) => m.id);
  const { data: ackReads } = ackMsgIds.length
    ? await sr
        .from("message_reads")
        .select("message_id, reader_id, acknowledged_at")
        .in("message_id", ackMsgIds)
        .not("acknowledged_at", "is", null)
    : { data: [] };
  const myAckSet = new Set(
    (ackReads ?? []).filter((r) => r.reader_id === profile.id).map((r) => r.message_id),
  );
  const ackCountMap = new Map<string, number>();
  for (const r of ackReads ?? []) {
    ackCountMap.set(r.message_id, (ackCountMap.get(r.message_id) ?? 0) + 1);
  }

  // V2 · Group-Members fuer Disclosure-Liste. Service-Role weil profiles-RLS
  // Cross-Reads blockt. Hart gefiltert ueber conversation_id.
  const { data: cmRows } = await sr
    .from("conversation_members")
    .select("profile_id, role")
    .eq("conversation_id", id);
  const memberProfileIds = (cmRows ?? []).map((r) => r.profile_id);
  const { data: memberProfiles } = memberProfileIds.length
    ? await sr
        .from("profiles")
        .select("id, display_name, tiktok_username, role")
        .in("id", memberProfileIds)
    : { data: [] };
  const profileLookup = new Map<string, { id: string; display_name: string | null; tiktok_username: string | null; role: string }>(
    (memberProfiles ?? []).map((p) => [p.id, p]),
  );
  const groupMembers: GroupMemberInfo[] = (cmRows ?? []).map((m) => {
    const p = profileLookup.get(m.profile_id);
    return {
      id: m.profile_id,
      display_name: p?.display_name ?? null,
      tiktok_username: p?.tiktok_username ?? null,
      role: p?.role ?? "creator",
      member_role: m.role,
      is_me: m.profile_id === profile.id,
    };
  }).sort((a, b) => {
    // Owner zuerst, dann Du, dann display_name alphabetisch
    if (a.member_role === "owner" && b.member_role !== "owner") return -1;
    if (b.member_role === "owner" && a.member_role !== "owner") return 1;
    if (a.is_me && !b.is_me) return -1;
    if (b.is_me && !a.is_me) return 1;
    return (a.display_name ?? "").localeCompare(b.display_name ?? "");
  });

  // Service-Role-Lookup, weil profiles-RLS Cross-User-Reads blockiert
  const senderIds = (msgs ?? []).map((m) => m.sender_id).filter((id): id is string => !!id);
  const profileMap = await loadProfileLabels(senderIds);
  const senderMap = new Map<string, string>();
  profileMap.forEach((p, id) => senderMap.set(id, formatPartnerLabel(p)));

  // Mark-Read: synchron mit revalidatePath. Defensive — markConversationRead
  // soll nie die Detail-Page crashen.
  if (member) {
    try {
      await markConversationRead(id);
    } catch (e) {
      console.error("[group-detail] markConversationRead failed:", e);
    }
  }

  // Schreib-Recht: in Channels nur Admin/Manager; in Gruppen alle Member.
  // Admin/Manager duerfen ueberall schreiben (auch ohne Member-Row).
  const canWrite =
    conv.type === "channel"
      ? isStaff
      : !!member || isStaff;

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={isManager}
      />

      <main className="container-luxe py-10 md:py-16 max-w-[640px] mx-auto">
        <div className="flex items-baseline justify-between gap-3 mb-8 flex-wrap">
          <Link
            href="/portal/inbox?tab=groups"
            className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em]"
          >
            ← Gruppen
          </Link>
          {isStaff && (
            <Link
              href={`/portal/admin/inbox/groups/${conv.id}`}
              className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
            >
              {isAdmin ? "Admin · Verwalten →" : "Manager · Verwalten →"}
            </Link>
          )}
        </div>

        <div className="mb-8 pb-6 border-b border-cream/[0.06]">
          <p className="text-cream/45 text-[10px] uppercase tracking-[0.3em] mb-2">
            {conv.type === "channel" ? "Channel" : conv.type === "event" ? "Event" : "Gruppe"}
          </p>
          <h1 className="font-display italic text-champagne text-2xl md:text-3xl leading-tight">
            {conv.title}
          </h1>
        </div>

        <GroupMembersDisclosure members={groupMembers} />

        <article className="space-y-4 mb-6">
          {(msgs ?? []).map((m) => {
            const isFromMe = m.sender_id === profile.id;
            const senderName = m.sender_id ? senderMap.get(m.sender_id) : null;
            const needsAck = !!m.requires_ack && !isFromMe;
            const myAcked = myAckSet.has(m.id);
            const ackCount = ackCountMap.get(m.id) ?? 0;
            return (
              <div
                key={m.id}
                className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] md:max-w-[75%] ${isFromMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isFromMe && senderName && (
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-1.5 px-1">
                      {senderName}
                    </p>
                  )}
                  <div
                    className={`px-4 py-3 md:px-5 md:py-4 leading-relaxed whitespace-pre-wrap text-sm md:text-base ${
                      isFromMe
                        ? "bg-champagne text-ink"
                        : "bg-cream/[0.05] text-cream/90 border border-cream/[0.08]"
                    }`}
                  >
                    {m.body}
                  </div>
                  <p
                    className={`text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-1.5 px-1 ${
                      isFromMe ? "text-right" : ""
                    }`}
                  >
                    {new Date(m.sent_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {new Date(m.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                    {m.requires_ack && <span className="text-champagne ml-2">· Pflicht</span>}
                  </p>
                  {needsAck && (
                    <GroupAckButton
                      messageId={m.id}
                      conversationId={conv.id}
                      acknowledged={myAcked}
                      ackCount={ackCount}
                      showCount={isStaff}
                    />
                  )}
                  {isFromMe && m.requires_ack && isStaff && (
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mt-2 px-1">
                      {ackCount > 0 ? `${ackCount} Bestaetigungen` : "Noch keine Bestaetigung"}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
          {(msgs ?? []).length === 0 && (
            <div className="border border-champagne/15 p-8 text-center">
              <p className="font-display italic text-cream/45 text-lg">
                Noch keine Nachrichten.
              </p>
              <p className="text-cream/35 text-sm mt-2">
                Schreib die erste — unten.
              </p>
            </div>
          )}
        </article>

        {canWrite ? (
          <GroupReplyForm
            conversationId={conv.id}
            showAckToggle={conv.type === "channel" && isStaff}
          />
        ) : (
          <div className="border-t border-cream/[0.06] pt-4 mt-6">
            <p className="text-cream/45 text-sm">
              {conv.type === "channel"
                ? "In diesem Channel schreibt nur ZOE Management."
                : "Du kannst hier aktuell nicht schreiben."}
            </p>
          </div>
        )}
      </main>
    </>
  );
}
