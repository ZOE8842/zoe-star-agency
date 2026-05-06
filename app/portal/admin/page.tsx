import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single();

  if (profile?.role !== "admin") redirect("/portal");

  // Stats (parallel queries)
  const [
    { count: totalUsers },
    { count: activeCreators },
    { count: openTickets },
  ] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true })
      .eq("role", "creator").eq("status", "active"),
    supabase.from("support_tickets").select("*", { count: "exact", head: true })
      .in("status", ["open", "in_progress"]),
  ]);

  return (
    <div className="min-h-screen bg-ink text-cream">
      <header className="border-b border-champagne/10 px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/portal"><Logo variant="horizontal" className="h-9" /></Link>
        <div className="flex items-center gap-6">
          <span className="eyebrow">Admin</span>
          <form action="/portal/logout" method="post">
            <button className="text-champagne hover:text-champagne-300 text-xs uppercase tracking-[0.25em]">
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="container-luxe py-16">
        <p className="eyebrow mb-4">Admin Console</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          System <span className="text-champagne">overview.</span>
        </h1>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <Stat label="Total Users" value={totalUsers ?? 0} />
          <Stat label="Active Creators" value={activeCreators ?? 0} />
          <Stat label="Open Tickets" value={openTickets ?? 0} />
          <Stat label="Coming Soon" value="—" />
        </div>

        {/* Admin Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <AdminTile href="/portal/admin/users" title="Users" hint="Manage creators · managers · roles" />
          <AdminTile href="/portal/admin/invites" title="Invites" hint="Generate codes" />
          <AdminTile href="/portal/admin/events" title="Events" hint="CRUD events + signups" />
          <AdminTile href="/portal/admin/downloads" title="Downloads" hint="Asset library" />
          <AdminTile href="/portal/admin/messages" title="Broadcasts" hint="Send messages to groups" />
          <AdminTile href="/portal/admin/analytics" title="Analytics" hint="Login · Activity · Tickets" />
        </div>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="border border-champagne/15 p-6">
      <p className="eyebrow mb-3">{label}</p>
      <p className="font-display italic font-black text-4xl text-champagne">{value}</p>
    </div>
  );
}

function AdminTile({ href, title, hint }: { href: string; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group border border-champagne/15 p-6 transition-all duration-300 hover:border-champagne hover:bg-champagne/5"
    >
      <h3 className="font-display italic font-black text-xl text-cream mb-2 group-hover:text-champagne transition-colors">
        {title}
      </h3>
      <p className="text-cream/40 text-xs">{hint}</p>
    </Link>
  );
}
