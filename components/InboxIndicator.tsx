import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createSrClient } from "@supabase/supabase-js";

// Inbox-Glocke: zaehlt ungelesene Messages + System-Notifications und
// rendert einen Bell-Icon mit Badge. Klick fuehrt zu /portal/inbox.
//
// Verwendung in PortalNav:
//   <InboxIndicator userId={userId} variant="dot" />   ← klein (Sub-Nav)
//   <InboxIndicator userId={userId} variant="bell" />  ← gross (Header)
//
// Group-Count (conversation_members + JOIN) muss via Service-Role laufen:
// user-cookie + RLS-EXISTS-Subquery liefert conversation=null im JOIN
// (siehe Live-Befund a6aa480). Wir filtern hart auf userId, kein Cross-User-Leak.

interface Props {
  userId: string;
  variant?: "dot" | "bell";
}

function sr() {
  return createSrClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function InboxIndicator({ userId, variant = "dot" }: Props) {
  const supabase = await createClient();
  const srClient = sr();

  const [{ data: messages }, { count: notifUnread }, { data: convMembers }] = await Promise.all([
    supabase
      .from("messages")
      .select("id")
      .or(`recipient_id.eq.${userId},recipient_group.eq.all_creators`)
      .order("sent_at", { ascending: false })
      .limit(200),
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "unread"),
    srClient
      .from("conversation_members")
      .select("last_read_at, conversation:conversations(last_message_at, type)")
      .eq("profile_id", userId),
  ]);

  let msgUnread = 0;
  if (messages && messages.length > 0) {
    const messageIds = messages.map((m) => m.id);
    const { data: reads } = await supabase
      .from("message_reads")
      .select("message_id")
      .eq("reader_id", userId)
      .in("message_id", messageIds);
    const readSet = new Set((reads ?? []).map((r) => r.message_id));
    msgUnread = messages.filter((m) => !readSet.has(m.id)).length;
  }

  // Gruppen-Unread im Bell-Count beruecksichtigen
  type ConvMemberRow = {
    last_read_at: string | null;
    conversation: { last_message_at: string | null; type: string } | null;
  };
  const groupUnread = ((convMembers as unknown) as ConvMemberRow[] | null ?? []).filter((r) => {
    if (!r.conversation || r.conversation.type === "dm") return false;
    if (!r.conversation.last_message_at) return false;
    if (!r.last_read_at) return true;
    return new Date(r.conversation.last_message_at) > new Date(r.last_read_at);
  }).length;

  const total = msgUnread + (notifUnread ?? 0) + groupUnread;

  if (variant === "dot") {
    if (total === 0) return null;
    return (
      <span
        aria-label="ungelesene Nachrichten"
        className="inline-block w-1 h-1 rounded-full bg-champagne ml-1.5 align-middle"
      />
    );
  }

  // bell-variant: voller Icon-Button mit Badge
  // Wenn mehr System-Notifications als Messages ungelesen → System-Tab oeffnen.
  const target =
    (notifUnread ?? 0) > msgUnread
      ? "/portal/inbox?tab=system"
      : "/portal/inbox";
  const display = total > 99 ? "99+" : String(total);
  return (
    <Link
      href={target}
      aria-label={total === 0 ? "Inbox" : `Inbox · ${total} ungelesen`}
      className="relative inline-flex items-center justify-center w-9 h-9 text-cream/65 hover:text-champagne transition-colors"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
        <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
      </svg>
      {total > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-champagne text-ink text-[9px] font-medium leading-[16px] text-center">
          {display}
        </span>
      )}
    </Link>
  );
}
