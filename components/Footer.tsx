import Link from "next/link";
import { Logo } from "./Logo";

const footerNav = {
  Company: [
    { href: "/agency", label: "Agency" },
    { href: "/about", label: "About" },
    { href: "/journal", label: "Journal" },
    { href: "/press", label: "Press" },
  ],
  Talent: [
    { href: "/talent", label: "Roster" },
    { href: "/join", label: "Join as Creator" },
  ],
  Brands: [
    { href: "/media", label: "Media" },
    { href: "/contact", label: "Partnerships" },
  ],
  Connect: [
    { href: "https://tiktok.com/@zoestar.agency", label: "TikTok" },
    { href: "https://instagram.com/zoestar.agency", label: "Instagram" },
    { href: "https://linkedin.com/company/zoe-star-agency", label: "LinkedIn" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-ink border-t border-champagne/20 mt-32 pt-24 pb-12">
      <div className="container-luxe">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 md:col-span-1">
            <Logo variant="horizontal" className="h-10 mb-6" />
            <p className="text-cream/60 text-sm leading-relaxed max-w-xs">
              Premium Talent · Media · Entertainment · Built for the next era of creators.
            </p>
          </div>

          {Object.entries(footerNav).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="eyebrow mb-5">{heading}</h4>
              <ul className="space-y-3">
                {links.map(({ href, label }) => (
                  <li key={href}>
                    <Link
                      href={href}
                      className="text-cream/70 hover:text-champagne text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-champagne/10 pt-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <p className="text-cream/40 text-xs uppercase tracking-[0.25em]">
            © {new Date().getFullYear()} ZOE Star Agency
          </p>
          <div className="flex gap-6">
            <Link href="/legal" className="text-cream/40 hover:text-champagne text-xs uppercase tracking-[0.25em]">Legal</Link>
            <Link href="/legal#privacy" className="text-cream/40 hover:text-champagne text-xs uppercase tracking-[0.25em]">Privacy</Link>
            <Link href="/legal#imprint" className="text-cream/40 hover:text-champagne text-xs uppercase tracking-[0.25em]">Imprint</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
