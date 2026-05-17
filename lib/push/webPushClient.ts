// Server-only Web-Push-Client. Konfiguriert web-push mit VAPID-Keys.
// VAPID-ENV-Variablen werden lazy gelesen + 1x validiert.
//
// Wichtig: NIE im Client/Edge-Runtime importieren — web-push hat
// Node-Crypto-Dependencies. Nur in Node-Runtime API-Routes verwenden.

import webpush, { type PushSubscription, type SendResult } from "web-push";

let configured = false;
let configuredOk = false;

function configure(): boolean {
  if (configured) return configuredOk;
  configured = true;
  const pub  = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subj = process.env.VAPID_SUBJECT || "mailto:info@zoe-star.de";
  if (!pub || !priv) {
    console.warn("[push] VAPID-Keys fehlen — Push-Versand deaktiviert");
    configuredOk = false;
    return false;
  }
  webpush.setVapidDetails(subj, pub, priv);
  configuredOk = true;
  return true;
}

export interface WebPushPayload {
  title: string;
  body?: string;
  url?: string;        // Klick-Ziel
  badge?: number;      // Setze app-badge auf diese Zahl
  tag?: string;        // Replace-Tag (gleiche Tag = update statt 2. notification)
  notificationId?: string;
  type?: string;
}

export interface SendOutcome {
  ok: boolean;
  statusCode?: number;
  error?: string;
  /** 404/410 = Endpoint tot, sollte aus DB geloescht werden */
  gone?: boolean;
}

export async function sendWebPush(
  subscription: PushSubscription,
  payload: WebPushPayload,
): Promise<SendOutcome> {
  if (!configure()) return { ok: false, error: "vapid_not_configured" };
  try {
    const res: SendResult = await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      { TTL: 60 * 60 * 24 }, // 24h Server-Hold
    );
    return { ok: true, statusCode: res.statusCode };
  } catch (e: unknown) {
    const err = e as { statusCode?: number; body?: string; message?: string };
    const code = err.statusCode;
    const gone = code === 404 || code === 410;
    return {
      ok: false,
      statusCode: code,
      error: err.message || err.body || "push_error",
      gone,
    };
  }
}
