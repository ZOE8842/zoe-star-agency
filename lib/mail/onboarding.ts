// Onboarding-Mail Builder fuer Invite-Codes.
// Editorial-Brand: schwarz / champagne / italic display.
// Inline-CSS Pflicht — Mail-Clients ignorieren <style>-Blocks (Gmail strippt sie).

interface InviteMailInput {
  inviteCode: string;
  intendedRole: "creator" | "manager";
  recipientName?: string;
  recipientEmail: string;
  expiresAt?: string | null;
  personalNote?: string;
  siteUrl?: string;
  senderName?: string;
}

interface InviteMailOutput {
  subject: string;
  html: string;
  text: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatExpiry(iso: string | null | undefined): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
}

export function buildInviteMail(input: InviteMailInput): InviteMailOutput {
  const site = input.siteUrl || "https://zoe-star.de";
  const greeting = input.recipientName?.trim()
    ? `An ${escapeHtml(input.recipientName.trim())},`
    : "An eine ausgewaehlte Stimme,";
  const sender = input.senderName?.trim() || "ZOE Star Agency";
  const expiryHuman = formatExpiry(input.expiresAt);
  const signupUrl = `${site}/portal/signup?invite=${encodeURIComponent(input.inviteCode)}`;
  const personalBlock = input.personalNote?.trim()
    ? `<p style="margin:0 0 28px;color:#e8dfc8;font-size:15px;line-height:1.7;font-style:italic;">${escapeHtml(input.personalNote.trim())}</p>`
    : "";

  const roleLine = input.intendedRole === "manager"
    ? "Manager-Zugang. Du betreust dein eigenes Roster, nicht das gesamte Haus."
    : "Creator-Zugang. Du gehoerst zum inneren Kreis des Hauses.";

  const subject = "Eine Einladung — ZOE Star Agency";

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:Georgia,'Times New Roman',serif;color:#f4ede0;-webkit-font-smoothing:antialiased;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Du wurdest persoenlich zur ZOE Star Agency eingeladen. Dein Code: ${escapeHtml(input.inviteCode)}.
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;">
    <tr>
      <td align="center" style="padding:56px 20px;">
        <table role="presentation" width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">
          <tr>
            <td style="padding:0 0 48px;text-align:center;">
              <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.32em;text-transform:uppercase;color:#cdb98a;">ZOE Star Agency</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px;border-top:1px solid rgba(205,185,138,0.25);"></td>
          </tr>
          <tr>
            <td style="padding:8px 0 32px;">
              <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:400;font-size:42px;line-height:1.15;color:#f4ede0;">An invitation.</h1>
            </td>
          </tr>
          <tr>
            <td style="padding:0 0 24px;">
              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#f4ede0;">${greeting}</p>
              <p style="margin:0 0 18px;font-size:15px;line-height:1.7;color:#e8dfc8;">
                wir bauen kein Netzwerk. Wir bauen ein Haus.<br />
                Und wir haben dir einen Schluessel reserviert.
              </p>
              ${personalBlock}
              <p style="margin:0 0 8px;font-size:15px;line-height:1.7;color:#e8dfc8;">
                ${escapeHtml(roleLine)}
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:24px 0 12px;">
              <p style="margin:0 0 14px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#cdb98a;">Dein Code</p>
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border:1px solid rgba(205,185,138,0.35);">
                <tr>
                  <td align="center" style="padding:24px 16px;">
                    <span style="font-family:'Courier New',Courier,monospace;font-size:24px;letter-spacing:0.18em;color:#cdb98a;">${escapeHtml(input.inviteCode)}</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 0 8px;text-align:center;">
              <a href="${signupUrl}" style="display:inline-block;padding:16px 36px;background:#cdb98a;color:#0a0a0a;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;text-decoration:none;font-weight:600;">
                Account erstellen
              </a>
            </td>
          </tr>
          <tr>
            <td style="padding:18px 0 32px;text-align:center;">
              <p style="margin:0;font-size:12px;color:#7a7163;line-height:1.6;">
                oder kopiere den Link:<br />
                <a href="${signupUrl}" style="color:#cdb98a;text-decoration:none;word-break:break-all;">${signupUrl}</a>
              </p>
            </td>
          </tr>
          ${expiryHuman ? `
          <tr>
            <td style="padding:0 0 32px;">
              <p style="margin:0;font-size:12px;color:#7a7163;line-height:1.6;font-style:italic;">
                Der Code verfaellt am ${escapeHtml(expiryHuman)}.
              </p>
            </td>
          </tr>` : ""}
          <tr>
            <td style="padding:32px 0 0;border-top:1px solid rgba(205,185,138,0.18);">
              <p style="margin:0 0 6px;font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.28em;text-transform:uppercase;color:#cdb98a;">${escapeHtml(sender)}</p>
              <p style="margin:0;font-size:12px;color:#7a7163;line-height:1.6;">
                <a href="${site}" style="color:#7a7163;text-decoration:none;">zoe-star.de</a>
                &nbsp;·&nbsp;
                <a href="mailto:info@zoe-star.de" style="color:#7a7163;text-decoration:none;">info@zoe-star.de</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    "ZOE Star Agency — An invitation.",
    "",
    input.recipientName?.trim() ? `An ${input.recipientName.trim()},` : "An eine ausgewaehlte Stimme,",
    "",
    "wir bauen kein Netzwerk. Wir bauen ein Haus.",
    "Und wir haben dir einen Schluessel reserviert.",
    "",
    input.personalNote?.trim() ? input.personalNote.trim() : "",
    input.personalNote?.trim() ? "" : "",
    roleLine,
    "",
    `Dein Code: ${input.inviteCode}`,
    "",
    `Account erstellen: ${signupUrl}`,
    "",
    expiryHuman ? `Der Code verfaellt am ${expiryHuman}.` : "",
    expiryHuman ? "" : "",
    "—",
    sender,
    "zoe-star.de · info@zoe-star.de",
  ].filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n");

  return { subject, html, text };
}
