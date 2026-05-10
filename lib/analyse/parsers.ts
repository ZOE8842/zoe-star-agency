// V2 Worker · Extrahiert das JSON-Result aus dem Claude-Text-Report.
// Claude schreibt: <<<ZOE_RESULT>>>{ ... }<<<END>>>
// Parser sucht den Block, parsed JSON, gibt strukturierte Daten zurueck.

const START = "<<<ZOE_RESULT>>>";
const END = "<<<END>>>";

export interface AccountResultJson {
  scores?: Record<string, number>;
  summary?: Record<string, string>;
  recommendations?: Array<{ title?: string; body?: string }>;
  image_suggestions?: Array<{ url?: string; note?: string }>;
}

export interface LiveResultJson {
  kpi?: Record<string, number | string>;
  summary?: Record<string, string>;
  recommendations?: Array<{ title?: string; body?: string }>;
  weekly_plan?: Array<{ day?: string; slot?: string; focus?: string; note?: string }>;
}

function extractJsonBlock(text: string): string | null {
  const s = text.indexOf(START);
  if (s < 0) return null;
  const e = text.indexOf(END, s + START.length);
  if (e < 0) return null;
  return text.slice(s + START.length, e).trim();
}

function tryParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // Versuch: Trailing-Komma-Fix (Claude macht das gerne)
    const fixed = raw
      .replace(/,(\s*[\]}])/g, "$1")
      .replace(/^[^{[]*/, "")
      .replace(/[^}\]]*$/, "");
    try {
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}

export function parseAccountResult(text: string): AccountResultJson | null {
  const block = extractJsonBlock(text);
  if (!block) return null;
  return tryParse<AccountResultJson>(block);
}

export function parseLiveResult(text: string): LiveResultJson | null {
  const block = extractJsonBlock(text);
  if (!block) return null;
  return tryParse<LiveResultJson>(block);
}
