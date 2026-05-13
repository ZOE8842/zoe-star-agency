import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { markConversationRead } from "@/lib/inbox/conversations";
import { loadProfileLabels, formatPartnerLabel } from "@/lib/inbox/profile-labels";
import { GroupReplyForm } from "./GroupReplyForm";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function GroupChatPage({ params }: Props) {
  const { id } = await params;
  const { supabase, profile } = await getAuthedProfile();
  const isAdmin = profile.role === "admin";

  // Member-Gate
  const { data: member } = await supabase
    .from("conversation_members")
    .select("id, role")
    .eq("conversation_id", id)
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!member && !isAdmin) notFound();

  const { data: conv } = await supabase
    .from("conversations")
    .select("id, type, title, created_at, last_message_at")
    .eq("id", id)
    .maybeSingle();
  if (!conv) notFound();

  // Messages laden
  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_id, body, sent_at")
    .eq("conversation_id", id)
    .order("sent_at", { ascending: true })
    .limit(200);

  // Service-Role-Lookup, weil profiles-RLS Cross-User-Reads blockiert
  const senderIds = (msgs ?? []).map((m) => m.sender_id).filter((id): id is string => !!id);
  const profileMap = await loadProfileLabels(senderIds);
  const senderMap = new Map<string, string>();
  profileMap.forEach((p, id) => senderMap.set(id, formatPartnerLabel(p)));

  // Mark-Read (best-effort, async)
  if (member) {
    markConversationRead(id).catch(() => {});
  }

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-10 md:py-16 max-w-[640px] mx-auto">
        <div className="flex items-baseline justify-between gap-3 mb-8 flex-wrap">
          <Link
            href="/portal/inbox?tab=groups"
            className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em]"
          >
            ← Gruppen
          </Link>
          {isAdmin && (
            <Link
              href={`/portal/admin/inbox/groups/${conv.id}`}
              className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.25em]"
            >
              Admin · Verwalten →
            </Link>
          )}
        </div>

        <div className="mb-10 pb-6 border-b border-cream/[0.06]">
          <p className="text-cream/45 text-[10px] uppercase tracking-[0.3em] mb-2">
            {conv.type === "channel" ? "Channel" : conv.type === "event" ? "Event" : "Gruppe"}
          </p>
          <h1 className="font-display italic text-champagne text-2xl md:text-3xl leading-tight">
            {conv.title}
          </h1>
        </div>

        <article className="space-y-4 mb-6">
          {(msgs ?? []).map((m) => {
            const isFromMe = m.sender_id === profile.id;
            const senderName = m.sender_id ? senderMap.get(m.sender_id) : null;
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
                  </p>
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

        <GroupReplyForm conversationId={conv.id} />
      </main>
    </>
  );
}
