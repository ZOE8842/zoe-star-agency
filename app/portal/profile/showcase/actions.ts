"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface ShowcaseInput {
  display_name: string;
  category?: string;
  showcase_image?: string;
  tiktok_url?: string;
  instagram_url?: string;
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

export async function upsertShowcase(input: ShowcaseInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const display_name = input.display_name?.trim();
  if (!display_name || display_name.length === 0 || display_name.length > 80) {
    return { ok: false, error: "Display-Name muss 1–80 Zeichen lang sein." };
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
    return { ok: false, error: err instanceof Error ? err.message : "Ungültige URL." };
  }

  const showcase_image = trimOrNull(input.showcase_image);

  const payload = {
    profile_id: user.id,
    display_name,
    category,
    showcase_image,
    tiktok_url,
    instagram_url,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase
    .from("showcase_creators")
    .upsert(payload, { onConflict: "profile_id" });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/portal/profile/showcase");
  revalidatePath("/");
  return { ok: true };
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
