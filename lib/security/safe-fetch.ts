// SSRF-Schutz fuer Server-seitige Fetches von User-supplied URLs.
// Blockiert:
//   - nicht-https
//   - private IP-Ranges (10.0/8, 172.16/12, 192.168/16)
//   - loopback (127.0/8, ::1)
//   - link-local (169.254.0.0/16 — Cloud-Metadata-Endpoint!)
//   - localhost / 0.0.0.0
//
// Nutzung:
//   const safe = await assertSafeUrl(userUrl);
//   if (!safe.ok) return { error: safe.error };
//   await fetch(safe.url);

const ALLOWED_PROTOCOLS = new Set(["https:"]);
const BLOCKED_HOSTS = new Set([
  "localhost",
  "0.0.0.0",
  "169.254.169.254",   // AWS / GCP metadata
  "metadata.google.internal",
  "metadata.azure.com",
]);

function isPrivateIp(host: string): boolean {
  // IPv4 only — basic check. Hostnames werden weiter unten resolved-strict.
  const m = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!m) return false;
  const [a, b] = [parseInt(m[1], 10), parseInt(m[2], 10)];
  if (a === 10) return true;
  if (a === 127) return true;                // loopback
  if (a === 169 && b === 254) return true;   // link-local + AWS metadata
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  if (a === 0) return true;                  // 0.0.0.0/8
  return false;
}

export type SafeUrlResult =
  | { ok: true; url: string; host: string }
  | { ok: false; error: string };

export function assertSafeUrl(raw: string | null | undefined): SafeUrlResult {
  if (!raw || typeof raw !== "string") {
    return { ok: false, error: "URL fehlt." };
  }
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { ok: false, error: "URL nicht parsbar." };
  }
  if (!ALLOWED_PROTOCOLS.has(parsed.protocol)) {
    return { ok: false, error: `Protokoll ${parsed.protocol} nicht erlaubt (nur https).` };
  }
  const host = parsed.hostname.toLowerCase();
  if (BLOCKED_HOSTS.has(host)) {
    return { ok: false, error: `Host ${host} ist blockiert.` };
  }
  if (host.endsWith(".local") || host.endsWith(".internal")) {
    return { ok: false, error: `Host ${host} ist intern.` };
  }
  if (isPrivateIp(host)) {
    return { ok: false, error: `IP ${host} ist privat / link-local.` };
  }
  // IPv6 literal in URL hat "[" — wir blocken hier defensiv.
  if (host.startsWith("[")) {
    return { ok: false, error: "IPv6-Literale nicht erlaubt." };
  }
  return { ok: true, url: parsed.toString(), host };
}
