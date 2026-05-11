// Inbox V2 · System-Notification-Bundler
// Mehrere Events vom selben bundle_key innerhalb 24h kollabieren zu
// EINEM Inbox-Eintrag mit count. Verhindert Spam-Effekt im Postfach.
//
// Beispiele:
//   bundle_key='analysis'  -> "3 Analysen sind fertig" statt 3× "fertig"
//   bundle_key='match'     -> "2 Big-Match-Updates" statt 2× Updates
//   bundle_key='showcase'  -> kein Bundle (jeder Approve ist eigenstaendig)

import type { SupabaseClient } from "@supabase/supabase-js";

const BUNDLE_WINDOW_HOURS = 24;

export interface InboxNotifInput {
  user_id: string;
  type: "message" | "event" | "slot" | "academy" | "reminder" | "badge" | "support" | "analysis" | "match";
  title: string;
  body: string;
  link?: string;
  channel?: string[];
  bundle_key?: string;
  external_push_id?: string;
}

export async function queueInboxNotification(
  supabase: SupabaseClient,
  input: InboxNotifInput,
): Promise<{ ok: boolean; id?: string; bundled?: boolean }> {
  const channel = input.channel ?? ["in_app"];

  // Wenn bundle_key gesetzt: bestehenden unread-Eintrag aktualisieren statt neu
  if (input.bundle_key) {
    const since = new Date(Date.now() - BUNDLE_WINDOW_HOURS * 3600_000).toISOString();
    const { data: existing } = await supabase
      .from("notifications")
      .select("id, bundle_count, bundle_data, title, body")
      .eq("user_id", input.user_id)
      .eq("bundle_key", input.bundle_key)
      .eq("status", "unread")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing) {
      const newCount = (existing.bundle_count ?? 1) + 1;
      // Title bekommt Count-Marker, Body zeigt das Neueste
      const baseTitle = (existing.bundle_data as { base_title?: string } | null)?.base_title
        ?? existing.title.replace(/\s*\(\d+\)\s*$/, "");
      const newTitle = `${baseTitle} (${newCount})`;
      const data = {
        ...(existing.bundle_data as Record<string, unknown> | null ?? {}),
        base_title: baseTitle,
        latest_body: input.body,
        latest_title: input.title,
        last_added_at: new Date().toISOString(),
      };
      await supabase
        .from("notifications")
        .update({
          title: newTitle,
          body: input.body,  // Neuester gewinnt im Preview
          bundle_count: newCount,
          bundle_data: data,
          link: input.link ?? null,
          read_at: null,
        })
        .eq("id", existing.id);
      return { ok: true, id: existing.id, bundled: true };
    }
  }

  // Fresh insert (kein Bundle oder Bundle-Window leer)
  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: input.user_id,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link ?? null,
      channel,
      status: "unread",
      bundle_key: input.bundle_key ?? null,
      bundle_count: 1,
      bundle_data: input.bundle_key ? { base_title: input.title } : {},
      external_push_id: input.external_push_id ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false };
  return { ok: true, id: data.id, bundled: false };
}

// ── Activity-Feed-Helper ─────────────────────────────────────────────────
export interface ActivityFeedInput {
  type:
    | "creator_live" | "match_call" | "event_started" | "academy_lesson"
    | "tiktok_push_selected" | "agency_news" | "creator_joined"
    | "match_scheduled" | "showcase_approved" | "analysis_done"
    | "creator_milestone" | "academy_winner" | "agency_announcement";
  actor_id?: string | null;
  headline?: string;
  subline?: string;
  visibility?: "all_creators" | "admin_only" | "specific";
  expires_at?: string | null;
  pinned?: boolean;
  extra?: Record<string, unknown>;
}

export async function pushActivityFeed(
  supabase: SupabaseClient,
  input: ActivityFeedInput,
): Promise<{ ok: boolean; id?: string }> {
  const { data, error } = await supabase
    .from("activity_feed")
    .insert({
      type: input.type,
      actor_id: input.actor_id ?? null,
      payload: {
        headline: input.headline ?? null,
        subline: input.subline ?? null,
        ...(input.extra ?? {}),
      },
      visibility: input.visibility ?? "all_creators",
      pinned: input.pinned ?? false,
      expires_at: input.expires_at ?? null,
    })
    .select("id")
    .single();
  if (error) return { ok: false };
  return { ok: true, id: data.id };
}
