import Link from "next/link";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface Props {
  eyebrow: string;
  title: string;
  subtitle?: string;
  applyCta?: boolean;
}

export function ComingSoonPage({ eyebrow, title, subtitle, applyCta = false }: Props) {
  return (
    <>
      <Header />
      <main className="container-luxe min-h-screen flex items-center pt-32 pb-20">
        <div className="max-w-2xl mx-auto text-center w-full">
          <p className="eyebrow mb-6">{eyebrow}</p>
          <h1 className="heading-display text-4xl md:text-6xl mb-6 leading-tight">
            {title.split(" ").map((word, i, arr) => (
              <span key={i}>
                {i === arr.length - 1 ? <span className="text-champagne">{word}</span> : word}
                {i < arr.length - 1 ? " " : ""}
              </span>
            ))}
          </h1>
          <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-10 max-w-xl mx-auto">
            {subtitle || "Diese Seite ist gerade in Arbeit. Wir arbeiten an einem Premium-Erlebnis und melden uns mit dem Launch."}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {applyCta && (
              <a
                href="https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                Als Creator bewerben
              </a>
            )}
            <Link href="/contact" className="btn-outline">
              Kontakt aufnehmen
            </Link>
            <Link href="/" className="text-cream/50 hover:text-champagne text-[11px] uppercase tracking-[0.3em] transition px-2 py-3">
              ← Zur Startseite
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
