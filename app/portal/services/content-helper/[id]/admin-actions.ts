"use server";

import { revalidatePath } from "next/cache";
import { createClient as createSsr } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

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

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://www.zoe-star.de")
  );
}

// Queued-Trigger: setzt Row auf "queued" und feuert den Worker via HTTP
// (eigene Function-Invocation mit eigenen 60s). Die Server Action selbst
// returnt nach ~1-2s — kein Vercel-Timeout mehr beim Anthropic-Call.
export async function adminTriggerContentReview(
  id: string,
): Promise<{ ok: boolean; queued?: boolean; error?: string }> {
  try {
    await requireAdmin();
    const sb = admin();

    // 1) Existenz + Kind ermitteln (fuer korrekten Worker-Dispatch)
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

    // 3) Worker via HTTP triggern. Worker antwortet sofort mit 202 und
    //    verarbeitet via after() in eigener Function-Invocation weiter.
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      return { ok: false, error: "CRON_SECRET fehlt im Backend." };
    }
    const workerUrl = `${siteUrl()}/api/cron/analyse-worker`;

    try {
      const r = await fetch(workerUrl, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${cronSecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id, kind: "content_review" }),
        cache: "no-store",
        // Falls Worker-Endpoint nicht innerhalb 8s mit 202 acked → abbrechen.
        signal: AbortSignal.timeout(8_000),
      });
      if (!r.ok && r.status !== 202) {
        const txt = await r.text().catch(() => "");
        // Row bleibt auf "queued" — naechster Cron-Tick uebernimmt.
        return {
          ok: false,
          queued: true,
          error: `Worker-Trigger HTTP ${r.status}${txt ? `: ${txt.slice(0, 200)}` : ""}`,
        };
      }
    } catch (e) {
      // Trigger gescheitert (Timeout/Netz). Row bleibt "queued",
      // Cron arbeitet sie spaeter ab.
      return {
        ok: false,
        queued: true,
        error: e instanceof Error ? `Worker-Trigger: ${e.message}` : "Worker-Trigger fehlgeschlagen",
      };
    }

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
