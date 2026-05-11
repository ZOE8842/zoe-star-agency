import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ProfileForm } from "./ProfileForm";
import { AvatarUploader } from "./AvatarUploader";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const { supabase, profile } = await getAuthedProfile();

  // Showcase-Status fuer prominente Card
  const { data: showcase } = await supabase
    .from("showcase_creators")
    .select("id, is_approved, is_featured")
    .eq("profile_id", profile.id)
    .maybeSingle();
  const showcaseExists = !!showcase;
  const showcaseLive = !!(showcase?.is_approved && showcase?.is_featured && profile.allow_website_showcase_confirmed);
  const showcasePending = showcaseExists && !showcaseLive;
  const coopActive = !!profile.allow_partner_cooperations;
  const coopConfirmed = !!profile.allow_partner_cooperations_confirmed;

  // Creator-ID aus uuid generiert, oeffentlich darstellbar (kein PII).
  const creatorId = "ZOE-" + (profile.id.replace(/-/g, "").slice(0, 8).toUpperCase());

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

      <main className="container-luxe py-12 md:py-16 max-w-2xl mx-auto">
        <p className="eyebrow mb-3">Profile</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Dein <span className="text-champagne italic">Profil.</span>
        </h1>

        <AvatarUploader currentUrl={profile.avatar_url} displayName={profile.display_name} />

        {/* SHOWCASE + KOOPERATIONEN · prominent oben */}
        <Link
          href="/portal/profile/showcase"
          className="border border-champagne/30 hover:border-champagne hover:bg-champagne/5 transition-all p-5 md:p-6 mb-6 block group"
        >
          <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
            <p className="font-display italic text-cream text-xl md:text-2xl group-hover:text-champagne transition-colors">
              Showcase &amp; Kooperationen
            </p>
            <span className="text-champagne text-xl group-hover:translate-x-1 transition-transform">→</span>
          </div>
          <p className="text-cream/55 text-sm leading-relaxed mb-4">
            Bilder verwalten, Display-Name fuer die Webseite waehlen, Showcase-
            Freigabe + Brand-Kooperationen jederzeit aktivieren oder deaktivieren.
          </p>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${
              showcaseLive ? "bg-champagne text-ink"
              : showcasePending ? "border border-champagne/40 text-champagne"
              : "border border-cream/20 text-cream/55"
            }`}>
              Showcase · {showcaseLive ? "LIVE auf zoe-star.de" : showcasePending ? "Pending" : "noch nicht eingerichtet"}
            </span>
            <span className={`px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${
              coopConfirmed ? "bg-champagne text-ink"
              : coopActive ? "border border-champagne/40 text-champagne"
              : "border border-cream/20 text-cream/55"
            }`}>
              Kooperationen · {coopConfirmed ? "aktiv" : coopActive ? "Email-Bestaetigung offen" : "deaktiviert"}
            </span>
          </div>
          {coopActive && (
            <p className="text-cream/40 text-[10px] uppercase tracking-[0.25em] mt-3">
              Du kannst die Brand-Kooperations-Freigabe jederzeit hier wieder deaktivieren.
            </p>
          )}
        </Link>

        <div className="border border-champagne/15 p-6 md:p-8 mb-6">
          <p className="eyebrow mb-3">Account</p>
          <dl className="space-y-3">
            <Row label="Creator-ID" value={creatorId} />
            <Row label="Rolle" value={profile.role} />
            <Row label="Status" value={profile.status} />
            <Row label="Mitglied seit" value={new Date(profile.joined_at).toLocaleDateString("de-DE")} />
          </dl>
        </div>

        <Link
          href="/portal/profile/security"
          className="border border-champagne/15 hover:border-champagne hover:bg-champagne/5 transition-all p-5 md:p-6 mb-6 flex items-center justify-between group"
        >
          <div>
            <p className="eyebrow mb-1">Security</p>
            <p className="text-cream font-display italic text-lg">Passwort ändern</p>
            <p className="text-cream/50 text-xs mt-1">Aktuelles Passwort + neues setzen</p>
          </div>
          <span className="text-champagne text-2xl group-hover:translate-x-1 transition-transform">→</span>
        </Link>

        <ProfileForm profile={profile} />
      </main>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <dt className="text-cream/50 uppercase tracking-[0.2em] text-[10px]">{label}</dt>
      <dd className="text-cream font-mono">{value}</dd>
    </div>
  );
}
