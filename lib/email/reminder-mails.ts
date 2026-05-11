// Reminder-Drip-Mails via Resend.
// 3 Templates: Onboarding-Drip (3 Stufen), Pending-Approve-Admin, Showcase-Incomplete.
// Styling matched zu consent-mails.ts (Brand-Lock: ink/cream/champagne).

import { Resend } from "resend";

function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.zoe-star.de";
}

function fromAddress(): string {
  const from = process.env.RESEND_FROM_EMAIL || "noreply@zoe-star.de";
  return `ZOE Star Agency <${from}>`;
}

interface BaseCtx {
  email: string;
  display_name: string | null;
}

// ── ONBOARDING-DRIP ────────────────────────────────────────────────
// Stage 1 (24h):  weicher Anstubser
// Stage 2 (72h):  helping-hand
// Stage 3 (7d):   letzte Erinnerung, kuerzer

export type OnboardingStage = 1 | 2 | 3;

const ONB_COPY: Record<OnboardingStage, { subject: string; headline: string; body: string }> = {
  1: {
    subject: "Dein Profil wartet auf dich",
    headline: "Bereit fuer den letzten Schritt?",
    body: "Du hast deinen Zugang aktiviert, aber das Onboarding noch nicht abgeschlossen. Es dauert ca. 2 Minuten und schaltet dein Creator-Profil im ZOE Network frei.",
  },
  2: {
    subject: "Brauchst du Hilfe beim Onboarding?",
    headline: "Wir helfen dir gerne weiter.",
    body: "Es sind nur 7 kurze Schritte. Falls etwas hakt, melde dich einfach im Support. Sonst geht's hier direkt weiter zum Onboarding.",
  },
  3: {
    subject: "Letzte Erinnerung zu deinem ZOE-Zugang",
    headline: "Wir halten deinen Platz frei.",
    body: "Damit dein Account aktiv bleibt, schliesse bitte das Onboarding ab. Sonst pausieren wir den Zugang temporaer.",
  },
};

export async function sendOnboardingReminder(
  ctx: BaseCtx & { stage: OnboardingStage },
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY fehlt.");
  const r = new Resend(apiKey);

  const copy = ONB_COPY[ctx.stage];
  const link = `${siteUrl()}/portal/onboarding`;
  const name = ctx.display_name || "Creator";

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;color:#f5e8d5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 0 32px 0;">
        <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#c9a86a;">ZOE Star Agency</p>
        <h1 style="margin:0;font-size:32px;font-style:italic;line-height:1.15;color:#f5e8d5;font-weight:normal;">${copy.headline}</h1>
      </td></tr>
      <tr><td style="padding:0 0 24px 0;font-size:16px;line-height:1.55;color:#d8c9b0;">
        Hi ${name},<br><br>${copy.body}
      </td></tr>
      <tr><td style="padding:0 0 32px 0;">
        <a href="${link}" style="display:inline-block;background:#c9a86a;color:#0a0a0a;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:bold;">Onboarding fortsetzen</a>
      </td></tr>
      <tr><td style="padding:24px 0 0 0;border-top:1px solid #2a2622;font-size:12px;line-height:1.5;color:#7a7062;">
        Direkter Link: <a href="${link}" style="color:#c9a86a;">${link}</a><br>
        Falls du diese Mail nicht erwartest, ignoriere sie.
      </td></tr>
      <tr><td style="padding:32px 0 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7062;">ZOE Star Agency · Creator Network</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await r.emails.send({
    from: fromAddress(),
    to: ctx.email,
    subject: copy.subject,
    html,
    text: `Hi ${name},\n\n${copy.body}\n\nOnboarding fortsetzen: ${link}\n\nZOE Star Agency`,
  });
}

// ── PENDING-APPROVE-ADMIN-REMINDER ─────────────────────────────────
// Wenn Creator >3 Tage in pending+onboarding_completed=true bleibt,
// erinnert ZOE sich selbst.

export interface PendingApproveCtx {
  admin_email: string;
  admin_name: string | null;
  creator_display_name: string | null;
  creator_email: string;
  waiting_days: number;
}

