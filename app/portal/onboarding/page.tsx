// /portal/onboarding — STUB
// Etappe 1 legt nur das Auth-Gate. Der echte 7-Step-Flow folgt
// in Etappe 2 mit frontend-design Skill.
// Bis dahin sieht der Creator hier eine ruhige Hold-Page —
// kein Lockout, keine Endlos-Redirects.

import { redirect } from "next/navigation";
import Link from "next/link";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export default async function OnboardingStubPage() {
  const { profile } = await getAuthedProfile();

  // Wer bereits onboarding_completed=true hat, gehoert nicht hier her.
  if (profile.onboarding_completed) {
    redirect("/portal");
  }

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

      <main className="container-luxe py-16 md:py-24 max-w-xl mx-auto text-center">
        <p className="eyebrow mb-4">Onboarding</p>
        <h1 className="heading-display text-4xl md:text-5xl leading-tight mb-6">
          Dein Creator-Profil <span className="text-champagne italic">wird vorbereitet.</span>
        </h1>
        <p className="text-cream/65 text-base md:text-lg leading-relaxed mb-10">
          Wir richten gerade den persoenlichen Onboarding-Flow fuer dich ein.
          Bis dahin meldet sich dein Management bei dir mit den naechsten Schritten.
        </p>

        <div className="border border-champagne/15 p-6 md:p-8 mb-10 text-left">
          <p className="eyebrow mb-3">Was du jetzt tun kannst</p>
          <ul className="space-y-2 text-cream/75 text-sm md:text-base">
            <li>· dein TikTok-Profil aktiv halten</li>
            <li>· LIVE-Slots regelmaessig wahrnehmen</li>
            <li>· auf Nachrichten von deinem Management reagieren</li>
          </ul>
        </div>

        <Link
          href="/portal/profile"
          className="text-champagne hover:text-champagne-300 text-[11px] uppercase tracking-[0.25em]"
        >
          Profil ansehen →
        </Link>
      </main>
    </>
  );
}
