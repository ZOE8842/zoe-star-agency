// Geschenke-FAQ · separate Unterseite unter TikTok LIVE → Geschenke im LIVE
// NICHT mit Listen / Schatztruhe / Portal mischen.

interface FaqBlock {
  q: string;
  a: string | string[];
}

const FAQS: FaqBlock[] = [
  {
    q: "Was sind Geschenke?",
    a: [
      "Virtuelle Gegenstaende, die Zuschauer waehrend eines LIVEs oder unter Videos senden koennen.",
      "Sie unterstuetzen Creator, zeigen Aufmerksamkeit, loesen Reaktionen aus, pushen Rankings, entscheiden Battles und machen LIVEs sichtbarer.",
      "Einige Geschenke haben Spezialeffekte, die alle Zuschauer im LIVE sehen.",
    ],
  },
  {
    q: "Wie viel kosten Geschenke?",
    a: [
      "Vor dem Senden zeigt TikTok immer den Muenzpreis an.",
      "Der echte Euro-Preis haengt vom gekauften Muenzpaket ab.",
      "Berechnung: Preis des Pakets ÷ Muenzanzahl × Geschenkpreis.",
    ],
  },
  {
    q: "Wie sendet man Geschenke im LIVE?",
    a: [
      "1. Auf 'Geschenk' tippen.",
      "2. Geschenk auswaehlen.",
      "3. Auf 'Senden' tippen.",
      "Voraussetzung: 18+ (in manchen Laendern 19 oder 20), Muenzguthaben verfuegbar.",
    ],
  },
  {
    q: "Wie sendet man Geschenke unter Videos?",
    a: [
      "1. Kommentarsymbol oeffnen.",
      "2. Geschenksymbol oeffnen.",
      "3. Geschenk auswaehlen.",
      "4. Auf 'Senden' tippen.",
    ],
  },
  {
    q: "Wie laedt man Muenzen waehrend eines LIVE?",
    a: [
      "1. Geschenk oeffnen.",
      "2. 'Aufladen' tippen.",
      "3. Muenzpaket auswaehlen.",
    ],
  },
  {
    q: "Wie laedt man Muenzen ohne LIVE?",
    a: [
      "1. Profil oeffnen.",
      "2. Drei Linien oben rechts.",
      "3. Einstellungen und Datenschutz.",
      "4. Guthaben.",
      "5. Aufladen.",
      "6. Paket auswaehlen.",
    ],
  },
  {
    q: "Wo findet man gesendete Geschenke?",
    a: [
      "1. Profil oeffnen.",
      "2. Drei Linien oben rechts.",
      "3. Einstellungen und Datenschutz.",
      "4. Guthaben.",
      "5. Aufladen.",
      "6. 'Verlauf' oeffnen.",
      "7. 'Alle Arten' waehlen.",
      "8. 'Geschenke gesendet' oeffnen.",
    ],
  },
];

export function GiftFaqSection() {
  return (
    <section className="space-y-8 md:space-y-10">
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-champagne/12 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-6xl md:text-7xl mb-4 leading-none select-none">❓</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Geschenke</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            Geschenke <span className="text-champagne">FAQ</span>.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl">
            Schnellantworten zu Muenzen, Preisen und Versand — fuer Zuschauer + Creator gleichermassen relevant.
          </p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4">7 haeufige Fragen</p>
        <div className="space-y-2">
          {FAQS.map((f, i) => (
            <details
              key={i}
              className="group border border-champagne/15 hover:border-champagne/30 transition-colors"
            >
              <summary className="cursor-pointer list-none p-4 md:p-5 flex items-start gap-3">
                <span className="text-champagne font-display italic text-lg leading-none mt-0.5">+</span>
                <span className="flex-1 text-cream text-sm md:text-base">{f.q}</span>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 -mt-1 ml-7 md:ml-8 space-y-2">
                {Array.isArray(f.a) ? (
                  f.a.map((line, j) => (
                    <p key={j} className="text-cream/65 text-sm leading-relaxed">{line}</p>
                  ))
                ) : (
                  <p className="text-cream/65 text-sm leading-relaxed">{f.a}</p>
                )}
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="border-t border-champagne/10 pt-5">
        <p className="text-cream/40 text-xs leading-relaxed">
          TikTok aendert UI-Pfade regelmaessig. Wenn ein Menupunkt anders heisst: Begriffe sinngemaess in der App suchen.
        </p>
      </div>
    </section>
  );
}
