import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AcknowledgeButton } from "./AcknowledgeButton";
import { markRead } from "./actions";

const CATEGORY_LABEL: Record<string, string> = {
  broadcast: "Broadcast",
  direct: "Direkt",
  event: "Event",
  reminder: "Reminder",
  system: "System",
};

export default async function MessageDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await getAuthedProfile();

  const { data: msg } = await supabase
    .from("messages")
    .select("id, subject, body, category, sent_at, requires_ack, sender_id, recipient_id, recipient_group")
    .eq("id", id)
    .maybeSingle();

  if (!msg) notFound();

  // Sicherheit: User muss Empfänger sein (entweder direkt oder in Gruppe)
  const isRecipient =
    msg.recipient_id === profile.id ||
    msg.recipient_group === "all_creators" ||
    profile.role === "admin";
  if (!isRecipient) notFound();

  // Mark-as-read (Server-Action) — idempotent
  await markRead(msg.id, profile.id);

  // Read-Info nach dem Mark
  const { data: readInfo } = await supabase
    .from("message_reads")
    .select("read_at, acknowledged_at")
    .eq("message_id", msg.id)
    .eq("reader_id", profile.id)
    .maybeSingle();

  // Sender-Name
  let senderName: string | null = null;
  if (msg.sender_id) {
    const { data: sender } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", msg.sender_id)
      .maybeSingle();
    senderName = sender?.display_name || null;
  }

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16 md:py-24 max-w-2xl mx-auto">
        <Link
          href="/portal/inbox"
          className="inline-flex items-center gap-2 text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-16 transition-colors"
        >
          <span aria-hidden="true">←</span> Inbox
        </Link>

        {/* Meta-Header */}
        <div className="mb-12 flex items-center gap-5 text-[10px] uppercase tracking-[0.3em] text-cream/45">
          <span>{CATEGORY_LABEL[msg.category] || msg.category}</span>
          {senderName && <span className="text-cream/35">· {senderName}</span>}
          <span className="text-cream/35">
            ·{" "}
            {new Date(msg.sent_at).toLocaleDateString("de-DE", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>

        {/* Subject als Display-Headline */}
        <h1 className="font-display italic text-cream text-3xl md:text-5xl leading-[1.05] tracking-[-0.015em] mb-12">
          {msg.subject || "(ohne Betreff)"}
        </h1>

        {/* Body — generous reading width + line-height */}
        <div className="text-cream/75 text-base md:text-lg leading-[1.75] whitespace-pre-wrap font-light">
          {msg.body}
        </div>

        {/* Acknowledge falls noetig */}
        {msg.requires_ack && (
          <div className="mt-16 pt-10 border-t border-cream/[0.05]">
            {readInfo?.acknowledged_at ? (
              <p className="text-cream/40 text-sm">
                ✓ Bestätigt am{" "}
                {new Date(readInfo.acknowledged_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            ) : (
              <div>
                <p className="eyebrow mb-5">Bestätigung erforderlich</p>
                <p className="text-cream/55 text-sm leading-relaxed mb-6 max-w-md">
                  Bitte bestätige, dass du diese Nachricht gelesen und verstanden
                  hast.
                </p>
                <AcknowledgeButton messageId={msg.id} userId={profile.id} />
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-cream/[0.05] flex items-center justify-between">
          <p className="text-cream/30 text-[10px] uppercase tracking-[0.3em]">
            {readInfo?.read_at
              ? `Gelesen ${new Date(readInfo.read_at).toLocaleDateString("de-DE", {
                  day: "2-digit",
                  month: "short",
                })}`
              : ""}
          </p>
          <Link
            href="/portal/inbox"
            className="text-cream/45 hover:text-champagne text-[10px] uppercase tracking-[0.3em] transition-colors"
          >
            Zurück
          </Link>
        </div>
      </main>
    </>
  );
}
