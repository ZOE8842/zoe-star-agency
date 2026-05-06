import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { TicketForm } from "./TicketForm";

const statusColors: Record<string, string> = {
  open: "text-champagne",
  in_progress: "text-yellow-400",
  resolved: "text-green-400",
  closed: "text-cream/40",
};

export default async function SupportPage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: tickets } = await supabase
    .from("support_tickets")
    .select("id, category, subject, status, created_at, resolved_at")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Support</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-4">
          Need <span className="text-champagne">help?</span>
        </h1>
        <p className="text-cream/60 text-sm mb-12">Open a ticket — payout · contract · event · tech · traffic · general.</p>

        <TicketForm />

        <div className="mt-16 mb-6">
          <p className="eyebrow">Your tickets</p>
        </div>
        {(!tickets || tickets.length === 0) && (
          <div className="border border-champagne/15 p-10 text-center">
            <p className="text-cream/40 text-sm">No tickets yet.</p>
          </div>
        )}

        <div className="space-y-2">
          {tickets?.map((t) => (
            <div key={t.id} className="border border-champagne/15 p-5 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <span className="eyebrow">{t.category}</span>
                  <span className={`text-[10px] uppercase tracking-[0.25em] ${statusColors[t.status]}`}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <h3 className="font-display italic text-lg text-cream">{t.subject}</h3>
              </div>
              <span className="text-cream/40 text-[10px] uppercase tracking-[0.2em] whitespace-nowrap">
                {new Date(t.created_at).toLocaleDateString("de-DE", { day: "2-digit", month: "short" })}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
