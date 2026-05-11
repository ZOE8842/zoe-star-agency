// Schatztruhe-Section · TikTok LIVE
// Briefing-konforme harte Fakten · keine Vermischung mit Portal.

interface FactCard {
  icon: string;
  title: string;
  body: string;
  badge?: string;
}

const TYPES: FactCard[] = [
  {
    icon: "📦",
    title: "Standard-Schatztruhe",
    body: "Vorgefertigtes TikTok-Format mit Standardwerten fuer Muenzen + Countdown.",
    badge: "Default",
  },
  {
    icon: "🛠️",
    title: "Individuelle Schatztruhe",
    body: "Du legst Mindestmuenzen, Countdown und Auftritt selbst fest — innerhalb der TikTok-Limits.",
    badge: "Custom",
  },
];

const RULES: FactCard[] = [
  {
    icon: "⏱️",
    title: "Countdown 1-5 Minuten",
    body: "Du waehlst die Laufzeit zwischen 1 und 5 Minuten. Danach geht die Truhe in den Sammel-Modus.",
    badge: "1-5 min",
  },
  {
    icon: "🪙",
    title: "Max. 10.000 Muenzen pro Truhe",
    body: "Eine einzelne Schatztruhe kann mit hoechstens 10.000 Muenzen gefuellt werden.",
    badge: "≤ 10.000",
  },
  {
    icon: "📅",
    title: "Max. 20.000 Muenzen pro Tag",
    body: "Tageslimit fuer Schatztruhen-Befuellung pro Account · ueber alle Truhen hinweg.",
    badge: "≤ 20.000/d",
  },
  {
    icon: "🕙",
    title: "Truhe laeuft 10 Minuten",
    body: "Sobald der Countdown abgelaufen ist, koennen Zuschauer 10 Minuten lang einsammeln.",
    badge: "10 min Pool",
  },
  {
    icon: "↩️",
    title: "Rueckerstattung",
    body: "Muenzen die nicht innerhalb der 10 Minuten eingesammelt werden, gehen automatisch an den Sender zurueck.",
    badge: "Refund",
  },
  {
    icon: "📜",
    title: "Chronologische Anzeige",
    body: "Alle Truhen-Aktionen + Sammlungen werden in einem Protokoll zeitlich nachvollziehbar gefuehrt.",
    badge: "Verlauf",
  },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "Wer kann eine Schatztruhe befuellen?",
    a: "Zuschauer mit Muenzguthaben. Die Truhe wird gemeinsam mit anderen Sammlern aufgemacht.",
  },
  {
    q: "Was sind 'Sammler'?",
    a: "Zuschauer im LIVE die nach Ablauf des Countdowns einen Anteil aus der Truhe ziehen koennen — je nach Aktivitaet und Zufallsverteilung.",
  },
  {
    q: "Was passiert wenn keiner sammelt?",
    a: "Nicht eingesammelte Muenzen werden nach 10 Minuten an den urspruenglichen Sender zurueckerstattet.",
  },
  {
    q: "Kann ich pro Stream mehrere Truhen starten?",
    a: "Ja — solange das Tageslimit von 20.000 Muenzen Befuellung gesamt nicht ueberschritten wird.",
  },
  {
    q: "Wo sehe ich meinen Truhen-Verlauf?",
    a: "Im LIVE-Center → Schatztruhen-Protokoll · chronologische Auflistung aller Aktionen.",
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
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl">
            Interaktives LIVE-Tool: Zuschauer befuellen eine Truhe mit Muenzen,
            nach Countdown laeuft 10 Minuten Sammelzeit · nicht eingesammelte
            Muenzen gehen zurueck.
          </p>
        </div>
      </div>

      {/* TYPEN */}
      <div>
        <p className="eyebrow mb-4">Zwei Schatztruhen-Typen</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {TYPES.map((t) => (
            <Card key={t.title} f={t} />
          ))}
        </div>
      </div>

      {/* REGELN · HARTE LIMITS */}
      <div>
        <p className="eyebrow mb-4">Harte Regeln</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {RULES.map((r) => (
            <Card key={r.title} f={r} />
          ))}
        </div>
      </div>

      {/* SCHNELL-REFERENZ · KOMPAKT */}
      <div className="border-l-2 border-champagne pl-5 md:pl-6">
        <p className="eyebrow mb-4 text-champagne">Schnell-Referenz</p>
        <ul className="space-y-1.5 text-cream/75 text-sm md:text-base">
          <li>Countdown: <span className="text-champagne">1-5 Minuten</span></li>
          <li>Befuellung pro Truhe: <span className="text-champagne">max 10.000 Muenzen</span></li>
          <li>Befuellung pro Tag: <span className="text-champagne">max 20.000 Muenzen</span></li>
          <li>Sammel-Phase: <span className="text-champagne">10 Minuten</span></li>
          <li>Rueckerstattung: <span className="text-champagne">automatisch fuer nicht eingesammelte Muenzen</span></li>
          <li>Verlauf: <span className="text-champagne">chronologisch im LIVE-Protokoll</span></li>
        </ul>
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
          Limits, Refund-Logik und 10-Minuten-Sammelphase sind TikTok-Mechanik · Werte
          koennen je nach Region und Update variieren.
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
