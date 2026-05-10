"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_KEYS = [
  "followed_zoe_instagram",
  "followed_zoe_tiktok",
  "followed_zoe_telegram",
] as const;

export async function setFollowStatus(
  key: (typeof ALLOWED_KEYS)[number],
  value: boolean,
): Promise<{ ok: boolean; error?: string }> {
  if (!ALLOWED_KEYS.includes(key)) return { ok: false, error: "Key ungueltig." };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("profiles")
    .update({ [key]: value })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal");
  revalidatePath("/portal/profile/showcase");
  return { ok: true };
}

export async function dismissFollowPrompt(): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const { error } = await supabase
    .from("profiles")
    .update({ follow_prompt_dismissed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal");
  return { ok: true };
}
