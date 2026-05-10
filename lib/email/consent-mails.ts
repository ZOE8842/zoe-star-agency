// Consent-Confirmation-Mails via Resend.
// 2 Templates: Showcase + Brand-Kooperationen.
// Tokens werden in consent_tokens Tabelle persistiert.

import { Resend } from "resend";
import { randomBytes } from "crypto";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const TOKEN_TTL_HOURS = 72;

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.zoe-star.de"
  );
}

export async function generateConsentToken(
  profileId: string,
  consentType: "showcase" | "brand_cooperation",
): Promise<string> {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );

  // Alte unbenutzte Tokens fuer denselben User+Type ablaufen lassen
  await admin
    .from("consent_tokens")
    .update({ expires_at: new Date(Date.now() - 1000).toISOString() })
    .eq("profile_id", profileId)
    .eq("consent_type", consentType)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString());

  const token = randomBytes(24).toString("base64url");
  const expires_at = new Date(Date.now() + TOKEN_TTL_HOURS * 3600 * 1000).toISOString();

  const { error } = await admin
    .from("consent_tokens")
    .insert({ profile_id: profileId, consent_type: consentType, token, expires_at });
  if (error) throw new Error(`consent_token insert: ${error.message}`);
  return token;
}

interface MailContext {
  email: string;
  display_name: string;
  token: string;
}

export async function sendShowcaseConsentMail(ctx: MailContext): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "noreply@zoe-star.de";
  if (!apiKey) throw new Error("RESEND_API_KEY fehlt.");

  const link = `${siteUrl()}/portal/consent/${ctx.token}?t=showcase`;
  const r = new Resend(apiKey);

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;color:#f5e8d5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 0 32px 0;">
        <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#c9a86a;">ZOE Star Agency</p>
        <h1 style="margin:0;font-size:34px;font-style:italic;line-height:1.1;color:#f5e8d5;font-weight:normal;">Bestaetige deine <span style="color:#c9a86a;">Showcase-Freigabe.</span></h1>
      </td></tr>
      <tr><td style="padding:0 0 24px 0;font-size:16px;line-height:1.55;color:#d8c9b0;">
        Hi ${ctx.display_name || "Creator"},<br><br>
        du hast im Portal angegeben, dass dein TikTok-Profil im Creator-Showcase auf zoe-star.de erscheinen darf. Bevor wir das aktivieren, brauchen wir deine Bestaetigung per Klick.
      </td></tr>
      <tr><td style="padding:0 0 32px 0;font-size:14px;line-height:1.5;color:#a89c87;">
        Was sichtbar wird:
        <ul style="margin:12px 0 0 18px;padding:0;">
          <li>TikTok-Anzeigename + @username</li>
          <li>Creator-Kategorie</li>
          <li>Showcase-Bilder (1-2)</li>
          <li>oeffentlicher TikTok-Profil-Link</li>
        </ul>
        Nicht sichtbar: dein Geburtstag, Email, Telefonnummer, persoenliche Daten.<br><br>
        Erst nach zusaetzlicher Admin-Freigabe wird die Karte oeffentlich sichtbar. Du kannst die Sichtbarkeit jederzeit im Profil wieder deaktivieren.
      </td></tr>
      <tr><td style="padding:0 0 32px 0;">
        <a href="${link}" style="display:inline-block;background:#c9a86a;color:#0a0a0a;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:bold;">Showcase bestaetigen</a>
      </td></tr>
      <tr><td style="padding:24px 0 0 0;border-top:1px solid #2a2622;font-size:12px;line-height:1.5;color:#7a7062;">
        Link gueltig 72 Stunden. Falls du den Showcase nicht angefragt hast, ignoriere diese Mail.<br>
        Direkter Link: <a href="${link}" style="color:#c9a86a;">${link}</a>
      </td></tr>
      <tr><td style="padding:32px 0 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7062;">ZOE Star Agency · Creator Network</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await r.emails.send({
    from: `ZOE Star Agency <${from}>`,
    to: ctx.email,
    subject: "Bestaetige deine Showcase-Freigabe",
    html,
    text: `Hi ${ctx.display_name || "Creator"},\n\nbestaetige deine Showcase-Freigabe per Klick:\n${link}\n\nLink gueltig 72 Stunden.\n\nZOE Star Agency`,
  });
}

export async function sendCooperationConsentMail(ctx: MailContext): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL || "noreply@zoe-star.de";
  if (!apiKey) throw new Error("RESEND_API_KEY fehlt.");

  const link = `${siteUrl()}/portal/consent/${ctx.token}?t=brand_cooperation`;
  const r = new Resend(apiKey);

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,serif;color:#f5e8d5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;">
      <tr><td style="padding:0 0 32px 0;">
        <p style="margin:0 0 8px 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#c9a86a;">ZOE Star Agency</p>
        <h1 style="margin:0;font-size:34px;font-style:italic;line-height:1.1;color:#f5e8d5;font-weight:normal;">Bestaetige deine <span style="color:#c9a86a;">Kooperations-Freigabe.</span></h1>
      </td></tr>
      <tr><td style="padding:0 0 24px 0;font-size:16px;line-height:1.55;color:#d8c9b0;">
        Hi ${ctx.display_name || "Creator"},<br><br>
        du hast angegeben, dass wir dich fuer Brand-Kooperationen beruecksichtigen duerfen. Bevor wir bei passenden Anfragen auf dich zugehen, brauchen wir deine Bestaetigung per Klick.
      </td></tr>
      <tr><td style="padding:0 0 32px 0;font-size:14px;line-height:1.5;color:#a89c87;">
        Was das bedeutet:
        <ul style="margin:12px 0 0 18px;padding:0;">
          <li>ZOE darf passende Kooperationen anfragen oder vorschlagen</li>
          <li>keine automatische Teilnahme — du entscheidest immer selbst</li>
          <li>jederzeit widerrufbar im Profil</li>
          <li>weitergegebene Daten nur: Anzeigename, @username, Kategorie, Aggregatdaten — keine privaten Informationen</li>
        </ul>
      </td></tr>
      <tr><td style="padding:0 0 32px 0;">
        <a href="${link}" style="display:inline-block;background:#c9a86a;color:#0a0a0a;padding:14px 28px;text-decoration:none;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;font-weight:bold;">Teilnahme bestaetigen</a>
      </td></tr>
      <tr><td style="padding:24px 0 0 0;border-top:1px solid #2a2622;font-size:12px;line-height:1.5;color:#7a7062;">
        Link gueltig 72 Stunden. Falls du das nicht angefragt hast, ignoriere diese Mail.<br>
        Direkter Link: <a href="${link}" style="color:#c9a86a;">${link}</a>
      </td></tr>
      <tr><td style="padding:32px 0 0 0;font-size:10px;letter-spacing:0.25em;text-transform:uppercase;color:#7a7062;">ZOE Star Agency · Creator Network</td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  await r.emails.send({
    from: `ZOE Star Agency <${from}>`,
    to: ctx.email,
    subject: "Bestaetige deine Kooperations-Freigabe",
    html,
    text: `Hi ${ctx.display_name || "Creator"},\n\nbestaetige deine Kooperations-Freigabe per Klick:\n${link}\n\nLink gueltig 72 Stunden.\n\nZOE Star Agency`,
  });
}
