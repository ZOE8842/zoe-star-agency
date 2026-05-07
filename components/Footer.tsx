import Link from "next/link";
import { Logo } from "./Logo";
import {
  TikTokIcon,
  InstagramIcon,
  MailIcon,
  ArrowExternalIcon,
  ChatIcon,
} from "./SocialIcons";

const SOCIAL = {
  instagram: "https://www.instagram.com/starzagency_88",
  tiktokMain: "https://www.tiktok.com/@zoe.star.agency",
  tiktokManager: "https://www.tiktok.com/@zoelandoo",
  applyTikTok:
    "https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756",
  email: "info@zoe-star.de",
};

interface SocialCardProps {
  href: string;
  external?: boolean;
  icon: React.ReactNode;
  label: string;
  handle: string;
  meta?: string;
}

function SocialCard({ href, external = true, icon, label, handle, meta }: SocialCardProps) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className="group flex items-center gap-4 border border-champagne/15 hover:border-champagne hover:bg-champagne/5 transition-all duration-300 px-5 py-4 md:px-6 md:py-5"
    >
      <span className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-champagne/8 border border-champagne/30 flex items-center justify-center text-champagne shrink-0 group-hover:bg-champagne/15 transition-colors">
        <span className="w-5 h-5 md:w-[22px] md:h-[22px] inline-block">{icon}</span>
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-cream/45 text-[10px] uppercase tracking-[0.28em] mb-1">{label}</p>
        <p className="text-cream group-hover:text-champagne text-sm md:text-base font-medium truncate transition-colors">
          {handle}
        </p>
        {meta && <p className="text-cream/35 text-xs mt-0.5 truncate">{meta}</p>}
      </div>
      <span className="text-cream/30 group-hover:text-champagne shrink-0 transition-all duration-300 group-hover:translate-x-0.5">
        <ArrowExternalIcon className="w-4 h-4" />
      </span>
    </a>
  );
}

export function Footer() {
  return (
    <footer className="bg-ink border-t border-champagne/15 mt-32 pt-20 pb-12">
      <div className="container-luxe">

        {/* APPLY-CTA — premium, mit shimmer */}
        <div className="border border-champagne/30 bg-champagne/5 p-8 md:p-14 mb-20 text-center relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            aria-hidden
            style={{
              background: "radial-gradient(ellipse 60% 70% at 50% 0%, rgba(201, 168, 106, 0.12), transparent 60%)",
            }}
          />
          <div className="relative z-10">
            <p className="eyebrow mb-3">Creator werden</p>
            <h3 className="font-display italic text-3xl md:text-5xl text-cream mb-5 leading-[1.05]">
              Werde Teil von <span className="text-champagne">ZOE Star Agency</span>.
            </h3>
            <p className="text-cream/65 text-sm md:text-base mb-8 max-w-xl mx-auto leading-relaxed">
              Du bist Creator und willst auf TikTok wachsen? Bewirb dich direkt über
              den offiziellen TikTok-Agency-Link.
            </p>
            <a
              href={SOCIAL.applyTikTok}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-cta btn-shimmer inline-flex"
            >
              Jetzt als Creator bewerben
              <span className="btn-cta-arrow" aria-hidden>→</span>
            </a>
          </div>
        </div>

        {/* SOCIAL-CARDS — 3 prominente Cards + 2 Kontakt-Rows */}
        <div className="mb-16 md:mb-20">
          <p className="eyebrow mb-6 md:mb-8">Connect</p>

          <div className="grid md:grid-cols-3 gap-3 md:gap-4 mb-4 md:mb-5">
            <SocialCard
              href={SOCIAL.tiktokMain}
              icon={<TikTokIcon className="w-full h-full" />}
              label="TikTok · Agency"
              handle="@zoe.star.agency"
              meta="Premium Creator House"
            />
            <SocialCard
              href={SOCIAL.tiktokManager}
              icon={<TikTokIcon className="w-full h-full" />}
              label="TikTok · Founder"
              handle="@zoelandoo"
              meta="Behind the scenes"
            />
            <SocialCard
              href={SOCIAL.instagram}
              icon={<InstagramIcon className="w-full h-full" />}
              label="Instagram"
              handle="@starzagency_88"
              meta="Visual Magazine"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-3 md:gap-4">
            <SocialCard
              href={`mailto:${SOCIAL.email}`}
              external={false}
              icon={<MailIcon className="w-full h-full" />}
              label="Email · direkt"
              handle={SOCIAL.email}
              meta="Antwort innerhalb 48h"
            />
            <SocialCard
              href="/contact"
              external={false}
              icon={<ChatIcon className="w-full h-full" />}
              label="Kontaktformular"
              handle="Persönliche Anfrage"
              meta="Brands · Press · Cooperation"
            />
          </div>
        </div>

        {/* NAVIGATION + RECHTLICHES + ADRESSE — kompakte Struktur */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 md:gap-8 mb-14">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Logo variant="horizontal" className="h-9 mb-5" />
            <p className="text-cream/55 text-sm leading-relaxed max-w-xs">
              Premium Creator House.<br />
              Boutique-Management aus Berlin.
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

          {/* Adresse */}
          <div>
            <p className="eyebrow mb-5">Adresse</p>
            <p className="text-cream/55 text-xs leading-relaxed">
              ZOE Star Agency<br />
              c/o SourceArt<br />
              Tuttlingerstraße 45<br />
              78333 Stockach
            </p>
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
