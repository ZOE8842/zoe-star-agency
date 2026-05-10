"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

interface SubmitInput {
  period_label?: string;
  manual_note?: string;
}

export async function requestLiveReport(
  input: SubmitInput,
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Nicht eingeloggt." };

  const label = (input.period_label || "Aktueller Monat").trim().slice(0, 60);
  const note = (input.manual_note || "").trim().slice(0, 500) || null;

  // Rate-Limit: max 1 offener Report pro Creator
  const { count: openCount } = await supabase
    .from("live_performance_reports")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .in("status", ["submitted", "queued", "processing"]);
  if ((openCount ?? 0) >= 1) {
    return { ok: false, error: "Es laeuft bereits ein Report. Warte bis er fertig ist." };
  }

  // Default-Period: aktueller Monat
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("live_performance_reports")
    .insert({
      profile_id: user.id,
      period_label: label,
      period_start: start,
      period_end: end,
      manual_note: note,
      status: "submitted",
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidatePath("/portal/analyse");
  revalidatePath("/portal/analyse/live");
  return { ok: true, id: data.id };
}
