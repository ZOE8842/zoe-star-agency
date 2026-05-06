import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { ProfileForm } from "./ProfileForm";

export default async function ProfilePage() {
  const { profile } = await getAuthedProfile();

  return (
    <>
      <PortalNav
        displayName={profile.display_name}
        email={profile.email}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />

      <main className="container-luxe py-12 md:py-16 max-w-2xl mx-auto">
        <p className="eyebrow mb-3">Profile</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Your <span className="text-champagne">profile.</span>
        </h1>

        <div className="border border-champagne/15 p-6 md:p-8 mb-6">
          <p className="eyebrow mb-3">Account</p>
          <dl className="space-y-3">
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
            <Row label="Status" value={profile.status} />
            <Row label="Joined" value={new Date(profile.joined_at).toLocaleDateString("de-DE")} />
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
