"use client";

import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitch } from "./LanguageSwitch";

export function Header() {
  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="container-luxe py-6 flex items-center justify-between gap-4">
        <Link href="/" aria-label="ZOE Star Agency Home">
          <Logo variant="horizontal" className="h-12" />
        </Link>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitch />
          <ThemeToggle />
          <Link
            href="/portal/login"
            className="text-champagne text-[11px] uppercase tracking-[0.3em] hover:text-champagne-300 transition px-2 py-3 inline-flex items-center min-h-[40px]"
          >
            Login
          </Link>
          <Link
            href="/contact"
            className="btn-outline text-[11px] py-3 px-5 hidden sm:inline-flex"
          >
            Kontakt
          </Link>
        </div>
      </div>
    </header>
  );
}
