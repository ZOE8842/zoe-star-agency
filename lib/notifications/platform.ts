// Platform-Notifications V1 · Insert-Helper
// Wird von Server-Actions aufgerufen die einen externen Push triggern wollen
// (TikTok-DM-Bridge via @zoe.star.agency).
// Inbox + Activity-Feed bleiben unabhaengig — diese Queue ist NUR fuer
// External-Push. Worker laeuft separat auf Win-PC.

import { SupabaseClient } from "@supabase/supabase-js";

export type PlatformNotifType =
  | "match_scheduled"
  | "match_partner_found"
  | "match_rejected"
  | "analysis_ready"
  | "showcase_approved"
  | "event_started"
  | "academy_challenge"
  | "inactivity_reminder"
  | "service_update"
  | "live_warning"
  | "push_selected";

interface QueueInput {
  profile_id: string;
  type: PlatformNotifType;
  body: string;
  title?: string;
  context_url?: string;
  priority?: number;
  cooldown_hours?: number;
}

// Default-Coolddown pro Type (verhindert Spam bei wiederholten Triggers)
const DEFAULT_COOLDOWN_HOURS: Record<PlatformNotifType, number> = {
  match_scheduled: 0,        // jeder Termin ist relevant
  match_partner_found: 0,
  match_rejected: 0,
  analysis_ready: 4,         // mehrere Analysen am Tag → bundle
  showcase_approved: 0,
  event_started: 0,
  academy_challenge: 24,     // max 1× pro Tag
  inactivity_reminder: 72,   // max 1× pro 3 Tage
  service_update: 6,
  live_warning: 0,
  push_selected: 0,
};

// Daily-Limit pro Creator pro Type (anti-spam an plattform-Ebene)
const DAILY_LIMIT_PER_TYPE = 3;
const DAILY_LIMIT_TOTAL = 6;

export async function queuePlatformNotification(
  supabase: SupabaseClient,
  input: QueueInput,
): Promise<{ ok: boolean; id?: string; skipped?: string }> {
  const cooldownH = input.cooldown_hours ?? DEFAULT_COOLDOWN_HOURS[input.type] ?? 6;

  // 1) Cooldown gegen Vorgaenger fuer denselben Type pruefen
  if (cooldownH > 0) {
    const since = new Date(Date.now() - cooldownH * 3600_000).toISOString();
    const { count } = await supabase
      .from("platform_notifications")
      .select("id", { head: true, count: "exact" })
      .eq("profile_id", input.profile_id)
      .eq("type", input.type)
      .gte("created_at", since)
      .in("status", ["queued", "sending", "sent"]);
    if ((count ?? 0) > 0) {
      return { ok: true, skipped: `cooldown ${cooldownH}h fuer ${input.type}` };
    }
  }

  // 2) Daily-Limit pruefen
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since = todayStart.toISOString();

  const { count: totalToday } = await supabase
    .from("platform_notifications")
    .select("id", { head: true, count: "exact" })
    .eq("profile_id", input.profile_id)
    .gte("created_at", since)
    .in("status", ["queued", "sending", "sent"]);
  if ((totalToday ?? 0) >= DAILY_LIMIT_TOTAL) {
    return { ok: true, skipped: `daily-limit ${DAILY_LIMIT_TOTAL} erreicht` };
  }

  const { count: typeToday } = await supabase
    .from("platform_notifications")
    .select("id", { head: true, count: "exact" })
    .eq("profile_id", input.profile_id)
    .eq("type", input.type)
    .gte("created_at", since)
    .in("status", ["queued", "sending", "sent"]);
  if ((typeToday ?? 0) >= DAILY_LIMIT_PER_TYPE) {
    return { ok: true, skipped: `daily-type-limit ${DAILY_LIMIT_PER_TYPE} fuer ${input.type}` };
  }

  // 3) Insert mit cooldown_until in der Zukunft
  const cooldown_until = cooldownH > 0
    ? new Date(Date.now() + cooldownH * 3600_000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("platform_notifications")
    .insert({
      profile_id: input.profile_id,
      type: input.type,
      priority: input.priority ?? 5,
      title: input.title ?? null,
      body: input.body.slice(0, 500),
      context_url: input.context_url ?? null,
      cooldown_until,
    })
    .select("id")
    .single();

  if (error) return { ok: false };
  return { ok: true, id: data.id };
}
