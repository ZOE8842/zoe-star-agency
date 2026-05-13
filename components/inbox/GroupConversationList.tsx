import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@supabase/supabase-js";

// Gruppen-Liste fuer Creator-Inbox-Tab.
// ROOT-CAUSE Live-Bug (a6aa480 Diagnostics):
//   conversation_members hat 23 Rows, Creator ist Member, aber RLS-JOIN
//   auf conversations.* via user-cookie kommt mit conversation=null zurueck.
//   conv_member_read policy hat eine EXISTS-Subquery auf conversation_members,
//   die in der Cross-Table-Selection nicht greift. Resultat: filter killt
//   alle Rows → "Keine Gruppen".
//
// FIX: Service-Role-Read NACH expliziter profile-id-Filterung.
//   Sicher: wir filtern hart auf den authentifizierten profileId, kein
//   Cross-User-Leak moeglich. Member-Liste leakt nicht (wir lesen nur
//   Memberships des aktuellen Users).

const TYPE_LABEL: Record<string, string> = {
  group: "Gruppe",
  channel: "Channel",
  event: "Event",
};

function srClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

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

interface MemberMembership {
  conversation_id: string;
  last_read_at: string | null;
}
interface ConversationRow {
  id: string;
  type: string;
  title: string;
  last_message_at: string | null;
}

export async function GroupConversationList({
  supabase: _supabase,
  profileId,
}: {
  supabase: SupabaseClient;
  profileId: string;
}) {
  const sr = srClient();

  // 1. Memberships des aktuellen Users (Service-Role, hart gefiltert auf profileId)
  const { data: memberRows } = await sr
    .from("conversation_members")
    .select("conversation_id, last_read_at")
    .eq("profile_id", profileId);

  const memberships = (memberRows ?? []) as MemberMembership[];
  if (memberships.length === 0) {
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

  // 2. Conversations per .in(conversation_id) laden — auch via Service-Role
  const convIds = memberships.map((m) => m.conversation_id);
  const { data: convRows } = await sr
    .from("conversations")
    .select("id, type, title, last_message_at")
    .in("id", convIds);

  const convMap = new Map<string, ConversationRow>(
    ((convRows ?? []) as ConversationRow[]).map((c) => [c.id, c]),
  );

  // 3. Merge + filter (nur non-DM Konversationen)
  const visible = memberships
    .map((m) => ({ membership: m, conversation: convMap.get(m.conversation_id) }))
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
        const lastReadAt = r.membership.last_read_at;
        const unread =
          !!lastMsgAt &&
          (!lastReadAt || new Date(lastMsgAt) > new Date(lastReadAt));
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
