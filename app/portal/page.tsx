import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Logo } from "@/components/Logo";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/portal/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Wenn Admin → /portal/admin
  // Wenn Manager → /portal/manager
  // Wenn Creator → /portal Dashboard
  if (profile?.role === "admin") redirect("/portal/admin");
  if (profile?.role === "manager") redirect("/portal/manager");

  return (
    <div className="min-h-screen bg-ink text-cream">
      {/* Top Bar */}
      <header className="border-b border-champagne/10 px-6 md:px-12 py-5 flex items-center justify-between">
        <Link href="/portal"><Logo variant="horizontal" className="h-9" /></Link>
        <div className="flex items-center gap-6">
          <span className="text-cream/60 text-xs uppercase tracking-[0.25em]">
            {profile?.display_name || user.email}
          </span>
          <form action="/portal/logout" method="post">
            <button className="text-champagne hover:text-champagne-300 text-xs uppercase tracking-[0.25em]">
              Logout
            </button>
          </form>
        </div>
      </header>

      <main className="container-luxe py-16">
        <p className="eyebrow mb-4">Dashboard</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Welcome back, <span className="text-champagne">{profile?.display_name?.split(" ")[0] || "Creator"}</span>
        </h1>
        <p className="text-cream/60 text-lg mb-16 max-w-2xl">
          @{profile?.tiktok_username || "—"} · {profile?.country || "—"} · {profile?.language?.toUpperCase() || "DE"}
        </p>

        {/* Quick-Tiles */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          <DashboardTile href="/portal/inbox" eyebrow="Inbox" title="Messages" hint="Unread: —" />
          <DashboardTile href="/portal/events" eyebrow="Events" title="Upcoming" hint="0 signed" />
          <DashboardTile href="/portal/slots" eyebrow="Slots" title="Live-Plan" hint="0 this week" />
          <DashboardTile href="/portal/downloads" eyebrow="Assets" title="Downloads" hint="Logos · Templates · PDFs" />
          <DashboardTile href="/portal/info" eyebrow="Info" title="Rules & Tips" hint="Live-Tag · TikTok-Regeln" />
          <DashboardTile href="/portal/academy" eyebrow="Academy" title="Phase 1" hint="Coming Phase 2" />
          <DashboardTile href="/portal/badges" eyebrow="Achievements" title="Badges" hint="0 earned" />
          <DashboardTile href="/portal/support" eyebrow="Support" title="Help" hint="Open ticket" />
        </div>

        <div className="border-t border-champagne/10 pt-10">
          <p className="eyebrow mb-3">Profile</p>
          <Link href="/portal/profile" className="text-cream/60 hover:text-champagne text-sm">
            Edit your profile →
          </Link>
        </div>
      </main>
    </div>
  );
}

function DashboardTile({
  href, eyebrow, title, hint,
}: { href: string; eyebrow: string; title: string; hint: string }) {
  return (
    <Link
      href={href}
      className="group border border-champagne/15 p-6 transition-all duration-300 hover:border-champagne hover:bg-champagne/5"
    >
      <p className="eyebrow mb-3">{eyebrow}</p>
      <h3 className="font-display italic font-black text-2xl text-cream mb-2 group-hover:text-champagne transition-colors">
        {title}
      </h3>
      <p className="text-cream/40 text-xs">{hint}</p>
    </Link>
  );
}
