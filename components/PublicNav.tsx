"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { LanguageSwitch } from "./LanguageSwitch";

const NAV_ITEMS = [
  { href: "/agency", label: "Agency" },
  { href: "/about", label: "Über uns" },
  { href: "/kooperationen", label: "Kooperationen" },
  { href: "/join", label: "Creator werden" },
  { href: "/contact", label: "Kontakt" },
];

export function PublicNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "bg-ink/85 backdrop-blur-md border-b border-champagne/10" : "bg-transparent"
        }`}
      >
        <div className="container-luxe py-4 md:py-5 flex items-center justify-between gap-4">
          <Link href="/" aria-label="ZOE Star Agency" className="shrink-0 inline-flex items-center">
            <Logo variant="horizontal" className="h-10 md:h-11" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-8">
            {NAV_ITEMS.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className="link-underline text-cream/80 hover:text-champagne text-[11px] uppercase tracking-[0.25em] transition-colors py-3"
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2 md:gap-3">
            <LanguageSwitch className="hidden md:block" />
            <ThemeToggle className="hidden md:inline-flex" />
            <Link
              href="/portal/login"
              className="hidden md:inline-flex text-champagne text-[11px] uppercase tracking-[0.3em] hover:text-champagne-300 transition px-3 py-3 items-center min-h-[40px]"
            >
              Login
            </Link>

            {/* Mobile Hamburger */}
            <button
              type="button"
              aria-label={open ? "Menü schließen" : "Menü öffnen"}
              aria-expanded={open}
              onClick={() => setOpen((s) => !s)}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 text-champagne"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                {open ? (
                  <>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </>
                ) : (
                  <>
                    <line x1="3" y1="7" x2="21" y2="7" />
                    <line x1="3" y1="12" x2="21" y2="12" />
                    <line x1="3" y1="17" x2="21" y2="17" />
                  </>
                )}
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer — Premium */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-500 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        <div className="absolute inset-0 bg-ink/[0.97] backdrop-blur-2xl" onClick={() => setOpen(false)} />
        <div className="relative h-full flex flex-col pt-32 pb-12 px-8 sm:px-12 overflow-y-auto">
          <p
            className="eyebrow mb-10 text-cream/40"
            style={{ animation: open ? "hero-rise 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s both" : "none" }}
          >
            Navigation
          </p>

          <nav className="flex flex-col gap-2 mb-16">
            {NAV_ITEMS.map((it, i) => (
              <Link
                key={it.href}
                href={it.href}
                onClick={() => setOpen(false)}
                style={{
                  animation: open
                    ? `hero-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) ${0.12 + i * 0.07}s both`
                    : "none",
                }}
                className="font-display italic text-[44px] sm:text-[56px] text-cream hover:text-champagne py-4 leading-none tracking-[-0.02em] transition-colors"
              >
                {it.label}
              </Link>
            ))}
          </nav>

          <div
            className="flex flex-col gap-3 mb-10"
            style={{
              animation: open ? "hero-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both" : "none",
            }}
          >
            <a
              href="https://web16-normal-useastred.tiktokw.eu/tcn/scout_creators?use_spark=1&agency_scout_source=qr_code_leads&ShareLinkID=7554019883420319756"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full justify-center"
            >
              Als Creator bewerben
            </a>
            <Link
              href="/portal/login"
              onClick={() => setOpen(false)}
              className="btn-outline w-full justify-center"
            >
              Login
            </Link>
          </div>

          <div
            className="flex items-center gap-3 mt-auto pt-8 border-t border-cream/[0.05]"
            style={{
              animation: open ? "hero-rise 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.7s both" : "none",
            }}
          >
            <LanguageSwitch />
            <ThemeToggle />
            <p className="ml-auto text-cream/30 text-[10px] uppercase tracking-[0.3em]">
              ZOE · {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
