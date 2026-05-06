import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export default async function EventsPage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, description, category, start_at, end_at, status, max_participants")
    .in("status", ["open", "closed"])
    .order("start_at", { ascending: true })
    .limit(30);

  // Eigene Signups holen
  const { data: signups } = await supabase
    .from("event_signups")
    .select("event_id, status")
    .eq("creator_id", profile.id);

  const signupMap = new Map((signups || []).map(s => [s.event_id, s.status]));

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
        <p className="eyebrow mb-3">Events</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Upcoming <span className="text-champagne">live formats.</span>
        </h1>
        <p className="text-cream/60 text-sm mb-12">Sign up for live events, battles, and ranking shows.</p>

        {(!events || events.length === 0) && (
          <div className="border border-champagne/15 p-10 text-center">
            <p className="text-cream/40 text-sm">No upcoming events.</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {events?.map((event) => {
            const userSignup = signupMap.get(event.id);
            const startDate = new Date(event.start_at);
            return (
              <div key={event.id} className="border border-champagne/15 p-8 hover:border-champagne transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <span className="eyebrow">{event.category}</span>
                  {userSignup && (
                    <span className="text-[10px] uppercase tracking-[0.25em] text-champagne">
                      {userSignup === "confirmed" ? "✓ Confirmed" : userSignup}
                    </span>
                  )}
                </div>
                <h3 className="font-display italic text-2xl text-cream mb-3">{event.title}</h3>
                {event.description && (
                  <p className="text-cream/60 text-sm mb-6 line-clamp-3">{event.description}</p>
                )}
                <div className="text-cream/40 text-[11px] uppercase tracking-[0.2em] mb-6">
                  {startDate.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                </div>
                {!userSignup && event.status === "open" && (
                  <form action={`/portal/events/${event.id}/signup`} method="post">
                    <button className="btn-outline text-[10px] py-2.5 px-5">Sign up</button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
