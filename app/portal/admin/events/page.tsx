import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { EventForm } from "./EventForm";

export default async function AdminEventsPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, start_at, status, max_participants")
    .order("start_at", { ascending: false });

  return (
    <>
      <PortalNav displayName={profile.display_name} email={profile.email} isAdmin />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Admin · Events</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Event <span className="text-champagne">management.</span>
        </h1>

        <EventForm adminId={profile.id} />

        <div className="mt-16 mb-6">
          <p className="eyebrow">All events</p>
        </div>
        <div className="space-y-2">
          {events?.map((e) => (
            <div key={e.id} className="border border-champagne/15 p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="eyebrow">{e.category}</span>
                  <span className={`text-[10px] uppercase tracking-[0.25em] ${
                    e.status === "open" ? "text-champagne" :
                    e.status === "draft" ? "text-yellow-400" :
                    "text-cream/40"
                  }`}>{e.status}</span>
                </div>
                <h3 className="font-display italic text-lg text-cream">{e.title}</h3>
                <p className="text-cream/50 text-xs mt-1">
                  {new Date(e.start_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  {e.max_participants && ` · max ${e.max_participants}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
