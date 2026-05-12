// V2 Worker · Anthropic Claude-API Wrapper
// Port von opus_analyze() aus bot_zoeapp.py.

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
// Sonnet ist 3-5x schneller als Opus bei vergleichbarer Vision-Qualität für
// Content-Scoring. Opus kann per env ueberschrieben werden wenn noetig.
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-6";
// Hartes Timeout je Anthropic-Call. Liegt klar unter Vercel-Function-maxDuration
// damit der Worker selbst die Kontrolle behaelt und failed-State schreibt.
const ANTHROPIC_TIMEOUT_MS = Number(process.env.ANTHROPIC_TIMEOUT_MS ?? 50_000);

// Pricing in USD pro Million Tokens — Stand 2026.
// Falls Anthropic-Preise sich aendern, hier anpassen oder per env injecten.
const PRICING: Record<string, { in: number; out: number }> = {
  "claude-opus-4-7": { in: 15.0, out: 75.0 },
  "claude-sonnet-4-6": { in: 3.0, out: 15.0 },
  "claude-haiku-4-5": { in: 0.8, out: 4.0 },
};

interface ClaudeResult {
  ok: boolean;
  text: string;
  cost_usd: number;
  in_tokens: number;
  out_tokens: number;
  model: string;
  error?: string;
}

// Laedt eine URL serverseitig und wandelt sie in base64 + media_type um.
// Anthropic-Vision akzeptiert entweder URL-Source oder base64-Source.
// URL-Source fuehrt regelmaessig zu HTTP 400 wenn Supabase-Storage-URLs
// nicht zuverlaessig fuer Anthropic erreichbar sind — daher base64 als
// stabile Default-Strategie.
export const ANTHROPIC_VISION_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"] as const;
export type AnthropicMediaType = (typeof ANTHROPIC_VISION_MEDIA)[number];

async function fetchImageAsBase64(url: string): Promise<
  | { ok: true; data: string; mediaType: AnthropicMediaType }
  | { ok: false; error: string }
