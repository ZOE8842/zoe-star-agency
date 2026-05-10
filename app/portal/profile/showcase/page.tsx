import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ShowcaseEditor } from "./ShowcaseEditor";

export const dynamic = "force-dynamic";

export default async function ShowcasePage() {
  const { supabase, profile } = await getAuthedProfile();

  const { data: showcase } = await supabase
    .from("showcase_creators")
    .select(
      "id, display_name, category, showcase_image, showcase_images, tiktok_url, instagram_url, is_approved, is_featured, birthday_day, birthday_month, created_at, updated_at",
    )
    .eq("profile_id", profile.id)
    .maybeSingle();

  // Profile-Felder fuer Consent-Status
  const showcaseRequested = !!profile.allow_website_showcase;
  const showcaseConfirmed = !!profile.allow_website_showcase_confirmed;
  const cooperationRequested = !!profile.allow_partner_cooperations;
  const cooperationConfirmed = !!profile.allow_partner_cooperations_confirmed;

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-12 md:py-20 max-w-3xl">
        <section className="mb-10 md:mb-14">
          <p className="eyebrow mb-4">Profil · Showcase</p>
          <h1 className="heading-display text-4xl md:text-6xl leading-[1.05]">
            Dein <span className="text-champagne italic">Showcase.</span>
          </h1>
          <p className="text-cream/60 text-base md:text-lg mt-4 max-w-2xl">
            Dein Creator-Portfolio fuer die Public-Site — bis zu zwei Bilder,
            Display-Name, Kategorie und Plattform-Links. Sichtbar wird die Karte
            erst nach deiner Email-Bestaetigung und Admin-Freigabe.
          </p>
        </section>

        {showcase && (
          <div className="mb-10 border border-champagne/15 px-5 py-4 flex flex-wrap items-center gap-3">
            <span
              className={`inline-block px-3 py-1 text-[10px] uppercase tracking-[0.25em] ${
                showcase.is_approved && showcase.is_featured && showcaseConfirmed
                  ? "bg-champagne text-ink"
                  : "border border-champagne/40 text-champagne"
              }`}
            >
              {showcase.is_approved && showcase.is_featured && showcaseConfirmed
                ? "LIVE auf zoe-star.de"
                : showcaseRequested && !showcaseConfirmed
                ? "Email-Bestaetigung ausstehend"
                : showcase.is_approved && showcase.is_featured
                ? "Bestaetigung fehlt"
                : "Pending Review"}
            </span>
            <span className="text-cream/55 text-sm">
              {showcase.is_approved && showcase.is_featured && showcaseConfirmed
                ? "Deine Card ist veroeffentlicht."
                : showcaseRequested && !showcaseConfirmed
                ? "Schau in dein Postfach — Bestaetigungs-Mail wartet."
                : "Wartet auf Admin-Freigabe."}
            </span>
          </div>
        )}

        <ShowcaseEditor
          initial={showcase ?? null}
          email={profile.email}
          showcaseRequested={showcaseRequested}
          showcaseConfirmed={showcaseConfirmed}
          cooperationRequested={cooperationRequested}
          cooperationConfirmed={cooperationConfirmed}
        />
      </main>
    </>
  );
}
