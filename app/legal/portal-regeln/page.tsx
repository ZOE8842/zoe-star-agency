import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portal-Regeln",
  description: "Verbindliche Regeln für die Nutzung des Creator-Portals",
};

export default function PortalRegelnPage() {
  return (
    <article className="prose-luxe">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-12 text-cream">Portal-Regeln</h1>

      <p className="text-cream/70 text-sm mb-10 leading-relaxed">
        Diese Regeln gelten verbindlich für alle Creator im ZOE-Portal. Sie ergänzen die AGB und sichern faire Zusammenarbeit, professionelle Standards und ein hochwertiges Brand-Erlebnis.
      </p>

      <Section number="01" title="Live-Disziplin">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Slot-Anmeldungen sind verbindlich</li>
          <li>Reschedule mind. 6 h vor Start (Inbox + Slot-Update)</li>
          <li>Bei No-Show ohne Absage: Eintrag im System, ggf. Slot-Sperre für 72 h</li>
          <li>20-Stunden-Regel über 8 Tage einhalten</li>
        </ul>
      </Section>

      <Section number="02" title="Kommunikation">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Pflicht-Nachrichten innerhalb 12 h bestätigen</li>
          <li>Manager-Kommunikation in der Inbox · keine privaten DMs</li>
          <li>Bei Problemen: Support-Ticket öffnen statt direkt anrufen</li>
          <li>Keine Drama-Calls oder öffentliche Konflikte mit anderen Creatorn</li>
        </ul>
      </Section>

      <Section number="03" title="Content-Standards">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>TikTok TOS einhalten · keine Adult/Suggestive-Inhalte</li>
          <li>Keine externen Plattform-Werbung im Live (kein Insta/Discord-Spam)</li>
          <li>Brand-Standards beachten — Logo, Hashtags wo gefordert</li>
          <li>Gäste & Match-Partner mit Respekt behandeln</li>
        </ul>
      </Section>

      <Section number="04" title="Account-Sicherheit">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Eigenes Portal-Passwort — niemals identisch mit TikTok</li>
          <li>Passwort nicht weitergeben — auch nicht an Manager</li>
          <li>Bei Verdacht auf Kompromittierung sofort melden</li>
          <li>Wir fragen niemals nach deinem Passwort</li>
        </ul>
      </Section>

      <Section number="05" title="Daten und Privacy">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Keine Daten anderer Creator weitergeben (Stats, Verträge, etc.)</li>
          <li>Screenshots aus dem Portal nicht öffentlich teilen</li>
          <li>Diskussionen über Vergütungen NUR mit ZOE Management</li>
        </ul>
      </Section>

      <Section number="06" title="Bei Verstößen">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>1. Verstoß: Hinweis durch Manager</li>
          <li>2. Verstoß: dokumentierte Verwarnung</li>
          <li>3. Verstoß: Slot-Pause oder Account-Deaktivierung</li>
          <li>Schwerer Verstoß (Beleidigung · illegale Inhalte): sofortige Sperrung</li>
        </ul>
      </Section>

      <p className="text-cream/40 text-xs mt-12">Stand: 6. Mai 2026 · Mit Anmeldung im Portal akzeptierst du diese Regeln.</p>
    </article>
  );
}

function Section({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-12 pb-10 border-b border-champagne/10 last:border-b-0">
      <div className="flex items-baseline gap-4 mb-5">
        <span className="font-display italic text-3xl text-champagne">{number}</span>
        <h2 className="font-display italic text-2xl text-cream">{title}</h2>
      </div>
      <div className="text-cream/70 leading-relaxed text-sm">{children}</div>
    </section>
  );
}
