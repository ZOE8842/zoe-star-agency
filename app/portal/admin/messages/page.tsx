import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { BroadcastForm } from "./BroadcastForm";

export default async function AdminMessagesPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: recent } = await supabase
    .from("messages")
    .select("id, subject, category, recipient_id, recipient_group, requires_ack, sent_at")
    .order("sent_at", { ascending: false })
    .limit(20);

  return (
    <>
      <PortalNav displayName={profile.display_name} email={profile.email} isAdmin />
      <main className="container-luxe py-16">
        <p className="eyebrow mb-3">Admin · Messages</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Broadcast <span className="text-champagne">·</span> Direct
        </h1>

        <BroadcastForm senderId={profile.id} />

        <div className="mt-16 mb-6">
          <p className="eyebrow">Recent messages</p>
        </div>
        <div className="space-y-2">
          {recent?.map((m) => (
            <div key={m.id} className="border border-champagne/15 p-5 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="eyebrow">{m.category}</span>
                  {m.requires_ack && <span className="text-[10px] uppercase tracking-[0.2em] text-champagne">Ack required</span>}
                  <span className="text-cream/40 text-[10px] uppercase tracking-[0.2em]">
                    {m.recipient_group ? m.recipient_group : "direct"}
                  </span>
                </div>
                <h3 className="font-display italic text-lg text-cream">{m.subject}</h3>
              </div>
              <span className="text-cream/40 text-[10px]">
                {new Date(m.sent_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
              </span>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
