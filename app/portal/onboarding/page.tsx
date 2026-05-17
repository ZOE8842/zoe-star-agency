// /portal/onboarding — Server-Wrapper
// Etappe 2 ersetzt den V1-Stub durch den echten 7-Step-Flow.
// Auth-Gate sitzt in getAuthedProfile (Creator-only).

import { redirect } from "next/navigation";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { OnboardingFlow } from "./OnboardingFlow";
import { loadLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const { profile } = await getAuthedProfile();

  // Bereits durch → ab ins Dashboard
  if (profile.onboarding_completed) {
    redirect("/portal");
  }

  const { t } = await loadLocale();

  return (
    <OnboardingFlow
      profileId={profile.id}
      initialDisplayName={profile.display_name}
      initialTiktok={profile.tiktok_username}
      initialLanguage={profile.language}
      initialRegion={profile.region}
      i18n={{
        back: t("common.back"),
        next: t("common.next"),
        complete: t("onboarding.complete_button"),
        setup_profile: t("onboarding.setup_profile"),
        submitting: t("onboarding.submitting"),
        // Phase-5 Body
        welcome_eyebrow: t("onboarding.welcome_eyebrow"),
        welcome_title_a: t("onboarding.welcome_title_a"),
        welcome_title_b: t("onboarding.welcome_title_b"),
        welcome_subtitle: t("onboarding.welcome_subtitle"),
        s1_eyebrow: t("onboarding.s1_eyebrow"),
        s1_title_a: t("onboarding.s1_title_a"),
        s1_title_b: t("onboarding.s1_title_b"),
        s2_eyebrow: t("onboarding.s2_eyebrow"),
        s2_title_a: t("onboarding.s2_title_a"),
        s2_title_b: t("onboarding.s2_title_b"),
        s3_eyebrow: t("onboarding.s3_eyebrow"),
        s3_title_a: t("onboarding.s3_title_a"),
        s3_title_b: t("onboarding.s3_title_b"),
        s4_eyebrow: t("onboarding.s4_eyebrow"),
        s4_title_a: t("onboarding.s4_title_a"),
        s4_title_b: t("onboarding.s4_title_b"),
        s5_eyebrow: t("onboarding.s5_eyebrow"),
        s5_title_a: t("onboarding.s5_title_a"),
        s5_title_b: t("onboarding.s5_title_b"),
        field_display_name: t("onboarding.field_display_name"),
        field_display_name_hint: t("onboarding.field_display_name_hint"),
        field_tiktok_username: t("onboarding.field_tiktok_username"),
        field_tiktok_username_hint: t("onboarding.field_tiktok_username_hint"),
        field_language: t("onboarding.field_language"),
        field_region: t("onboarding.field_region"),
        field_creator_category: t("onboarding.field_creator_category"),
        field_live_format: t("onboarding.field_live_format"),
        field_live_window: t("onboarding.field_live_window"),
        field_live_window_hint: t("onboarding.field_live_window_hint"),
        field_goals: t("onboarding.field_goals"),
        field_goals_hint: t("onboarding.field_goals_hint"),
        field_extra_focus: t("onboarding.field_extra_focus"),
        field_telegram: t("onboarding.field_telegram"),
        field_instagram: t("onboarding.field_instagram"),
        field_bio: t("onboarding.field_bio"),
        field_allow_showcase: t("onboarding.field_allow_showcase"),
        field_allow_partner: t("onboarding.field_allow_partner"),
        select_placeholder: t("onboarding.select_placeholder"),
        success_title: t("onboarding.success_title"),
        success_subtitle: t("onboarding.success_subtitle"),
        to_dashboard: t("onboarding.to_dashboard"),
      }}
    />
  );
}
