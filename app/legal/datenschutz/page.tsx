import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutz",
  description: "Datenschutzerklärung gemäß DSGVO und TDDDG",
  alternates: { canonical: "/legal/datenschutz" },
  openGraph: {
    title: "Datenschutz · ZOE Star Agency",
    description: "Datenschutzerklärung gemäß DSGVO und TDDDG",
    url: "/legal/datenschutz",
  },
  twitter: {
    title: "Datenschutz · ZOE Star Agency",
    description: "Datenschutzerklärung gemäß DSGVO und TDDDG",
  },

};

export default function DatenschutzPage() {
  return (
    <article className="prose-luxe">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-6 text-cream">Datenschutzerklärung</h1>

      <div className="border-l-2 border-champagne/40 pl-4 mb-10 text-cream/60 text-xs leading-relaxed">
        <p><strong className="text-cream">Version:</strong> v2.5.1</p>
        <p><strong className="text-cream">Letztes Update:</strong> 2026-05-17</p>
      </div>

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
          <li><strong className="text-cream">Account-Daten</strong> — E-Mail, Passwort (gehasht), Anzeigename, TikTok-Username, Land, Sprache, Region, Creator-Kategorie, LIVE-Format, Bio, Profilbild, individuelle Ziele</li>
          <li><strong className="text-cream">Aktivitäts-Daten</strong> — Login-Zeiten, Slot-Anmeldungen, Event-Anmeldungen, gelesene Nachrichten</li>
          <li><strong className="text-cream">Performance-Daten</strong> — Live-Stunden, Live-Tage, Zuschauer-Durchschnitt, Aktivitäts-Status, Veröffentlichungs-Datum</li>
          <li><strong className="text-cream">Öffentliche TikTok-Profil-Daten</strong> — Follower-Zahlen, Likes, Video-Statistiken, Video-Beschreibungen (siehe Abschnitt 5.6)</li>
          <li><strong className="text-cream">Inhalte</strong> — Support-Tickets, optionale Bio</li>
          <li><strong className="text-cream">Technische Daten</strong> — IP-Adresse (kurzzeitig), Browser- und Geräte-Metadaten, technisch eingesetzter Session-Cookie („session_id&quot;, UUID). Dieser dient der technischen Sitzungsverwaltung, Sicherheitsfunktionen und pseudonymisierten Nutzungsanalyse (siehe „Nutzungsdaten&quot;).</li>
          <li><strong className="text-cream">Nutzungsdaten</strong> — pseudonymisierte Ereignisse zu Seitenaufrufen, Portal-Aktivität und Interaktionen (z.B. „page_view&quot;, „join_open&quot;, „creator_application_submit&quot;) zur Verbesserung des Portals. Es erfolgt keine Profilbildung über verschiedene Webseiten hinweg und es werden keine Daten an Werbenetzwerke weitergegeben.</li>
          <li><strong className="text-cream">Optional</strong> — Telegram-Username, sofern du diesen freiwillig im Portal hinterlegst (für vereinfachte Kommunikation)</li>
        </ul>
      </Section>

      <Section title="3. Zwecke und Rechtsgrundlagen">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li><strong className="text-cream">Vertragserfüllung</strong> (Art. 6 Abs. 1 lit. b DSGVO) — Bereitstellung des Creator-Portals, Slot- und Event-Verwaltung, Support, Creator-Analyse und Performance-Auswertung</li>
          <li><strong className="text-cream">Berechtigtes Interesse</strong> (Art. 6 Abs. 1 lit. f DSGVO) — Sicherheit, Missbrauchsschutz, pseudonymisierte Nutzungsanalyse, Verbesserung der Betreuungsqualität durch automatisierte Auswertung öffentlich zugänglicher Profil-Performance</li>
          <li><strong className="text-cream">Einwilligung</strong> (Art. 6 Abs. 1 lit. a DSGVO) — optionale E-Mail-Reminder, Marketing-Newsletter, Hinterlegen von Telegram-Username</li>
        </ul>
      </Section>

      <Section title="4. Cookies und lokale Speicherung">
        <p>
          Die eingesetzten Cookies dienen der technischen Bereitstellung, Sicherheit und pseudonymisierten Nutzungsanalyse des Portals. Dazu gehört insbesondere der Session-Cookie („session_id&quot; als UUID). Es werden keine Werbe- oder Marketing-Cookies eingesetzt und keine Daten an Werbenetzwerke weitergegeben.
        </p>
      </Section>

      <Section title="5. Externe Dienstleister und technische Anbieter">
        <p className="mb-4">
          Wir nutzen folgende externe Dienstleister bzw. technische Anbieter zur Bereitstellung unseres Portals. Sofern erforderlich werden entsprechende Datenschutzvereinbarungen (z.B. Auftragsverarbeitungsverträge nach Art. 28 DSGVO) abgeschlossen. Für Datentransfers in Drittländer kommen geeignete Garantien gemäß Art. 46 DSGVO zum Einsatz, insbesondere Standardvertragsklauseln, soweit erforderlich.
        </p>

        <Subsection title="5.1 Vercel Inc. (USA)">
          <p>
            Hosting der Webseite und der Server-Routen. Datenstandort: u.a. USA.<br />
            Datenschutz: <a href="https://vercel.com/legal/privacy-policy" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">vercel.com/legal/privacy-policy</a><br />
            DPA: <a href="https://vercel.com/legal/dpa" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">vercel.com/legal/dpa</a>
          </p>
        </Subsection>

        <Subsection title="5.2 Supabase Inc. (USA, Hosting in der EU)">
          <p>
            Datenbank, Authentifizierung, Storage. Hosting-Region: AWS eu-west-1 (Irland, EU).<br />
            Datenschutz: <a href="https://supabase.com/privacy" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/privacy</a><br />
            DPA: <a href="https://supabase.com/legal/dpa" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">supabase.com/legal/dpa</a>
          </p>
        </Subsection>

        <Subsection title="5.3 Resend Inc. (USA)">
          <p>
            Versand transaktionaler E-Mails: Login-Bestätigungen, Account-Verifizierung, Passwort-Reset-Links, Slot-/Event-Reminder, Geburtstags-Reminder. Datenstandort: u.a. USA.<br />
            Datenschutz: <a href="https://resend.com/legal/privacy-policy" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">resend.com/legal/privacy-policy</a><br />
            DPA: <a href="https://resend.com/legal/dpa" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">resend.com/legal/dpa</a>
          </p>
        </Subsection>

        <Subsection title="5.4 dogado GmbH (Dortmund, Deutschland)">
          <p>
            Domain-Hosting und Mail-Hosting für info@zoe-star.de. Datenstandort: Deutschland.<br />
            AVV: <a href="https://www.dogado.de/datenschutz-auftragsverarbeitung" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">dogado.de/datenschutz-auftragsverarbeitung</a>
          </p>
        </Subsection>

        <Subsection title="5.5 Technisch vorbereitetes Fehler-Monitoring">
          <p>
            Die technische Infrastruktur unseres Portals enthält Vorbereitungen für ein Fehler-Monitoring (SDK von Sentry, derzeit ohne aktiven Empfänger und ohne konfigurierten Daten-Endpunkt). Aktuell werden über diese Komponente keine personenbezogenen Daten an externe Empfänger übermittelt. Sobald ein aktives Fehler-Monitoring aufgenommen wird, ergänzen wir diese Datenschutzerklärung um den jeweiligen Anbieter, Datenkategorien und Rechtsgrundlagen.
          </p>
        </Subsection>

        <Subsection title="5.6 Apify Technologies s.r.o. (Tschechische Republik, EU)">
          <p>
            Wir nutzen Apify zur Abfrage öffentlich zugänglicher TikTok-Profil-Daten unserer Creator (z.B. Follower-Zahlen, Bio, Profilbild, Statistiken der letzten Videos). Diese Daten werden im Rahmen der Creator-Betreuung und Performance-Auswertung verarbeitet und zwischengespeichert (Cache-Dauer: 24 Stunden). Datenstandort: EU (Tschechische Republik).<br />
            Datenschutz: <a href="https://apify.com/privacy-policy" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">apify.com/privacy-policy</a><br />
            DPA: <a href="https://apify.com/data-processing-agreement" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">apify.com/data-processing-agreement</a>
          </p>
        </Subsection>

        <Subsection title="5.7 Anthropic PBC (USA)">
          <p>
            Wir nutzen die API von Anthropic für automatisierte Analyse- und Content-Funktionen im Rahmen der Creator-Betreuung. Bei der Nutzung können Daten an Server von Anthropic in den USA übermittelt werden. Dabei können folgende Inhalte verarbeitet werden: Anzeigename, TikTok-Username, Bio, Sprache, Region, Creator-Kategorie, Profilbild, Performance-Kennzahlen (Live-Stunden, Zuschauer-Schnitt, Aktivitäts-Status), öffentlich verfügbare TikTok-Statistiken sowie Bildmaterial, das die Creator im Portal hochladen. Für die Datenübermittlung kommen geeignete Garantien gemäß Art. 46 DSGVO zum Einsatz, soweit erforderlich.<br />
            Datenschutz: <a href="https://www.anthropic.com/legal/privacy" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">anthropic.com/legal/privacy</a><br />
            Vertragsgrundlagen: <a href="https://www.anthropic.com/legal/dpa" className="text-champagne hover:underline" target="_blank" rel="noopener noreferrer">anthropic.com/legal/dpa</a>
          </p>
        </Subsection>
      </Section>

      <Section title="6. Speicherdauer">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Account-Daten: bis zur Account-Löschung; Backup-Retention gemäß den technischen Vorgaben der eingesetzten Infrastruktur-Dienstleister</li>
          <li>Aktivitäts- und Nutzungsdaten: bis zu 12 Monate</li>
          <li>Performance-Daten (Monats-Metriken): bis zur Account-Löschung</li>
          <li>TikTok-Public-Snapshots (Apify-Cache): 24 Stunden, automatische Erneuerung bei Bedarf</li>
          <li>Daten, die im Rahmen der Analyse-Funktionen an externe KI-Anbieter übermittelt werden, unterliegen den jeweils geltenden Vorgaben des Anbieters</li>
          <li>Support-Tickets: bis zu 24 Monate</li>
          <li>Steuerlich relevante Daten: 10 Jahre (§ 147 AO)</li>
        </ul>
      </Section>

      <Section title="7. Deine Rechte (Art. 15–22 DSGVO)">
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
          Verschlüsselte Verbindung via TLS · Passwörter gehasht (bcrypt) · Row-Level-Security in der Datenbank · Service-Keys nur server-seitig · SSRF-Schutz bei externen Ressourcen-Abrufen · Zugriff auf personenbezogene Daten ausschließlich durch berechtigte Personen mit Multi-Faktor-Authentifizierung.
        </p>
      </Section>

      <Section title="9. Änderungen">
        <p>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte Rechtslage oder Funktionen anzupassen. Wesentliche Änderungen werden dir per E-Mail oder im Portal mitgeteilt.
        </p>
      </Section>

      <Section title="Versions-Historie">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-cream/70 border-collapse">
            <thead>
              <tr className="border-b border-champagne/20 text-cream">
                <th className="text-left py-2 pr-3 font-display italic">Version</th>
                <th className="text-left py-2 pr-3 font-display italic">Datum</th>
                <th className="text-left py-2 font-display italic">Änderung</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-champagne/10">
                <td className="py-2 pr-3 align-top">v1.0</td>
                <td className="py-2 pr-3 align-top">2026-05-06</td>
                <td className="py-2 align-top">Initial-Version</td>
              </tr>
              <tr className="border-b border-champagne/10">
                <td className="py-2 pr-3 align-top">v2.5.1</td>
                <td className="py-2 pr-3 align-top">2026-05-17</td>
                <td className="py-2 align-top">
                  Nach Code-Audit konsolidiert: Sentry korrekt als „technisch vorbereitet&quot; deklariert (SDK installiert, DSN nicht gesetzt); Anthropic und Apify als aktive Dienstleister aufgenommen; Supabase-Region korrigiert zu AWS eu-west-1 (Irland); juristisch weichere Formulierungen; Datenkategorien um Performance, öffentliche TikTok-Daten und Analytics-Events erweitert.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>
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

function Subsection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-cream text-sm font-semibold mb-2">{title}</h3>
      <div className="text-cream/70 leading-relaxed text-sm">{children}</div>
    </div>
  );
}
