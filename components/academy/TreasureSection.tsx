// Schatztruhe-Section · TikTok LIVE Wissens-Modul
// Inhalte: Mechanik + Strategie + typische Fehler + FAQ
// Mobile-first, dunkler Premium-Style, klare Trennung
// TikTok-Fakt vs Agency-Erfahrungswert.

interface MechanicCard {
  icon: string;
  title: string;
  body: string;
  badge?: string;
}

const MECHANICS: MechanicCard[] = [
  {
    icon: "⏱️",
    title: "Timer-System",
    body: "Die Schatztruhe laeuft mit einem Countdown. Solange der laeuft, sammeln Zuschauer durch Interaktion Punkte und Drops.",
    badge: "Mechanik",
  },
  {
    icon: "🎁",
    title: "Drops",
    body: "Waehrend des Timers koennen kleine Coin-Belohnungen oder virtuelle Geschenke automatisch ausgespielt werden. Zuschauer fuehlen sich belohnt fuer's Dabeibleiben.",
    badge: "Belohnung",
  },
  {
    icon: "🪙",
    title: "Coins / Rewards",
    body: "Die Belohnungen sind virtuell und an das TikTok-Coin-System gekoppelt. Sie ersetzen keine Auszahlung — sie binden Aufmerksamkeit.",
    badge: "Coin-Layer",
  },
  {
    icon: "👀",
    title: "Watchtime-Boost",
    body: "Wer mitmacht, bleibt waehrend des Countdowns aktiv im LIVE. Das druckt direkt deine Watchtime + Average-Viewer-Duration hoch.",
    badge: "Erfahrungswert",
  },
  {
    icon: "💬",
    title: "Engagement-System",
    body: "Zuschauer interagieren waehrend der Truhe (Kommentar, Tap, Aktion). Engagement-Rate steigt – Algorithmus liest das als 'starker LIVE'.",
    badge: "Erfahrungswert",
  },
  {
    icon: "🚪",
    title: "Teilnahmebedingungen",
    body: "Feature variiert je nach Region, Account-Stufe und TikTok-Update. Falls bei dir nicht freigeschaltet: Backstage/Support kontaktieren.",
    badge: "TikTok-abhaengig",
  },
];

interface StrategyPoint {
  title: string;
  body: string;
}

const STRATEGY: StrategyPoint[] = [
  {
    title: "Truhe gegen Stream-Drops setzen",
    body: "Wenn Watchtime im Mittelteil abflacht, hilft eine Truhe sofort. Ankuendigung 30-60 Sek vorher, dann starten — bringt Lurker zurueck in Aktion.",
  },
  {
    title: "Ankuendigen statt ueberraschen",
    body: "Sag im Voraus 'in 5 Minuten Truhe' — gibt Zuschauern einen Grund zu bleiben. Ueberraschungs-Truhe verschenkt diesen Effekt.",
  },
  {
    title: "Mit Battle/Match kombinieren",
    body: "Truhe waehrend Match-Pause = Zuschauer bleiben, statt zu zappen. Sehr effektiv im Match-Cool-down.",
  },
  {
    title: "Mods aktivieren",
    body: "Mods sollen Truhe ankuendigen, Stamm-Zuschauer ranholen, neue User abholen. Ohne Mods bleibt Effekt unter Potential.",
  },
];

interface Mistake {
  title: string;
  body: string;
}

const MISTAKES: Mistake[] = [
  {
    title: "Zu frueh starten",
    body: "Truhe in Min. 1-3 verpufft. Erst stabilisieren (Begruessungen, Rhythmus), dann Truhe als Push-Move.",
  },
  {
    title: "Zu oft hintereinander",
    body: "Mehrere Truhen in kurzer Folge wirken billig. Sparen, dann gezielt einsetzen.",
  },
  {
    title: "Stumm waehrend Countdown",
    body: "Truhe laeuft, du redest nicht — Zuschauer dropen. Waehrend des Timers staendig kommentieren, ueber Drops reagieren, Stimmung halten.",
  },
  {
    title: "Kein Follow-up nach Truhe",
    body: "Truhe endet, Stille kommt. Direkt Anschluss-Thema vorbereitet haben, sonst killt der Drop deinen Reach.",
  },
];

interface FaqItem {
  q: string;
  a: string;
}

const FAQ: FaqItem[] = [
  {
    q: "Kostet das mich als Creator etwas?",
    a: "Nein. Die Truhe ist ein TikTok-Mechanik, die Drops kommen aus TikTok's System, nicht aus deinem Konto.",
  },
  {
    q: "Wie oft pro Stream sinnvoll?",
    a: "Erfahrung: 1-3 mal pro 60-90-Min-Stream. Sparen, dann gezielt setzen — nicht durchballern.",
  },
  {
    q: "Wann ist der beste Moment?",
    a: "Wenn die Live-Viewer-Linie abflacht. Truhe pushed sie wieder hoch — und bringt sie tendenziell drueber, wenn Engagement passt.",
  },
  {
    q: "Was wenn meine Truhe nicht freigeschaltet ist?",
    a: "Feature haengt an TikTok-Region + Account-Status. Sprich Backstage/Support an, wenn du sie nicht siehst.",
  },
  {
    q: "Truhe oder Geschenk-Push: was bringt mehr?",
    a: "Beides erfuellt unterschiedliche Funktionen. Truhe = Watchtime + Engagement. Geschenk-Push = Diamonds. Kombination ist staerker als Einzeleinsatz.",
  },
];

