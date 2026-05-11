// Komplette Funktionsuebersicht · TikTok LIVE System (Teil 1 + 2 zusammengefasst)
// 15 Themen als Quick-Index + strategische Kernerkenntnis am Ende

interface OverviewItem {
  n: number;
  icon: string;
  title: string;
  body: string;
  tabHint?: string; // Verweis auf andere Sektion
}

const ITEMS: OverviewItem[] = [
  { n: 1,  icon: "🎁", title: "Geschenke",            body: "Virtuelle Gegenstaende. Unterstuetzen Creator, triggern Reaktionen, entscheiden Battles.", tabHint: "live" },
  { n: 2,  icon: "🪙", title: "Muenzen",              body: "TikTok-Waehrung. Mit Echtgeld gekauft. Geschenkpreis = benoetigte Muenzen.", tabHint: "coins" },
  { n: 3,  icon: "🛡️", title: "Geschenksteuerung",   body: "Tageslimit, Warnungen bei 90/100%, Ausgaben-Kontrolle.", tabHint: "moderation" },
  { n: 4,  icon: "⭐", title: "Schenkenden-Level",    body: "XP pro Muenze → Level → mehr Sichtbarkeit und Status.", tabHint: "moderation" },
  { n: 5,  icon: "🎉", title: "Levelaufstiegsfeier",  body: "Host kann Nutzer erwaehnen, Glueckwunsch-Sticker erscheinen. Optional.", tabHint: "moderation" },
  { n: 6,  icon: "🤝", title: "Co-Host vorschlagen",  body: "Zuschauer empfehlen LIVE-Partner. Bis zu 3 Vorschlaege pro LIVE. Anonym moeglich.", tabHint: "funktionen" },
  { n: 7,  icon: "✨", title: "LIVE zur Story",        body: "LIVE in eigene Story posten. Bringt Follower direkt rein.", tabHint: "funktionen" },
  { n: 8,  icon: "🚀", title: "LIVE-Werbung",          body: "Bezahlter Push. Ziel: mehr Zuschauer oder mehr Follower. Auch Zuschauer koennen werben.", tabHint: "funktionen" },
  { n: 9,  icon: "🎯", title: "Spielbelohnungen",      body: "Aufgaben + Watchtime → Codes + In-Game-Items. Bindet Nutzer ans LIVE.", tabHint: "funktionen" },
  { n: 10, icon: "👮", title: "Moderator-System",     body: "Vom Host bestimmt. Eigene Symbole, eigene Rechte (muten, sperren, filtern).", tabHint: "moderation" },
  { n: 11, icon: "📋", title: "Moderationsliste",     body: "Eigene Mods verwalten, Zugriffe sehen, Mods entfernen.", tabHint: "moderation" },
  { n: 12, icon: "🤖", title: "KI-Match-Kommentare",  body: "Beta · Englisch. Creator aktiviert. TikTok: 'Genauigkeit nicht garantiert.'", tabHint: "moderation" },
  { n: 13, icon: "📱", title: "Bildschirmzeit",       body: "Taegliche Nutzungszeit + Wochenvergleich + Aktivitaetsdiagramm.", tabHint: "moderation" },
  { n: 14, icon: "📤", title: "Share/Teilen-Menue",   body: "WhatsApp, Telegram, IG-Direct, SMS, Story, Link, Werbung, Co-Host, Mod, Belohnungen.", tabHint: "funktionen" },
  { n: 15, icon: "🎭", title: "Enigma",               body: "Premium-Anonym ab Level 25. Maskiert kommentieren, geheime Matchpunkte, anonyme Geschenke.", tabHint: "enigma" },
];

const LABEL_BY_HINT: Record<string, string> = {
  live: "Geschenke im LIVE",
  coins: "Coin-System",
  moderation: "Moderation",
  funktionen: "Funktionen",
  enigma: "Enigma",
  schatz: "Schatztruhe",
  portal: "Portal",
};

export function UebersichtSection() {
  return (
    <section className="space-y-10 md:space-y-12">
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-7xl md:text-8xl mb-4 leading-none select-none">🗺️</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Komplettsystem</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            <span className="text-champagne">15 Bausteine</span> auf einen Blick.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl">
            TikTok LIVE ist mehr als Kamera + Zuschauer + Geschenke. Es ist ein komplettes Sozial-, Werbe- und Gamification-System.
          </p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4">Die 15 Bausteine</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {ITEMS.map((it) => (
            <article key={it.n} className="border border-champagne/15 hover:border-champagne/35 transition-colors p-5">
              <div className="flex items-start gap-4 mb-3">
                <div className="shrink-0 w-10 h-10 border border-champagne/40 flex items-center justify-center font-display italic text-champagne">
                  {it.n}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-2xl leading-none">{it.icon}</span>
                    <h3 className="font-display italic text-cream text-lg leading-tight">{it.title}</h3>
                  </div>
                  {it.tabHint && LABEL_BY_HINT[it.tabHint] && (
                    <a
                      href={`/portal/academy/gifts?tab=${it.tabHint}`}
                      className="inline-block text-champagne/85 hover:text-champagne text-[10px] uppercase tracking-[0.22em] mt-0.5"
                    >
                      → {LABEL_BY_HINT[it.tabHint]}
                    </a>
                  )}
                </div>
              </div>
              <p className="text-cream/65 text-sm leading-relaxed">{it.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="border-l-2 border-champagne pl-5 md:pl-6">
        <p className="eyebrow mb-3 text-champagne">Kernlogik des Systems</p>
        <p className="text-cream/75 text-base md:text-lg leading-relaxed mb-3">
          <span className="font-display italic">Mehr Zuschauer · Geschenke · Kommentare · Matches · Werbung · Watchtime</span> =
          mehr Reichweite, mehr TikTok-Umsatz, mehr LIVE-Push, mehr Sichtbarkeit.
        </p>
        <p className="text-cream/55 text-sm leading-relaxed">
          TikTok kombiniert Psychologie, Status, Wettbewerb, Community, Geld, Sichtbarkeit, Belohnungen und sozialen Druck — damit Zuschauer laenger bleiben und Creator vom System abhaengig werden.
        </p>
      </div>

      <div className="border border-champagne bg-champagne/[0.04] p-5 md:p-7">
        <p className="eyebrow text-champagne mb-3">Wichtigste Erkenntnis</p>
        <p className="text-cream font-display italic text-xl md:text-2xl leading-tight mb-3">
          TikTok LIVE ist <span className="text-champagne">kein simples Streaming</span>.
        </p>
        <p className="text-cream/75 text-sm md:text-base leading-relaxed">
          Es ist ein monetarisiertes Sozialnetzwerk · Gamification-System · Echtzeit-Werbesystem · Zuschauerbindungs-System — mit Statusmechaniken, kuenstlicher Verknappung, Levels, Belohnungen, sozialem Druck und Sichtbarkeitssystemen.
        </p>
      </div>

      <div className="border-t border-champagne/10 pt-5">
        <p className="text-cream/40 text-xs leading-relaxed">
          Faktum: alle 15 Bausteine existieren als Features in TikTok LIVE. Detail-Mechanik, Preise, Regionen und Beta-Status veraendern sich laufend.
        </p>
      </div>
    </section>
  );
}
