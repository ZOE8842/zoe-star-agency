import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ShowcaseEditor } from "./ShowcaseEditor";

export default async function ShowcasePage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: showcase } = await supabase
    .from("showcase_creators")
    .select("id, display_name, category, showcase_image, tiktok_url, instagram_url, is_approved, is_featured, created_at, updated_at")
    .eq("profile_id", profile.id)
    .maybeSingle();

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-12 md:py-20">
        <section className="mb-10 md:mb-14">
          <p className="eyebrow mb-4">Profile · Showcase</p>
          <h1 className="heading-display text-4xl md:text-6xl leading-[1.05]">
            Dein <span className="text-champagne italic">Showcase.</span>
          </h1>
          <p className="text-cream/60 text-base md:text-lg mt-4 max-w-2xl">
            Lege deine Showcase-Card für die Public-Site an. Bild + Display-Name + Kategorie + Plattform-Links.
            Nach Speichern landet alles im Pending-Bereich. Erst nach Admin-Freigabe wird die Karte auf zoe-star.de sichtbar.
          </p>
        </section>

        {showcase && (
          <div className="mb-10 border border-champagne/15 px-5 py-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-block px-3 py-1 text-[10px] uppercase tracking-[0.25em] ${
                showcase.is_approved && showcase.is_featured
                  ? "bg-champagne text-ink"
                  : "border border-champagne/40 text-champagne"
              }`}
            >
              {showcase.is_approved && showcase.is_featured ? "LIVE auf Homepage" : "Pending Review"}
            </span>
            <span className="text-cream/55 text-sm">
              {showcase.is_approved && showcase.is_featured
                ? "Deine Showcase-Card ist veröffentlicht."
                : "Wartet auf Admin-Freigabe."}
            </span>
          </div>
        )}

        <ShowcaseEditor initial={showcase ?? null} />
      </main>
    </>
  );
}
