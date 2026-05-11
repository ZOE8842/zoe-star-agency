import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { Playbook } from "./Playbook";

export const dynamic = "force-dynamic";

export default async function InfoPage() {
  const { profile } = await getAuthedProfile();

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

      <main className="container-luxe py-12 md:py-16 max-w-3xl mx-auto">
        <p className="eyebrow mb-3">ZOE's Playbook</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          So laeuft ein guter <span className="text-champagne">TikTok-LIVE</span>.
        </h1>
        <p className="text-cream/55 text-sm md:text-base leading-relaxed mb-10 md:mb-12 max-w-xl">
          Kurze Checklisten, keine Theorie. Klick dich durch die fuenf
          Phasen und mach's beim naechsten Stream einfach.
        </p>

        <Playbook />

        <p className="text-cream/35 text-xs mt-14 leading-relaxed border-t border-champagne/10 pt-6">
          Tieferes Wissen findest du in der Academy — TikTok-Strategie,
          Watchtime, Battle-Psychologie, Profil-Optimierung.
        </p>
      </main>
    </>
  );
}
