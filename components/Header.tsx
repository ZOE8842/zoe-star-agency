"use client";

import Link from "next/link";
import { Logo } from "./Logo";

const navLinks = [
  { href: "/agency", label: "Agency" },
  { href: "/talent", label: "Talent" },
  { href: "/media", label: "Media" },
  { href: "/events", label: "Events" },
  { href: "/studio", label: "Studio" },
  { href: "/journal", label: "Journal" },
];

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container-luxe py-6 flex items-center justify-between">
        <Link href="/" aria-label="ZOE Star Agency Home">
          <Logo variant="horizontal" className="h-12" />
        </Link>

        <nav className="hidden lg:flex items-center gap-10">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-cream/80 hover:text-champagne text-[12px] uppercase tracking-[0.3em] transition-colors duration-300"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/portal/login"
            className="text-champagne text-[12px] uppercase tracking-[0.3em] hover:text-champagne-300 transition"
          >
            Login
          </Link>
          <Link href="/contact" className="btn-outline text-[11px] py-3 px-5 hidden md:inline-flex">
            Contact
          </Link>
        </div>
      </div>
    </header>
  );
}
