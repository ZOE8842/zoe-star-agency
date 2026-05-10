// V2 Worker · Daten-Sammelpunkt fuer Analyse-Worker.
// Stufe 1: holt was DB-seitig schon vorhanden ist (profiles, creator_monthly_metrics).
// Stufe 2 (spaeter): TikTok-Public via Apify, Backstage via shared-Drive-Sync.
//
// Wichtig: Wenn Daten fehlen, NICHT fantasieren — wir geben "[nicht verfuegbar]"
// an Claude weiter (siehe DATA_DISCLAIMER in prompts.ts).

import { SupabaseClient } from "@supabase/supabase-js";

export interface CreatorSnapshot {
  profile_id: string;
  display_name: string | null;
  tiktok_username: string | null;
  bio: string | null;
  avatar_url: string | null;
  language: string | null;
  region: string | null;
  creator_category: string | null;
  live_format: string | null;
  goals: string[];
  joined_at: string | null;
}

export async function getCreatorSnapshot(
  supabase: SupabaseClient,
  profile_id: string,
): Promise<CreatorSnapshot | null> {
  const { data } = await supabase
    .from("profiles")
    .select(
      "id, display_name, tiktok_username, bio, avatar_url, language, region, creator_category, live_format, metadata, joined_at",
    )
    .eq("id", profile_id)
    .maybeSingle();
  if (!data) return null;
  const meta = (data.metadata as { goals?: string[] } | null) ?? null;
  return {
    profile_id: data.id,
    display_name: data.display_name,
    tiktok_username: data.tiktok_username,
    bio: data.bio,
    avatar_url: data.avatar_url,
    language: data.language,
    region: data.region,
    creator_category: data.creator_category,
    live_format: data.live_format,
    goals: meta?.goals ?? [],
    joined_at: data.joined_at,
  };
}

export interface MonthlyMetric {
  month: string; // ISO date — Monatsbeginn
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display: number | null;
  average_viewers: number;
  last_live_date: string | null;
  activity_status: "aktiv" | "unregelmaessig" | "inaktiv" | null;
}

export async function getMonthlyMetrics(
  supabase: SupabaseClient,
  profile_id: string,
  limit: number = 3,
): Promise<MonthlyMetric[]> {
  const { data, error } = await supabase
    .from("creator_monthly_metrics")
    .select(
      "month, valid_live_days, live_minutes_total, live_hours_display, average_viewers, last_live_date, activity_status",
    )
    .eq("profile_id", profile_id)
    .order("month", { ascending: false })
    .limit(limit);
  if (error) return [];
  return (data ?? []) as MonthlyMetric[];
}

export function formatCreatorBlock(s: CreatorSnapshot, targetUsername?: string | null): string {
  const t = (targetUsername || s.tiktok_username || "").replace(/^@/, "");
  return [
    `CREATOR-DATEN (Stand jetzt):`,
    `- Target: @${t || "[unbekannt]"}`,
    `- Display-Name: ${s.display_name || "[nicht verfuegbar]"}`,
    `- TikTok: @${s.tiktok_username || "[nicht verfuegbar]"}`,
    `- Bio: ${s.bio ? `"${s.bio}"` : "[nicht verfuegbar]"}`,
    `- Sprache: ${s.language || "[nicht verfuegbar]"}`,
    `- Region: ${s.region || "[nicht verfuegbar]"}`,
    `- Creator-Kategorie: ${s.creator_category || "[nicht verfuegbar]"}`,
    `- LIVE-Format: ${s.live_format || "[nicht verfuegbar]"}`,
    `- Goals: ${s.goals.length ? s.goals.join(", ") : "[nicht verfuegbar]"}`,
    `- Profilbild-URL: ${s.avatar_url || "[nicht verfuegbar]"}`,
    `- Beim Network seit: ${s.joined_at ? new Date(s.joined_at).toLocaleDateString("de-DE") : "[nicht verfuegbar]"}`,
  ].join("\n");
}

export function formatMonthlyBlock(metrics: MonthlyMetric[]): string {
  if (metrics.length === 0) return "MONATS-METRIKEN: [nicht verfuegbar — noch keine Daten gesynct]";
  const lines = ["MONATS-METRIKEN (neueste zuerst, Quelle: Backstage-Sync):"];
  for (const m of metrics) {
    const monthDate = new Date(m.month);
    const monthLabel = monthDate.toLocaleDateString("de-DE", { month: "long", year: "numeric" });
    lines.push(
      `- ${monthLabel}: ` +
        `Zuschauer-Schnitt ${m.average_viewers} · ` +
        `gueltige Live-Tage ${m.valid_live_days} · ` +
        `Live-Minuten ${m.live_minutes_total} ` +
        `(${m.live_hours_display ?? "?"} h) · ` +
        `Status ${m.activity_status ?? "?"}` +
        (m.last_live_date ? ` · zuletzt live ${m.last_live_date}` : ""),
    );
  }
  return lines.join("\n");
}

// Backstage-Live-Daten kommen aus creator_monthly_metrics (Backstage-Sync).
// Wenn dort nichts steht: Stub-Hinweis, damit Claude keine Zahlen erfindet.
export function backstageBlock(metricsAvailable: boolean): string {
  if (metricsAvailable) {
    return "BACKSTAGE-LIVE-PERFORMANCE: Quelle = creator_monthly_metrics (Daily-Sync). Siehe Monats-Metriken oben.";
  }
  return "BACKSTAGE-LIVE-PERFORMANCE: [nicht verfuegbar — Daily-Sync hat noch keine Daten fuer diesen Creator gepusht]";
}
