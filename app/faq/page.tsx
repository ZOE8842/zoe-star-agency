import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { MotionReveal } from "@/components/MotionReveal";
import { JsonLd } from "@/components/JsonLd";
import { MONATSZIELE } from "@/lib/creator/monatsziele";

export const metadata: Metadata = {
  title: "Häufige Fragen",
  description:
    "Antworten auf die häufigsten Fragen zur ZOE Star Agency: Aufnahme, Mindestwerte, Portal, Betreuung und Kommunikation.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Häufige Fragen · ZOE Star Agency",
    description:
      "Antworten auf die häufigsten Fragen zur ZOE Star Agency: Aufnahme, Mindestwerte, Portal, Betreuung und Kommunikation.",
    url: "/faq",
  },
  twitter: {
    title: "Häufige Fragen · ZOE Star Agency",
    description:
      "Antworten auf die häufigsten Fragen zur ZOE Star Agency: Aufnahme, Mindestwerte, Portal, Betreuung und Kommunikation.",
  },
};

// Statisch: die Antworten aendern sich selten, keine DB noetig.
export const revalidate = 86400;

interface Frage {
  frage: string;
  antwort: React.ReactNode;
  /** Klartext fuer das FAQPage-Schema (Google-Rich-Result) */
  antwortText: string;
}

