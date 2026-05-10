// V2-Stufe-2 · TikTok-Public-Scraper via Apify
// Port von scrape_tiktok_public() aus bot_zoeapp.py.
// Apify Actor: clockworks~tiktok-profile-scraper
// Cache via tiktok_public_snapshots (24h-Default).

import { SupabaseClient } from "@supabase/supabase-js";

const APIFY_ACTOR = "clockworks~tiktok-profile-scraper";
const APIFY_API = "https://api.apify.com/v2";

export interface TikTokVideo {
  id: string;
  url: string;
  description: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  created: string;
}

export interface TikTokProfile {
  username: string;
  display_name: string | null;
  bio: string | null;
  profile_pic: string | null;
  followers: number | null;
  following: number | null;
  total_likes: number | null;
  video_count: number | null;
  verified: boolean | null;
  videos: TikTokVideo[];
}

export interface FetchResult {
  ok: boolean;
  source: "apify" | "cache" | "stub";
  profile?: TikTokProfile;
  cost_usd: number;
  fetched_at: string;
  error?: string;
}

const CACHE_MAX_AGE_HOURS = 24;

// Apify result-Item → TikTokProfile
function mapApifyItem(first: Record<string, unknown>, username: string): TikTokProfile {
  const meta = (first.authorMeta as Record<string, unknown>) ?? {};
  const items = Array.isArray((first as { items?: unknown[] }).items)
    ? ((first as { items: unknown[] }).items as Array<Record<string, unknown>>)
    : null;
  // Manche Actor-Versionen liefern items[] mit Videos, manche flach.
  const videoSource =
    items ??
    (Array.isArray((first as { videos?: unknown[] }).videos)
      ? ((first as { videos: unknown[] }).videos as Array<Record<string, unknown>>)
      : []);

  return {
    username: (meta.name as string) || username.replace(/^@/, ""),
    display_name: (meta.nickName as string) ?? null,
    bio: (meta.signature as string) ?? null,
    profile_pic: (meta.avatar as string) ?? null,
    followers: (meta.fans as number) ?? null,
    following: (meta.following as number) ?? null,
    total_likes: (meta.heart as number) ?? null,
    video_count: (meta.video as number) ?? null,
    verified: (meta.verified as boolean) ?? null,
    videos: (videoSource || []).slice(0, 5).map((v) => ({
      id: (v.id as string) || "",
      url: (v.webVideoUrl as string) || "",
      description: (v.text as string) || "",
      views: (v.playCount as number) ?? 0,
      likes: (v.diggCount as number) ?? 0,
      comments: (v.commentCount as number) ?? 0,
      shares: (v.shareCount as number) ?? 0,
      created: (v.createTimeISO as string) || "",
    })),
  };
}

