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

  const results: Array<{ id: string; path: string; ok: boolean; error?: string }> = [];

  for (const row of candidates) {
    const path = row.video_storage_path as string;
    // Storage-File loeschen
    const { error: rmErr } = await supabase.storage.from(BUCKET).remove([path]);
    if (rmErr && !rmErr.message.toLowerCase().includes("not found")) {
      results.push({ id: row.id, path, ok: false, error: rmErr.message });
      continue;
    }
    // DB-Row: video_storage_path = null (Analyse-Daten bleiben)
    const { error: upErr } = await supabase
      .from("content_reviews")
      .update({ video_storage_path: null })
      .eq("id", row.id);
    if (upErr) {
      results.push({ id: row.id, path, ok: false, error: upErr.message });
      continue;
    }
    results.push({ id: row.id, path, ok: true });
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
