import Link from "next/link";
import { Logo } from "./Logo";

const SOCIAL = {
  instagram: "https://www.instagram.com/starzagency_88",
  tiktokMain: "https://www.tiktok.com/@zoe.star.agency",
  tiktokManager: "https://www.tiktok.com/@zoelandoo",
  applyTikTok:
    "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756",
  email: "info@zoe-star.de",
};

export function Footer() {
  return (
    <footer className="bg-ink border-t border-champagne/15 mt-32 pt-20 pb-12">
      <div className="container-luxe">
        {/* Apply CTA */}
        <div className="border border-champagne/30 bg-champagne/5 p-8 md:p-12 mb-20 text-center">
          <p className="eyebrow mb-3">Creator werden</p>
          <h3 className="font-display italic text-2xl md:text-4xl text-cream mb-4 leading-tight">
            Werde Teil von <span className="text-champagne">ZOE Star Agency</span>.
          </h3>
          <p className="text-cream/60 text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed">
            Du bist Creator und willst auf TikTok wachsen? Bewirb dich direkt über
            den offiziellen TikTok-Agency-Link.
          </p>
          <a
            href={SOCIAL.applyTikTok}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary inline-flex"
          >
            Jetzt als Creator bewerben
          </a>
        </div>

        {/* 5-Spalten Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 md:gap-8 mb-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo variant="horizontal" className="h-10 mb-5" />
            <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
              Premium Creator Agency.<br />
              Talent · Media · Events · Studio.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <p className="eyebrow mb-5">Navigation</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/agency" className="text-cream/70 hover:text-champagne transition-colors">Agency</Link></li>
              <li><Link href="/about" className="text-cream/70 hover:text-champagne transition-colors">Über uns</Link></li>
              <li><Link href="/kooperationen" className="text-cream/70 hover:text-champagne transition-colors">Kooperationen</Link></li>
              <li><Link href="/join" className="text-cream/70 hover:text-champagne transition-colors">Creator werden</Link></li>
              <li><Link href="/contact" className="text-cream/70 hover:text-champagne transition-colors">Kontakt</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div>
            <p className="eyebrow mb-5">Social</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={SOCIAL.tiktokMain} target="_blank" rel="noopener noreferrer" className="text-cream/70 hover:text-champagne transition-colors">
                  TikTok · @zoe.star.agency
                </a>
              </li>
              <li>
                <a href={SOCIAL.tiktokManager} target="_blank" rel="noopener noreferrer" className="text-cream/70 hover:text-champagne transition-colors">
                  TikTok · @zoelandoo
                </a>
              </li>
              <li>
                <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="text-cream/70 hover:text-champagne transition-colors">
                  Instagram · @starzagency_88
                </a>
              </li>
            </ul>
          </div>

          {/* Kontakt */}
          <div>
            <p className="eyebrow mb-5">Kontakt</p>
            <ul className="space-y-3 text-sm">
              <li>
                <a href={`mailto:${SOCIAL.email}`} className="text-cream/70 hover:text-champagne transition-colors">
                  {SOCIAL.email}
                </a>
              </li>
              <li>
                <Link href="/contact" className="text-cream/70 hover:text-champagne transition-colors">
                  Kontaktformular
                </Link>
              </li>
              <li className="text-cream/40 text-xs leading-relaxed pt-3">
                ZOE Star Agency<br />
                c/o SourceArt<br />
                Tuttlingerstraße 45<br />
                78333 Stockach
              </li>
            </ul>
          </div>

          {/* Rechtliches */}
          <div>
            <p className="eyebrow mb-5">Rechtliches</p>
            <ul className="space-y-3 text-sm">
              <li><Link href="/legal/impressum" className="text-cream/70 hover:text-champagne transition-colors">Impressum</Link></li>
              <li><Link href="/legal/datenschutz" className="text-cream/70 hover:text-champagne transition-colors">Datenschutz</Link></li>
              <li><Link href="/legal/agb" className="text-cream/70 hover:text-champagne transition-colors">AGB</Link></li>
              <li><Link href="/legal/portal-regeln" className="text-cream/70 hover:text-champagne transition-colors">Portal-Regeln</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-champagne/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-cream/40 text-xs uppercase tracking-[0.25em]">
            © {new Date().getFullYear()} ZOE Star Agency · Alle Rechte vorbehalten
          </p>
          <p className="text-cream/30 text-[10px] uppercase tracking-[0.3em]">
            Premium Talent · Media · Entertainment
          </p>
        </div>
      </div>
    </footer>
  );
}
