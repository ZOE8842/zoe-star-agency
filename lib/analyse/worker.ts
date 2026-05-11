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
import { claudeAnalyze } from "./claude";
import {
  ACCOUNT_ANALYSE_SYSTEM,
  LIVE_PERFORMANCE_SYSTEM,
  DATA_DISCLAIMER,
} from "./prompts";
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

export async function runWorkerBatch(
  supabase: SupabaseClient,
  opts: { maxAccount?: number; maxLive?: number } = {},
): Promise<{
  account: ProcessResult[];
  live: ProcessResult[];
  total_cost_usd: number;
}> {
  const maxA = opts.maxAccount ?? 5;
  const maxL = opts.maxLive ?? 5;

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

  const accountResults: ProcessResult[] = [];
  for (const row of aaPending ?? []) {
    accountResults.push(await processAccountAnalysis(supabase, row.id));
  }

  const liveResults: ProcessResult[] = [];
  for (const row of lpPending ?? []) {
    liveResults.push(await processLiveReport(supabase, row.id));
  }

  const total_cost_usd =
    accountResults.reduce((s, r) => s + r.cost_usd, 0) +
    liveResults.reduce((s, r) => s + r.cost_usd, 0);

  return { account: accountResults, live: liveResults, total_cost_usd };
}
