// Pure-Funktionen fuer Tracking-Klassifizierung.
// Bewusst KEIN Fingerprinting: device_type ist grobe Klasse,
// alle Strings werden gekappt damit Logs nicht aufblaehen.

export const LOCALE_MAX     = 16;
export const REFERRER_MAX   = 512;
export const UTM_MAX        = 128;
export const USER_AGENT_MAX = 256;
export const PATH_MAX       = 256;

export function cap(s: string | null | undefined, max: number): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.length > max ? t.slice(0, max) : t;
}

// Sehr einfache, deterministische Device-Klassifizierung.
// Bewusst grob - wir wollen keine Fingerprint-Praezision.
export function deviceTypeFromUA(ua: string | null | undefined): string {
  if (!ua) return "unknown";
  const s = ua.toLowerCase();
  if (s.includes("tablet") || s.includes("ipad") || (s.includes("android") && !s.includes("mobile"))) {
    return "tablet";
  }
  if (s.includes("mobi") || s.includes("iphone") || s.includes("ipod") || s.includes("android")) {
    return "mobile";
  }
  return "desktop";
}

// Locale aus Cookie-String (Document oder Header) extrahieren.
export function localeFromCookieString(cookieStr: string | null | undefined, name = "zoe_public_lang"): string | null {
  if (!cookieStr) return null;
  const m = cookieStr.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? cap(decodeURIComponent(m[1]), LOCALE_MAX) : null;
}
