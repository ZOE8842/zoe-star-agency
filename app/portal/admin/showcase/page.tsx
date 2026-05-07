import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ShowcaseAdminTable } from "./ShowcaseAdminTable";

export default async function AdminShowcasePage() {
  const { supabase, profile } = await requireAdmin();

  const { data: rows } = await supabase
    .from("showcase_creators")
    .select(`
      id, profile_id, display_name, category, showcase_image,
      tiktok_url, instagram_url, is_approved, is_featured,
      sort_order, created_at, updated_at, approved_at
    `)
    .order("created_at", { ascending: false });

  const all = rows ?? [];
  const pending = all.filter((r) => !r.is_approved);
  const live = all.filter((r) => r.is_approved && r.is_featured);
  const approved_unfeatured = all.filter((r) => r.is_approved && !r.is_featured);

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-12 md:py-20">
        <section className="mb-10 md:mb-14">
          <p className="eyebrow mb-4">Admin · Showcase</p>
          <h1 className="heading-display text-4xl md:text-6xl leading-[1.05]">
            Featured <span className="text-champagne italic">Roster.</span>
          </h1>
          <p className="text-cream/60 text-base md:text-lg mt-4 max-w-2xl">
            Creator-Showcase-Cards verwalten. Approve/Reject, Featured-Toggle und Reihenfolge.
            Nur freigegebene + featured Cards erscheinen auf der Public-Site.
          </p>
        </section>

        {/* Counts */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mb-10 md:mb-14">
          <CountCard label="Pending" value={pending.length} highlight={pending.length > 0} />
          <CountCard label="Live" value={live.length} />
          <CountCard label="Approved (off)" value={approved_unfeatured.length} />
        </div>

        {pending.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow text-champagne mb-5">Pending Review · {pending.length}</p>
            <ShowcaseAdminTable rows={pending} />
          </section>
        )}

        {live.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-5">Live auf Homepage · {live.length}</p>
            <ShowcaseAdminTable rows={live} />
          </section>
        )}

        {approved_unfeatured.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-5">Freigegeben aber inaktiv · {approved_unfeatured.length}</p>
            <ShowcaseAdminTable rows={approved_unfeatured} />
          </section>
        )}

        {all.length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">Noch keine Showcase-Einreichungen.</p>
        )}
      </main>
    </>
  );
}

function CountCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`border p-5 md:p-6 ${highlight ? "border-champagne bg-champagne/5" : "border-champagne/15"}`}>
      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      <p className={`font-display italic font-black text-4xl md:text-5xl leading-none ${highlight ? "text-champagne" : "text-cream"}`}>{value}</p>
    </div>
  );
}
