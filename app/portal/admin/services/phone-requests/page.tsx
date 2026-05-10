import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { AdminPhoneTable } from "./AdminTable";

export const dynamic = "force-dynamic";

export default async function AdminPhoneRequestsPage() {
  const { supabase, profile } = await requireAdmin();

  const { data: rows } = await supabase
    .from("phone_call_requests")
    .select("id, profile_id, channel, contact_value, earliest_at, latest_at, status, note, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const ids = Array.from(new Set((rows ?? []).map((r) => r.profile_id)));
  const { data: profiles } = ids.length
    ? await supabase.from("profiles").select("id, display_name, tiktok_username").in("id", ids)
    : { data: [] };
  const map = new Map((profiles ?? []).map((p) => [p.id, p]));

  const enriched = (rows ?? []).map((r) => ({
    ...r,
    display_name: map.get(r.profile_id)?.display_name ?? null,
    tiktok_username: map.get(r.profile_id)?.tiktok_username ?? null,
  }));

  const open = enriched.filter((r) => r.status === "open" || r.status === "planned");
  const closed = enriched.filter((r) => r.status === "done" || r.status === "cancelled");

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
          Telefon-Termin <span className="text-champagne">Anfragen.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          Rueckruf-Wuensche der Creator. Status setzen sobald geplant
          oder erledigt.
        </p>

        {open.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow text-champagne mb-5">Offen / Geplant · {open.length}</p>
            <AdminPhoneTable rows={open} />
          </section>
        )}

        {closed.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-5">Erledigt · {closed.length}</p>
            <AdminPhoneTable rows={closed} />
          </section>
        )}

        {enriched.length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">Keine Termin-Anfragen.</p>
        )}
      </main>
    </>
  );
}
