// Portal-Section · TikTok LIVE
// Eigenes Thema · NICHT mit Schatztruhe vermischen.

interface FactCard {
  icon: string;
  title: string;
  body: string;
  badge?: string;
}

const MECHANIK: FactCard[] = [
  {
    icon: "🌀",
    title: "Was ist ein Portal?",
    body: "Eine bezahlte LIVE-Aktion, die zusaetzliche Zuschauer in dein LIVE bringt und parallel automatisch eine Schatztruhe sendet.",
    badge: "Boost",
  },
  {
    icon: "🚪",
    title: "Zuschauer-Pull",
    body: "TikTok zieht waehrend des Countdowns neue Zuschauer aus angrenzenden LIVEs in dein LIVE.",
    badge: "Push-In",
  },
  {
    icon: "🎁",
    title: "Portal + Schatztruhe gekoppelt",
    body: "Mit jedem Portal startet automatisch eine Schatztruhe — die neuen Zuschauer kommen mit Sammel-Anreiz rein.",
    badge: "Bundle",
  },
  {
    icon: "⏱️",
    title: "5-Minuten-Countdown",
    body: "Portal-Phase dauert genau 5 Minuten. In dieser Zeit landen Zuschauer in deinem LIVE.",
    badge: "5 min",
  },
];

const PRICING: { reach: string; coins: string }[] = [
  { reach: "500 Zuschauer erreichen", coins: "200 Muenzen" },
  { reach: "2.500 Zuschauer erreichen", coins: "1.000 Muenzen" },
];

const RULES: FactCard[] = [
  {
    icon: "📜",
    title: "Sendungsverlauf",
    body: "Jedes Portal wird in deinem LIVE-Protokoll mit Datum, Kosten und Reichweite erfasst.",
    badge: "Verlauf",
  },
  {
    icon: "🔒",
    title: "Nicht rueckgaengig",
    body: "Sobald ein Portal gestartet ist, kann es nicht abgebrochen werden. Plane den Zeitpunkt vorher.",
    badge: "One-Shot",
  },
  {
    icon: "↩️",
    title: "Schatztruhen-Refund",
    body: "Nicht eingesammelte Schatztruhen-Muenzen gehen zurueck — wie bei einer normalen Schatztruhe.",
    badge: "Refund",
  },
  {
    icon: "💳",
    title: "Portal-Muenzen NICHT erstattet",
    body: "Die Muenzen fuer die Zuschauer-Einladung selbst werden nicht zurueckgegeben · Ausnahme: technischer Fehler von TikTok.",
    badge: "Final",
  },
];

const STRATEGY: { title: string; body: string }[] = [
  {
    title: "Portal in starkem LIVE einsetzen",
    body: "Portal zieht neue Zuschauer rein — wenn dein LIVE schon stabil laeuft, halten sie laenger. In schwachen Phasen verpufft der Effekt.",
  },
  {
    title: "Vor Battle / Match setzen",
    body: "Portal direkt vor einem starken Moment (Match-Start, Reveal, Highlight) ist der Hebel · neue Zuschauer landen sofort in einer attraktiven Szene.",
  },
  {
    title: "Mods briefen vor Portal-Start",
    body: "Wenn 100+ neue Zuschauer einkommen, brauchen Mods Welcome-Script + Begruessungs-Rhythmus. Sonst kippt die Stimmung.",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Wie viel kostet ein Portal?",
    a: "Je nach Reichweiten-Ziel · Beispiele: 500 Zuschauer = 200 Muenzen, 2.500 Zuschauer = 1.000 Muenzen. TikTok zeigt dir vor dem Start die exakten Kosten.",
  },
  {
    q: "Bleiben die neuen Zuschauer?",
    a: "Erfahrungswert: ein Teil bleibt langfristig, der Rest dropt nach 1-3 Minuten. Entscheidend ist was waehrend des Portals im LIVE passiert.",
  },
  {
    q: "Kann ich mehrere Portals hintereinander starten?",
    a: "Technisch ja — aber pro Stream nur 1-2 sinnvoll. Mehr als das verbrennt Muenzen ohne kontinuierlichen Effekt.",
  },
  {
    q: "Was zaehlt als 'technischer Fehler' fuer Refund?",
    a: "Wenn TikTok das Portal nicht ausspielt oder es abbricht ohne dein Zutun. In dem Fall werden die Portal-Muenzen zurueckerstattet.",
  },
];

