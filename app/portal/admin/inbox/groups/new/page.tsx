import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { CreateGroupForm } from "./CreateGroupForm";

export const dynamic = "force-dynamic";

export default async function NewGroupPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, display_name, tiktok_username, role")
    .in("role", ["creator", "manager", "admin"])
    .eq("status", "active")
    .order("display_name", { ascending: true });

  const members = (profiles ?? [])
    .filter((p) => p.id !== profile.id)
    .map((p) => ({
      id: p.id,
      label: p.display_name,
      hint: p.tiktok_username ? `@${p.tiktok_username}` : undefined,
      role: p.role,
    }));

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />
      <main className="container-luxe py-12 md:py-16 max-w-2xl">
        <div className="mb-8">
          <Link
            href="/portal/admin/inbox/groups"
            className="text-cream/45 hover:text-champagne text-[11px] uppercase tracking-[0.25em]"
          >
            ← Gruppen
          </Link>
        </div>
        <p className="eyebrow mb-3">Neue Gruppe</p>
        <h1 className="font-display italic text-cream text-3xl md:text-4xl mb-8">
          Gruppe anlegen.
        </h1>
        <CreateGroupForm members={members} />
      </main>
    </>
  );
}
