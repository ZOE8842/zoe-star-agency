"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  generateConsentToken,
  sendShowcaseConsentMail,
  sendCooperationConsentMail,
} from "@/lib/email/consent-mails";

interface ImageEntry {
  url: string;
  type: "image";
  position: number;
}

interface ShowcaseInput {
  display_name: string;
  category?: string;
  showcase_images?: ImageEntry[];
  tiktok_url?: string;
  instagram_url?: string;
  birthday_day?: number | null;
  birthday_month?: number | null;
  request_showcase?: boolean;       // Creator-Wunsch
  request_cooperations?: boolean;   // Creator-Wunsch
}

function trimOrNull(v: string | undefined): string | null {
  if (!v) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function validateUrl(url: string | null, label: string): string | null {
  if (!url) return null;
  if (!/^https?:\/\//i.test(url)) {
    throw new Error(`${label}: muss mit http:// oder https:// beginnen`);
  }
  return url;
}

export async function upsertShowcase(input: ShowcaseInput): Promise<{ ok: boolean; error?: string; mail_sent?: string[] }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const display_name = input.display_name?.trim();
  if (!display_name || display_name.length === 0 || display_name.length > 80) {
    return { ok: false, error: "Display-Name muss 1-80 Zeichen lang sein." };
  }

  const category = trimOrNull(input.category);
  if (category && category.length > 60) {
    return { ok: false, error: "Kategorie maximal 60 Zeichen." };
  }

  let tiktok_url: string | null;
  let instagram_url: string | null;
  try {
    tiktok_url = validateUrl(trimOrNull(input.tiktok_url), "TikTok-URL");
    instagram_url = validateUrl(trimOrNull(input.instagram_url), "Instagram-URL");
  } catch (err: unknown) {
    return { ok: false, error: err instanceof Error ? err.message : "Ungueltige URL." };
  }

  // Birthday: nur Tag + Monat
  const bday = input.birthday_day;
  const bmonth = input.birthday_month;
  if ((bday != null || bmonth != null) && (bday == null || bmonth == null)) {
    return { ok: false, error: "Geburtstag bitte komplett (Tag + Monat) oder leer." };
  }
  if (bday != null && (bday < 1 || bday > 31)) {
    return { ok: false, error: "Geburtstag-Tag ungueltig." };
  }
  if (bmonth != null && (bmonth < 1 || bmonth > 12)) {
    return { ok: false, error: "Geburtstag-Monat ungueltig." };
  }

  // Images: max 2, valid URLs
  const images: ImageEntry[] = (input.showcase_images || [])
    .filter((i) => i && i.url && /^https?:\/\//i.test(i.url))
    .slice(0, 2)
    .map((i, idx) => ({
      url: i.url,
      type: "image" as const,
      position: idx + 1,
    }));

  const primaryImage = images[0]?.url ?? null;

  // 1) showcase_creators upsert
  const showcasePayload = {
    profile_id: user.id,
    display_name,
    category,
    showcase_image: primaryImage, // legacy single-image-Field (Public-Card-Fallback)
    showcase_images: images,
    tiktok_url,
    instagram_url,
    birthday_day: bday ?? null,
    birthday_month: bmonth ?? null,
    updated_at: new Date().toISOString(),
  };

  const { error: showcaseErr } = await supabase
    .from("showcase_creators")
    .upsert(showcasePayload, { onConflict: "profile_id" });
  if (showcaseErr) return { ok: false, error: showcaseErr.message };

  // 2) profile.allow_*-Flags + Confirm-Reset wenn Wunsch geaendert
  const wantShowcase = !!input.request_showcase;
  const wantCooperations = !!input.request_cooperations;

  // current state lesen
  const { data: prof } = await supabase
    .from("profiles")
    .select(
      "email, display_name, allow_website_showcase, allow_website_showcase_confirmed, allow_partner_cooperations, allow_partner_cooperations_confirmed",
    )
    .eq("id", user.id)
    .single();
  if (!prof) return { ok: false, error: "Profil nicht gefunden." };

  const profileUpdate: Record<string, unknown> = {};
  const mailToSend: string[] = [];

  // Showcase-Wunsch
  if (wantShowcase !== prof.allow_website_showcase) {
    profileUpdate.allow_website_showcase = wantShowcase;
    if (wantShowcase) {
      // Re-Aktivierung → Confirm-Status zuruecksetzen + Mail neu senden
      profileUpdate.allow_website_showcase_confirmed = false;
      profileUpdate.allow_website_showcase_confirmed_at = null;
      mailToSend.push("showcase");
    } else {
      profileUpdate.allow_website_showcase_confirmed = false;
      profileUpdate.allow_website_showcase_confirmed_at = null;
    }
  } else if (wantShowcase && !prof.allow_website_showcase_confirmed) {
    // bestand schon, aber noch nie confirmed → Re-Mail moeglich
    mailToSend.push("showcase");
  }

  // Cooperations-Wunsch
  if (wantCooperations !== prof.allow_partner_cooperations) {
    profileUpdate.allow_partner_cooperations = wantCooperations;
    if (wantCooperations) {
      profileUpdate.allow_partner_cooperations_confirmed = false;
      profileUpdate.allow_partner_cooperations_confirmed_at = null;
      mailToSend.push("brand_cooperation");
    } else {
      profileUpdate.allow_partner_cooperations_confirmed = false;
      profileUpdate.allow_partner_cooperations_confirmed_at = null;
    }
  } else if (wantCooperations && !prof.allow_partner_cooperations_confirmed) {
    mailToSend.push("brand_cooperation");
  }

  if (Object.keys(profileUpdate).length > 0) {
    const { error: profileErr } = await supabase
      .from("profiles")
      .update(profileUpdate)
      .eq("id", user.id);
    if (profileErr) return { ok: false, error: profileErr.message };
  }

  // 3) Tokens generieren + Mails senden
  const sent: string[] = [];
  for (const consent of mailToSend) {
    try {
      const token = await generateConsentToken(
        user.id,
        consent as "showcase" | "brand_cooperation",
      );
      if (consent === "showcase") {
        await sendShowcaseConsentMail({
          email: prof.email,
          display_name: prof.display_name || "",
          token,
        });
      } else {
        await sendCooperationConsentMail({
          email: prof.email,
          display_name: prof.display_name || "",
          token,
        });
      }
      sent.push(consent);
    } catch (err) {
      console.error(`consent mail fail [${consent}]:`, err);
    }
  }

  revalidatePath("/portal/profile/showcase");
  revalidatePath("/portal/profile");
  revalidatePath("/");
  return { ok: true, mail_sent: sent };
}

export async function resendConsentMail(
  type: "showcase" | "brand_cooperation",
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { data: prof } = await supabase
    .from("profiles")
    .select(
      "email, display_name, allow_website_showcase, allow_website_showcase_confirmed, allow_partner_cooperations, allow_partner_cooperations_confirmed",
    )
    .eq("id", user.id)
    .single();
  if (!prof) return { ok: false, error: "Profil nicht gefunden." };

  if (type === "showcase") {
    if (!prof.allow_website_showcase) {
      return { ok: false, error: "Showcase-Freigabe ist nicht aktiv." };
    }
    if (prof.allow_website_showcase_confirmed) {
      return { ok: false, error: "Bereits bestaetigt — keine neue Mail noetig." };
    }
  } else {
    if (!prof.allow_partner_cooperations) {
      return { ok: false, error: "Kooperations-Freigabe ist nicht aktiv." };
    }
    if (prof.allow_partner_cooperations_confirmed) {
      return { ok: false, error: "Bereits bestaetigt — keine neue Mail noetig." };
    }
  }

  // Rate-Limit: max 1 Resend pro Minute
  const oneMinuteAgo = new Date(Date.now() - 60_000).toISOString();
  const { count } = await supabase
    .from("consent_tokens")
    .select("id", { head: true, count: "exact" })
    .eq("profile_id", user.id)
    .eq("consent_type", type)
    .gte("created_at", oneMinuteAgo);
  if ((count ?? 0) >= 1) {
    return { ok: false, error: "Bitte ~1 Minute warten, dann erneut probieren." };
  }

  try {
    const token = await generateConsentToken(user.id, type);
    if (type === "showcase") {
      await sendShowcaseConsentMail({
        email: prof.email,
        display_name: prof.display_name || "",
        token,
      });
    } else {
      await sendCooperationConsentMail({
        email: prof.email,
        display_name: prof.display_name || "",
        token,
      });
    }
    revalidatePath("/portal/profile/showcase");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Mail-Versand fehlgeschlagen." };
  }
}

export async function deleteOwnShowcase(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("showcase_creators")
    .delete()
    .eq("profile_id", user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/profile/showcase");
  revalidatePath("/");
  return { ok: true };
}
