// Server-only Notification-Helper.
// createNotification() = inserted Row + sendet Web-Push an alle aktiven
//                        Subscriptions des Users.
// markRead() / countUnread() = Convenience-Helpers fuer API-Routes.
//
// DSGVO: title + body sind kurze Hinweise, KEINE Vollinhalte (z.B. KEIN
// vollstaendiger Inbox-Message-Body in der Notification).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { sendWebPush, type WebPushPayload } from "@/lib/push/webPushClient";

export type NotificationType =
  | "inbox_message"
  | "ranking_ready"
  | "event_new"
  | "warning_new"
  | "content_review_ready"
  | "recommendation_new"
  | "application_status"
  | "match_request"
  | "admin_notice";

export interface CreateNotificationInput {
  user_id: string;
  type: NotificationType;
  title: string;
  body?: string;
  target_url?: string;
  metadata?: Record<string, unknown>;
  priority?: number;
  /** Wenn true: auch Web-Push an alle Subscriptions des Users (default true) */
  push?: boolean;
}

let _admin: SupabaseClient | null = null;
function admin(): SupabaseClient | null {
  if (_admin) return _admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return _admin;
}

/**
 * Inserted eine Notification-Row + sendet Web-Push an alle aktiven
 * Subscriptions des Users. Liefert die created notification-id.
 * Failures werden geloggt aber nie geworfen — Notification ist Best-Effort
 * und darf nie den primaeren User-Flow brechen.
 */
export async function createNotification(input: CreateNotificationInput): Promise<string | null> {
  const sb = admin();
  if (!sb) {
    console.error("[notifications] admin-client missing - ENV fehlt");
    return null;
  }

  // 1) Notification-Row inserten
  const row = {
    user_id: input.user_id,
    type: input.type,
    title: input.title.slice(0, 200),
    body: input.body ? input.body.slice(0, 500) : null,
    target_url: input.target_url ? input.target_url.slice(0, 512) : null,
    metadata: input.metadata ?? null,
    priority: input.priority ?? 0,
  };
  const { data, error } = await sb
    .from("user_notifications")
    .insert(row)
    .select("id")
    .single();

  if (error || !data) {
    console.error("[notifications] insert failed", error?.message);
    return null;
  }

  const notificationId = data.id as string;

  // 2) Push optional (default an)
  if (input.push !== false) {
    void sendPushToUser(input.user_id, {
      title: input.title.slice(0, 120),
      body: input.body?.slice(0, 200),
      url: input.target_url ?? "/portal",
      tag: input.type,
      notificationId,
      type: input.type,
    });
  }

  return notificationId;
}

/**
 * Sendet Web-Push an ALLE Subscriptions des Users.
 * Tote Endpoints (404/410) werden aus DB geloescht.
 * Failures werden geloggt aber nie geworfen.
 */
export async function sendPushToUser(
  user_id: string,
  payload: WebPushPayload,
): Promise<void> {
  const sb = admin();
  if (!sb) return;

  const { data: subs } = await sb
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", user_id);

  if (!subs || subs.length === 0) return;

  // Badge-Count zum Senden aus DB lesen (unread-count)
  const { count } = await sb
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id)
    .is("read_at", null);
  const badge = typeof count === "number" ? count : undefined;

  const enriched: WebPushPayload = { ...payload, badge };

  await Promise.all(subs.map(async (s) => {
    const subscription = {
      endpoint: s.endpoint,
      keys: { p256dh: s.p256dh, auth: s.auth },
    };
    const out = await sendWebPush(subscription, enriched);
    if (out.gone) {
      // Endpoint tot — Cleanup
      await sb.from("push_subscriptions").delete().eq("id", s.id);
    } else if (!out.ok) {
      console.warn(`[push] ${out.statusCode} ${out.error} endpoint=${s.endpoint.slice(0,60)}…`);
    }
  }));
}

/**
 * Markiert Notifications als read. Wenn ids leer ist → alle ungelesenen.
 * Returns: anzahl_geaendert
 */
export async function markRead(user_id: string, ids?: string[]): Promise<number> {
  const sb = admin();
  if (!sb) return 0;
  let q = sb
    .from("user_notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user_id)
    .is("read_at", null);
  if (ids && ids.length > 0) q = q.in("id", ids);
  const { data, error } = await q.select("id");
  if (error) {
    console.error("[notifications] markRead failed", error.message);
    return 0;
  }
  return data?.length ?? 0;
}

export async function countUnread(user_id: string): Promise<number> {
  const sb = admin();
  if (!sb) return 0;
  const { count } = await sb
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user_id)
    .is("read_at", null);
  return typeof count === "number" ? count : 0;
}
