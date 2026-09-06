import type { MetadataRoute } from "next";
import { baseUrl, INDEXABLE_ROUTES } from "@/lib/seo/routes";

export default function robots(): MetadataRoute.Robots {
  const base = baseUrl();
  // "/creator" kommt seit 06.09.2026 aus der Registry und deckt als Prefix
  // auch die dynamischen /creator/[username]-Profile ab. Der fruehere
  // manuelle allow.push("/creator") stand danach doppelt in der robots.txt.
  const allow = INDEXABLE_ROUTES.map((r) => (r.path ? `/${r.path}` : "/"));
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
