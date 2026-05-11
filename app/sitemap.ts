import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zoe-star.de";
  const now = new Date();
  const pages = [
    { url: "", priority: 1.0, changeFrequency: "weekly" as const },
    { url: "agency", priority: 0.9, changeFrequency: "monthly" as const },
    { url: "kooperationen", priority: 0.85, changeFrequency: "monthly" as const },
    { url: "events", priority: 0.8, changeFrequency: "weekly" as const },
    { url: "press", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "studio", priority: 0.6, changeFrequency: "monthly" as const },
    { url: "media", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "journal", priority: 0.5, changeFrequency: "monthly" as const },
    { url: "contact", priority: 0.7, changeFrequency: "yearly" as const },
    { url: "join", priority: 0.8, changeFrequency: "monthly" as const },
    { url: "about", priority: 0.4, changeFrequency: "yearly" as const },
    { url: "legal/agb", priority: 0.3, changeFrequency: "yearly" as const },
    { url: "legal/datenschutz", priority: 0.3, changeFrequency: "yearly" as const },
    { url: "legal/impressum", priority: 0.3, changeFrequency: "yearly" as const },
    { url: "legal/portal-regeln", priority: 0.3, changeFrequency: "yearly" as const },
  ];
  return pages.map((p) => ({
    url: `${base}/${p.url}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
