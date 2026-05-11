import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { BroadcastForm } from "./BroadcastForm";

export const dynamic = "force-dynamic";

const FILTERS = [
  { key: "all", label: "Alle" },
  { key: "unread", label: "Ungelesen" },
  { key: "waiting", label: "Wartet" },
  { key: "broadcast", label: "Broadcast" },
  { key: "direct", label: "Direkt" },
] as const;
type FilterKey = (typeof FILTERS)[number]["key"];

const CATEGORY_LABEL: Record<string, string> = {
  broadcast: "Broadcast",
  direct: "Direkt",
  event: "Event",
  reminder: "Reminder",
  system: "System",
};

interface Props {
  searchParams: Promise<{ f?: string }>;
}

function stripRePrefix(s: string | null): string {
  return (s ?? "").replace(/^(re:\s*)+/i, "").trim();
}

function threadKey(senderId: string | null, recipientId: string | null, subject: string | null): string {
  const a = senderId ?? "";
  const b = recipientId ?? "";
  const pair = a < b ? `${a}|${b}` : `${b}|${a}`;
  return `${pair}::${stripRePrefix(subject).toLowerCase()}`;
}

export default async function AdminMessagesPage({ searchParams }: Props) {
  const { supabase, profile } = await requireAdmin();
  const sp = await searchParams;
  const filterRaw = (sp.f || "all") as FilterKey;
  const filter: FilterKey = FILTERS.some((f) => f.key === filterRaw) ? filterRaw : "all";

  // Letzte 100 Messages — egal ob recipient, sender oder broadcast
  const { data: recentRaw } = await supabase
    .from("messages")
    .select("id, subject, category, sender_id, recipient_id, recipient_group, requires_ack, sent_at")
    .order("sent_at", { ascending: false })
    .limit(100);
  const recent = recentRaw ?? [];

  // Alle Admin-IDs holen — Threads gelten als "wartet auf Antwort", wenn
  // die letzte Message von einem Nicht-Admin an einen Admin ging.
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("role", "admin");
  const adminIds = new Set((admins ?? []).map((a) => a.id));

  // Waiting-Set: pro Thread die letzte Message, wenn sender=Creator + recipient=Admin
  const seenThread = new Set<string>();
  const waitingSet = new Set<string>();
  for (const m of recent) {
    // direct-only — broadcasts werden nicht als "wartet" gewertet
    if (m.category !== "direct" || !m.sender_id || !m.recipient_id) continue;
    const k = threadKey(m.sender_id, m.recipient_id, m.subject);
    if (seenThread.has(k)) continue; // recent ist DESC sortiert → erste pro Key ist die neueste
    seenThread.add(k);
    if (!adminIds.has(m.sender_id) && adminIds.has(m.recipient_id)) {
      waitingSet.add(m.id);
    }
  }

  // Namen aller Sender/Recipients holen
  const ids = new Set<string>();
  for (const m of recent) {
    if (m.sender_id) ids.add(m.sender_id);
    if (m.recipient_id) ids.add(m.recipient_id);
  }
  const nameMap = new Map<string, string>();
  if (ids.size > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", Array.from(ids));
    (profiles ?? []).forEach((p) => nameMap.set(p.id, p.display_name));
  }

  // Ungelesen-Set: messages, bei denen der Admin recipient ist und kein read_at vorliegt
  const ownRecipientIds = recent.filter((m) => m.recipient_id === profile.id).map((m) => m.id);
  const unreadSet = new Set<string>();
  if (ownRecipientIds.length > 0) {
    const { data: reads } = await supabase
      .from("message_reads")
      .select("message_id, read_at")
      .eq("reader_id", profile.id)
      .in("message_id", ownRecipientIds);
    const readIds = new Set((reads ?? []).filter((r) => r.read_at).map((r) => r.message_id));
    for (const id of ownRecipientIds) {
      if (!readIds.has(id)) unreadSet.add(id);
    }
  }

  // Filter anwenden
  const filtered = recent.filter((m) => {
    if (filter === "unread") return unreadSet.has(m.id);
    if (filter === "waiting") return waitingSet.has(m.id);
    if (filter === "broadcast") return m.category === "broadcast" || m.recipient_group != null;
    if (filter === "direct") return m.category === "direct" && m.recipient_group == null;
    return true;
  });

  // Counts fuer Filter-Pills
  const counts: Record<FilterKey, number> = {
    all: recent.length,
    unread: unreadSet.size,
    waiting: waitingSet.size,
    broadcast: recent.filter((m) => m.category === "broadcast" || m.recipient_group != null).length,
    direct: recent.filter((m) => m.category === "direct" && m.recipient_group == null).length,
  };

  return (
    <>
      <PortalNav userId={profile.id}
        displayName={profile.display_name} email={profile.email}
        avatarUrl={profile.avatar_url} isAdmin />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Admin · Messages</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Broadcast <span className="text-champagne">·</span> Direct
        </h1>

        <BroadcastForm senderId={profile.id} />

        <div className="mt-16 mb-4 flex items-baseline justify-between gap-4 flex-wrap">
          <p className="eyebrow">Letzte Nachrichten</p>
          <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
            {filtered.length} von {recent.length}
          </p>
        </div>

        {/* Filter-Pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((f) => {
            const active = f.key === filter;
            const c = counts[f.key];
            return (
              <Link
                key={f.key}
                href={f.key === "all" ? "/portal/admin/messages" : `/portal/admin/messages?f=${f.key}`}
                className={`px-3 py-1.5 text-[10px] uppercase tracking-[0.25em] border transition-colors ${
                  active
                    ? "bg-champagne text-ink border-champagne"
                    : "border-champagne/20 text-cream/55 hover:border-champagne/60 hover:text-cream"
                }`}
              >
                {f.label}
                {c > 0 && <span className="ml-2 opacity-65">{c}</span>}
              </Link>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="border border-champagne/15 p-8 text-center">
            <p className="text-cream/45 text-sm">Keine Nachrichten in diesem Filter.</p>
          </div>
        )}

        <div className="space-y-2">
          {filtered.map((m) => {
            const isBroadcast = m.recipient_group != null;
            const isOwnRecipient = m.recipient_id === profile.id;
            const unread = isOwnRecipient && unreadSet.has(m.id);
            const waiting = waitingSet.has(m.id);
            const sender = m.sender_id ? nameMap.get(m.sender_id) : null;
            const recipient = m.recipient_id ? nameMap.get(m.recipient_id) : null;
            const targetLabel = isBroadcast
              ? "@all_creators"
              : recipient
              ? `@ ${recipient}`
              : "direct";

            return (
              <Link
                key={m.id}
                href={`/portal/inbox/${m.id}`}
                className="border border-champagne/15 hover:border-champagne/50 hover:bg-champagne/5 p-5 flex items-center justify-between gap-4 transition-colors group"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    {unread && (
                      <span className="w-1.5 h-1.5 rounded-full bg-champagne" aria-label="ungelesen" />
                    )}
                    <span className="eyebrow">{CATEGORY_LABEL[m.category] || m.category}</span>
                    {m.requires_ack && (
                      <span className="text-[10px] uppercase tracking-[0.2em] text-champagne">Ack</span>
                    )}
                    {waiting && (
                      <span className="text-[10px] uppercase tracking-[0.25em] px-1.5 py-0.5 bg-champagne text-ink">
                        Wartet
                      </span>
                    )}
                    <span className="text-cream/40 text-[10px] uppercase tracking-[0.2em]">
                      {targetLabel}
                    </span>
                    {sender && (
                      <span className="text-cream/40 text-[10px] uppercase tracking-[0.2em]">
                        von {sender}
                      </span>
                    )}
                  </div>
                  <h3 className="font-display italic text-lg text-cream group-hover:text-champagne transition-colors truncate">
                    {m.subject || "(ohne Betreff)"}
                  </h3>
                </div>
                <span className="text-cream/40 text-[10px] shrink-0">
                  {new Date(m.sent_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
