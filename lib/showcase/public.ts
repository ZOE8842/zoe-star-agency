// Zentrale Public-Showcase-Queries · Service-Role-Client.
// Genutzt von:
//   - app/page.tsx          → Homepage (random 6 featured)
//   - app/creator/page.tsx  → Creator-Liste (random 6)
//   - app/creator/[username]/page.tsx → Einzelprofil
//   - app/kooperationen     → alle coop-confirmed

import { createClient } from "@supabase/supabase-js";
import type { CreatorShowcase } from "@/components/CreatorShowcaseCard";

const VISUAL_CYCLE: NonNullable<CreatorShowcase["visual"]>[] = [
  "champagne",
  "warm",
  "cool",
  "ink",
];

export interface PublicCreator {
  profileId: string;
  displayName: string | null;
  tiktokUsername: string | null;
  category: string | null;
  language: string | null;
  region: string | null;
  showcaseImage: string | null;
  showcaseImages: string[];
  tiktokUrl: string | null;
  instagramUrl: string | null;
  bio: string | null;
  approvedAt: string | null;
  sortOrder: number | null;
}

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

// showcase_images-Spalte ist jsonb · echtes Format kann zwei Schemas haben:
//   - alt: string[]                      ["https://...png", ...]
//   - neu: { url, type, position }[]     [{url, position: 1}, ...]
// Diese Helper normalisiert beides zu sortiertem string[] und entfernt
// Duplikate. Fallback: zeigt mindestens showcase_image-Singular.
function parseShowcaseImages(
  raw: unknown,
  fallbackSingle: string | null,
): string[] {
  const collected: { url: string; position: number }[] = [];

  if (Array.isArray(raw)) {
    raw.forEach((item, i) => {
      if (typeof item === "string" && item.length > 0) {
        collected.push({ url: item, position: i + 1 });
        return;
      }
      if (item && typeof item === "object") {
        const obj = item as { url?: unknown; position?: unknown };
        if (typeof obj.url === "string" && obj.url.length > 0) {
          const pos = typeof obj.position === "number" ? obj.position : i + 1;
          collected.push({ url: obj.url, position: pos });
        }
      }
    });
  }

  collected.sort((a, b) => a.position - b.position);

  // Dedupe by url
  const seen = new Set<string>();
  const urls: string[] = [];
  for (const c of collected) {
    if (seen.has(c.url)) continue;
    seen.add(c.url);
    urls.push(c.url);
  }

  // Wenn Array leer aber showcase_image vorhanden → Fallback
  if (urls.length === 0 && fallbackSingle) {
    return [fallbackSingle];
  }
  return urls;
}

/**
 * Tage, die ein Creator ohne LIVE sein darf und trotzdem auf der Webseite
 * bleibt. 30 Tage decken Urlaub und Krankheit ab, halten die Liste aber frei
 * von Leuten, die seit Monaten nicht mehr streamen.
 */
const AKTIV_TAGE = 30;

/**
 * TikTok-Namen, die laut Backstage-Daten zuletzt live waren.
 * Gibt null zurueck, wenn die Abfrage nicht klappt oder gar keine Daten
 * liefert — dann wird nicht gefiltert. Ein ausgefallener Sync soll nicht
 * die halbe Webseite leerraeumen.
 */
async function aktiveHandles(): Promise<Set<string> | null> {
  try {
    const seit = new Date(Date.now() - AKTIV_TAGE * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10);
    const { data, error } = await admin()
      .from("creator_daily_metrics")
      .select("tiktok_username")
      .gte("metric_date", seit)
      .gt("live_minutes", 0);
    if (error || !data || data.length === 0) return null;
    return new Set(
      data
        .map((r) => (r.tiktok_username ?? "").toLowerCase())
        .filter(Boolean),
    );
  } catch {
    return null;
  }
}

