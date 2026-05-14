import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung gemäß DSGVO und TDDDG",
  alternates: { canonical: "/legal/datenschutz" },
};

export default function DatenschutzPage() {
  return (
    <article className="prose-luxe">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-12 text-cream">Datenschutzerklärung</h1>

      <p className="text-cream/70 text-sm mb-10 leading-relaxed">
        Wir nehmen den Schutz personenbezogener Daten ernst. Diese Erklärung informiert dich nach Art. 13/14 DSGVO sowie § 25 TDDDG, welche Daten wir verarbeiten, warum und welche Rechte du hast.
      </p>

      <Section title="1. Verantwortlicher">
        <p className="text-cream/80">
          <strong className="text-champagne font-display italic text-lg block mb-2">ZOE ⭐ Star Agency</strong>
          c/o SourceArt<br />
          Tuttlingerstraße 45<br />
          78333 Stockach · Deutschland<br />
          E-Mail: <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">info@zoe-star.de</a>
        </p>
        <p className="text-cream/50 text-xs mt-3">
          Datenschutz-Verantwortliche Person: Andreea Schütz · Anschrift wie oben
        </p>
      </Section>

      <Section title="2. Welche Daten wir verarbeiten">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li><strong className="text-cream">Account-Daten</strong> — E-Mail, Passwort (gehasht), Anzeigename, TikTok-Username, Land, Sprache</li>
          <li><strong className="text-cream">Aktivitäts-Daten</strong> — Login-Zeiten, Slot-Anmeldungen, Event-Anmeldungen, gelesene Nachrichten</li>
          <li><strong className="text-cream">Inhalte</strong> — Support-Tickets, optionale Bio</li>
          <li><strong className="text-cream">Technische Daten</strong> — IP-Adresse (kurzzeitig), Browser, Session-Cookies (technisch notwendig)</li>
        </ul>
      </Section>

      <Section title="3. Zwecke und Rechtsgrundlagen">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li><strong className="text-cream">Vertragserfüllung</strong> (Art. 6 Abs. 1 lit. b DSGVO) — Bereitstellung des Creator-Portals · Slot-/Event-Verwaltung · Support</li>
          <li><strong className="text-cream">Berechtigtes Interesse</strong> (Art. 6 Abs. 1 lit. f DSGVO) — Sicherheit, Missbrauchsschutz, Aktivitäts-Auswertung</li>
          <li><strong className="text-cream">Einwilligung</strong> (Art. 6 Abs. 1 lit. a DSGVO) — optionale E-Mail-Reminder, Marketing-Newsletter</li>
        </ul>
      </Section>

      <Section title="4. Cookies und lokale Speicherung">
        <p>
          Wir verwenden ausschließlich technisch notwendige Cookies für die Authentifizierung (Supabase-Session). Diese sind gemäß § 25 Abs. 2 Nr. 2 TDDDG ohne Einwilligung zulässig.
          Es werden keine Tracking- oder Werbe-Cookies gesetzt.
        </p>
      </Section>

      <Section title="5. Auftragsverarbeiter (Hosting / Auth / Mail)">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li><strong className="text-cream">Vercel Inc.</strong> (USA) — Hosting der Webseite. Standard-Vertragsklauseln + EU-US Data Privacy Framework</li>
          <li><strong className="text-cream">Supabase Inc.</strong> (USA, EU-Region Frankfurt) — Datenbank, Auth. Daten in Frankfurt-Region gehostet</li>
          <li><strong className="text-cream">Resend Inc.</strong> (USA) — Transaktions-E-Mails (Reminder, Auth-Confirmations). Standard-Vertragsklauseln</li>
          <li><strong className="text-cream">dogado GmbH</strong> (Dortmund) — Domain + Mail-Hosting</li>
        </ul>
      </Section>

      <Section title="6. Speicherdauer">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Account-Daten: bis zur Account-Löschung + 30 Tage Backup-Retention</li>
          <li>Aktivitäts-Daten: 12 Monate</li>
          <li>Support-Tickets: 24 Monate</li>
          <li>Steuerlich relevante Daten: 10 Jahre (§ 147 AO)</li>
        </ul>
      </Section>

      <Section title="7. Deine Rechte (Art. 15-22 DSGVO)">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Auskunft über deine Daten (Art. 15)</li>
          <li>Berichtigung (Art. 16)</li>
          <li>Löschung (Art. 17)</li>
          <li>Einschränkung (Art. 18)</li>
          <li>Datenübertragbarkeit (Art. 20)</li>
          <li>Widerspruch gegen Verarbeitung (Art. 21)</li>
          <li>Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft</li>
          <li>Beschwerde bei der zuständigen Datenschutz-Aufsichtsbehörde</li>
        </ul>
        <p className="mt-4">
          Anfragen an: <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">info@zoe-star.de</a>
        </p>
      </Section>

      <Section title="8. Datensicherheit">
        <p>
          Verschlüsselte Verbindung via TLS · Passwörter gehasht (bcrypt) · Row-Level-Security in der Datenbank · Service-Keys nur server-seitig.
        </p>
      </Section>

      <Section title="9. Änderungen">
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslage oder Funktionen anzupassen. Wesentliche Änderungen werden dir per E-Mail oder im Portal mitgeteilt.
        </p>
      </Section>

      <p className="text-cream/40 text-xs mt-12">Stand: 6. Mai 2026</p>
    </article>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="font-display italic text-xl text-champagne mb-4">{title}</h2>
      <div className="text-cream/70 leading-relaxed text-sm">{children}</div>
    </section>
  );
}
