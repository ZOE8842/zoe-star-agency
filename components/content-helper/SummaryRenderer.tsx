// Strukturierter Renderer fuer Content-Helper-Analyse-Texte.
// Anthropic-Output folgt einem festen Format (siehe content-prompts.ts):
//   1) STIMMUNG · ...
//   2) STAERKEN · ...
//   3) SCHWAECHEN · ...
//   4) FIX-ANWEISUNGEN · ...
//   5) HOOK-SCORE · ...
//   ```json {...} ```
// Dieser Renderer parst die Sektionen und rendert sie als eigene UI-Bloecke
// mit eyebrow + Body. Listen (- / * / •) werden zu <ul>. Fallback: ganzer
// Text als whitespace-pre-wrap.

const TITLE_MAP: Record<string, string> = {
  "STIMMUNG": "Stimmung",
  "STAERKEN": "Staerken",
  "STÄRKEN": "Staerken",
  "SCHWAECHEN": "Schwaechen",
  "SCHWÄCHEN": "Schwaechen",
  "FIX-ANWEISUNGEN": "Fix-Anweisungen",
  "FIXES": "Fixes",
  "HOOK-SCORE": "Hook-Score",
  "EMPFEHLUNGEN": "Empfehlungen",
};

interface SectionBlock {
  title: string;
  body: string;
}

function stripJsonArtifacts(raw: string): string {
  let s = raw;
  // 1) Vollstaendige Triple-Backtick-Bloecke (json oder generic)
  s = s.replace(/```json[\s\S]*?```/gi, "");
  s = s.replace(/```[\s\S]*?```/g, "");
  // 2) Unvollstaendige Triple-Backticks am Ende (oeffnender Block ohne Close)
  s = s.replace(/```json[\s\S]*$/i, "");
  s = s.replace(/```[\s\S]*$/g, "");
  // 3) Raw-JSON am Ende der Antwort (Object oder Array) — z.B. wenn LLM
  //    den Markdown-Fence weggelassen hat. Hueristik: ab der letzten
  //    eigenstaendigen Zeile, die mit { oder [ beginnt, bis Ende abschneiden.
  const trailJson = s.match(/\n\s*[{[][\s\S]*$/);
  if (trailJson) {
    const candidate = trailJson[0].trim();
    // Nur wenn parsebar — sonst Original behalten
    try {
      JSON.parse(candidate);
      s = s.slice(0, trailJson.index);
    } catch {
      // nicht json → ignorieren
    }
  }
  // 4) Escaped Markdown-Artefakte
  s = s.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  return s.trim();
}

function parseSections(text: string): SectionBlock[] {
  const cleaned = stripJsonArtifacts(text);

  // Match: "1) STIMMUNG · ..." bis zum naechsten "N) " oder Ende
  const re = /^\s*(\d+)\)\s+([A-ZÄÖÜa-zäöü-]+)\s*[·:]?\s*([\s\S]*?)(?=^\s*\d+\)\s+|$)/gm;
  const sections: SectionBlock[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(cleaned)) !== null) {
    const rawTitle = m[2].trim().toUpperCase();
    const mapped = TITLE_MAP[rawTitle] || rawTitle.toLowerCase().replace(/^./, (c) => c.toUpperCase());
    sections.push({ title: mapped, body: m[3].trim() });
  }
  return sections;
}

function SectionBody({ text }: { text: string }) {
  const paragraphs = text.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="space-y-3">
      {paragraphs.map((p, i) => {
        const lines = p.split(/\n/).map((l) => l.trim()).filter(Boolean);
        const isList = lines.length > 1 && lines.every((l) => /^[-*•]\s+/.test(l));
        if (isList) {
          return (
            <ul key={i} className="space-y-2">
              {lines.map((line, j) => (
                <li
                  key={j}
                  className="text-cream/85 text-sm md:text-base leading-relaxed pl-4 border-l border-champagne/30"
                >
                  {line.replace(/^[-*•]\s+/, "")}
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p
            key={i}
            className="text-cream/85 text-sm md:text-base leading-relaxed whitespace-pre-wrap"
          >
            {p}
          </p>
        );
      })}
    </div>
  );
}

export function SummaryRenderer({ summary }: { summary: Record<string, unknown> | null }) {
  if (!summary) return null;

  // Worker speichert standardmaessig { text: "..." } mit dem rohen
  // Anthropic-Output. Wenn das vorhanden ist, parsen + sektionieren.
  const text = typeof summary.text === "string" ? summary.text : null;

  if (text) {
    const sections = parseSections(text);
    if (sections.length === 0) {
      // Kein bekanntes Format → Fallback whitespace-pre-wrap (mit gleicher Bereinigung)
      const cleaned = stripJsonArtifacts(text);
      return (
        <p className="text-cream/85 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
          {cleaned}
        </p>
      );
    }
    return (
      <div className="space-y-6 md:space-y-8">
        {sections.map((s, i) => (
          <section key={i}>
            <p className="eyebrow text-champagne mb-3">{s.title}</p>
            <SectionBody text={s.body} />
          </section>
        ))}
      </div>
    );
  }

  // Fallback fuer alte key/value-Summaries (z.B. manueller Admin-Review
  // mit summary={ text: ..., note: ... }).
  const entries = Object.entries(summary).filter(([, v]) => v != null && v !== "");
  if (entries.length === 0) return null;
  return (
    <div className="space-y-4">
      {entries.map(([k, v]) => (
        <div key={k}>
          <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mb-1">{k}</p>
          <p className="text-cream/85 text-sm md:text-base leading-relaxed whitespace-pre-wrap">
            {String(v)}
          </p>
        </div>
      ))}
    </div>
  );
}