> {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(15_000) });
    if (!r.ok) return { ok: false, error: `HTTP ${r.status} beim Bild-Download` };
    const contentType = (r.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    let mediaType: AnthropicMediaType | null =
      (ANTHROPIC_VISION_MEDIA as readonly string[]).includes(contentType)
        ? (contentType as AnthropicMediaType)
        : null;
    if (!mediaType) {
      // Fallback: aus Dateiendung herleiten
      const ext = url.split("?")[0].split("#")[0].split(".").pop()?.toLowerCase();
      const map: Record<string, AnthropicMediaType> = {
        jpg: "image/jpeg",
        jpeg: "image/jpeg",
        png: "image/png",
        gif: "image/gif",
        webp: "image/webp",
      };
      if (ext && map[ext]) mediaType = map[ext];
    }
    if (!mediaType) return { ok: false, error: `Unbekannter Bild-Typ (content-type=${contentType})` };

    const buf = await r.arrayBuffer();
    const sizeMb = buf.byteLength / 1024 / 1024;
    if (sizeMb > 5) return { ok: false, error: `Bild zu gross (${sizeMb.toFixed(1)} MB > 5 MB)` };

    const base64 = Buffer.from(buf).toString("base64");
    return { ok: true, data: base64, mediaType };
  } catch (e) {
    const isAbort = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    const msg = isAbort ? "Bild-Download Timeout nach 15s" : e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

// Vision-Variante · laedt Bilder serverseitig (URL) oder akzeptiert
// bereits-base64-encoded Bilder direkt (z.B. aus Supabase-Storage-Download).
// Nutzt das gleiche Pricing und Token-Tracking wie claudeAnalyze.
export async function claudeAnalyzeVision(args: {
  systemPrompt: string;
  text: string;
  /** Public HTTPS URLs — werden serverseitig geladen + zu base64 konvertiert. */
  imageUrls?: string[];
  /** Bereits-base64-encoded Bilder. Bevorzugt vor imageUrls bei private Buckets. */
  images?: Array<{ data: string; mediaType: AnthropicMediaType }>;
  maxTokens?: number;
  model?: string;
}): Promise<ClaudeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = args.model || DEFAULT_MODEL;
  if (!key) {
    return { ok: false, text: "", cost_usd: 0, in_tokens: 0, out_tokens: 0, model, error: "ANTHROPIC_API_KEY fehlt" };
  }

  const imageBlocks: Array<{
    type: "image";
    source: { type: "base64"; media_type: AnthropicMediaType; data: string };
  }> = [];

  // 1) Direkte base64-Inputs (z.B. aus Supabase-Storage-Download)
  for (const img of (args.images ?? []).slice(0, 5)) {
    imageBlocks.push({
      type: "image",
      source: { type: "base64", media_type: img.mediaType, data: img.data },
    });
  }

  // 2) Public-URLs serverseitig laden + zu base64 konvertieren
  const urlBudget = Math.max(0, 5 - imageBlocks.length);
  for (const url of (args.imageUrls ?? []).slice(0, urlBudget)) {
    const conv = await fetchImageAsBase64(url);
    if (!conv.ok) {
      return {
        ok: false,
        text: "",
        cost_usd: 0,
        in_tokens: 0,
        out_tokens: 0,
        model,
        error: `Bild konnte nicht geladen werden: ${conv.error}`,
      };
    }
    imageBlocks.push({
      type: "image",
      source: { type: "base64", media_type: conv.mediaType, data: conv.data },
    });
  }

  if (imageBlocks.length === 0) {
    return { ok: false, text: "", cost_usd: 0, in_tokens: 0, out_tokens: 0, model, error: "Kein Bild uebergeben." };
  }

  const body = {
    model,
    max_tokens: args.maxTokens ?? 3000,
    system: args.systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          { type: "text", text: args.text },
        ],
      },
    ],
  };

  try {
    // AbortSignal sorgt dafuer dass wir nie laenger als ANTHROPIC_TIMEOUT_MS
    // auf Anthropic warten — sonst wuerde Vercel die Function killen ohne
    // dass unser try/catch greift.
    const r = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ANTHROPIC_TIMEOUT_MS),
    });
    if (!r.ok) {
      const txt = await r.text();
      return { ok: false, text: "", cost_usd: 0, in_tokens: 0, out_tokens: 0, model, error: `HTTP ${r.status}: ${txt.slice(0, 300)}` };
    }
    const res = (await r.json()) as {
      content: Array<{ text?: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = res.content?.[0]?.text || "";
    const inTok = res.usage?.input_tokens ?? 0;
    const outTok = res.usage?.output_tokens ?? 0;
    const p = PRICING[model] ?? PRICING["claude-sonnet-4-6"];
    const cost = (inTok * p.in + outTok * p.out) / 1_000_000;
    return { ok: true, text, cost_usd: cost, in_tokens: inTok, out_tokens: outTok, model };
  } catch (e) {
    const isAbort = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    const msg = isAbort
      ? `Anthropic-Timeout nach ${Math.round(ANTHROPIC_TIMEOUT_MS / 1000)}s`
      : (e instanceof Error ? e.message : String(e));
    return { ok: false, text: "", cost_usd: 0, in_tokens: 0, out_tokens: 0, model, error: msg };
  }
}

export async function claudeAnalyze(args: {
  systemPrompt: string;
  userPrompt: string;
  maxTokens?: number;
  model?: string;
}): Promise<ClaudeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = args.model || DEFAULT_MODEL;
  if (!key) {
    return {
      ok: false,
      text: "",
      cost_usd: 0,
      in_tokens: 0,
      out_tokens: 0,
      model,
      error: "ANTHROPIC_API_KEY fehlt",
    };
  }

  const body = {
    model,
    max_tokens: args.maxTokens ?? 4000,
    system: args.systemPrompt,
    messages: [{ role: "user", content: args.userPrompt }],
  };

  try {
    const r = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(ANTHROPIC_TIMEOUT_MS),
    });
    if (!r.ok) {
      const txt = await r.text();
      return {
        ok: false,
        text: "",
        cost_usd: 0,
        in_tokens: 0,
        out_tokens: 0,
        model,
        error: `HTTP ${r.status}: ${txt.slice(0, 300)}`,
      };
    }
    const res = (await r.json()) as {
      content: Array<{ text: string }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    const text = res.content?.[0]?.text || "";
    const inTok = res.usage?.input_tokens ?? 0;
    const outTok = res.usage?.output_tokens ?? 0;
    const p = PRICING[model] ?? PRICING["claude-sonnet-4-6"];
    const cost = (inTok * p.in + outTok * p.out) / 1_000_000;
    return {
      ok: true,
      text,
      cost_usd: cost,
      in_tokens: inTok,
      out_tokens: outTok,
      model,
    };
  } catch (e) {
    const isAbort = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
    const msg = isAbort
      ? `Anthropic-Timeout nach ${Math.round(ANTHROPIC_TIMEOUT_MS / 1000)}s`
      : (e instanceof Error ? e.message : String(e));
    return {
      ok: false,
      text: "",
      cost_usd: 0,
      in_tokens: 0,
      out_tokens: 0,
      model,
      error: msg,
    };
  }
}
