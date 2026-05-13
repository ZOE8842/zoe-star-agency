import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AddMemberButton, RemoveMemberButton } from "./MemberActions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

// Service-Role-Client fuer RLS-Bypass nach erfolgreichem requireAdmin().
// Grund: Conversations werden in createGroupConversation via Service-Role
// inserted; die zugehoerigen SELECT-RLS-Policies (cm_member_select)
// liefern fuer den Admin-Cookie erst nach Membership-Join Rows zurueck.
// Direkt nach Insert sieht der User-Cookie die frische Zeile nicht →
// notFound() fuer den Creator. Nach Admin-Check ist Service-Role sicher.
function srClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export default async function AdminGroupDetailPage({ params }: Props) {
  const { id } = await params;
  const { profile } = await requireManagerOrAdmin();
  const sr = srClient();

  const { data: conv } = await sr
    .from("conversations")
    .select("id, type, title, created_by, created_at, last_message_at")
    .eq("id", id)
    .maybeSingle();
  if (!conv) notFound();

  const { data: members } = await sr
    .from("conversation_members")
    .select("id, profile_id, role, joined_at, last_read_at, muted")
    .eq("conversation_id", id);

  const memberIds = (members ?? []).map((m) => m.profile_id);

  const { data: memberProfiles } = memberIds.length
    ? await sr
        .from("profiles")
        .select("id, display_name, tiktok_username, role")
        .in("id", memberIds)
    : { data: [] };

  const memberMap = new Map(
    (memberProfiles ?? []).map((p) => [p.id, p]),
  );

  const { data: allProfiles } = await sr
    .from("profiles")
    .select("id, display_name, tiktok_username, role")
    .in("role", ["creator", "manager", "admin"])
    .eq("status", "active")
    .order("display_name", { ascending: true });

  const candidates = (allProfiles ?? [])
    .filter((p) => !memberIds.includes(p.id))
    .map((p) => ({
      id: p.id,
      label: p.display_name,
      hint: p.tiktok_username ? `@${p.tiktok_username}` : undefined,
    }));

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />
      <main className="container-luxe py-12 md:py-16 max-w-3xl">
        <div className="flex items-baseline justify-between gap-3 mb-8 flex-wrap">
          <Link
            href="/portal/admin/inbox/groups"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em]"
          >
            ← Gruppen
          </Link>
          <Link
            href={`/portal/inbox/group/${conv.id}`}
            className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
          >
            Chat oeffnen →
          </Link>
        </div>

        <p className="eyebrow mb-3">Admin · {conv.type === "channel" ? "Channel" : "Gruppe"}</p>
        <h1 className="font-display italic text-cream text-3xl md:text-5xl mb-2">
          {conv.title}
        </h1>
        <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mb-12">
          Erstellt {new Date(conv.created_at).toLocaleDateString("de-DE")} ·
          {conv.last_message_at
            ? ` Letzte Nachricht ${new Date(conv.last_message_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}`
            : " Noch keine Nachricht"}
        </p>

        <section className="mb-10">
          <div className="flex items-baseline justify-between mb-4">
            <p className="eyebrow">Mitglieder · {members?.length ?? 0}</p>
            <AddMemberButton conversationId={conv.id} candidates={candidates} />
          </div>
          <ul className="space-y-2">
            {(members ?? []).map((m) => {
              const p = memberMap.get(m.profile_id);
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 border border-champagne/15 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-cream text-sm">{p?.display_name ?? "—"}</p>
                    <p className="text-cream/40 text-[10px] uppercase tracking-[0.22em]">
                      {p?.tiktok_username ? `@${p.tiktok_username} · ` : ""}{p?.role ?? "—"} · {m.role}
                    </p>
                  </div>
                  {m.role !== "owner" && (
                    <RemoveMemberButton conversationId={conv.id} profileId={m.profile_id} />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </>
  );
}
