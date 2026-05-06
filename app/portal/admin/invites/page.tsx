import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { InviteGenerator } from "./InviteGenerator";

export default async function AdminInvitesPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: invites } = await supabase
    .from("invites")
    .select("id, code, intended_role, created_at, expires_at, used_at, used_by")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <PortalNav displayName={profile.display_name} email={profile.email}
        avatarUrl={profile.avatar_url} isAdmin />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Admin · Invites</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Invite <span className="text-champagne">codes.</span>
        </h1>

        <InviteGenerator adminId={profile.id} />

        <div className="mt-16 mb-6">
          <p className="eyebrow">History</p>
        </div>
        <div className="border border-champagne/15 overflow-hidden">
          <table className="w-full">
            <thead className="bg-champagne/5">
              <tr className="text-left">
                <Th>Code</Th>
                <Th>Role</Th>
                <Th>Created</Th>
                <Th>Expires</Th>
                <Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {invites?.map((inv) => (
                <tr key={inv.id} className="border-t border-champagne/10">
                  <td className="px-4 py-3 font-mono text-sm text-champagne">{inv.code}</td>
                  <td className="px-4 py-3 text-cream/70 text-xs uppercase tracking-[0.2em]">{inv.intended_role}</td>
                  <td className="px-4 py-3 text-cream/40 text-xs">{new Date(inv.created_at).toLocaleDateString("de-DE")}</td>
                  <td className="px-4 py-3 text-cream/40 text-xs">
                    {inv.expires_at ? new Date(inv.expires_at).toLocaleDateString("de-DE") : "—"}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {inv.used_at
                      ? <span className="text-cream/40">used {new Date(inv.used_at).toLocaleDateString("de-DE")}</span>
                      : <span className="text-champagne">available</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th className="px-4 py-3 text-[10px] uppercase tracking-[0.25em] text-champagne font-medium">
      {children}
    </th>
  );
}
