import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AdminPushTable } from "./AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminTikTokPushPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: rows } = await supabase
    .from("tiktok_push_requests")
    .select("id, profile_id, week_start_monday, status, requested_slots, note, created_at")
    .order("week_start_monday", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  // Profile-Lookup batch
  const ids = Array.from(new Set((rows ?? []).map((r) => r.profile_id)));
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, display_name, tiktok_username").in("id", ids)
    : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const enriched = (rows ?? []).map((r) => ({
    ...r,
    requested_slots: (r.requested_slots as Array<{ date: string; time: string; duration_min: number }>) ?? [],
    display_name: profileMap.get(r.profile_id)?.display_name ?? null,
    tiktok_username: profileMap.get(r.profile_id)?.tiktok_username ?? null,
  }));

  const pending = enriched.filter((r) => r.status === "submitted" || r.status === "reviewed");
  const decided = enriched.filter((r) => r.status === "selected" || r.status === "not_selected" || r.status === "cancelled");

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-12 md:py-16">
        <p className="eyebrow mb-4">Admin · Services</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          TikTok Push <span className="text-champagne">Anfragen.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Wunschzeiten der Creator pro Woche. Status setzen, damit der Creator
          die Auswahl im Portal sieht.
        </p>

        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-14">
          <Count label="Offen" value={pending.length} highlight={pending.length > 0} />
          <Count label="Entschieden" value={decided.length} />
          <Count label="Total" value={enriched.length} />
        </div>

        {pending.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow text-champagne mb-5">Offen · {pending.length}</p>
            <AdminPushTable rows={pending} />
          </section>
        )}

        {decided.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-5">Entschieden · {decided.length}</p>
            <AdminPushTable rows={decided} />
          </section>
        )}

        {enriched.length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">
            Noch keine Push-Anfragen eingegangen.
          </p>
        )}
      </main>
    </>
  );
}

function Count({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl leading-none ${highlight ? "text-champagne" : "text-cream"}`}>
        {value}
      </p>
    </div>
  );
}
