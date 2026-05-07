import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

const CATEGORY_LABEL: Record<string, string> = {
  broadcast: "Broadcast",
  direct: "Direkt",
  event: "Event",
  reminder: "Reminder",
  system: "System",
};

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { supabase, profile } = await getAuthedProfile();
  const params = await searchParams;
  const query = (params.q || "").trim();

  let req = supabase
    .from("messages")
    .select("id, subject, category, sent_at, requires_ack, sender_id, body")
    .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`)
    .order("sent_at", { ascending: false })
    .limit(80);

  if (query) {
    req = req.or(`subject.ilike.%${query}%,body.ilike.%${query}%`);
  }

  const { data: messages } = await req;

  const { data: reads } = await supabase
    .from("message_reads")
    .select("message_id, read_at, acknowledged_at")
    .eq("reader_id", profile.id);

  const readMap = new Map((reads || []).map((r) => [r.message_id, r]));

  // Sender-Display-Names (fuer direct messages)
  const senderIds = Array.from(
    new Set((messages || []).map((m) => m.sender_id).filter(Boolean) as string[]),
  );
  const senderMap = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", senderIds);
    (senders || []).forEach((s) => senderMap.set(s.id, s.display_name));
  }

  const unreadCount = (messages || []).filter((m) => !readMap.has(m.id)).length;

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

      <main className="container-luxe py-16 md:py-24 max-w-3xl mx-auto">
        <div className="flex items-start justify-between gap-6 mb-4">
          <div>
            <p className="eyebrow mb-4">Postfach</p>
            <h1 className="font-display italic text-cream text-5xl md:text-7xl leading-[0.95] tracking-[-0.02em]">
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
        <p className="text-cream/45 text-sm mb-12">
          {messages?.length || 0} Nachrichten
          {unreadCount > 0 && (
            <span className="text-champagne"> · {unreadCount} ungelesen</span>
          )}
          {query && (
            <span className="text-cream/35"> · Suche „{query}"</span>
          )}
        </p>

        {/* Search — minimal, ruhig */}
        <form method="get" action="/portal/inbox" className="mb-16">
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
                Zurücksetzen
              </Link>
            )}
          </div>
        </form>

        {(!messages || messages.length === 0) && (
          <div className="py-20 text-center">
            <p className="font-display italic text-cream/30 text-2xl">
              Hier ist es noch ruhig.
            </p>
          </div>
        )}

        <ul className="divide-y divide-cream/[0.05]">
          {messages?.map((msg) => {
            const readInfo = readMap.get(msg.id);
            const unread = !readInfo;
            const needsAck = msg.requires_ack && !readInfo?.acknowledged_at;
            const sender = msg.sender_id ? senderMap.get(msg.sender_id) : null;

            return (
              <li key={msg.id}>
                <Link
                  href={`/portal/inbox/${msg.id}`}
                  className="group block py-7 md:py-8 transition-colors hover:bg-cream/[0.015]"
                >
                  <div className="flex items-start gap-5">
                    <div className="shrink-0 w-1 self-stretch">
                      {unread && (
                        <span
                          className="block w-1 h-1 rounded-full bg-champagne mt-3"
                          aria-label="ungelesen"
                        />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-4 mb-3 text-[10px] uppercase tracking-[0.25em]">
                        <span className="text-cream/45">
                          {CATEGORY_LABEL[msg.category] || msg.category}
                        </span>
                        {sender && (
                          <span className="text-cream/35">{sender}</span>
                        )}
                        {needsAck && (
                          <span className="text-champagne">Bestätigen</span>
                        )}
                      </div>

                      <h2
                        className={`font-display italic text-2xl md:text-3xl mb-2 leading-tight tracking-[-0.01em] transition-colors ${
                          unread ? "text-cream group-hover:text-champagne" : "text-cream/70 group-hover:text-cream"
                        }`}
                      >
                        {msg.subject || "(ohne Betreff)"}
                      </h2>

                      <p className="text-cream/45 text-sm leading-relaxed line-clamp-2 mb-3 max-w-2xl">
                        {msg.body}
                      </p>

                      <p className="text-cream/30 text-[10px] uppercase tracking-[0.25em]">
                        {new Date(msg.sent_at).toLocaleDateString("de-DE", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
