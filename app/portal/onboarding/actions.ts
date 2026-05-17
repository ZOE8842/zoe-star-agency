"use server";

// Onboarding-Server-Action — schreibt alle 7 Steps in einer Transaktion,
// setzt onboarding_completed=true. Whitelist auf Felder, keine PII.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Codex-Fix 0052: 'other' ist KEIN gueltiger DB-Wert (CHECK-Constraint
// profiles_language_supported). Legacy-Onboarding-Submits mit 'other'
// werden im language-Mapping unten auf 'de' normalisiert.
const ALLOWED_LANGUAGES = ["de", "en", "fr", "tr", "pt", "ar"] as const;
const ALLOWED_REGIONS = ["DE", "AT", "CH", "LI"] as const;
const ALLOWED_LIVE_WINDOWS = ["tag", "abend", "nacht", "wochenende", "flex"] as const;
const ALLOWED_GOALS = [
  "community", "ranking", "brand_deals", "wachstum", "matches", "reichweite",
] as const;

export interface OnboardingInput {
  display_name: string;
  tiktok_username: string;
  language: string;
  region: string;
  creator_category: string;
  live_format: string;
  live_window: string;
  goals: string[];
  extra_focus?: string;
  telegram_username?: string;
  instagram_username?: string;
  whatsapp_url?: string;
  bio?: string;
  allow_website_showcase: boolean;
  allow_partner_cooperations: boolean;
}

interface ActionResult {
  ok: boolean;
  error?: string;
}

function clean(v: string | undefined | null, max: number): string | null {
  if (!v) return null;
  const t = v.trim().slice(0, max);
  return t.length === 0 ? null : t;
}

export async function upsertOnboarding(input: OnboardingInput): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  // --- Validation, weich aber konsequent ---
  const display_name = clean(input.display_name, 80);
  if (!display_name) return { ok: false, error: "Display-Name fehlt." };

  const tiktok_username = clean(input.tiktok_username?.replace(/^@/, ""), 64);
  if (!tiktok_username) return { ok: false, error: "TikTok Username fehlt." };

  // Mapping: Legacy 'other' (vor CHECK-Constraint) → 'de'.
  const rawLang = input.language === "other" ? "de" : input.language;
  const language = ALLOWED_LANGUAGES.includes(rawLang as never)
    ? rawLang : "de";

  if (!ALLOWED_REGIONS.includes(input.region as never)) {
    return { ok: false, error: "Region ungueltig." };
  }
  const region = input.region;

  const creator_category = clean(input.creator_category, 60);
  const live_format = clean(input.live_format, 60);

  const live_window = ALLOWED_LIVE_WINDOWS.includes(input.live_window as never)
    ? input.live_window : "flex";

  // Goals: kein 3er-Limit mehr — Creator darf mehrere Ziele wählen.
  // Whitelist filtert ungueltige Werte raus.
  const goals = (Array.isArray(input.goals) ? input.goals : [])
    .filter((g) => ALLOWED_GOALS.includes(g as never));

  const extra_focus = clean(input.extra_focus, 160);
  const telegram_username = clean(input.telegram_username?.replace(/^@/, ""), 64);
  const instagram_username = clean(input.instagram_username?.replace(/^@/, ""), 64);

  // WhatsApp-URL: Pflicht-Format wa.me / https-Link, sonst leer.
  let whatsapp_url: string | null = null;
  const rawWa = clean(input.whatsapp_url, 200);
  if (rawWa) {
    if (!/^https?:\/\//i.test(rawWa)) {
      return { ok: false, error: "WhatsApp-Link muss mit http:// oder https:// beginnen." };
    }
    whatsapp_url = rawWa;
  }

  const bio = clean(input.bio, 240);

  // Pre-Check: TikTok-Username darf nicht von ANDEREM Profil belegt sein.
  // Eigener User darf eigenen Username speichern (Update-Idempotenz).
  const { data: dup } = await supabase
    .from("profiles")
    .select("id")
    .eq("tiktok_username", tiktok_username)
    .neq("id", user.id)
    .limit(1)
    .maybeSingle();

  if (dup) {
    return {
      ok: false,
      error:
        "Dieser TikTok-Username ist bereits bei ZOE registriert. Bitte pruefe die Schreibweise oder melde dich beim Team.",
    };
  }

  // metadata jsonb merge — bestehende keys nicht zerstoeren
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("metadata")
    .eq("id", user.id)
    .single();

  const prevMeta = (existingProfile?.metadata as Record<string, unknown>) || {};
  const newMeta: Record<string, unknown> = {
    ...prevMeta,
    goals,
    live_window,
  };
  if (extra_focus) newMeta.extra_focus = extra_focus;
  else delete newMeta.extra_focus;
  if (instagram_username) newMeta.instagram_username = instagram_username;
  else delete newMeta.instagram_username;

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name,
      tiktok_username,
      language,
      region,
      creator_category,
      live_format,
      telegram_username,
      whatsapp_url,
      bio,
      allow_website_showcase: !!input.allow_website_showcase,
      allow_partner_cooperations: !!input.allow_partner_cooperations,
      metadata: newMeta,
      onboarding_completed: true,
      onboarding_completed_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    // Defense-in-depth: falls die Race-Condition den Pre-Check umgangen hat,
    // den unique-violation auch hier zu Friendly-Text uebersetzen.
    const code = (error as { code?: string }).code;
    if (
      code === "23505" &&
      /tiktok_username/i.test(error.message)
    ) {
      return {
        ok: false,
        error:
          "Dieser TikTok-Username ist bereits bei ZOE registriert. Bitte pruefe die Schreibweise oder melde dich beim Team.",
      };
    }
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Server-Action fuer den finalen Redirect (separater Aufruf)
export async function finishOnboarding(): Promise<never> {
  redirect("/portal");
}
