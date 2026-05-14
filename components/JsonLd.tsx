// JSON-LD Structured Data — minimal Server-Component-Helper.
// Verwendung:
//   <JsonLd data={{ "@type": "Organization", name: "ZOE Star Agency", ... }} />
//
// Schema-Builder fuer typische Patterns sind unten als Named Exports.

import { baseUrl } from "@/lib/seo/routes";

type JsonLdObject = Record<string, unknown> & { "@type": string };

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  const payload = Array.isArray(data)
    ? { "@context": "https://schema.org", "@graph": data }
    : { "@context": "https://schema.org", ...data };
  return (
    <script
      type="application/ld+json"
      // Wir injecten NUR Server-Daten via JSON.stringify — kein User-Input.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}

// Organization-Schema fuer Root-Layout. Erscheint auf jeder Seite.
export function organizationSchema(): JsonLdObject {
  const base = baseUrl();
  return {
    "@type": "Organization",
    "@id": `${base}/#organization`,
    name: "ZOE Star Agency",
    alternateName: "ZOE⭐ Star Agency",
    url: base,
    logo: `${base}/brand/og-image.png`,
    description:
      "Premium Creator Talent Agency — multi-vertical brand für Talent, Media, Events und Studio.",
    sameAs: [
      "https://www.tiktok.com/@zoeagency",
    ],
    address: {
      "@type": "PostalAddress",
      addressCountry: "DE",
    },
    areaServed: "DE",
  };
}

// Website-Schema mit SearchAction (kein public search aktuell — search-template
// daher weggelassen, aber Site als Top-Level-Entity definiert).
export function websiteSchema(): JsonLdObject {
  const base = baseUrl();
  return {
    "@type": "WebSite",
    "@id": `${base}/#website`,
    url: base,
    name: "ZOE Star Agency",
    inLanguage: "de-DE",
    publisher: { "@id": `${base}/#organization` },
  };
}

// BreadcrumbList — Helper. items = [{ name, url-segment }, ...]
export function breadcrumbSchema(items: { name: string; path: string }[]): JsonLdObject {
  const base = baseUrl();
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.path === "/" ? base : `${base}${item.path.startsWith("/") ? item.path : `/${item.path}`}`,
    })),
  };
}

// Person/Creator-Schema fuer /creator/[username] Seiten.
export function creatorPersonSchema(opts: {
  name: string;
  username: string | null;
  bio: string | null;
  imageUrl: string | null;
  tiktokUrl: string | null;
  instagramUrl: string | null;
}): JsonLdObject {
  const base = baseUrl();
  const sameAs: string[] = [];
  if (opts.tiktokUrl) sameAs.push(opts.tiktokUrl);
  if (opts.instagramUrl) sameAs.push(opts.instagramUrl);
  const profileUrl = opts.username ? `${base}/creator/${encodeURIComponent(opts.username)}` : base;
  return {
    "@type": "Person",
    "@id": `${profileUrl}#person`,
    name: opts.name,
    url: profileUrl,
    ...(opts.imageUrl ? { image: opts.imageUrl } : {}),
    ...(opts.bio ? { description: opts.bio } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    affiliation: { "@id": `${base}/#organization` },
  };
}
