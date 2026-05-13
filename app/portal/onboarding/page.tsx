// /portal/onboarding — Server-Wrapper
// Etappe 2 ersetzt den V1-Stub durch den echten 7-Step-Flow.
// Auth-Gate sitzt in getAuthedProfile (Creator-only).

import { redirect } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { OnboardingFlow } from "./OnboardingFlow";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await getAuthedProfile();

  // Bereits durch → ab ins Dashboard
  if (profile.onboarding_completed) {
    redirect("/portal");
  }

  return (
    <OnboardingFlow
      profileId={profile.id}
      initialDisplayName={profile.display_name}
      initialTiktok={profile.tiktok_username}
      initialLanguage={profile.language}
      initialRegion={profile.region}
    />
  );
}