const FRAGEN: Frage[] = [
  {
    frage: "Wer kann sich bei ZOE bewerben?",
    antwort: (
      <>
        Creator, die auf TikTok LIVE gehen und regelmäßig senden wollen. Wir
        schauen weniger auf die Followerzahl als auf Beständigkeit: eine klare
        Richtung, ein wiedererkennbares Profil und die Bereitschaft, über Monate
        hinweg dranzubleiben. Wer heute klein anfängt, aber liefert, ist uns
        lieber als eine große Zahl ohne LIVE-Routine.
      </>
    ),
    antwortText:
      "Creator, die auf TikTok LIVE gehen und regelmäßig senden wollen. Wir schauen weniger auf die Followerzahl als auf Beständigkeit: eine klare Richtung, ein wiedererkennbares Profil und die Bereitschaft, über Monate hinweg dranzubleiben.",
  },
  {
    frage: "Welche Mindestwerte muss ich erfüllen?",
    antwort: (
      <>
        Drei Werte, jeweils pro Kalendermonat:{" "}
        {MONATSZIELE.map((z, i) => (
          <span key={z.key}>
            {i > 0 && (i === MONATSZIELE.length - 1 ? " und " : ", ")}
            <strong className="text-cream">
              {z.ziel} {z.label.toLowerCase()}
            </strong>
          </span>
        ))}
        . Die Stunden kannst du frei über deine Tage verteilen. Deinen Stand
        siehst du jederzeit oben auf deiner Portal-Startseite — du musst nichts
        selbst mitzählen.
      </>
    ),
    antwortText: `Pro Kalendermonat: ${MONATSZIELE.map(
      (z) => `${z.ziel} ${z.label.toLowerCase()}`,
    ).join(", ")}. Die Stunden kannst du frei über deine Tage verteilen. Deinen Stand siehst du auf der Portal-Startseite.`,
  },
  {
    frage: "Was passiert, wenn ich die Werte mal nicht schaffe?",
    antwort: (
      <>
        Dann sprichst du vorher mit deinem Manager. Für Urlaub, Krankheit und
        geplante Pausen gibt es im Portal die Abwesenheitsmeldung — damit ist
        die Auszeit abgestimmt und zählt nicht gegen dich. Was wir nicht
        brauchen, ist wochenlange Funkstille ohne Rückmeldung.
      </>
    ),
    antwortText:
      "Sprich vorher mit deinem Manager. Für Urlaub, Krankheit und geplante Pausen gibt es im Portal die Abwesenheitsmeldung — damit ist die Auszeit abgestimmt und zählt nicht gegen dich.",
  },
  {
    frage: "Wie läuft die Bewerbung ab?",
    antwort: (
      <>
        In drei Schritten. Erstens das Formular auf der{" "}
        <Link href="/join" className="text-champagne hover:underline">
          Bewerbungsseite
        </Link>{" "}
        — TikTok-Name, Sprache, kurzer Pitch, zwei Minuten. Zweitens ein Gespräch
        von 15 bis 30 Minuten, in dem wir uns dein Profil gemeinsam ansehen.
        Drittens, wenn es passt: Vertrag, Portal-Zugang und dein persönlicher
        Manager. Wir melden uns innerhalb von ein bis drei Werktagen.
      </>
    ),
    antwortText:
      "In drei Schritten: Formular auf der Bewerbungsseite ausfüllen, danach ein Gespräch von 15 bis 30 Minuten, in dem wir dein Profil ansehen, und bei Zusage Vertrag, Portal-Zugang und persönlicher Manager. Rückmeldung innerhalb von ein bis drei Werktagen.",
  },
  {
    frage: "Bekomme ich einen festen Ansprechpartner?",
    antwort: (
      <>
        Ja. Jeder Creator hat einen persönlichen Manager, nicht eine anonyme
        Sammeladresse. Die Kommunikation läuft über die Inbox im Portal, damit
        Absprachen nachlesbar bleiben und nichts in privaten Chats verloren
        geht.
      </>
    ),
    antwortText:
      "Ja. Jeder Creator hat einen persönlichen Manager. Die Kommunikation läuft über die Inbox im Portal, damit Absprachen nachlesbar bleiben.",
  },
  {
    frage: "Was bekomme ich im Portal?",
    antwort: (
      <>
        Deine LIVE-Zahlen mit Verlauf und Vergleich zum Vormonat, eine Analyse
        deines Accounts mit konkreten Empfehlungen und Wochenplan, die Academy
        mit Lektionen und Quiz, das Ranking innerhalb der Agency, die
        Slot-Planung für deine LIVE-Zeiten, Events und Kampagnen sowie die
        Inbox zu deinem Manager. Dazu Services wie Match-Anfragen,
        Content-Hilfe und TikTok-Push.
      </>
    ),
    antwortText:
      "Deine LIVE-Zahlen mit Verlauf und Vormonatsvergleich, eine Account-Analyse mit Empfehlungen und Wochenplan, die Academy mit Lektionen und Quiz, das Agency-Ranking, die Slot-Planung, Events und Kampagnen sowie die Inbox zu deinem Manager.",
  },
  {
    frage: "Verliere ich die Kontrolle über meinen Account?",
    antwort: (
      <>
        Nein. Dein Account bleibt deiner. Wir fragen niemals nach deinem
        TikTok-Passwort — weder das Management noch dein Manager. Für das
        Portal vergibst du ein eigenes, separates Passwort, das nicht mit deinem
        TikTok-Zugang identisch sein darf.
      </>
    ),
    antwortText:
      "Nein. Dein Account bleibt deiner. Wir fragen niemals nach deinem TikTok-Passwort. Für das Portal vergibst du ein eigenes, separates Passwort.",
  },
  {
    frage: "Sagt ihr mir, was ich streamen soll?",
    antwort: (
      <>
        Nein. Dein Inhalt bleibt deine Entscheidung. Wir beraten zu Format,
        Sendezeiten, Matches und Aufbau, und bei Marken-Kampagnen gibt es
        naturgemäß Vorgaben zu Logo, Hashtags und Tonalität. Was du sonst
        sendest, bestimmst du.
      </>
    ),
    antwortText:
      "Nein. Dein Inhalt bleibt deine Entscheidung. Wir beraten zu Format, Sendezeiten, Matches und Aufbau. Nur bei Marken-Kampagnen gibt es Vorgaben zu Logo, Hashtags und Tonalität.",
  },
  {
    frage: "Wie läuft die Kommunikation im Alltag?",
    antwort: (
      <>
        Über die Portal-Inbox. Dort kommen Absprachen, Kampagnen-Infos und
        Pflicht-Nachrichten an, die du kurz bestätigst, damit wir gemeinsam
        planen können. LIVE-Slots stimmen wir vorher ab; wenn sich etwas ändert,
        gib bitte früh Bescheid.
      </>
    ),
    antwortText:
      "Über die Portal-Inbox. Dort kommen Absprachen, Kampagnen-Infos und Pflicht-Nachrichten an. LIVE-Slots werden vorher abgestimmt.",
  },
  {
    frage: "Was gilt für Daten anderer Creator?",
    antwort: (
      <>
        Sie bleiben intern. Zahlen, Verträge und Vergütungen anderer Creator
        werden nicht weitergegeben, und Screenshots aus dem Portal gehören nicht
        in die Öffentlichkeit. Wie wir mit deinen eigenen Daten umgehen, steht
        in der{" "}
        <Link href="/legal/datenschutz" className="text-champagne hover:underline">
          Datenschutzerklärung
        </Link>
        . Die vollständigen Regeln findest du unter{" "}
        <Link href="/legal/portal-regeln" className="text-champagne hover:underline">
          Portal-Regeln
        </Link>
        .
      </>
    ),
    antwortText:
      "Sie bleiben intern. Zahlen, Verträge und Vergütungen anderer Creator werden nicht weitergegeben, Screenshots aus dem Portal gehören nicht in die Öffentlichkeit.",
  },
  {
    frage: "Ich habe eine Frage, die hier nicht steht.",
    antwort: (
      <>
        Schreib uns an{" "}
        <a href="mailto:info@zoe-star.de" className="text-champagne hover:underline">
          info@zoe-star.de
        </a>{" "}
        oder über das{" "}
        <Link href="/contact" className="text-champagne hover:underline">
          Kontaktformular
        </Link>
        . Wir antworten innerhalb von 48 Stunden.
      </>
    ),
    antwortText:
      "Schreib uns an info@zoe-star.de oder über das Kontaktformular. Wir antworten innerhalb von 48 Stunden.",
  },
];

