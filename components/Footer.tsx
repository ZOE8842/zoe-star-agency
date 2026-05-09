import Link from "next/link";
import { Logo } from "./Logo";

const SOCIAL = {
  email: "info@zoe-star.de",
};

export function Footer() {
  return (
    <footer className="bg-ink border-t border-champagne/10 mt-20 pt-10 pb-6 md:pt-12 md:pb-8">
      <div className="container-luxe">
        {/* Single-row layout: Logo · Legal-Links · Copyright */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 md:gap-8">
          <Link href="/" className="shrink-0" aria-label="ZOE Star Agency">
            <Logo variant="horizontal" className="h-7" />
          </Link>

          <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-cream/55 text-[11px] uppercase tracking-[0.22em]">
            <Link href="/legal/impressum" className="hover:text-champagne transition-colors">Impressum</Link>
            <Link href="/legal/datenschutz" className="hover:text-champagne transition-colors">Datenschutz</Link>
            <Link href="/legal/agb" className="hover:text-champagne transition-colors">AGB</Link>
            <Link href="/legal/portal-regeln" className="hover:text-champagne transition-colors">Portal</Link>
            <Link href="/contact" className="hover:text-champagne transition-colors">Kontakt</Link>
            <a href={`mailto:${SOCIAL.email}`} className="hover:text-champagne transition-colors">
              {SOCIAL.email}
            </a>
          </nav>

          <p className="text-cream/35 text-[10px] uppercase tracking-[0.28em] shrink-0">
            © {new Date().getFullYear()} ZOE Star Agency
          </p>
        </div>
      </div>
    </footer>
  );
}
