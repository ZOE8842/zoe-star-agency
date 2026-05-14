import type { MetadataRoute } from "next";
import { baseUrl, PUBLIC_ROUTES } from "@/lib/seo/routes";
import { fetchCooperationCreators } from "@/lib/showcase/public";

// Sitemap-Refresh stuendlich. Verhindert Latenzspike bei wachsendem
// Creator-Roster und entlastet die Sitemap-Crawl-Requests.
export const revalidate = 3600;

// Dynamische Sitemap. Public-Routes aus zentraler Registry + alle
// freigegebenen Creator-Profile (cooperation-confirmed = oeffentlich
// sichtbar unter /creator/[username]). Bei Build/Crawl-Time gerendert.

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = baseUrl();
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((r) => ({
    url: r.path ? `${base}/${r.path}` : base,
    lastModified: now,
    changeFrequency: r.changeFrequency,
    priority: r.priority,
  }));

  // Creator-Profile-Routes
  let creatorEntries: MetadataRoute.Sitemap = [];
  try {
    const creators = await fetchCooperationCreators();
    creatorEntries = creators
      .filter((c) => c.tiktokUsername)
      .map((c) => ({
        url: `${base}/creator/${encodeURIComponent(c.tiktokUsername!)}`,
        lastModified: c.approvedAt ? new Date(c.approvedAt) : now,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      }));
  } catch {
    // Sitemap soll bei DB-Ausfall nicht ganz brechen — Static-Entries reichen
  }

  return [...staticEntries, ...creatorEntries];
}
