// V2 Worker · Orchestrator fuer Account-Analyse + LIVE-Performance-Report.
//
// Ablauf pro Analyse:
//   1) Row holen
//   2) Status -> processing setzen (mit processing_started_at)
//   3) Creator-Snapshot + Monats-Metriken sammeln
//   4) Prompt bauen + Claude-Call
//   5) JSON-Block aus Antwort extrahieren
//   6) Result + Cost + status='done' in DB schreiben
//   7) Notification an Creator senden (in_app + ggf. email)
//   8) Bei Fehler: status='failed' + error_message

import { SupabaseClient } from "@supabase/supabase-js";
import { claudeAnalyze, claudeAnalyzeVision, ANTHROPIC_VISION_MEDIA, type AnthropicMediaType } from "./claude";
import {
  ACCOUNT_ANALYSE_SYSTEM,
  LIVE_PERFORMANCE_SYSTEM,
  DATA_DISCLAIMER,
} from "./prompts";
import { CONTENT_IMAGE_SYSTEM, CONTENT_PROFILE_NOTE, CONTENT_VIDEO_NOTE } from "./content-prompts";
import { parseAccountResult, parseLiveResult } from "./parsers";
import {
  getCreatorSnapshot,
  getMonthlyMetrics,
  formatCreatorBlock,
  formatMonthlyBlock,
  backstageBlock,
} from "./data-sources";
import { getTikTokPublic, formatTikTokBlock } from "./tiktok-public";
import { queuePlatformNotification } from "@/lib/notifications/platform";
import { queueInboxNotification, pushActivityFeed } from "@/lib/notifications/inbox";

interface ProcessResult {
  ok: boolean;
  id: string;
  status: "done" | "failed";
  cost_usd: number;
  error?: string;
}

async function notifyCreator(
  supabase: SupabaseClient,
  profile_id: string,
  link: string,
  module: "Account-Analyse" | "LIVE-Performance",
) {
  // Bundle-Key 'analysis' — Account + LIVE-Reports in 24h kollabieren
  await queueInboxNotification(supabase, {
    user_id: profile_id,
    type: "analysis",
    title: `Deine ${module} ist fertig`,
    body: "Aura hat den Report fuer dich zusammengestellt. Schau ihn dir an wenn du Zeit hast.",
    link,
    bundle_key: "analysis",
  });
}

// ─────────────────────────────────────────────────────────────────────────
// ACCOUNT ANALYSE
// ─────────────────────────────────────────────────────────────────────────

