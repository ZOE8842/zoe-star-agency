// Pfeil-Menue / Zuschauerfunktionen · Teilen, Co-Host, Werbung, Spielbelohnungen
// TikTok LIVE → Zuschauerfunktionen

interface FeatureBlock {
  icon: string;
  title: string;
  badge?: string;
  body: string;
  bullets?: string[];
}

const SHARING: FeatureBlock = {
  icon: "📤",
  title: "Teilen & Weiterleiten",
  body: "Pfeil unten rechts → Menue oeffnet sich. LIVE direkt teilen, in Story posten oder per Link weitergeben.",
  bullets: [
    "WhatsApp · Telegram · Instagram Direct · SMS · Snapchat · E-Mail",
    "Link kopieren · Status posten · Story posten · Erneut veroeffentlichen",
  ],
};

const STORY: FeatureBlock = {
  icon: "✨",
  title: "Zu Story hinzufuegen",
  body: "Mit 'Zu Story hinzufuegen' kommt das aktuelle LIVE in die eigene TikTok-Story. Follower sehen direkt, welches LIVE empfohlen wird.",
  bullets: [
    "Bringt zusaetzliche Zuschauer",
    "Mehr Reichweite fuer den Host",
    "Soft-Push ohne Werbe-Budget",
  ],
};

const COHOST: FeatureBlock = {
  icon: "🤝",
  title: "Co-Host vorschlagen",
  body: "Zuschauer empfehlen, mit welchem Creator der Host LIVE gehen soll. Bis zu 3 Vorschlaege pro LIVE. Host entscheidet selbst.",
  bullets: [
    "Vorschlagen via 'Vorschlagen'",
    "Voten via '+1'",
    "Anonym-Modus: Name + Profilbild werden versteckt",
  ],
};

const ADVERT: FeatureBlock = {
  icon: "🚀",
  title: "LIVE-Werbung (Werben)",
  badge: "Bezahlt",
  body: "Bezahlte TikTok-LIVE-Werbung. Nicht nur der Host — auch Zuschauer koennen Werbung fuer den Host starten.",
  bullets: [
    "Ziel: mehr LIVE-Zuschauer ODER mehr Follower",
    "Einstellbar: Budget · Dauer · Zielgruppe · LIVE oder Video",
    "TikTok zeigt Schaetzung: Zuschauer · Reichweite · Kosten",
    "Beispiel: 50€ / 1h Laufzeit · ~ 1 Muenze ≈ 0,01€",
  ],
};

const REWARDS: FeatureBlock = {
  icon: "🎯",
  title: "Spielbelohnungen",
  body: "TikTok-LIVE-Feature: Zuschauer erfuellen Aufgaben (Zeit schauen, kommentieren, aktiv folgen) und bekommen Belohnungen — meist Spielcodes oder In-Game-Items.",
  bullets: [
    "Aufgaben oft in fester Reihenfolge",
    "Belohnungen meist 1× pro Account",
    "Wiedergabezeit zaehlt pro Spiel — Spielwechsel kann Zeit zuruecksetzen",
    "Einfordern → Code → einloesen",
  ],
};

const FEATURES = [SHARING, STORY, COHOST, ADVERT, REWARDS];

const OTHER = [
  "Feedback",
  "Melden",
  "Kein Interesse",
  "Einstellungen",
  "Bildschirm aufraeumen",
  "Hintergrundwiedergabe",
  "Videoqualitaet",
  "Auf Computer ansehen",
];

export function FunktionenSection() {
  return (
    <section className="space-y-10 md:space-y-12">
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-7xl md:text-8xl mb-4 leading-none select-none">⤴️</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Pfeil-Menue</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            Zuschauer-<span className="text-champagne">Funktionen</span>.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl">
            Alles was sich oeffnet, wenn man im LIVE unten rechts auf den Pfeil drueckt. Teilen, Co-Host vorschlagen, Werbung schalten, Spielbelohnungen — Wachstumstools, nicht nur Features.
          </p>
        </div>
      </div>

      <div className="space-y-3 md:space-y-4">
        {FEATURES.map((f) => (
          <article key={f.title} className="border border-champagne/20 hover:border-champagne/40 transition-colors p-5 md:p-6">
            <div className="flex items-start gap-4 mb-3">
              <span className="text-4xl leading-none shrink-0">{f.icon}</span>
              <div className="flex-1">
                <div className="flex items-baseline justify-between gap-2 flex-wrap">
                  <h3 className="font-display italic text-cream text-xl leading-tight">{f.title}</h3>
                  {f.badge && (
                    <span className="shrink-0 px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] bg-champagne text-ink">
                      {f.badge}
                    </span>
                  )}
                </div>
                <p className="text-cream/70 text-sm md:text-base leading-relaxed mt-2">{f.body}</p>
              </div>
            </div>
            {f.bullets && (
              <ul className="ml-0 md:ml-14 space-y-1.5">
                {f.bullets.map((b) => (
                  <li key={b} className="text-cream/60 text-sm leading-relaxed flex gap-2">
                    <span className="text-champagne/60 shrink-0">·</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        ))}
      </div>

      <div className="border border-champagne/15 p-5 md:p-6 bg-champagne/[0.02]">
        <p className="eyebrow mb-3">Sonstige Optionen im Pfeil-Menue</p>
        <ul className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {OTHER.map((o) => (
            <li key={o} className="text-cream/65 text-sm">· {o}</li>
          ))}
        </ul>
      </div>

      <div className="border-l-2 border-champagne pl-5 md:pl-6">
        <p className="eyebrow mb-3 text-champagne">Strategische Sicht</p>
        <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-2">
          TikTok belohnt Interaktion, Shares, Watchtime und Aktivitaet im LIVE. Diese Funktionen sind keine reinen 'Features' — sie sind Wachstumshebel, die dein Algorithmus-Signal direkt aufwerten.
        </p>
        <p className="text-cream/55 text-sm leading-relaxed">
          Story-Share + Co-Host-Vorschlaege haben den besten Push-Effekt gemessen am Aufwand. LIVE-Werbung zuendet nur, wenn dein LIVE bereits sauber laeuft.
        </p>
      </div>
    </section>
  );
}