export function PortalSection() {
  return (
    <section className="space-y-10 md:space-y-12">
      {/* HERO */}
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-7xl md:text-8xl mb-4 leading-none select-none">🌀</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Reichweiten-Tool</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            Das <span className="text-champagne">Portal</span>.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl">
            Bezahlte LIVE-Aktion · zieht Zuschauer aus angrenzenden LIVEs in dein LIVE.
            Wird mit einer Schatztruhe gekoppelt, damit Neuzuschauer einen Sammel-Anreiz haben.
          </p>
        </div>
      </div>

      {/* MECHANIK */}
      <div>
        <p className="eyebrow mb-4">Mechanik</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {MECHANIK.map((m) => (
            <Card key={m.title} f={m} />
          ))}
        </div>
      </div>

      {/* PRICING-BEISPIELE */}
      <div>
        <p className="eyebrow mb-4">Preis-Beispiele</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {PRICING.map((p) => (
            <article key={p.reach} className="border border-champagne/25 bg-champagne/[0.04] p-5 md:p-6">
              <p className="text-cream/60 text-sm md:text-base mb-2">{p.reach}</p>
              <p className="font-display italic font-black text-champagne text-3xl md:text-4xl leading-none">
                {p.coins}
              </p>
            </article>
          ))}
        </div>
        <p className="text-cream/45 text-xs italic mt-3">
          TikTok zeigt dir vor dem Start die exakten Kosten · Werte koennen je nach Region variieren.
        </p>
      </div>

      {/* REGELN */}
      <div>
        <p className="eyebrow mb-4">Regeln</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {RULES.map((r) => (
            <Card key={r.title} f={r} />
          ))}
        </div>
      </div>

      {/* STRATEGIE */}
      <div className="border-l-2 border-champagne pl-5 md:pl-6">
        <p className="eyebrow mb-4 text-champagne">Strategie · richtig einsetzen</p>
        <div className="space-y-4">
          {STRATEGY.map((s) => (
            <div key={s.title}>
              <p className="text-cream font-medium text-base mb-1">{s.title}</p>
              <p className="text-cream/65 text-sm leading-relaxed">{s.body}</p>
            </div>
          ))}
        </div>
      </div>

      {/* FAQ */}
      <div>
        <p className="eyebrow mb-4">FAQ</p>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <details key={i} className="group border border-champagne/15 hover:border-champagne/30 transition-colors">
              <summary className="cursor-pointer list-none p-4 md:p-5 flex items-start gap-3">
                <span className="text-champagne font-display italic text-lg leading-none mt-0.5">+</span>
                <span className="flex-1 text-cream text-sm md:text-base">{f.q}</span>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 -mt-1 ml-7 md:ml-8">
                <p className="text-cream/65 text-sm leading-relaxed">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      <div className="border-t border-champagne/10 pt-5">
        <p className="text-cream/40 text-xs leading-relaxed">
          Pricing, Refund-Logik und Reichweiten-Tiers sind TikTok-Mechanik · Werte koennen
          je nach Region und Update variieren.
        </p>
      </div>
    </section>
  );
}

function Card({ f }: { f: FactCard }) {
  return (
    <article className="border border-champagne/20 hover:border-champagne/40 transition-colors p-5">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-3xl leading-none">{f.icon}</span>
        {f.badge && (
          <span className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] border border-champagne/30 text-champagne/80">
            {f.badge}
          </span>
        )}
      </div>
      <h3 className="font-display italic text-cream text-lg leading-tight mb-2">{f.title}</h3>
      <p className="text-cream/65 text-sm leading-relaxed">{f.body}</p>
    </article>
  );
}
