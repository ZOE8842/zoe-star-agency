import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { SlotForm } from "./SlotForm";

export default async function SlotsPage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: slots } = await supabase
    .from("slots")
    .select("id, start_at, duration_minutes, status, notes, created_at")
    .eq("creator_id", profile.id)
    .order("start_at", { ascending: false })
    .limit(40);

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Live Slots</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Your <span className="text-champagne">live plan.</span>
        </h1>
        <p className="text-cream/60 text-sm mb-12">Schedule your live appearances and traffic-push slots.</p>

        <SlotForm tiktokUsername={profile.tiktok_username} />

        <div className="mt-16 mb-6">
          <p className="eyebrow">History</p>
        </div>
        {(!slots || slots.length === 0) && (
          <div className="border border-champagne/15 p-10 text-center">
            <p className="text-cream/40 text-sm">No slots yet — schedule your first live above.</p>
          </div>
        )}

        <div className="space-y-2">
          {slots?.map((slot) => {
            const start = new Date(slot.start_at);
            const statusColors: Record<string, string> = {
              planned: "text-champagne",
              went_live: "text-green-400",
              missed: "text-red-400",
              cancelled: "text-cream/30",
            };
            const statusColor = statusColors[slot.status] || "text-cream/50";
            return (
              <div key={slot.id} className="border border-champagne/15 p-5 flex items-center justify-between">
                <div>
                  <p className="font-display italic text-lg text-cream">
                    {start.toLocaleString("de-DE", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="text-cream/50 text-sm mt-1">{slot.duration_minutes} min{slot.notes ? ` · ${slot.notes}` : ""}</p>
                </div>
                <span className={`eyebrow ${statusColor}`}>{slot.status.replace("_", " ")}</span>
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
