import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB",
  description: "Allgemeine Geschäftsbedingungen ZOE Star Agency",
};

export default function AGBPage() {
  return (
    <article className="prose-luxe">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-8 text-cream">
        Allgemeine Geschäftsbedingungen
      </h1>

      <div className="border border-champagne/40 bg-champagne/5 px-5 py-4 mb-12">
        <p className="text-champagne text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">⚠ Entwurf · Bitte rechtlich prüfen</p>
        <p className="text-cream/70 text-sm">
          Diese AGB sind ein Entwurf. Vor Live-Schaltung empfohlen: Prüfung durch eine:n Anwält:in für Vertragsrecht / Medienrecht. Gerichtsstand „Berlin" anpassen falls Geschäftssitz abweicht.
        </p>
      </div>

      <Section title="§ 1 Geltungsbereich">
        <p>
          Diese AGB regeln das Vertragsverhältnis zwischen ZOE Star Agency („wir", „uns") und Creatorn („Creator", „du") betreffend die Nutzung des Creator-Portals zoe-star.de.
        </p>
      </Section>

      <Section title="§ 2 Account & Zugang">
        <p>
          Der Zugang zum Portal erfolgt invite-basiert. Du verpflichtest dich, deine Zugangsdaten geheim zu halten und ein eigenes, eigenständiges Passwort zu verwenden — explizit NICHT dein TikTok-Passwort. Bei Verdacht auf Kompromittierung informierst du uns umgehend.
        </p>
      </Section>

      <Section title="§ 3 Pflichten der Creator">
        <ul className="list-disc list-outside ml-5 space-y-2">
          <li>Wahrheitsgemäße Angaben bei der Registrierung</li>
          <li>Einhaltung der TikTok Community-Richtlinien</li>
          <li>Verbindliche Slot-Anmeldungen — Reschedule mind. 6 Stunden vor Start</li>
          <li>Bestätigung von Pflicht-Nachrichten innerhalb 12 Stunden</li>
          <li>Respektvoller Umgang mit anderen Creatorn und Zuschauern</li>
        </ul>
      </Section>

      <Section title="§ 4 Leistungsumfang">
        <p>
          Wir stellen das Portal nach dem Stand der Technik bereit. Wir bemühen uns um eine hohe Verfügbarkeit, garantieren aber keine 100 %ige Erreichbarkeit. Wartungsarbeiten kündigen wir wenn möglich an.
        </p>
      </Section>

      <Section title="§ 5 Vergütung & Auszahlung">
        <p>
          Vergütungen werden in separaten Vereinbarungen mit jedem Creator individuell geregelt (Vertrags-Anhang). Die im Portal angezeigten Statistiken sind Orientierung, nicht abschließend abrechnungsrelevant.
        </p>
      </Section>

      <Section title="§ 6 Pflichtverletzungen & Sperrung">
        <p>
          Bei wiederholten Verstößen gegen diese AGB oder die Portal-Regeln behalten wir uns vor, Accounts zu deaktivieren. Bei schweren Verstößen (Beleidigung, Diskriminierung, illegale Inhalte) kann die Sperrung sofort und ohne Vorwarnung erfolgen.
        </p>
      </Section>

      <Section title="§ 7 Datenschutz">
        <p>
          Es gilt unsere{" "}
          <a href="/legal/datenschutz" className="text-champagne hover:underline">Datenschutzerklärung</a>.
        </p>
      </Section>

      <Section title="§ 8 Haftung">
        <p>
          Wir haften nur für Schäden, die durch Vorsatz oder grobe Fahrlässigkeit entstanden sind. Die Haftung für leichte Fahrlässigkeit ist auf vertragstypische, vorhersehbare Schäden begrenzt. Diese Haftungsbeschränkung gilt nicht bei Verletzung von Leben, Körper oder Gesundheit.
        </p>
      </Section>

      <Section title="§ 9 Schlussbestimmungen">
        <p>
          Es gilt deutsches Recht. Erfüllungsort und Gerichtsstand ist, soweit gesetzlich zulässig, Berlin. Sollte eine Bestimmung dieser AGB unwirksam sein, bleibt die Wirksamkeit der übrigen Bestimmungen unberührt.
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
