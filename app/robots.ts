import type { MetadataRoute } from "next";
import { baseUrl, PUBLIC_ROUTES } from "@/lib/seo/routes";

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  const allow = PUBLIC_ROUTES.map((r) => (r.path ? `/${r.path}` : "/"));
  // Creator-Profile-Routes sind dynamisch — Crawler darf alle.
  allow.push("/creator");
  return {
    rules: [
      {
        userAgent: "*",
        allow,
        disallow: ["/portal", "/api"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
