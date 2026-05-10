"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SubmitInput {
  target_tiktok_username?: string;
  manual_note?: string;
}

export async function requestAccountAnalysis(
  input: SubmitInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  // Default-Target: eigenes TikTok aus Profil
  const { data: prof } = await supabase
    .from("profiles")
    .select("tiktok_username")
    .eq("id", user.id)
    .single();

  const target = (input.target_tiktok_username || prof?.tiktok_username || "").replace(/^@/, "").trim();
  if (!target || target.length > 64) {
    return { ok: false, error: "TikTok-Username fehlt oder zu lang." };
  }

  const note = (input.manual_note || "").trim().slice(0, 500) || null;

  // Rate-Limit: max 1 offene Analyse pro Creator
  const { count: openCount } = await supabase
    .from("account_analyses")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .in("status", ["submitted", "queued", "processing"]);

  if ((openCount ?? 0) >= 1) {
    return { ok: false, error: "Es laeuft bereits eine Analyse. Warte bis sie fertig ist." };
  }

  const { data, error } = await supabase
    .from("account_analyses")
    .insert({
      profile_id: user.id,
      target_tiktok_username: target,
      manual_note: note,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/analyse");
  revalidatePath("/portal/analyse/account");
  return { ok: true, id: data.id };
}
