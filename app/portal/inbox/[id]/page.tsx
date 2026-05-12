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

  // Sender-Profile fuer alle Korrespondenz-Items + Gespraechspartner
  const senderIds = Array.from(
    new Set(
      [
        ...correspondence.map((c) => c.sender_id),
        msg.sender_id,
        msg.recipient_id,
      ].filter((id): id is string => !!id),
    ),
  );
  const profileMap = new Map<string, { display_name: string; role: string }>();
  if (senderIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, role")
      .in("id", senderIds);
    (profiles ?? []).forEach((p) =>
      profileMap.set(p.id, { display_name: p.display_name, role: p.role }),
    );
  }
  // Legacy-Alias fuer alten Code-Pfad
  const senderMap = new Map<string, string>();
  profileMap.forEach((p, id) => senderMap.set(id, p.display_name));

  // Gespraechspartner-Label fuer Header
  function partnerLabelFor(otherId: string | null): string {
    if (!otherId) return "—";
    const p = profileMap.get(otherId);
    if (!p) return "—";
    if (p.role === "admin" || p.role === "manager") return "ZOE Management";
    return p.display_name || "Creator";
  }
  const headerLabel: string = msg.recipient_group === "all_creators"
    ? "ZOE Broadcast"
    : msg.sender_id === profile.id
    ? partnerLabelFor(msg.recipient_id)
    : partnerLabelFor(msg.sender_id);

  // Lese-/Bestaetigungs-Status fuer Gegenseite (zeigt dem Sender ob gelesen wurde)
  let readByPartnerAt: string | null = null;
  if (msg.sender_id === profile.id && msg.recipient_id) {
    const { data: partnerRead } = await supabase
      .from("message_reads")
      .select("read_at")
      .eq("message_id", msg.id)
      .eq("reader_id", msg.recipient_id)
      .maybeSingle();
    readByPartnerAt = partnerRead?.read_at ?? null;
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

      <main className="container-luxe py-10 md:py-16 max-w-[640px] mx-auto">
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

        {/* Gespraechs-Header — Partner + Status */}
        <div className="mb-12 pb-6 border-b border-cream/[0.06]">
          <p className="text-cream/45 text-[10px] uppercase tracking-[0.3em] mb-2">
            Gespraech mit
          </p>
          <p className="font-display italic text-champagne text-2xl md:text-3xl leading-tight mb-3">
            {headerLabel}
          </p>
          <div className="flex items-center gap-3 flex-wrap text-[10px] uppercase tracking-[0.25em]">
            {msg.sender_id === profile.id ? (
              readByPartnerAt ? (
                <span className="text-champagne">Gelesen · {formatLongDate(readByPartnerAt)}</span>
              ) : (
                <span className="text-cream/55">Gesendet</span>
              )
            ) : readInfo?.acknowledged_at ? (
              <span className="text-champagne">Bestaetigt</span>
            ) : msg.requires_ack ? (
              <span className="text-champagne">Bestaetigung offen</span>
            ) : readInfo?.read_at ? (
              <span className="text-cream/45">Gelesen</span>
            ) : (
              <span className="text-cream/55">Neu</span>
            )}
            {correspondence.length > 1 && (
              <span className="text-cream/35">{correspondence.length} Nachrichten</span>
            )}
          </div>
        </div>

        {/* Subject als kleiner Kontext-Header — nur wenn nicht autogeneriert aus Body */}
        {baseSubject && !baseSubject.endsWith("...") && (
          <p className="text-cream/45 text-[11px] uppercase tracking-[0.3em] mb-6">
            Betreff · {baseSubject}
          </p>
        )}

        {/* Chat-Timeline mit Bubbles */}
        <article className="space-y-4 mb-12">
          {items.map((item) => {
            const isFromMe = item.sender_id === profile.id;
            const senderName = item.sender_id ? senderMap.get(item.sender_id) : null;
            return (
              <div
                key={item.id}
                className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}
              >
                <div className={`max-w-[85%] md:max-w-[75%] ${isFromMe ? "items-end" : "items-start"} flex flex-col`}>
                  {!isFromMe && senderName && (
                    <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-1.5 px-1">
                      {senderName}
                    </p>
                  )}
                  <div className={`px-4 py-3 md:px-5 md:py-4 leading-relaxed whitespace-pre-wrap text-sm md:text-base ${
                    isFromMe
                      ? "bg-champagne text-ink"
                      : "bg-cream/[0.05] text-cream/90 border border-cream/[0.08]"
                  }`}>
                    {item.body}
                  </div>
                  <p className={`text-cream/35 text-[10px] uppercase tracking-[0.25em] mt-1.5 px-1 ${isFromMe ? "text-right" : ""}`}>
                    {new Date(item.sent_at).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {formatLongDate(item.sent_at)}
                  </p>

                  {/* Attachments + Reactions — nur am aktuellen Item */}
                  {item.id === msg.id && msg.attachments && msg.attachments.length > 0 && (
                    <div className="mt-2 w-full">
                      <AttachmentList paths={msg.attachments} />
                    </div>
                  )}
                  {item.id === msg.id && (
                    <div className={`mt-2 ${isFromMe ? "self-end" : "self-start"}`}>
                      <ReactionBar
                        messageId={msg.id}
                        initialReactions={initialReactions}
                      />
                    </div>
                  )}
                </div>
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