export default function FaqPage() {
  // FAQPage-Schema: Google zeigt die Fragen direkt in den Suchergebnissen.
  // "@context" setzt die JsonLd-Komponente selbst.
  const schema = {
    "@type": "FAQPage",
    mainEntity: FRAGEN.map((f) => ({
      "@type": "Question",
      name: f.frage,
      acceptedAnswer: { "@type": "Answer", text: f.antwortText },
    })),
  };

  return (
    <>
      <JsonLd data={schema} />
      <Header />
      <main className="bg-ink">
        <section className="container-luxe pt-24 md:pt-36 pb-12 md:pb-16">
          <MotionReveal>
            <p className="eyebrow mb-5">Häufige Fragen</p>
          </MotionReveal>
          <MotionReveal delay={0.1}>
            <h1 className="heading-display text-4xl md:text-7xl text-cream mb-5 leading-[0.95] max-w-4xl">
              Alles, was du <span className="text-champagne">wissen</span> willst.
            </h1>
          </MotionReveal>
          <MotionReveal delay={0.2}>
            <p className="text-cream/70 text-base md:text-xl leading-relaxed max-w-2xl">
              Die Fragen, die uns Creator vor der Bewerbung am häufigsten
              stellen — offen beantwortet.
            </p>
          </MotionReveal>
        </section>

        <section className="container-luxe pb-20 md:pb-28">
          <div className="max-w-3xl border-t border-champagne/15">
            {FRAGEN.map((f, i) => (
              <MotionReveal key={f.frage} delay={Math.min(i * 0.04, 0.3)}>
                {/* details/summary statt JS-Akkordeon: funktioniert ohne
                    JavaScript, ist tastaturbedienbar und bleibt im HTML
                    auffindbar — wichtig fuer Google. */}
                <details className="group border-b border-champagne/15">
                  <summary className="flex items-start justify-between gap-6 cursor-pointer list-none py-6 md:py-7">
                    <h2 className="font-display italic font-black text-lg md:text-2xl text-cream leading-snug">
                      {f.frage}
                    </h2>
                    <span
                      aria-hidden
                      className="shrink-0 mt-1 text-champagne text-2xl leading-none transition-transform duration-300 group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-cream/65 text-sm md:text-base leading-relaxed pb-7 pr-10 max-w-2xl">
                    {f.antwort}
                  </p>
                </details>
              </MotionReveal>
            ))}
          </div>
        </section>

        <section className="container-luxe pb-24 md:pb-32">
          <MotionReveal>
            <div className="border border-champagne/15 p-8 md:p-12 text-center">
              <h2 className="heading-display text-2xl md:text-4xl text-cream mb-4 leading-tight">
                Bereit für den <span className="text-champagne">nächsten</span> Schritt?
              </h2>
              <p className="text-cream/65 text-sm md:text-base leading-relaxed max-w-xl mx-auto mb-8">
                Zwei Minuten für das Formular, danach schauen wir uns dein
                Profil gemeinsam an.
              </p>
              <Link href="/join" className="btn-primary">
                Creator werden
              </Link>
            </div>
          </MotionReveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
