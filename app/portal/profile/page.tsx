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

      <main className="container-luxe py-16 max-w-2xl mx-auto">
        <p className="eyebrow mb-3">Profile</p>
        <h1 className="heading-display text-4xl md:text-5xl mb-12">
          Your <span className="text-champagne">profile.</span>
        </h1>

        <div className="border border-champagne/15 p-8 mb-8">
          <p className="eyebrow mb-3">Account</p>
          <dl className="space-y-3">
            <Row label="Email" value={profile.email} />
            <Row label="Role" value={profile.role} />
            <Row label="Status" value={profile.status} />
            <Row label="Joined" value={new Date(profile.joined_at).toLocaleDateString("de-DE")} />
          </dl>
        </div>

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
