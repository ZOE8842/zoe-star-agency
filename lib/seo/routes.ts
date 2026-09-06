// Zentrale Public-Route-Registry. Single source of truth fuer
// robots.ts + sitemap.ts + Canonical-Tags. Aenderungen hier propagieren
// automatisch in alle drei.

import type { MetadataRoute } from "next";

export interface PublicRoute {
  /** Path-Segment ohne fuehrenden Slash. Leerer String = Root "/". */
  path: string;
  /** Sitemap-Priority */
  priority: number;
  /** Sitemap-changeFrequency */
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  /**
   * true = Seite existiert, hat aber noch keinen echten Inhalt (Teaser-Text).
   * Solche Seiten bleiben erreichbar, werden aber weder in die Sitemap
   * geschrieben noch in robots.txt beworben — sonst indexiert Google
   * fuenf fast leere Seiten und die Domain sieht duenner aus als sie ist.
   * Sobald echter Inhalt drin ist: Flag entfernen.
   */
  placeholder?: boolean;
}

export const PUBLIC_ROUTES: PublicRoute[] = [
  { path: "",                       priority: 1.0,  changeFrequency: "weekly" },
  { path: "agency",                 priority: 0.9,  changeFrequency: "monthly" },
  // Roster-Uebersicht. Stand bis 06.09.2026 nicht in der Registry — sie war
  // damit weder in der Sitemap noch aus der Navigation erreichbar, obwohl
  // robots.ts /creator ausdruecklich erlaubt.
  { path: "creator",                priority: 0.88, changeFrequency: "weekly" },
  { path: "kooperationen",          priority: 0.85, changeFrequency: "monthly" },
  { path: "events",                 priority: 0.8,  changeFrequency: "weekly", placeholder: true },
  { path: "join",                   priority: 0.8,  changeFrequency: "monthly" },
  { path: "contact",                priority: 0.7,  changeFrequency: "yearly" },
  { path: "press",                  priority: 0.6,  changeFrequency: "monthly", placeholder: true },
  { path: "studio",                 priority: 0.6,  changeFrequency: "monthly", placeholder: true },
  { path: "media",                  priority: 0.5,  changeFrequency: "monthly", placeholder: true },
  { path: "journal",                priority: 0.5,  changeFrequency: "monthly", placeholder: true },
  { path: "about",                  priority: 0.4,  changeFrequency: "yearly" },
  { path: "legal/agb",              priority: 0.3,  changeFrequency: "yearly" },
  { path: "legal/datenschutz",      priority: 0.3,  changeFrequency: "yearly" },
  { path: "legal/impressum",        priority: 0.3,  changeFrequency: "yearly" },
  { path: "legal/portal-regeln",    priority: 0.3,  changeFrequency: "yearly" },
];

/** Nur Routen mit echtem Inhalt — Basis fuer Sitemap und robots.txt. */
export const INDEXABLE_ROUTES: PublicRoute[] = PUBLIC_ROUTES.filter(
  (r) => !r.placeholder,
);

// Hostname-Normalisierung: NEXT_PUBLIC_SITE_URL ist Single-Source. Wenn
// kein env gesetzt → Fallback https://www.zoe-star.de (canonical primary).
// Alle Canonical/Sitemap/Robots-Outputs verwenden EINEN normalisierten Host.
// Apex zoe-star.de redirected via vercel.json permanent (308) auf www.
export function baseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zoe-star.de";
  // trailing slash entfernen damit `${base}/path` keinen "//path" baut
  return raw.replace(/\/+$/, "");
}

export function canonical(path: string = ""): string {
  const base = baseUrl();
  if (!path || path === "/") return base;
  const clean = path.replace(/^\/+/, "");
  return `${base}/${clean}`;
}
