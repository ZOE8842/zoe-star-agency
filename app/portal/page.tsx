import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export default async function DashboardPage() {
  const { supabase, profile } = await getAuthedProfile();

  if (profile.role === "admin") redirect("/portal/admin");

  // Counts parallel
  const [
    { count: unreadCount },
    { count: upcomingEvents },
    { count: weekSlots },
    { count: openTickets },
  ] = await Promise.all([
    supabase.from("messages").select("*", { count: "exact", head: true })
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`),
    supabase.from("events").select("*", { count: "exact", head: true })
      .eq("status", "open").gte("start_at", new Date().toISOString()),
    supabase.from("slots").select("*", { count: "exact", head: true })
      .eq("creator_id", profile.id).gte("start_at", new Date().toISOString())
      .lte("start_at", new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString()),
    supabase.from("support_tickets").select("*", { count: "exact", head: true })
      .eq("creator_id", profile.id).in("status", ["open", "in_progress"]),
  ]);

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16">
        <p className="eyebrow mb-4">Dashboard</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Welcome back, <span className="text-champagne">{profile.display_name?.split(" ")[0] || "Creator"}</span>
        </h1>
        <p className="text-cream/60 text-lg mb-16 max-w-2xl">
          @{profile.tiktok_username} · {profile.country || "—"} · {profile.language?.toUpperCase()}
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-16">
          <Tile href="/portal/inbox" eyebrow="Inbox" title="Messages" hint={`${unreadCount ?? 0} total`} />
          <Tile href="/portal/events" eyebrow="Events" title="Upcoming" hint={`${upcomingEvents ?? 0} open`} />
          <Tile href="/portal/slots" eyebrow="Slots" title="Live-Plan" hint={`${weekSlots ?? 0} this week`} />
          <Tile href="/portal/downloads" eyebrow="Assets" title="Downloads" hint="Logos · Templates · PDFs" />
          <Tile href="/portal/info" eyebrow="Info" title="Rules & Tips" hint="Live-Tag · TikTok-Regeln" />
          <Tile href="/portal/academy" eyebrow="Academy" title="Phase 1" hint="Coming Phase 2" />
          <Tile href="/portal/badges" eyebrow="Achievements" title="Badges" hint="0 earned" />
          <Tile href="/portal/support" eyebrow="Support" title="Help" hint={`${openTickets ?? 0} open ticket${openTickets === 1 ? "" : "s"}`} />
        </div>

        <div className="border-t border-champagne/10 pt-10">
          <p className="eyebrow mb-3">Profile</p>
          <Link href="/portal/profile" className="text-cream/60 hover:text-champagne text-sm">
            Edit your profile →
          </Link>
        </div>
      </main>
    </>
  );
}

function Tile({ href, eyebrow, title, hint }: { href: string; eyebrow: string; title: string; hint: string }) {
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
