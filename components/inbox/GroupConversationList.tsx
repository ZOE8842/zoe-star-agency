import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

// Gruppen-Liste fuer Creator-Inbox-Tab.
// Liest conversation_members WHERE profile_id=me + JOIN conversations.

const TYPE_LABEL: Record<string, string> = {
  group: "Gruppe",
  channel: "Channel",
  event: "Event",
};

function relativeAge(iso: string | null): string {
  if (!iso) return "—";
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  const d = Math.floor(h / 24);
  return `${d} t`;
}

interface MemberRow {
  conversation_id: string;
  last_read_at: string | null;
  conversation: {
    id: string;
    type: string;
    title: string;
    last_message_at: string | null;
  } | null;
}

export async function GroupConversationList({
  supabase,
  profileId,
}: {
  supabase: SupabaseClient;
  profileId: string;
}) {
  const { data } = await supabase
    .from("conversation_members")
    .select("conversation_id, last_read_at, conversation:conversations(id, type, title, last_message_at)")
    .eq("profile_id", profileId)
    .order("last_read_at", { ascending: false, nullsFirst: true });

  const rows = ((data as unknown) as MemberRow[] | null) ?? [];
  const visible = rows
    .filter((r) => r.conversation && r.conversation.type !== "dm")
    .sort((a, b) => {
      const al = a.conversation?.last_message_at ?? "";
      const bl = b.conversation?.last_message_at ?? "";
      return bl.localeCompare(al);
    });

  if (visible.length === 0) {
    return (
      <div className="border border-champagne/15 p-8 text-center">
        <p className="font-display italic text-cream/45 text-xl mb-2">
          Keine Gruppen.
        </p>
        <p className="text-cream/35 text-sm">
          Sobald du in eine Gruppe eingeladen wirst, erscheint sie hier.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-cream/[0.05]">
      {visible.map((r) => {
        const c = r.conversation!;
        const lastMsgAt = c.last_message_at;
        const unread =
          !!lastMsgAt &&
          (!r.last_read_at || new Date(lastMsgAt) > new Date(r.last_read_at));
        const initial = (c.title || "?").slice(0, 1).toUpperCase();

        return (
          <li key={c.id}>
            <Link
              href={`/portal/inbox/group/${c.id}`}
              className="group block py-4 md:py-5 transition-colors hover:bg-cream/[0.015]"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`shrink-0 w-10 h-10 md:w-11 md:h-11 rounded-full border flex items-center justify-center font-display italic text-base ${
                    unread
                      ? "border-champagne/60 bg-champagne/10 text-champagne"
                      : "border-cream/15 bg-cream/[0.03] text-cream/55"
                  }`}
                >
                  {initial}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-3 mb-1 flex-wrap">
                    <p className={`text-sm md:text-base ${unread ? "text-cream font-medium" : "text-cream/70"}`}>
                      {c.title}
                    </p>
                    <span className="text-cream/30 text-[10px] uppercase tracking-[0.25em]">
                      {relativeAge(lastMsgAt)}
                    </span>
                  </div>
                  <p className="text-cream/40 text-[10px] uppercase tracking-[0.22em]">
                    {TYPE_LABEL[c.type] ?? c.type}
                  </p>
                </div>
                {unread && (
                  <span className="shrink-0 w-1.5 h-1.5 rounded-full bg-champagne" aria-label="ungelesen" />
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
