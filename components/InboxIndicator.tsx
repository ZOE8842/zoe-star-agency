import { createClient } from "@/lib/supabase/server";

// Subtile Inbox-Indicator fuer PortalNav
// Zeigt einen kleinen Champagne-Dot wenn es ungelesene Nachrichten gibt.
// Keine Zahl, kein Badge, keine roten Kreise — nur Dot.

export async function InboxIndicator({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: messages } = await supabase
    .from("messages")
    .select("id")
    .or(`recipient_id.eq.${userId},recipient_group.eq.all_creators`)
    .order("sent_at", { ascending: false })
    .limit(80);

  if (!messages || messages.length === 0) return null;

  const messageIds = messages.map((m) => m.id);
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id")
    .eq("reader_id", userId)
    .in("message_id", messageIds);

  const readSet = new Set((reads || []).map((r) => r.message_id));
  const hasUnread = messages.some((m) => !readSet.has(m.id));

  if (!hasUnread) return null;

  return (
    <span
      aria-label="ungelesene Nachrichten"
      className="inline-block w-1 h-1 rounded-full bg-champagne ml-1.5 align-middle"
    />
  );
}
