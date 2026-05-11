import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL || "https://www.zoe-star.de";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/agency", "/kooperationen", "/events", "/press",
                "/studio", "/journal", "/media", "/contact", "/join",
                "/legal/agb", "/legal/datenschutz", "/legal/impressum",
                "/legal/portal-regeln", "/about"],
        disallow: ["/portal", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