export async function processAccountAnalysis(
  supabase: SupabaseClient,
  id: string,
): Promise<ProcessResult> {
  const startedAt = new Date().toISOString();

  // 1) Lock auf processing — verhindert Doppellauf
  const { data: locked, error: lockErr } = await supabase
    .from("account_analyses")
    .update({ status: "processing", processing_started_at: startedAt })
    .eq("id", id)
    .in("status", ["submitted", "queued"])
    .select("*")
    .maybeSingle();

  if (lockErr || !locked) {
    return {
      ok: false,
      id,
      status: "failed",
      cost_usd: 0,
      error: lockErr?.message || "Lock fehlgeschlagen — bereits in Bearbeitung?",
    };
  }

  try {
    // 2) Daten sammeln
    const snap = await getCreatorSnapshot(supabase, locked.profile_id);
    if (!snap) throw new Error("Creator-Snapshot leer");

    // TikTok-Public via Apify (cached 24h)
    const tt = await getTikTokPublic(supabase, locked.target_tiktok_username, {
      profile_id: locked.profile_id,
    });

    const sources: Array<{ name: string; ok: boolean; detail?: string }> = [
      { name: "profile_snapshot", ok: true },
    ];
    let tiktokSection: string;
    if (tt.ok && tt.profile) {
      tiktokSection = formatTikTokBlock(tt.profile);
      sources.push({ name: "tiktok_public", ok: true, detail: tt.source });
    } else {
      tiktokSection = `TIKTOK-PUBLIC: [nicht verfuegbar — ${tt.error || "Apify lieferte keine Daten"}]`;
      sources.push({ name: "tiktok_public", ok: false, detail: tt.error });
    }

    const userPrompt = [
      DATA_DISCLAIMER,
      "",
      formatCreatorBlock(snap, locked.target_tiktok_username),
      "",
      tiktokSection,
      "",
      locked.manual_note ? `HINWEIS-DES-CREATORS:\n"${locked.manual_note}"` : "HINWEIS-DES-CREATORS: [keiner]",
      "",
      "Bitte erstelle den Report im vereinbarten Format. Schreibe persoenlich, ehrlich, konkret. Beende mit dem JSON-Block.",
    ].join("\n");

    // 3) Claude
    const c = await claudeAnalyze({
      systemPrompt: ACCOUNT_ANALYSE_SYSTEM,
      userPrompt,
      maxTokens: 4500,
    });

    if (!c.ok) throw new Error(c.error || "Claude-Call fehlgeschlagen");

    const parsed = parseAccountResult(c.text);
    if (!parsed) throw new Error("JSON-Block im Report nicht gefunden / nicht valide");

    const totalCost = c.cost_usd + (tt.cost_usd || 0);

    // 4) Result schreiben
    const { error: upErr } = await supabase
      .from("account_analyses")
      .update({
        status: "done",
        scores: parsed.scores ?? {},
        summary: parsed.summary ?? {},
        recommendations: parsed.recommendations ?? [],
        image_suggestions: parsed.image_suggestions ?? [],
        raw_response: {
          text: c.text,
          in_tokens: c.in_tokens,
          out_tokens: c.out_tokens,
          sources,
          tiktok_fetched_at: tt.fetched_at,
          tiktok_source: tt.source,
        },
        ai_provider: "anthropic",
        ai_model: c.model,
        cost_usd: totalCost,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (upErr) throw new Error(upErr.message);

    // 5) Notification
    await notifyCreator(supabase, locked.profile_id, `/portal/analyse/account/${id}`, "Account-Analyse");

    // 5b) Platform-Notification (TikTok-DM-Bridge)
    await queuePlatformNotification(supabase, {
      profile_id: locked.profile_id,
      type: "analysis_ready",
      title: "Deine Account-Analyse ist fertig",
      body: "Deine Analyse ist fertig ✨ Du findest sie jetzt im ZOE Portal.",
      context_url: `/portal/analyse/account/${id}`,
      priority: 4,
    });

    // 6) Worker-Health
    await supabase.from("data_source_health").insert({
      source: "claude_worker",
      kind: "account_analysis",
      ok: true,
      count_items: 1,
      cost_usd: totalCost,
      duration_ms: Date.now() - new Date(startedAt).getTime(),
      payload: { analysis_id: id, sources },
    });

    return { ok: true, id, status: "done", cost_usd: totalCost };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("account_analyses")
      .update({ status: "failed", error_message: msg.slice(0, 1000), completed_at: new Date().toISOString() })
      .eq("id", id);
    await supabase.from("data_source_health").insert({
      source: "claude_worker",
      kind: "account_analysis",
      ok: false,
      error_message: msg.slice(0, 500),
      payload: { analysis_id: id },
    });
    return { ok: false, id, status: "failed", cost_usd: 0, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// LIVE PERFORMANCE
// ─────────────────────────────────────────────────────────────────────────

export async function processLiveReport(
  supabase: SupabaseClient,
  id: string,
): Promise<ProcessResult> {
  const startedAt = new Date().toISOString();

  const { data: locked, error: lockErr } = await supabase
    .from("live_performance_reports")
    .update({ status: "processing", processing_started_at: startedAt })
    .eq("id", id)
    .in("status", ["submitted", "queued"])
    .select("*")
    .maybeSingle();

  if (lockErr || !locked) {
    return {
      ok: false,
      id,
      status: "failed",
      cost_usd: 0,
      error: lockErr?.message || "Lock fehlgeschlagen",
    };
  }

  try {
    const snap = await getCreatorSnapshot(supabase, locked.profile_id);
    if (!snap) throw new Error("Creator-Snapshot leer");
    const metrics = await getMonthlyMetrics(supabase, locked.profile_id, 3);

    const sources: Array<{ name: string; ok: boolean; detail?: string }> = [
      { name: "profile_snapshot", ok: true },
      { name: "monthly_metrics", ok: metrics.length > 0, detail: `${metrics.length} months` },
    ];

    // Optional: TikTok-Public dazu damit der LIVE-Report Bio + Followers kennt
    let tiktokSection = "";
    let tiktokCost = 0;
    let tiktokFetchedAt: string | null = null;
    if (snap.tiktok_username) {
      const tt = await getTikTokPublic(supabase, snap.tiktok_username, {
        profile_id: locked.profile_id,
      });
      if (tt.ok && tt.profile) {
        tiktokSection = formatTikTokBlock(tt.profile);
        tiktokCost = tt.cost_usd || 0;
        tiktokFetchedAt = tt.fetched_at;
        sources.push({ name: "tiktok_public", ok: true, detail: tt.source });
      } else {
        sources.push({ name: "tiktok_public", ok: false, detail: tt.error });
      }
    }

    const userPrompt = [
      DATA_DISCLAIMER,
      "",
      formatCreatorBlock(snap),
      "",
      formatMonthlyBlock(metrics),
      "",
      backstageBlock(metrics.length > 0),
      "",
      tiktokSection || "TIKTOK-PUBLIC: [optional · nicht abgefragt fuer diesen Report]",
      "",
      `ZEITRAUM-LABEL: "${locked.period_label}"` +
        (locked.period_start && locked.period_end
          ? ` (${locked.period_start} bis ${locked.period_end})`
          : ""),
      "",
      locked.manual_note ? `HINWEIS-DES-CREATORS:\n"${locked.manual_note}"` : "HINWEIS-DES-CREATORS: [keiner]",
      "",
      "Bitte erstelle den Report im vereinbarten Format. Wochen-Plan konkret, kein Marketing-Sprech. Beende mit dem JSON-Block.",
    ].join("\n");

    const c = await claudeAnalyze({
      systemPrompt: LIVE_PERFORMANCE_SYSTEM,
      userPrompt,
      maxTokens: 4500,
    });

    if (!c.ok) throw new Error(c.error || "Claude-Call fehlgeschlagen");

    const parsed = parseLiveResult(c.text);
    if (!parsed) throw new Error("JSON-Block im Report nicht gefunden / nicht valide");

    const totalCost = c.cost_usd + tiktokCost;

    const { error: upErr } = await supabase
      .from("live_performance_reports")
      .update({
        status: "done",
        kpi: parsed.kpi ?? {},
        summary: parsed.summary ?? {},
        recommendations: parsed.recommendations ?? [],
        weekly_plan: parsed.weekly_plan ?? [],
        raw_response: {
          text: c.text,
          in_tokens: c.in_tokens,
          out_tokens: c.out_tokens,
          sources,
          tiktok_fetched_at: tiktokFetchedAt,
        },
        ai_provider: "anthropic",
        ai_model: c.model,
        cost_usd: totalCost,
        completed_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (upErr) throw new Error(upErr.message);

    await notifyCreator(supabase, locked.profile_id, `/portal/analyse/live/${id}`, "LIVE-Performance");

    await queuePlatformNotification(supabase, {
      profile_id: locked.profile_id,
      type: "analysis_ready",
      title: "Dein LIVE-Performance-Report ist fertig",
      body: "Dein neuer LIVE-Report ist fertig ✨ Du findest ihn jetzt im ZOE Portal.",
      context_url: `/portal/analyse/live/${id}`,
      priority: 4,
    });

    await supabase.from("data_source_health").insert({
      source: "claude_worker",
      kind: "live_performance",
      ok: true,
      count_items: 1,
      cost_usd: totalCost,
      duration_ms: Date.now() - new Date(startedAt).getTime(),
      payload: { report_id: id, sources },
    });

    return { ok: true, id, status: "done", cost_usd: totalCost };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("live_performance_reports")
      .update({ status: "failed", error_message: msg.slice(0, 1000), completed_at: new Date().toISOString() })
      .eq("id", id);
    await supabase.from("data_source_health").insert({
      source: "claude_worker",
      kind: "live_performance",
      ok: false,
      error_message: msg.slice(0, 500),
      payload: { report_id: id },
    });
    return { ok: false, id, status: "failed", cost_usd: 0, error: msg };
  }
}

// ─────────────────────────────────────────────────────────────────────────
// BATCH-RUNNER · holt pending, processed mit Limit
// ─────────────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────
// CONTENT-HELPER
// kind=image      → Claude Vision Analyse
// kind=video_*    → Status auf 'in_review' fuer Admin (Anthropic verarbeitet
//                   keine Videos direkt)
// kind=profile    → Status auf 'in_review' fuer Admin
// ─────────────────────────────────────────────────────────────────────────

// Legacy: publicImageUrl wird nicht mehr genutzt — creator-content Bucket
// ist privat, daher unzuverlaessig fuer Anthropic. Stattdessen laedt der
// Worker das Bild direkt per supabase.storage.download().

export async function processContentReview(
  supabase: SupabaseClient,
  id: string,
): Promise<ProcessResult> {
  const startedAt = new Date().toISOString();

  // 1) Lock auf processing
  const { data: locked, error: lockErr } = await supabase
    .from("content_reviews")
    .update({ status: "processing", processing_started_at: startedAt })
    .eq("id", id)
    .in("status", ["submitted", "queued"])
    .select("*")
    .maybeSingle();

  if (lockErr || !locked) {
    return {
      ok: false,
      id,
      status: "failed",
      cost_usd: 0,
      error: lockErr?.message || "Lock fehlgeschlagen — bereits in Bearbeitung?",
    };
  }

  try {
    const kind = locked.kind as "image" | "video_file" | "video_link" | "profile";
    const note = locked.manual_note as string | null;

    // IMAGE · Claude Vision
    if (kind === "image") {
      const text =
        (note ? `Hinweis vom Creator: "${note}"\n\n` : "") +
        "Analysiere das obige Bild als TikTok-Content-Visual. Folge dem geforderten Format.";

      // Storage-Path: direkt via Service-Role-SDK herunterladen (Bucket ist
      // private; getPublicUrl liefert nicht-erreichbare URLs).
      // Direkte video_url/source_url: serverseitig per fetch via claudeAnalyzeVision.
      let images: Array<{ data: string; mediaType: AnthropicMediaType }> | undefined;
      let imageUrls: string[] | undefined;

      if (locked.video_storage_path) {
        const { data: blob, error: dlErr } = await supabase.storage
          .from("creator-content")
          .download(locked.video_storage_path as string);
        if (dlErr || !blob) {
          throw new Error(`Storage-Download fehlgeschlagen: ${dlErr?.message ?? "blob leer"}`);
        }
        const buf = Buffer.from(await blob.arrayBuffer());
        const sizeMb = buf.byteLength / 1024 / 1024;
        if (sizeMb > 5) throw new Error(`Bild zu gross (${sizeMb.toFixed(1)} MB > 5 MB)`);
        // Media-Type aus Blob oder Pfad ableiten
        let mediaType: AnthropicMediaType = "image/jpeg";
        const blobType = (blob.type || "").split(";")[0].trim().toLowerCase();
        if ((ANTHROPIC_VISION_MEDIA as readonly string[]).includes(blobType)) {
          mediaType = blobType as AnthropicMediaType;
        } else {
          const ext = (locked.video_storage_path as string).split(".").pop()?.toLowerCase();
          const map: Record<string, AnthropicMediaType> = {
            jpg: "image/jpeg",
            jpeg: "image/jpeg",
            png: "image/png",
            gif: "image/gif",
            webp: "image/webp",
          };
          if (ext && map[ext]) mediaType = map[ext];
        }
        images = [{ data: buf.toString("base64"), mediaType }];
      } else {
        const url = (locked.video_url as string | null) || (locked.source_url as string | null);
        if (!url) throw new Error("Kein Bild-Pfad oder URL gefunden");
        imageUrls = [url];
      }

      // 1500 Tokens reichen fuer strukturiertes JSON-Output;
      // grosser Token-Cap macht Anthropic-Latency unnoetig hoch.
      const c = await claudeAnalyzeVision({
        systemPrompt: CONTENT_IMAGE_SYSTEM,
        images,
        imageUrls,
        text,
        maxTokens: 1500,
      });

      if (!c.ok) throw new Error(c.error || "Claude-Vision fehlgeschlagen");

      // JSON-Block extrahieren
      const jsonMatch = c.text.match(/```json\s*([\s\S]+?)\s*```/);
      let ai_score: Record<string, unknown> = {};
      if (jsonMatch) {
        try { ai_score = JSON.parse(jsonMatch[1]); } catch {}
      }

      const { error: upErr } = await supabase
        .from("content_reviews")
        .update({
          status: "done",
          summary: { text: c.text },
          ai_score,
          ai_provider: "anthropic",
          ai_model: c.model,
          cost_usd: c.cost_usd,
          reviewed_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (upErr) throw new Error(upErr.message);

      await notifyContentReady(supabase, locked.profile_id, id);

      await supabase.from("data_source_health").insert({
        source: "claude_worker",
        kind: "content_image",
        ok: true,
        count_items: 1,
        cost_usd: c.cost_usd,
        duration_ms: Date.now() - new Date(startedAt).getTime(),
        payload: { content_review_id: id },
      });

      return { ok: true, id, status: "done", cost_usd: c.cost_usd };
    }

    // VIDEO + PROFILE · manueller Admin-Workflow
    const manualNote =
      kind === "profile" ? CONTENT_PROFILE_NOTE : CONTENT_VIDEO_NOTE;

    const { error: upErr } = await supabase
      .from("content_reviews")
      .update({
        status: "in_review",
        summary: { text: manualNote, note },
        ai_provider: "manual",
        cost_usd: 0,
        processing_started_at: startedAt,
      })
      .eq("id", id);
    if (upErr) throw new Error(upErr.message);

    // Admin-Notification (alle Admins)
    const { data: admins } = await supabase
      .from("profiles")
      .select("id")
      .eq("role", "admin")
      .eq("status", "active");
    for (const a of admins ?? []) {
      await queueInboxNotification(supabase, {
        user_id: a.id,
        type: "reminder",
        title: "Content-Review wartet auf manuelle Pruefung",
        body: `Neuer ${kind}-Submit · Admin-Review notwendig`,
        link: `/portal/services/content-helper/${id}`,
        bundle_key: "content_review_admin",
      });
    }

    await supabase.from("data_source_health").insert({
      source: "claude_worker",
      kind: "content_manual_route",
      ok: true,
      count_items: 1,
      cost_usd: 0,
      duration_ms: Date.now() - new Date(startedAt).getTime(),
      payload: { content_review_id: id, kind },
    });

    return { ok: true, id, status: "done", cost_usd: 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await supabase
      .from("content_reviews")
      .update({ status: "failed", error_message: msg.slice(0, 1000), reviewed_at: new Date().toISOString() })
      .eq("id", id);
    await supabase.from("data_source_health").insert({
      source: "claude_worker",
      kind: "content_review",
      ok: false,
      error_message: msg.slice(0, 500),
      payload: { content_review_id: id },
    });
    return { ok: false, id, status: "failed", cost_usd: 0, error: msg };
  }
}

async function notifyContentReady(
  supabase: SupabaseClient,
  profile_id: string,
  reviewId: string,
) {
  await queueInboxNotification(supabase, {
    user_id: profile_id,
    type: "analysis",
    title: "Dein Content-Review ist fertig",
    body: "Aura hat dein Bild analysiert. Schau es dir an wenn du Zeit hast.",
    link: `/portal/services/content-helper/${reviewId}`,
    bundle_key: "content_review",
  });
  await pushActivityFeed(supabase, {
    type: "analysis_done",
    actor_id: profile_id,
    headline: "Content-Review fertig",
  });
  await queuePlatformNotification(supabase, {
    profile_id,
    type: "analysis_ready",
    title: "Dein Content-Review ist fertig",
    body: "Dein Content-Review ist fertig ✨ Du findest ihn jetzt im ZOE Portal.",
    context_url: `/portal/services/content-helper/${reviewId}`,
    priority: 3,
  });
}

export async function runWorkerBatch(
  supabase: SupabaseClient,
  opts: { maxAccount?: number; maxLive?: number; maxContent?: number } = {},
): Promise<{
  account: ProcessResult[];
  live: ProcessResult[];
  content: ProcessResult[];
  total_cost_usd: number;
}> {
  const maxA = opts.maxAccount ?? 5;
  const maxL = opts.maxLive ?? 5;
  const maxC = opts.maxContent ?? 5;

  const { data: aaPending } = await supabase
    .from("account_analyses")
    .select("id")
    .in("status", ["submitted", "queued"])
    .order("created_at", { ascending: true })
    .limit(maxA);

  const { data: lpPending } = await supabase
    .from("live_performance_reports")
    .select("id")
    .in("status", ["submitted", "queued"])
    .order("created_at", { ascending: true })
    .limit(maxL);

  const { data: crPending } = await supabase
    .from("content_reviews")
    .select("id")
    .in("status", ["submitted", "queued"])
    .order("created_at", { ascending: true })
    .limit(maxC);

  const accountResults: ProcessResult[] = [];
  for (const row of aaPending ?? []) {
    accountResults.push(await processAccountAnalysis(supabase, row.id));
  }

  const liveResults: ProcessResult[] = [];
  for (const row of lpPending ?? []) {
    liveResults.push(await processLiveReport(supabase, row.id));
  }

  const contentResults: ProcessResult[] = [];
  for (const row of crPending ?? []) {
    contentResults.push(await processContentReview(supabase, row.id));
  }

  const total_cost_usd =
    accountResults.reduce((s, r) => s + r.cost_usd, 0) +
    liveResults.reduce((s, r) => s + r.cost_usd, 0) +
    contentResults.reduce((s, r) => s + r.cost_usd, 0);

  return { account: accountResults, live: liveResults, content: contentResults, total_cost_usd };
}
