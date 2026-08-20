// Deutsche Texte fuer Supabase-Auth-Fehler.
//
// Warum: signInWithPassword & Co. liefern englische Rohmeldungen
// ("Invalid login credentials"). Die standen bis 2026-08-20 ungefiltert auf
// der Login-Seite — mitten in einer sonst durchgehend deutschen Oberflaeche.
//
// Unbekannte Codes fallen auf einen neutralen Satz zurueck, damit nie wieder
// eine englische Rohmeldung durchrutscht.

const MESSAGES: Record<string, string> = {
  "invalid login credentials": "E-Mail oder Passwort stimmt nicht.",
  "email not confirmed": "Deine E-Mail ist noch nicht bestätigt. Schau in dein Postfach.",
  "user not found": "Zu dieser E-Mail gibt es keinen Zugang.",
  "invalid email or password": "E-Mail oder Passwort stimmt nicht.",
  "email rate limit exceeded": "Zu viele Versuche. Warte ein paar Minuten.",
  "over_email_send_rate_limit": "Zu viele E-Mails in kurzer Zeit. Warte ein paar Minuten.",
  "for security purposes, you can only request this after 60 seconds":
    "Aus Sicherheitsgründen geht das erst nach 60 Sekunden wieder.",
  "new password should be different from the old password":
    "Das neue Passwort muss sich vom alten unterscheiden.",
  "password should be at least 6 characters":
    "Das Passwort braucht mindestens 6 Zeichen.",
  "token has expired or is invalid":
    "Der Link ist abgelaufen. Fordere einen neuen an.",
  "email link is invalid or has expired":
    "Der Link ist abgelaufen. Fordere einen neuen an.",
  "user already registered": "Für diese E-Mail gibt es schon einen Zugang.",
  "signups not allowed for this instance":
    "Registrierung ist deaktiviert. Melde dich bei deinem Manager.",
};

/** Uebersetzt eine Supabase-Auth-Fehlermeldung ins Deutsche. */
export function authErrorText(raw: string | null | undefined): string {
  if (!raw) return "Das hat nicht geklappt. Versuch es nochmal.";
  const key = raw.trim().toLowerCase();
  if (MESSAGES[key]) return MESSAGES[key];
  // Teiltreffer: Supabase haengt manchmal Zusaetze an die Meldung
  for (const [needle, text] of Object.entries(MESSAGES)) {
    if (key.includes(needle)) return text;
  }
  return "Das hat nicht geklappt. Versuch es nochmal.";
}