export function TreasureSection() {
  return (
    <section className="space-y-10 md:space-y-12">
      {/* HERO */}
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-7xl md:text-8xl mb-4 leading-none select-none">🎁</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Mechanik</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            Die <span className="text-champagne">Schatztruhe</span>.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl mb-4">
            Ein Interaktions-Tool im LIVE, das Watchtime + Zuschauerbindung
            spuerbar pusht — wenn du es zur richtigen Zeit einsetzt.
          </p>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 border border-champagne/40 bg-champagne/5">
            <span className="text-champagne text-[10px] uppercase tracking-[0.25em]">
              Effekt
            </span>
            <span className="text-cream/85 text-sm">
              Watchtime + Engagement steigen massiv
            </span>
          </div>
        </div>
      </div>

      {/* MINI-FLOW · So funktioniert es */}
      <div>
        <p className="eyebrow mb-4">So funktioniert es</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          <FlowStep
            n={1}
            title="Truhe starten"
            body="Du triggerst die Schatztruhe ueber das LIVE-Menue. Countdown beginnt."
          />
          <FlowStep
            n={2}
            title="Interagieren lassen"
            body="Zuschauer tippen/kommentieren waehrend des Timers. Drops werden ausgespielt."
          />
          <FlowStep
            n={3}
            title="Effekt einsacken"
            body="Watchtime + Engagement steigen. Du schliesst mit einem klaren Anschluss-Thema."
          />
        </div>
      </div>

      {/* MECHANIK-KARTEN */}
      <div>
        <p className="eyebrow mb-4">Wie sie wirklich funktioniert</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {MECHANICS.map((m) => (
            <article
              key={m.title}
              className="border border-champagne/20 hover:border-champagne/40 transition-colors p-5 flex flex-col"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="text-3xl leading-none">{m.icon}</span>
                {m.badge && (
                  <span className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] border border-champagne/30 text-champagne/80">
                    {m.badge}
                  </span>
                )}
              </div>
              <h3 className="font-display italic text-cream text-lg leading-tight mb-2">
                {m.title}
              </h3>
              <p className="text-cream/65 text-sm leading-relaxed">{m.body}</p>
            </article>
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

      {/* FEHLER */}
      <div>
        <p className="eyebrow mb-4 text-red-400/90">Fehler die Creator machen</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MISTAKES.map((m) => (
            <article
              key={m.title}
              className="border border-red-400/30 bg-red-400/5 p-5"
            >
              <p className="text-cream font-medium text-base mb-1.5">
                {m.title}
              </p>
              <p className="text-cream/70 text-sm leading-relaxed">{m.body}</p>
            </article>
          ))}
        </div>
      </div>

      {/* WARUM TIKTOK */}
      <div className="border border-champagne/15 p-5 md:p-6 bg-champagne/[0.02]">
        <p className="eyebrow mb-3">Warum TikTok das nutzt</p>
        <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-2">
          Schatztruhen halten Zuschauer im LIVE — ohne dass die Plattform
          eigene Coins ausgeben muss. Hohe Watchtime = mehr Werbe-Inventar
          = mehr Umsatz. Fuer dich heisst es: ein Tool, das deinen Algorithmus-
          Score direkt aufwertet.
        </p>
        <p className="text-cream/45 text-xs italic">
          Erfahrungswert aus Agency-Praxis · keine offizielle TikTok-Aussage.
        </p>
      </div>

      {/* FAQ */}
      <div>
        <p className="eyebrow mb-4">FAQ</p>
        <div className="space-y-2">
          {FAQ.map((f, i) => (
            <details
              key={i}
              className="group border border-champagne/15 hover:border-champagne/30 transition-colors"
            >
              <summary className="cursor-pointer list-none p-4 md:p-5 flex items-start gap-3">
                <span className="text-champagne font-display italic text-lg leading-none mt-0.5">
                  +
                </span>
                <span className="flex-1 text-cream text-sm md:text-base">
                  {f.q}
                </span>
              </summary>
              <div className="px-4 md:px-5 pb-4 md:pb-5 pt-0 -mt-1 ml-7 md:ml-8">
                <p className="text-cream/65 text-sm leading-relaxed">{f.a}</p>
              </div>
            </details>
          ))}
        </div>
      </div>

      {/* DISCLAIMER FOOTER */}
      <div className="border-t border-champagne/10 pt-5">
        <p className="text-cream/40 text-xs leading-relaxed">
          Sicheres Faktum: das Feature existiert in TikTok LIVE und triggert
          Zuschauer-Interaktion + Drops. Alles zur Frequenz, Timing-Wirkung,
          Algorithmus-Hebel: ZOE-Erfahrungswerte aus echten Streams. TikTok
          kommuniziert die Detail-Mechanik nicht offiziell.
        </p>
      </div>
    </section>
  );
}

function FlowStep({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <article className="border border-champagne/20 p-5 relative">
      <div className="absolute -top-3 left-4 px-2 py-0.5 bg-ink border border-champagne text-champagne font-display italic text-sm">
        Schritt {n}
      </div>
      <p className="text-cream font-medium text-base mt-3 mb-2">{title}</p>
      <p className="text-cream/60 text-sm leading-relaxed">{body}</p>
    </article>
  );
}
