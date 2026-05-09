import Link from "next/link";
import { Logo } from "./Logo";

const SOCIAL = {
  email: "info@zoe-star.de",
  tiktokMain: "https://www.tiktok.com/@zoe.star.agency",
  instagram: "https://www.instagram.com/starzagency_88",
};

export function Footer() {
  return (
    <footer className="bg-ink border-t border-champagne/10 mt-20 pt-12 pb-6 md:pt-14 md:pb-8">
      <div className="container-luxe">

        {/* Top: Logo + Quick-Links */}
        <div className="grid md:grid-cols-12 gap-8 md:gap-10 mb-10">
          {/* Brand */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-block mb-4" aria-label="ZOE Star Agency">
              <Logo variant="horizontal" className="h-7" />
            </Link>
            <p className="text-cream/50 text-xs leading-relaxed max-w-xs">
              TikTok LIVE Creator Management. Persönliche Betreuung, langfristiger Aufbau.
            </p>
            <p className="text-champagne/70 text-[10px] uppercase tracking-[0.28em] mt-4">
              TikTok Elite Agency Club Deutschland
            </p>
          </div>

          {/* Navigation */}
          <div className="md:col-span-3">
            <p className="eyebrow mb-4">Agency</p>
            <ul className="space-y-2 text-cream/70 text-sm">
              <li><Link href="/agency" className="hover:text-champagne transition-colors">Creator</Link></li>
              <li><Link href="/kooperationen" className="hover:text-champagne transition-colors">Kooperationen</Link></li>
              <li><Link href="/about" className="hover:text-champagne transition-colors">Über uns</Link></li>
              <li><Link href="/join" className="hover:text-champagne transition-colors">Bewerbung</Link></li>
              <li><Link href="/contact" className="hover:text-champagne transition-colors">Kontakt</Link></li>
            </ul>
          </div>

          {/* Social */}
          <div className="md:col-span-3">
            <p className="eyebrow mb-4">Social</p>
            <ul className="space-y-2 text-cream/70 text-sm">
              <li>
                <a href={SOCIAL.tiktokMain} target="_blank" rel="noopener noreferrer" className="hover:text-champagne transition-colors">
                  TikTok
                </a>
              </li>
              <li>
                <a href={SOCIAL.instagram} target="_blank" rel="noopener noreferrer" className="hover:text-champagne transition-colors">
                  Instagram
                </a>
              </li>
              <li>
                <a href={`mailto:${SOCIAL.email}`} className="hover:text-champagne transition-colors">
                  {SOCIAL.email}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal + Portal */}
          <div className="md:col-span-2">
            <p className="eyebrow mb-4">Legal</p>
            <ul className="space-y-2 text-cream/70 text-sm">
              <li><Link href="/legal/impressum" className="hover:text-champagne transition-colors">Impressum</Link></li>
              <li><Link href="/legal/datenschutz" className="hover:text-champagne transition-colors">Datenschutz</Link></li>
              <li><Link href="/legal/agb" className="hover:text-champagne transition-colors">AGB</Link></li>
              <li><Link href="/portal/login" className="text-cream/45 hover:text-cream/70 transition-colors text-xs">Portal</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-champagne/10 pt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <p className="text-cream/35 text-[10px] uppercase tracking-[0.28em]">
            © {new Date().getFullYear()} ZOE⭐ Star Agency
          </p>
          <p className="text-cream/30 text-[10px] uppercase tracking-[0.28em]">
            TikTok LIVE Creator Management
          </p>
        </div>
      </div>
    </footer>
  );
}
