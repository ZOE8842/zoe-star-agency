// Zentraler Cache-Invalidator fuer alle Showcase-relevanten Schreib-Sites.
//
// HINTERGRUND (CDX-1):
// lib/showcase/public.ts:153 hat unstable_cache(revalidate: 3600,
// tags: ['showcase-homepage']). Ohne expliziten revalidateTag bleibt
// dieser DB-Cache bis zu 60 Minuten stale, auch wenn die Page-Render-
// Schicht via revalidatePath neu rendert.
//
// MUSS aufgerufen werden nach JEDEM Write auf:
//   - showcase_creators (alle Felder: approve, feature, sort, edit, delete)
//   - profiles.allow_website_showcase_confirmed
//   - profiles.allow_partner_cooperations_confirmed
//   - profiles.allow_website_showcase (Interest-Flow)
//   - profiles.allow_partner_cooperations (Interest-Flow)

import { revalidatePath, revalidateTag } from "next/cache";

export async function invalidateShowcase(): Promise<void> {
  try {
    // DB-Layer-Cache: lib/showcase/public.ts:153 unstable_cache-Tag.
    // Next 16: revalidateTag(tag, profile) — profile MUSS gesetzt sein.
    // String-Profile-Namen erfordern eine cacheLife-Config in next.config.js
    // (die wir nicht haben), deshalb explizites CacheLifeConfig-Object
    // mit expire:0 -> sofortige Invalidation.
    revalidateTag("showcase-homepage", { expire: 0 });

    // Page-Layer-Caches: alle Public-Surfaces die fetchHomepageCreators
    // oder fetchCooperationCreators lesen.
    revalidatePath("/");
    revalidatePath("/creator");
    revalidatePath("/kooperationen");
    revalidatePath("/sitemap.xml");
  } catch (e) {
    // Logging, aber nicht werfen — eine fehlgeschlagene Invalidation
    // darf den Write nicht ruckgaengig machen.
    console.error("[invalidateShowcase] revalidation failed:", e);
  }
}
