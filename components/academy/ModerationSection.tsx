// Moderation + Geschenksteuerung + Schenkenden-Level
// TikTok LIVE → Einstellungen / Moderation / Geschenke

interface FeatureCard {
  icon: string;
  title: string;
  body: string;
  badge?: string;
}

const MOD_CAPABILITIES: FeatureCard[] = [
  {
    icon: "💬",
    title: "Kommentar-Kontrolle",
    body: "Kommentareinstellungen oeffnen, problematische Begriffe filtern, Spam stoppen.",
    badge: "Mod",
  },
  {
    icon: "🔇",
    title: "Stummschalten",
    body: "Einzelne Nutzer im LIVE muten — sie sehen weiter zu, koennen aber nicht stoeren.",
    badge: "Mod",
  },
  {
    icon: "🚫",
    title: "Sperren",
    body: "Verbal toxische Konten direkt aus dem LIVE entfernen.",
    badge: "Mod",
  },
  {
    icon: "📋",
    title: "Moderationsliste",
    body: "Eigene Mods verwalten, Rechte sehen, ggf. entfernen ueber Teilen → Einstellungen → Moderationsliste.",
    badge: "Host",
  },
];

const GIFT_CONTROL: FeatureCard[] = [
  {
    icon: "🛡️",
    title: "Tagesmuenzlimit",
    body: "TikTok bietet ein Geschenk-Limit pro Tag. Schuetzt Zuschauer vor unkontrollierten Ausgaben.",
    badge: "Setting",
  },
  {
    icon: "⚠️",
    title: "Geschenkwarnung",
    body: "Warnungen bei 90% und 100% des Tageslimits. Hilft, das Limit bewusst wahrzunehmen.",
    badge: "Auto",
  },
  {
    icon: "📊",
    title: "Verwendete Muenzen",
    body: "TikTok zeigt taegliche Ausgaben, Statistik und Geschenk-Verlauf an.",
    badge: "Transparenz",
  },
];

const LEVEL: FeatureCard[] = [
  {
    icon: "🪙",
    title: "XP pro Muenze",
    body: "Jede verschenkte Muenze zaehlt als Erfahrungspunkt. Dadurch steigt das Schenkenden-Level.",
    badge: "Mechanik",
  },
  {
    icon: "⭐",
    title: "Sichtbarkeit + Status",
    body: "Hoeheres Level = sichtbarer im LIVE. Status + Praesenz + manchmal exklusive Funktionen.",
    badge: "Effekt",
  },
  {
    icon: "🎉",
    title: "Levelaufstiegsfeier",
    body: "Creator kann Nutzer mit Glueckwunsch-Stickern erwaehnen. Level-Up wird angezeigt — vom Nutzer deaktivierbar.",
    badge: "Optional",
  },
];

export function ModerationSection() {
  return (
    <section className="space-y-10 md:space-y-12">
      <div className="relative border border-champagne/30 bg-gradient-to-br from-champagne/[0.07] via-champagne/[0.02] to-transparent p-6 md:p-10 overflow-hidden">
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-champagne/15 blur-3xl pointer-events-none" />
        <div className="relative">
          <div className="text-7xl md:text-8xl mb-4 leading-none select-none">🛡️</div>
          <p className="eyebrow text-champagne mb-2">TikTok LIVE · Einstellungen + Moderation</p>
          <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-tight mb-3">
            Moderation, <span className="text-champagne">Geschenksteuerung</span> & Level.
          </h2>
          <p className="text-cream/70 text-base md:text-lg leading-relaxed max-w-2xl">
            Wer Ordnung im LIVE haelt, welche Schutzmechaniken Zuschauer haben und wie das Schenkenden-Level wirkt.
          </p>
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4">Moderator-System</p>
        <p className="text-cream/65 text-sm md:text-base leading-relaxed mb-5 max-w-2xl">
          Moderatoren sind Zuschauer mit Sonderrechten — vom Host bestimmt. Sie sorgen fuer Ordnung, schuetzen Stimmung und entlasten den Creator.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          {MOD_CAPABILITIES.map((m) => (
            <FeatureBox key={m.title} f={m} />
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4">Geschenksteuerung · Schutz fuer Zuschauer</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {GIFT_CONTROL.map((m) => (
            <FeatureBox key={m.title} f={m} />
          ))}
        </div>
      </div>

      <div>
        <p className="eyebrow mb-4">Schenkenden-Level (XP-System)</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
          {LEVEL.map((m) => (
            <FeatureBox key={m.title} f={m} />
          ))}
        </div>
      </div>

      <div className="border border-champagne/15 p-5 md:p-6 bg-champagne/[0.02]">
        <p className="eyebrow mb-3">KI-Match-Kommentare (Beta)</p>
        <p className="text-cream/70 text-sm md:text-base leading-relaxed mb-2">
          TikTok testet automatische KI-Kommentare bei Matches. Aktuell nur Englisch, Creator muss aktivieren. TikTok weist selbst darauf hin: Genauigkeit nicht garantiert.
        </p>
        <p className="text-cream/45 text-xs italic">
          Status: Beta-Feature · Verfuegbarkeit variabel.
        </p>
      </div>

      <div className="border border-champagne/15 p-5 md:p-6">
        <p className="eyebrow mb-3">Bildschirmzeit</p>
        <p className="text-cream/70 text-sm md:text-base leading-relaxed">
          TikTok zeigt taegliche Nutzungszeit, Wochenvergleich und Aktivitaetsdiagramme. Hilft, das eigene Nutzungsverhalten realistisch zu sehen.
        </p>
      </div>

      <div className="border-l-2 border-champagne pl-5 md:pl-6">
        <p className="eyebrow mb-3 text-champagne">Strategische Sicht</p>
        <p className="text-cream/70 text-sm md:text-base leading-relaxed">
          TikTok baut Zuschauerbindung ueber Statussysteme, Level, Erwaehnungen und Belohnungen. Fuer dich als Creator heisst das: Stammgaeste mit Namen begruessen, Levels feiern, Mods sauber briefen — das aktiviert die Mechanik fuer dich.
        </p>
      </div>
    </section>
  );
}

function FeatureBox({ f }: { f: FeatureCard }) {
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