export async function sendPendingApproveReminder(
  ctx: PendingApproveCtx,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY fehlt.");
  const r = new Resend(apiKey);

  const link = `${siteUrl()}/portal/admin/pending`;
  const admin = ctx.admin_name || "ZOE";
  const creator = ctx.creator_display_name || ctx.creator_email;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;color:#f5e8d5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 0 24px 0;">
        <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#c9a86a;">ZOE Admin</p>
        <h1 style="margin:0;font-size:26px;font-style:italic;line-height:1.2;color:#f5e8d5;font-weight:normal;">Pending-Approval wartet seit ${ctx.waiting_days} Tagen.</h1>
      </td></tr>
      <tr><td style="padding:0 0 24px 0;font-size:15px;line-height:1.55;color:#d8c9b0;">
        Hi ${admin},<br><br>
        <b style="color:#c9a86a;">${creator}</b> hat das Onboarding abgeschlossen und wartet seit ${ctx.waiting_days} Tagen auf deine Freigabe.
      </td></tr>
      <tr><td style="padding:0 0 32px 0;">
        <a href="${link}" style="display:inline-block;background:#c9a86a;color:#0a0a0a;padding:12px 24px;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:bold;">Zur Pending-Liste</a>
      </td></tr>
      <tr><td style="padding:24px 0 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7062;">ZOE Star Agency · Admin-Reminder</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await r.emails.send({
    from: fromAddress(),
    to: ctx.admin_email,
    subject: `Pending-Approve: ${creator} wartet seit ${ctx.waiting_days}d`,
    html,
    text: `Hi ${admin},\n\n${creator} wartet seit ${ctx.waiting_days} Tagen auf Freigabe.\n\nLink: ${link}\n\nZOE Admin`,
  });
}

// ── SHOWCASE-INCOMPLETE-REMINDER ───────────────────────────────────
// Wenn Creator allow_website_showcase=true gesetzt hat aber <2 Bilder,
// bekommt er nach 24h eine Erinnerungs-Mail.

export async function sendShowcaseIncompleteReminder(
  ctx: BaseCtx & { images_count: number },
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY fehlt.");
  const r = new Resend(apiKey);

  const link = `${siteUrl()}/portal/profile/showcase`;
  const name = ctx.display_name || "Creator";
  const missing = Math.max(0, 2 - ctx.images_count);

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;color:#f5e8d5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 0 32px 0;">
        <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#c9a86a;">ZOE Star Agency</p>
        <h1 style="margin:0;font-size:30px;font-style:italic;line-height:1.15;color:#f5e8d5;font-weight:normal;">Noch ${missing === 1 ? "ein" : missing.toString()} Bild${missing === 1 ? "" : "er"} bis dein <span style="color:#c9a86a;">Showcase live geht</span>.</h1>
      </td></tr>
      <tr><td style="padding:0 0 24px 0;font-size:16px;line-height:1.55;color:#d8c9b0;">
        Hi ${name},<br><br>
        du hast den Showcase freigegeben, aber es fehlen noch Bilder. Wir brauchen mindestens 2 Bilder, damit deine Karte sauber auf der Public-Seite landen kann.
      </td></tr>
      <tr><td style="padding:0 0 32px 0;font-size:13px;line-height:1.5;color:#a89c87;">
        Empfehlung:
        <ul style="margin:12px 0 0 18px;padding:0;">
          <li>1 Portrait-Look (Hochformat)</li>
          <li>1 LIVE-Vibe (Setup, Bühne, Stimmung)</li>
        </ul>
      </td></tr>
      <tr><td style="padding:0 0 32px 0;">
        <a href="${link}" style="display:inline-block;background:#c9a86a;color:#0a0a0a;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:bold;">Bilder hochladen</a>
      </td></tr>
      <tr><td style="padding:24px 0 0 0;border-top:1px solid #2a2622;font-size:12px;line-height:1.5;color:#7a7062;">
        Direkter Link: <a href="${link}" style="color:#c9a86a;">${link}</a>
      </td></tr>
      <tr><td style="padding:32px 0 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7062;">ZOE Star Agency · Creator Network</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await r.emails.send({
    from: fromAddress(),
    to: ctx.email,
    subject: `Showcase unvollstaendig (${ctx.images_count}/2 Bilder)`,
    html,
    text: `Hi ${name},\n\ndein Showcase ist freigegeben, aber es fehlen noch ${missing} Bild(er) (${ctx.images_count}/2).\n\nHochladen: ${link}\n\nZOE Star Agency`,
  });
}
