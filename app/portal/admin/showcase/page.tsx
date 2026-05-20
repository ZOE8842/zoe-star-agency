import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ShowcaseAdminTable } from "./ShowcaseAdminTable";

export default async function AdminShowcasePage() {
  const { supabase, profile } = await requireAdmin();

  // CDX-1: Edit-Felder (brand_safe, public_note) plus showcase_creators-Basis
  // mit-laden, damit ShowcaseAdminTable → ShowcaseEditModal nicht versehentlich
  // mit null-Defaults bestehende Werte ueberschreibt.
  const { data: rows } = await supabase
    .from("showcase_creators")
    .select(`
      id, profile_id, display_name, category, showcase_image, showcase_images,
      tiktok_url, instagram_url, is_approved, is_featured,
      sort_order, created_at, updated_at, approved_at,
      brand_safe, public_note
    `)
    .order("created_at", { ascending: false });

  const showcaseRows = rows ?? [];

  // CDX-1: JOIN auf profiles fuer Consent-Flags + tiktok_username.
  // Admin-UI muss dieselbe Wahrheit zeigen wie der Public-Resolver, sonst
  // suggeriert "X live" eine Sichtbarkeit, die DSGVO-Filter spaeter beschneiden.
  const profileIds = showcaseRows
    .map((r) => r.profile_id)
    .filter((id): id is string => !!id);
  // CDX-1: bio, region, language fuer ShowcaseEditModal mit-laden (profile-side).
  const { data: profileRows } = profileIds.length > 0
    ? await supabase
        .from("profiles")
        .select(
          "id, tiktok_username, allow_website_showcase_confirmed, allow_partner_cooperations_confirmed, bio, region, language",
        )
        .in("id", profileIds)
    : { data: [] };
  const profileById = new Map(
    (profileRows ?? []).map((p) => [p.id as string, p] as const),
  );

  // Pro Row die Visibility-Booleans anreichern. Wenn Profile fehlt
  // (Edge-Case: Cleanup-Drift), behandeln wir es als "nicht öffentlich".
  const all = showcaseRows.map((r) => {
    const p = r.profile_id ? profileById.get(r.profile_id) : undefined;
    const webOk = !!p?.allow_website_showcase_confirmed;
    const coopOk = !!p?.allow_partner_cooperations_confirmed;
    return {
      ...r,
      tiktok_username: p?.tiktok_username ?? null,
      bio: p?.bio ?? null,
      region: p?.region ?? null,
      language: p?.language ?? null,
      web_ok: webOk,
      coop_ok: coopOk,
      is_public_homepage: r.is_approved && r.is_featured && webOk,
      is_public_coop: r.is_approved && r.is_featured && coopOk,
    };
  });

  const pending = all.filter((r) => !r.is_approved);
  const live = all.filter((r) => r.is_approved && r.is_featured);
  const approved_unfeatured = all.filter((r) => r.is_approved && !r.is_featured);

  // CDX-1: Truth-Counts. Die Differenz zwischen "Live" und "Public (Web)"
  // ist genau die DSGVO-Hidden-Liste, die Admin sonst nicht sieht.
  const publicWeb = live.filter((r) => r.is_public_homepage).length;
  const publicCoop = live.filter((r) => r.is_public_coop).length;
  const blocked = live.length - publicWeb;

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
            Nur freigegebene + featured Cards mit aktivem Consent erscheinen auf der Public-Site.
          </p>
        </section>

        {/* CDX-1: 4 Counter (Pending, Live, Public Web, Public Coop). Plus
            kompakter "blockiert via DSGVO"-Hinweis falls > 0. */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-3">
          <CountCard label="Pending" value={pending.length} highlight={pending.length > 0} />
          <CountCard label="Live total" value={live.length} />
          <CountCard label="Public (Web)" value={publicWeb} />
          <CountCard label="Public (Coop)" value={publicCoop} />
        </div>
        {blocked > 0 && (
          <p className="text-cream/55 text-xs mb-10 md:mb-14">
            {blocked} von {live.length} Live-Karten sind aktuell DSGVO-blockiert
            (kein bestaetigter Web-Showcase-Consent) und erscheinen NICHT auf
            der Public-Site.
          </p>
        )}
        {blocked === 0 && <div className="mb-10 md:mb-14" />}

        {pending.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow text-champagne mb-5">Pending Review · {pending.length}</p>
            <ShowcaseAdminTable rows={pending} />
          </section>
        )}

        {live.length > 0 && (
          <section className="mb-12 md:mb-16">
            <p className="eyebrow mb-5">Live · {live.length}</p>
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
