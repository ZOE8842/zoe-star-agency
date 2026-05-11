"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
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

// Queued-Trigger: setzt Row auf "queued" und startet processContentReview
// im Hintergrund via after(). Server Action returnt sofort — kein zweiter
// HTTP-Hop und damit auch kein CRON_SECRET-Auth-Problem.
//
// after() laeuft NACH der Response, blockt also den Client nicht. Es lebt
// innerhalb der Page-Route-maxDuration (siehe page.tsx).
export async function adminTriggerContentReview(
  id: string,
): Promise<{ ok: boolean; queued?: boolean; error?: string }> {
  try {
    await requireAdmin();
    const sb = admin();

    // 1) Existenz pruefen
    const { data: row, error: rowErr } = await sb
      .from("content_reviews")
      .select("id, kind, status")
      .eq("id", id)
      .maybeSingle();
    if (rowErr || !row) {
      return { ok: false, error: rowErr?.message || "Row nicht gefunden." };
    }

    // 2) Row auf "queued" setzen — auch bei Re-Run aus done/failed.
    const { error: qErr } = await sb
      .from("content_reviews")
      .update({
        status: "queued",
        processing_started_at: null,
        reviewed_at: null,
        error_message: null,
      })
      .eq("id", id);
    if (qErr) return { ok: false, error: qErr.message };

    revalidatePath(`/portal/services/content-helper/${id}`);

    // 3) Worker direkt asynchron starten. Kein HTTP-Hop noetig — wir sind
    //    schon serverseitig + service-role authentifiziert.
    after(async () => {
      try {
        await processContentReview(sb, id);
      } catch (e) {
        // processContentReview hat eigenes try/catch + failed-Write.
        // Fallback-Log fuer Vercel-Function-Logs.
        console.error("[content-helper] after() failed:", e);
      }
    });

    return { ok: true, queued: true };
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
