"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSsr } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { processContentReview } from "@/lib/analyse/worker";

async function requireAdmin() {
  const supabase = await createSsr();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Nicht eingeloggt.");
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (!profile || profile.role !== "admin") throw new Error("Nur Admin.");
  return { user };
}

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export async function adminTriggerContentReview(
  id: string,
): Promise<{ ok: boolean; cost_usd?: number; error?: string }> {
  try {
    await requireAdmin();
    const sb = admin();
    const r = await processContentReview(sb, id);
    revalidatePath(`/portal/services/content-helper/${id}`);
    return { ok: r.ok, cost_usd: r.cost_usd, error: r.error };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function adminResetContentReview(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const sb = admin();
    const { error } = await sb
      .from("content_reviews")
      .update({
        status: "submitted",
        processing_started_at: null,
        reviewed_at: null,
        error_message: null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/portal/services/content-helper/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function adminSetInReview(
  id: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const sb = admin();
    const { error } = await sb
      .from("content_reviews")
      .update({
        status: "in_review",
        processing_started_at: new Date().toISOString(),
        error_message: null,
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/portal/services/content-helper/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}

export async function adminMarkReviewed(
  id: string,
  summaryText: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await requireAdmin();
    const sb = admin();
    const note = summaryText.trim().slice(0, 4000);
    if (!note) return { ok: false, error: "Summary darf nicht leer sein." };
    const { error } = await sb
      .from("content_reviews")
      .update({
        status: "reviewed",
        summary: { text: note },
        ai_provider: "manual",
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/portal/services/content-helper/${id}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Fehler" };
  }
}