async function fetchFromApify(
  username: string,
  resultsPerPage: number,
): Promise<{ ok: boolean; profile?: TikTokProfile; error?: string; raw?: unknown }> {
  const token = process.env.APIFY_TOKEN;
  if (!token) return { ok: false, error: "APIFY_TOKEN fehlt" };

  const cleanUsername = username.replace(/^@/, "");
  const url = `${APIFY_API}/acts/${APIFY_ACTOR}/run-sync-get-dataset-items?token=${token}&timeout=120`;
  const body = {
    profiles: [cleanUsername],
    resultsPerPage,
    shouldDownloadVideos: false,
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) {
      const txt = await r.text();
      return { ok: false, error: `Apify HTTP ${r.status}: ${txt.slice(0, 300)}` };
    }
    const results = (await r.json()) as Array<Record<string, unknown>>;
    if (!Array.isArray(results) || results.length === 0) {
      return { ok: false, error: "Apify lieferte leeres Dataset" };
    }
    return { ok: true, profile: mapApifyItem(results[0], cleanUsername), raw: results };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function getTikTokPublic(
  supabase: SupabaseClient,
  username: string,
  opts: {
    profile_id?: string | null;
    forceRefresh?: boolean;
    maxAgeHours?: number;
    resultsPerPage?: number;
  } = {},
): Promise<FetchResult> {
  const cleanUsername = username.replace(/^@/, "").trim().toLowerCase();
  if (!cleanUsername) {
    return {
      ok: false,
      source: "stub",
      cost_usd: 0,
      fetched_at: new Date().toISOString(),
      error: "Username leer",
    };
  }

  const maxAge = opts.maxAgeHours ?? CACHE_MAX_AGE_HOURS;
  const sinceIso = new Date(Date.now() - maxAge * 3600_000).toISOString();

  // 1) Cache pruefen
  if (!opts.forceRefresh) {
    const { data: cached } = await supabase
      .from("tiktok_public_snapshots")
      .select("payload, fetched_at, source")
      .eq("tiktok_username", cleanUsername)
      .gte("fetched_at", sinceIso)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached && cached.payload) {
      return {
        ok: true,
        source: "cache",
        profile: cached.payload as TikTokProfile,
        cost_usd: 0,
        fetched_at: cached.fetched_at,
      };
    }
  }

  // 2) Apify-Fetch
  const t0 = Date.now();
  const r = await fetchFromApify(cleanUsername, opts.resultsPerPage ?? 5);
  const dur = Date.now() - t0;

  if (!r.ok) {
    // Health-Log
    await supabase.from("data_source_health").insert({
      source: "apify_tiktok",
      kind: cleanUsername,
      ok: false,
      duration_ms: dur,
      error_message: r.error?.slice(0, 500) ?? null,
    });
    return {
      ok: false,
      source: "apify",
      cost_usd: 0,
      fetched_at: new Date().toISOString(),
      error: r.error,
    };
  }

  // Cost-Schaetzung: Apify-Compute fuer profile-scraper ist ca. $0,01-0,02 pro Profile
  // Aktuelle Pricing siehe Apify-Dashboard; wir schaetzen konservativ.
  const estCost = 0.02;

  // 3) Cache-Insert (best-effort, Worker laeuft auch ohne)
  const fetched_at = new Date().toISOString();
  const expires_at = new Date(Date.now() + maxAge * 3600_000).toISOString();
  await supabase.from("tiktok_public_snapshots").insert({
    profile_id: opts.profile_id ?? null,
    tiktok_username: cleanUsername,
    source: "apify",
    payload: r.profile,
    cost_usd: estCost,
    fetched_at,
    expires_at,
  });

  await supabase.from("data_source_health").insert({
    source: "apify_tiktok",
    kind: cleanUsername,
    ok: true,
    count_items: r.profile?.videos.length ?? 0,
    cost_usd: estCost,
    duration_ms: dur,
  });

  return {
    ok: true,
    source: "apify",
    profile: r.profile,
    cost_usd: estCost,
    fetched_at,
  };
}

export function formatTikTokBlock(p: TikTokProfile): string {
  const lines: string[] = ["TIKTOK-PUBLIC (Quelle: Apify · live gescraped):"];
  lines.push(`- TikTok-Username: @${p.username}`);
  lines.push(`- Display-Name: ${p.display_name || "[leer]"}`);
  lines.push(`- Bio: ${p.bio ? `"${p.bio}"` : "[leer]"}`);
  lines.push(`- Follower: ${p.followers ?? "?"} · Following: ${p.following ?? "?"} · Likes gesamt: ${p.total_likes ?? "?"}`);
  lines.push(`- Videos auf Profil: ${p.video_count ?? "?"}${p.verified ? " · verified" : ""}`);
  if (p.videos.length) {
    lines.push("- Letzte Videos:");
    for (const v of p.videos) {
      const desc = (v.description || "").replace(/\s+/g, " ").slice(0, 120);
      lines.push(
        `  • ${v.created?.slice(0, 10) || "?"} · Views ${v.views} · Likes ${v.likes} · Kommentare ${v.comments} · "${desc}"`,
      );
    }
  } else {
    lines.push("- Letzte Videos: [keine geliefert]");
  }
  return lines.join("\n");
}
