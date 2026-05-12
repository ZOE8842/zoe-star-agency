import Link from "next/link";
import { notFound } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AttachmentList } from "@/components/AttachmentList";
import { ReactionBar } from "@/components/inbox/ReactionBar";
import { AcknowledgeButton } from "./AcknowledgeButton";
import { ReplyForm } from "./ReplyForm";
import { markRead } from "./actions";

const CATEGORY_LABEL: Record<string, string> = {
  broadcast: "Broadcast",
  direct: "Direkt",
  event: "Event",
  reminder: "Reminder",
  system: "System",
};

function formatLongDate(iso: string) {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function stripRePrefix(s: string): string {
  return s.replace(/^(re:\s*)+/i, "").trim();
}

export default async function MessageDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ sent?: string }>;
}) {
  const { id } = await params;
  const sp = searchParams ? await searchParams : {};
  const justSent = sp.sent === "1";
  const { supabase, profile } = await getAuthedProfile();

  // Versuch mit attachments-Spalte; Fallback ohne (falls Migration noch fehlt)
  let { data: msg } = await supabase
    .from("messages")
    .select("id, subject, body, category, sent_at, requires_ack, sender_id, recipient_id, recipient_group, attachments")
    .eq("id", id)
    .maybeSingle();
  if (!msg) {
    const fallback = await supabase
      .from("messages")
      .select("id, subject, body, category, sent_at, requires_ack, sender_id, recipient_id, recipient_group")
      .eq("id", id)
      .maybeSingle();
    msg = fallback.data ? { ...fallback.data, attachments: [] } : null;
  }

  if (!msg) notFound();

  const isRecipient =
    msg.recipient_id === profile.id ||
    msg.recipient_group === "all_creators" ||
    profile.role === "admin";
  if (!isRecipient) notFound();

  await markRead(msg.id, profile.id);

  const { data: readInfo } = await supabase
    .from("message_reads")
    .select("read_at, acknowledged_at")
    .eq("message_id", msg.id)
    .eq("reader_id", profile.id)
    .maybeSingle();

  // Korrespondenz-Kette: alle Messages mit gleichem subject-Stamm + zwischen denselben 2 Personen
  const baseSubject = stripRePrefix(msg.subject || "");
  type ChainItem = {
    id: string;
    subject: string | null;
    body: string;
    sent_at: string;
    sender_id: string | null;
    recipient_id: string | null;
    category: string;
  };
  let correspondence: ChainItem[] = [];
  let canReply = false;
  let replyTargetId: string | null = null;

  if (msg.sender_id && msg.recipient_id && baseSubject) {
    const a = msg.sender_id;
    const b = msg.recipient_id;
    const { data: chain } = await supabase
      .from("messages")
      .select("id, subject, body, sent_at, sender_id, recipient_id, category")
      .or(`and(sender_id.eq.${a},recipient_id.eq.${b}),and(sender_id.eq.${b},recipient_id.eq.${a})`)
      .order("sent_at", { ascending: true });

    correspondence = (chain || []).filter((c) => stripRePrefix(c.subject || "") === baseSubject);
    canReply = true;
    replyTargetId = msg.sender_id === profile.id ? msg.recipient_id : msg.sender_id;
  } else if (msg.sender_id && msg.recipient_group === "all_creators" && msg.sender_id !== profile.id) {
    // Broadcast-Reply: Creator antwortet direkt an den Broadcast-Sender (Admin/Manager).
    // Keine Korrespondenz-Kette — Reply startet einen neuen direct-Thread.
    canReply = true;
    replyTargetId = msg.sender_id;
  }

  // Sender-Names fuer alle Korrespondenz-Items
  const senderIds = Array.from(
    new Set(
      correspondence
        .map((c) => c.sender_id)
        .filter((id): id is string => !!id),
    ),
  );
  const senderMap = new Map<string, string>();
  if (senderIds.length > 0) {
    const { data: senders } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", senderIds);
    (senders || []).forEach((s) => senderMap.set(s.id, s.display_name));
  } else if (msg.sender_id) {
    const { data: sender } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("id", msg.sender_id)
      .maybeSingle();
    if (sender) senderMap.set(sender.id, sender.display_name);
  }

  // Wenn keine Kette: nur die aktuelle Nachricht zeigen
  const items: ChainItem[] = correspondence.length > 0 ? correspondence : [{
    id: msg.id,
    subject: msg.subject,
    body: msg.body,
    sent_at: msg.sent_at,
    sender_id: msg.sender_id,
    recipient_id: msg.recipient_id,
    category: msg.category,
  }];
  const replySubject = `Re: ${baseSubject}`;

  // Reactions fuer aktuelle Message
  const { data: reactionsRaw } = await supabase
    .from("message_reactions")
    .select("emoji, profile_id")
    .eq("message_id", msg.id);
  const reactionAggregate = new Map<string, { count: number; reacted_by_me: boolean }>();
  for (const r of reactionsRaw ?? []) {
    const cur = reactionAggregate.get(r.emoji) ?? { count: 0, reacted_by_me: false };
    cur.count++;
    if (r.profile_id === profile.id) cur.reacted_by_me = true;
    reactionAggregate.set(r.emoji, cur);
  }
  const initialReactions = Array.from(reactionAggregate.entries()).map(
    ([emoji, agg]) => ({ emoji, ...agg }),
  );

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-20 md:py-32 max-w-[640px] mx-auto">
        <Link
          href="/portal/inbox"
          className="inline-flex items-center gap-2 text-cream/40 hover:text-champagne text-[10px] uppercase tracking-[0.3em] mb-12 transition-colors"
        >
          <span aria-hidden="true">←</span> Inbox
        </Link>

        {justSent && (
          <div className="border border-champagne/40 bg-champagne/5 px-4 py-3 mb-10 flex items-center justify-between gap-3">
            <p className="text-champagne text-sm">Nachricht gesendet.</p>
            <span className="text-champagne text-[10px] uppercase tracking-[0.25em]">OK</span>
          </div>
        )}

        {/* Editorial-Korrespondenz-Timeline */}
        <article>
          {items.map((item, idx) => {
            const isFirst = idx === 0;
            const senderName = item.sender_id ? senderMap.get(item.sender_id) : null;
            const isFromMe = item.sender_id === profile.id;

            return (
              <div
                key={item.id}
                className={idx > 0 ? "mt-32 md:mt-40 pt-20 md:pt-24 border-t border-cream/[0.04]" : ""}
              >
                {/* Meta */}
                <div className="mb-10 text-[10px] uppercase tracking-[0.3em] text-cream/40">
                  <span>{senderName || (isFromMe ? "Du" : "—")}</span>
                  <span className="mx-3 text-cream/25">·</span>
                  <span className="text-cream/35">{formatLongDate(item.sent_at)}</span>
                  {!isFirst && (
                    <>
                      <span className="mx-3 text-cream/25">·</span>
                      <span className="text-cream/35">
                        {CATEGORY_LABEL[item.category] || item.category}
                      </span>
                    </>
                  )}
                </div>

                {/* Subject — nur beim ersten Item */}
                {isFirst && (
                  <h1 className="font-display italic text-cream text-[40px] sm:text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] mb-16">
                    {stripRePrefix(item.subject || "") || "(ohne Betreff)"}
                  </h1>
                )}

                {/* Body */}
                <div className="text-cream/85 text-base md:text-lg leading-[1.85] whitespace-pre-wrap font-light">
                  {item.body}
                </div>

                {/* Attachments — nur beim aktuellen Item (msg.id) */}
                {item.id === msg.id && msg.attachments && msg.attachments.length > 0 && (
                  <AttachmentList paths={msg.attachments} />
                )}

                {/* Reactions — V1 nur fuer aktuelles Item */}
                {item.id === msg.id && (
                  <ReactionBar
                    messageId={msg.id}
                    initialReactions={initialReactions}
                  />
                )}
              </div>
            );
          })}
        </article>

        {/* Acknowledge falls noetig */}
        {msg.requires_ack && (
          <div className="mt-32 pt-12 border-t border-cream/[0.05]">
            {readInfo?.acknowledged_at ? (
              <p className="text-cream/35 text-[11px] uppercase tracking-[0.3em]">
                Bestätigt · {formatLongDate(readInfo.acknowledged_at)}
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

        {/* Reply — als ruhige Verlaengerung */}
        {canReply && replyTargetId && (
          <div className="mt-32 md:mt-40 pt-16 md:pt-20 border-t border-cream/[0.04]">
            <p className="eyebrow mb-8">Antworten</p>
            <ReplyForm
              recipientId={replyTargetId}
              defaultSubject={replySubject}
            />
          </div>
        )}

        {/* Footer */}
        <div className="mt-32 pt-10 border-t border-cream/[0.04] flex items-center justify-between text-[10px] uppercase tracking-[0.3em]">
          <p className="text-cream/25">
            {readInfo?.read_at
              ? `Gelesen · ${formatLongDate(readInfo.read_at)}`
              : ""}
          </p>
          <Link
            href="/portal/inbox"
            className="text-cream/45 hover:text-champagne transition-colors"
          >
            Zurück
          </Link>
        </div>
      </main>
    </>
  );
}
