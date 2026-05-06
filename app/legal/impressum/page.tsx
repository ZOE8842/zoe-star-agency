import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Impressum",
  description: "Anbieterkennzeichnung gemäß § 5 DDG",
};

export default function ImpressumPage() {
  return (
    <article className="prose-luxe">
      <p className="eyebrow mb-4">Legal</p>
      <h1 className="heading-display text-4xl md:text-5xl mb-8 text-cream">Impressum</h1>

      <div className="border border-champagne/40 bg-champagne/5 px-5 py-4 mb-12">
        <p className="text-champagne text-[10px] uppercase tracking-[0.25em] font-semibold mb-1">⚠ Platzhalter · Bitte finalisieren</p>
        <p className="text-cream/70 text-sm">
          Diese Seite enthält Platzhalter. Vor Live-Schaltung müssen Inhaber:in, vollständige Anschrift, Kontakt-Mail und ggf. USt-ID/Register eingetragen werden.
        </p>
      </div>

      <Section title="Anbieter">
        <p>ZOE Star Agency<br />
        Inhaber:in: <span className="text-champagne">[Vollständiger Name]</span><br />
        <span className="text-champagne">[Straße + Hausnummer]</span><br />
        <span className="text-champagne">[PLZ + Ort]</span><br />
        Deutschland</p>
      </Section>

      <Section title="Kontakt">
        <p>
          E-Mail: <span className="text-champagne">[kontakt@zoe-star.de]</span><br />
          Web: zoe-star.de
        </p>
      </Section>

      <Section title="Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV">
        <p><span className="text-champagne">[Vollständiger Name]</span> · Anschrift wie oben</p>
      </Section>

      <Section title="Optional · einzutragen wenn anwendbar">
        <ul className="list-disc list-outside ml-5 space-y-2 text-cream/70">
          <li>USt-Identifikationsnummer (§ 27a UStG): <span className="text-champagne">[falls vorhanden]</span></li>
          <li>Handelsregistereintrag: <span className="text-champagne">[HRB · Amtsgericht falls vorhanden]</span></li>
          <li>Berufsbezeichnung + zuständige Kammer: <span className="text-champagne">[falls anwendbar]</span></li>
        </ul>
      </Section>

      <Section title="Streitschlichtung">
        <p>
          Die EU-Kommission stellt eine Plattform zur Online-Streitbeilegung bereit:{" "}
          <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener" className="text-champagne hover:underline">
            ec.europa.eu/consumers/odr
          </a>.
          Wir sind nicht verpflichtet und nicht bereit, an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </Section>

      <Section title="Haftung für Inhalte">
        <p>
          Als Diensteanbieter sind wir gemäß § 7 Abs. 1 DDG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich.
          Nach §§ 8 bis 10 DDG sind wir als Diensteanbieter jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.
        </p>
      </Section>

      <Section title="Haftung für Links">
        <p>
          Unser Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte wir keinen Einfluss haben.
          Deshalb können wir für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
        </p>
      </Section>

      <Section title="Urheberrecht">
        <p>
          Die durch die Seitenbetreiber erstellten Inhalte und Werke unterliegen dem deutschen Urheberrecht.
          Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen der schriftlichen Zustimmung des jeweiligen Autors bzw. Erstellers.
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
