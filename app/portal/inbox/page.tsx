import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export default async function InboxPage() {
  const { supabase, profile } = await getAuthedProfile();

  // Nachrichten holen — RLS sortiert was sichtbar ist
  const { data: messages } = await supabase
    .from("messages")
    .select("id, subject, category, sent_at, requires_ack, sender_id, body")
    .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`)
    .order("sent_at", { ascending: false })
    .limit(50);

  // Read-Status fuer den User holen
  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id, read_at, acknowledged_at")
    .eq("reader_id", profile.id);

  const readMap = new Map((reads || []).map(r => [r.message_id, r]));

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Postfach</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Inbox <span className="text-champagne">·</span> {messages?.length || 0} messages
        </h1>
        <p className="text-cream/60 text-sm mb-12">Direct messages, broadcasts, and event updates.</p>

        {(!messages || messages.length === 0) && (
          <div className="border border-champagne/15 p-10 text-center">
            <p className="text-cream/40 text-sm">No messages yet.</p>
          </div>
        )}

        <div className="space-y-2">
          {messages?.map((msg) => {
            const readInfo = readMap.get(msg.id);
            const unread = !readInfo;
            const needsAck = msg.requires_ack && !readInfo?.acknowledged_at;

            return (
              <Link
                key={msg.id}
                href={`/portal/inbox/${msg.id}`}
                className={`group block border p-5 transition-all duration-200
                  ${unread ? "border-champagne bg-champagne/5" : "border-champagne/15"}
                  ${needsAck ? "border-l-4 border-l-champagne" : ""}
                  hover:bg-champagne/5`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="eyebrow">{msg.category}</span>
                      {unread && <span className="w-1.5 h-1.5 rounded-full bg-champagne" />}
                      {needsAck && (
                        <span className="text-[10px] uppercase tracking-[0.2em] text-champagne">
                          Acknowledge required
                        </span>
                      )}
                    </div>
                    <h3 className="font-display italic text-lg text-cream group-hover:text-champagne transition-colors mb-1">
                      {msg.subject}
                    </h3>
                    <p className="text-cream/50 text-sm line-clamp-2">{msg.body}</p>
                  </div>
                  <span className="text-cream/40 text-[10px] uppercase tracking-[0.25em] whitespace-nowrap">
                    {new Date(msg.sent_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
