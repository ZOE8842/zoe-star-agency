// Content-Cleanup-Cron
// Loescht Original-Storage-Files aus content_reviews die aelter als
// 5 Tage sind. Die Analyse-Daten (summary, ai_score, cost, etc.) bleiben
// in der DB unangetastet — Creator sieht nach 5 Tagen einen Platzhalter
// statt des Originalbilds.
//
// Schedule: vercel.json → daily 04:00 UTC
// Manuell triggerbar: curl -H "Authorization: Bearer $CRON_SECRET" https://www.zoe-star.de/api/cron/content-cleanup

import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { checkCronAuth } from "@/lib/security/cron-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EXPIRY_DAYS = 5;
const BUCKET = "creator-content";

export async function GET(request: NextRequest) {
  const denied = checkCronAuth(request);
  if (denied) return denied;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  const cutoff = new Date(Date.now() - EXPIRY_DAYS * 24 * 3600 * 1000).toISOString();

  // Reviews finden, deren created_at aelter als 5 Tage ist UND noch ein Storage-Path hat
  const { data: rows, error: fetchErr } = await supabase
    .from("content_reviews")
    .select("id, video_storage_path, created_at")
    .lt("created_at", cutoff)
    .not("video_storage_path", "is", null)
    .limit(500);

  if (fetchErr) {
    return NextResponse.json({ error: fetchErr.message }, { status: 500 });
  }

  const candidates = (rows ?? []).filter((r) => r.video_storage_path);

  // Parallel mit Concurrency-Cap. Storage-API kann pro Call latent sein.
  // Batches von 8 gleichzeitigen Deletes haelt die Function unter Timeout.
  const CONCURRENCY = 8;

  async function processOne(row: { id: string; video_storage_path: string | null }) {
    const path = row.video_storage_path as string;
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove([path]);
    if (rmErr && !rmErr.message.toLowerCase().includes("not found")) {
      return { id: row.id, path, ok: false, error: rmErr.message };
    }
    const { error: upErr } = await supabase
      .from("content_reviews")
      .update({ video_storage_path: null })
      .eq("id", row.id);
    if (upErr) {
      return { id: row.id, path, ok: false, error: upErr.message };
    }
    return { id: row.id, path, ok: true };
  }

  // 100ms Backoff zwischen Batches verhindert Storage-Rate-Limits bei
  // grossen Cleanup-Runs.
  const BATCH_DELAY_MS = 100;

  const results: Array<{ id: string; path: string; ok: boolean; error?: string }> = [];
  for (let i = 0; i < candidates.length; i += CONCURRENCY) {
    if (i > 0) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
    const batch = candidates.slice(i, i + CONCURRENCY);
    const settled = await Promise.allSettled(batch.map(processOne));
    for (let j = 0; j < settled.length; j++) {
      const s = settled[j];
      if (s.status === "fulfilled") {
        results.push(s.value);
      } else {
        const r = batch[j];
        results.push({
          id: r.id,
          path: (r.video_storage_path as string) ?? "",
          ok: false,
          error: s.reason instanceof Error ? s.reason.message : String(s.reason),
        });
      }
    }
  }

  const cleaned = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;

  // Audit-Log — source ist auf ('apify_tiktok','backstage_sync','claude_worker')
  // eingeschraenkt (Check-Constraint), deshalb "claude_worker" mit kind als
  // Sub-Tag.
  await supabase.from("data_source_health").insert({
    source: "claude_worker",
    kind: "content_cleanup",
    ok: failed === 0,
    count_items: cleaned,
    payload: { cutoff, cleaned, failed, total_candidates: candidates.length },
  }).then(() => undefined, () => undefined);

  return NextResponse.json({
    success: true,
    cutoff,
    cleaned,
    failed,
    total_candidates: candidates.length,
    details: results,
  });
}
