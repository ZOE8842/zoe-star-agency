import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { EventForm } from "./EventForm";

export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: events } = await supabase
    .from("events")
    .select("id, title, category, source, start_at, end_at, status, max_participants, cover_image_url")
    .order("start_at", { ascending: false })
    .limit(80);

  return (
    <>
      <PortalNav userId={profile.id}
        displayName={profile.display_name} email={profile.email}
        avatarUrl={profile.avatar_url} isAdmin />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Admin · Events</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Event <span className="text-champagne">Management.</span>
        </h1>

        <EventForm />

        <div className="mt-16 mb-6 flex items-baseline justify-between">
          <p className="eyebrow">Alle Events</p>
          <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">{events?.length ?? 0} Eintraege</p>
        </div>
        <div className="space-y-2">
          {(events ?? []).map((e) => (
            <Link
              key={e.id}
              href={`/portal/admin/events/${e.id}`}
              className="block border border-champagne/15 hover:border-champagne/50 hover:bg-champagne/5 p-5 transition-colors group"
            >
              <div className="flex items-baseline justify-between gap-3 flex-wrap">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <span className="eyebrow">{e.category}</span>
                    <span className="text-cream/40 text-[10px] uppercase tracking-[0.25em]">
                      {e.source ?? "agency"}
                    </span>
                    <span className={`text-[10px] uppercase tracking-[0.25em] px-1.5 py-0.5 ${
                      e.status === "open" ? "bg-champagne text-ink" :
                      e.status === "draft" ? "border border-yellow-400/40 text-yellow-300" :
                      e.status === "completed" ? "border border-cream/20 text-cream/55" :
                      "border border-champagne/40 text-champagne"
                    }`}>{e.status}</span>
                  </div>
                  <h3 className="font-display italic text-lg text-cream group-hover:text-champagne transition-colors">{e.title}</h3>
                  <p className="text-cream/50 text-xs mt-1">
                    {new Date(e.start_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                    {e.end_at && <> — {new Date(e.end_at).toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}</>}
                    {e.max_participants && ` · max ${e.max_participants}`}
                  </p>
                </div>
                <span className="text-champagne/60 group-hover:text-champagne shrink-0">→</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </>
  );
}