// Basis-Query: alle approved+featured+confirmed Creators.
// 2-Step (showcase → profiles via IN) wegen FK-Embed-Ambiguity.
async function fetchApprovedConfirmed(
  filter: "featured" | "cooperation",
): Promise<PublicCreator[]> {
  const c = admin();

  const { data: shows, error: showErr } = await c
    .from("showcase_creators")
    .select(
      "profile_id, display_name, category, showcase_image, showcase_images, tiktok_url, instagram_url, approved_at, sort_order, always_visible",
    )
    .eq("is_approved", true)
    .eq("is_featured", true)
    .order("sort_order", { ascending: true })
    .order("approved_at", { ascending: false });

  if (showErr || !shows || shows.length === 0) return [];

  const ids = shows.map((s) => s.profile_id).filter(Boolean) as string[];
  if (ids.length === 0) return [];

  const confirmField =
    filter === "featured"
      ? "allow_website_showcase_confirmed"
      : "allow_partner_cooperations_confirmed";

  const { data: profiles } = await c
    .from("profiles")
    .select(
      `id, tiktok_username, language, region, bio, allow_website_showcase_confirmed, allow_partner_cooperations_confirmed`,
    )
    .in("id", ids)
    .eq(confirmField, true);

  const byId = new Map(
    (profiles ?? []).map((p) => [p.id as string, p] as const),
  );

  // Wer seit ueber AKTIV_TAGE nicht mehr live war, verschwindet von der
  // Webseite. Kommt er zurueck, taucht er beim naechsten Sync von allein
  // wieder auf — niemand muss ein Haekchen umstellen.
  const aktiv = await aktiveHandles();
  const istAktiv = (username: string | null | undefined) =>
    !aktiv || (username ? aktiv.has(username.toLowerCase()) : false);

  return shows
    .filter((s) => s.profile_id && byId.has(s.profile_id))
    // always_visible sticht den Aktivitaetsfilter: gedacht fuer Creator in
    // Pause oder kurz vor der Rueckkehr, die trotzdem auf der Seite bleiben.
    .filter(
      (s) =>
        s.always_visible === true ||
        istAktiv(byId.get(s.profile_id!)?.tiktok_username as string | null),
    )
    .map((s) => {
      const p = byId.get(s.profile_id)!;
      const images = parseShowcaseImages(s.showcase_images, s.showcase_image);
      return {
        profileId: s.profile_id,
        displayName: s.display_name,
        tiktokUsername: p.tiktok_username,
        category: s.category,
        language: p.language,
        region: p.region,
        showcaseImage: s.showcase_image,
        showcaseImages: images,
        tiktokUrl: s.tiktok_url,
        instagramUrl: s.instagram_url,
        bio: p.bio ?? null,
        approvedAt: s.approved_at,
        sortOrder: s.sort_order,
      };
    });
}

import { unstable_cache } from "next/cache";

// Phase-10-Performance: trotz dynamic-Render (loadPublicLocale-Header-Reads)
// bleibt die Supabase-Query 1h gecached. Cache-Key ist tag-basiert.
const cachedHomepageCreators = unstable_cache(
  async () => fetchApprovedConfirmed("featured"),
  ["homepage-creators-v1"],
  { revalidate: 3600, tags: ["showcase-homepage"] },
);

export async function fetchHomepageCreators(): Promise<PublicCreator[]> {
  return cachedHomepageCreators();
}

export async function fetchCooperationCreators(): Promise<PublicCreator[]> {
  return fetchApprovedConfirmed("cooperation");
}

export async function fetchCreatorByUsername(
  username: string,
): Promise<PublicCreator | null> {
  const c = admin();
  const u = username.trim().toLowerCase().replace(/^@/, "");
  if (!u) return null;

  // Profile via tiktok_username case-insensitive
  const { data: profile } = await c
    .from("profiles")
    .select(
      `id, tiktok_username, language, region, bio, allow_website_showcase_confirmed, allow_partner_cooperations_confirmed`,
    )
    .ilike("tiktok_username", u)
    .maybeSingle();

  if (!profile) return null;
  if (!profile.allow_website_showcase_confirmed) return null;

  const { data: s } = await c
    .from("showcase_creators")
    .select(
      "profile_id, display_name, category, showcase_image, showcase_images, tiktok_url, instagram_url, approved_at, sort_order",
    )
    .eq("profile_id", profile.id)
    .eq("is_approved", true)
    .eq("is_featured", true)
    .maybeSingle();

  if (!s) return null;

  const images = parseShowcaseImages(s.showcase_images, s.showcase_image);

  return {
    profileId: s.profile_id,
    displayName: s.display_name,
    tiktokUsername: profile.tiktok_username,
    category: s.category,
    language: profile.language,
    region: profile.region,
    showcaseImage: s.showcase_image,
    showcaseImages: images,
    tiktokUrl: s.tiktok_url,
    instagramUrl: s.instagram_url,
    bio: profile.bio ?? null,
    approvedAt: s.approved_at,
    sortOrder: s.sort_order,
  };
}

// Map PublicCreator → CreatorShowcase fuer Card-Component.
export function toShowcaseCard(p: PublicCreator, i: number): CreatorShowcase {
  const platform: CreatorShowcase["platform"] = p.tiktokUrl
    ? "tiktok"
    : p.instagramUrl
    ? "instagram"
    : null;
  const href = p.tiktokUrl || p.instagramUrl || undefined;
  return {
    displayName: p.displayName ?? p.tiktokUsername ?? "Creator",
    category: p.category ?? undefined,
    imageSrc: p.showcaseImage ?? undefined,
    imageSrc2: p.showcaseImages[1] ?? undefined,
    platform,
    href,
    visual: VISUAL_CYCLE[i % VISUAL_CYCLE.length],
    profileHref: p.tiktokUsername ? `/creator/${p.tiktokUsername}` : undefined,
  };
}

// Random-Pick · Fisher-Yates Shuffle, dann slice.
// HINWEIS: nicht deterministisch — bei jeder Server-Render-Anfrage neu.
export function randomTake<T>(arr: T[], n: number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}
