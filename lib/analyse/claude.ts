// V2 Worker · Anthropic Claude-API Wrapper
// Port von opus_analyze() aus bot_zoeapp.py.

const ANTHROPIC_API = "https://api.anthropic.com/v1/messages";
const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-7";

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

// Vision-Variante · accepts ein Bild via Public-URL.
// Nutzt das gleiche Pricing und Token-Tracking wie claudeAnalyze.
export async function claudeAnalyzeVision(args: {
  systemPrompt: string;
  text: string;
  imageUrls: string[]; // public HTTPS URLs
  maxTokens?: number;
  model?: string;
}): Promise<ClaudeResult> {
  const key = process.env.ANTHROPIC_API_KEY;
  const model = args.model || DEFAULT_MODEL;
  if (!key) {
    return { ok: false, text: "", cost_usd: 0, in_tokens: 0, out_tokens: 0, model, error: "ANTHROPIC_API_KEY fehlt" };
  }

  const imageBlocks = args.imageUrls.slice(0, 5).map((url) => ({
    type: "image" as const,
    source: { type: "url" as const, url },
  }));

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
    const r = await fetch(ANTHROPIC_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(body),
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
    const p = PRICING[model] ?? PRICING["claude-opus-4-7"];
    const cost = (inTok * p.in + outTok * p.out) / 1_000_000;
    return { ok: true, text, cost_usd: cost, in_tokens: inTok, out_tokens: outTok, model };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
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
    const p = PRICING[model] ?? PRICING["claude-opus-4-7"];
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
    const msg = e instanceof Error ? e.message : String(e);
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
