import { requireManagerOrAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { UserRow } from "./UserRow";

export default async function AdminUsersPage() {
  const { supabase, profile } = await requireManagerOrAdmin();

  const isAdmin = profile.role === "admin";

  let query = supabase
    .from("profiles")
    .select("id, email, tiktok_username, display_name, role, status, country, language, joined_at, last_active_at")
    .order("joined_at", { ascending: false });

  // Manager: nur eigene Creator (manager_id = self)
  if (!isAdmin) {
    query = query.eq("manager_id", profile.id);
  }

  const { data: users } = await query;

  return (
    <>
      <PortalNav userId={profile.id}
        displayName={profile.display_name} email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={isAdmin}
        isManager={profile.role === "manager"} />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">{isAdmin ? "Roster · Alle" : "Mein Roster"}</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          {isAdmin ? (
            <>User <span className="text-champagne">management.</span></>
          ) : (
            <>Meine <span className="text-champagne">Creator.</span></>
          )}
        </h1>

        <div className="border border-champagne/15 overflow-hidden">
          <table className="w-full">
            <thead className="bg-champagne/5">
              <tr className="text-left">
                <Th>Display</Th>
                <Th>TikTok</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
              </tr>
            </thead>
            <tbody>
              {users?.map((u) => <UserRow key={u.id} user={u} />)}
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
