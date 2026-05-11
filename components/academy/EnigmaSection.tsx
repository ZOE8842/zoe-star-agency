// Enigma · Premium-Anonym-Funktion fuer starke Supporter
// TikTok LIVE → Zuschauer & Supporter → Enigma

interface FeatureCard {
  icon: string;
  title: string;
  body: string;
  badge?: string;
}

const FEATURES: FeatureCard[] = [
  {
    icon: "🎭",
    title: "Maskiert bleiben",
    body: "Echter Name und Profil werden verborgen. Im LIVE erscheint stattdessen eine Maske + eine Enigma-ID (z.B. Enigma 81648).",
    badge: "Anonym",
  },
  {
    icon: "💬",
    title: "Maskierte Kommentare",
    body: "Bis zu 3 versteckte Kommentare pro Minute. Sichtbar nur fuer Creator, Moderatoren und andere Enigmen.",
    badge: "Limit 3/min",
  },
  {
    icon: "🃏",
    title: "Versteckte Matchpunkte",
    body: "Battle-Punkte bleiben bis zum Ende geheim. Spannung bis zur letzten Sekunde. In manchen EU-Matches deaktiviert.",
    badge: "Region-abhaengig",
  },
  {
    icon: "🆔",
    title: "Eigene Enigma-ID",
    body: "Enigma-Namen koennen individuell angepasst werden.",
    badge: "Personalisierbar",
  },
];

const CAN_DO = [
  "anonym im LIVE bleiben",
  "verdeckt kommentieren",
  "Geschenke anonym senden",
  "Matchpunkte verstecken",
  "individuelle Enigma-ID nutzen",
  "anonym Zuschauer bleiben",
];

const CANT_DO = [
  "Moderator werden",
  "mit Maske LIVE gehen",
  "neue Follower gewinnen",
  "Kamera als Gast aktivieren",
  "Spotlight-Zuschauerfunktionen nutzen",
  "Top-Kommentare senden",
];

const LIMITS = [
  "Fanclub-Ranglisten",
  "Super-Fan-Systeme",
  "Geschenkgalerien",
  "Kampagnen",
  "Kaeufe in Livestreams",
  "Schatztruhen-Gewinne",
  "Follow-Benachrichtigungen",
];

export function EnigmaSection() {
  return (
    <section className="space-y-10 md:space-y-12">
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-7xl md:text-8xl mb-4 leading-none select-none">🎭</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Premium-Anonym</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            <span className="text-champagne">Enigma</span>.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl mb-4">
            Premium-Funktion fuer starke Supporter und grosse Gifters. Zuschauer bleiben anonym, behalten aber volle Geschenk- und Match-Power.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="border border-champagne/20 p-5">
          <p className="eyebrow mb-3 text-champagne/85">Voraussetzung</p>
          <p className="text-cream text-lg font-display italic mb-2">Geschenk-Level 25+</p>
          <p className="text-cream/65 text-sm leading-relaxed">
            Erst ab Level 25 wird Enigma als kaufbare Funktion freigeschaltet.
          </p>
        </div>
        <div className="border border-champagne/20 p-5">
          <p className="eyebrow mb-3 text-champagne/85">Kosten · Beispiel</p>
          <p className="text-cream text-lg font-display italic mb-2">
            12.999 Muenzen / 7 Tage
          </p>
          <p className="text-cream/65 text-sm leading-relaxed">
            Wochen- oder Monatsabo. Preise + Aktionen variieren nach Region.
          </p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4">Hauptfunktionen</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {FEATURES.map((f) => (
            <article key={f.title} className="border border-champagne/20 hover:border-champagne/40 transition-colors p-5">
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
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="border border-champagne/25 bg-champagne/[0.04] p-5">
          <p className="eyebrow mb-3 text-champagne">Was Enigmen koennen</p>
          <ul className="space-y-2">
            {CAN_DO.map((item) => (
              <li key={item} className="text-cream/80 text-sm leading-relaxed flex gap-2">
                <span className="text-champagne shrink-0">✓</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="border border-red-400/30 bg-red-400/5 p-5">
          <p className="eyebrow mb-3 text-red-400/90">Was Enigmen NICHT koennen</p>
          <ul className="space-y-2">
            {CANT_DO.map((item) => (
              <li key={item} className="text-cream/80 text-sm leading-relaxed flex gap-2">
                <span className="text-red-400/80 shrink-0">×</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-l-2 border-champagne pl-5 md:pl-6">
        <p className="eyebrow mb-4 text-champagne">Identitaet kann sichtbar werden bei</p>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {LIMITS.map((item) => (
            <li key={item} className="text-cream/70 text-sm leading-relaxed">
              · {item}
            </li>
          ))}
        </ul>
        <p className="text-cream/45 text-xs italic mt-4">
          TikTok kann die echte Identitaet in genannten Bereichen offenlegen — Anonymitaet ist nicht absolut.
        </p>
      </div>

      <div className="border border-champagne/15 p-5 md:p-6 bg-champagne/[0.02]">
        <p className="eyebrow mb-3">Wichtig fuer Creator</p>
        <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-2">
          Enigmen sind oft die staerksten Supporter — Battle-Spieler, grosse Gifters, High-Level-Zuschauer. Erkennen kannst du sie an grossen Geschenken, geheimen Matchpunkten und anonymen Kommentaren.
        </p>
        <p className="text-cream/55 text-sm leading-relaxed">
          Lass Enigmen ihre Rolle spielen. Sie wollen anonym sein — keine Aufdeck-Versuche, kein Druck. Sie zaehlen trotzdem voll als Supporter.
        </p>
      </div>

      <div className="border-t border-champagne/10 pt-5">
        <p className="text-cream/40 text-xs leading-relaxed">
          Sicheres Faktum: Enigma existiert ab Level 25 mit Wochen-/Monatsabo. Detail-Mechanik, Preise und Regionen werden von TikTok variabel angepasst.
        </p>
      </div>
    </section>
  );
}
