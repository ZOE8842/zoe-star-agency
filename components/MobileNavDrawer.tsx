"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./Logo";

interface NavItem {
  href: string;
  label: string;
}

interface Props {
  items: NavItem[];
  isAdmin?: boolean;
  isManager?: boolean;
  displayName: string;
  tiktokUsername?: string | null;
  avatarUrl?: string | null;
}

export function MobileNavDrawer({
  items, isAdmin, isManager, displayName, tiktokUsername, avatarUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Bei Pfad-Wechsel automatisch zu
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Body-Scroll-Lock waehrend offen
  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

  // ESC schliesst
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open]);

  const initials = (displayName || tiktokUsername || "")
    .split(/\s+/)
    .map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Menue oeffnen"
        className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 text-champagne hover:text-champagne-300"
      >
        <span className="sr-only">Menue</span>
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
          <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Overlay — schwerer Black + starker Blur damit Dashboard nicht durchscheint */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 bg-black/85 backdrop-blur-md z-[60] transition-opacity duration-300 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Drawer — solides Schwarz, kein transluzentes ink-Layer mehr */}
      <aside
        role="dialog" aria-modal="true" aria-label="Hauptmenue"
        className={`fixed inset-y-0 right-0 w-[86%] max-w-[420px] bg-[#050505] border-l border-[#3a2a18] shadow-2xl shadow-black/80 overflow-y-auto z-[61] transform transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-champagne/10">
          <Link href="/portal" aria-label="ZOE Star Agency" onClick={() => setOpen(false)}>
            <Logo variant="horizontal" className="h-7" />
          </Link>
          <button
            onClick={() => setOpen(false)}
            aria-label="Menue schliessen"
            className="inline-flex items-center justify-center w-11 h-11 -mr-2 text-cream/55 hover:text-champagne"
          >
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden>
              <line x1="2" y1="2" x2="20" y2="20" stroke="currentColor" strokeWidth="1.5" />
              <line x1="20" y1="2" x2="2" y2="20" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-5 border-b border-champagne/10 flex items-center gap-3">
          {avatarUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-champagne/30" loading="lazy" />
          ) : (
            <div className="w-10 h-10 rounded-full bg-champagne/10 border border-champagne/30 flex items-center justify-center text-champagne text-sm font-display italic">
              {initials || "?"}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-cream text-sm font-medium truncate">{displayName || "Creator"}</p>
            {tiktokUsername && (
              <p className="text-cream/45 text-xs truncate">@{tiktokUsername}</p>
            )}
          </div>
        </div>

        <nav className="px-3 py-3">
          {items.map((it) => {
            const active = pathname === it.href || (it.href !== "/portal" && pathname?.startsWith(it.href));
            return (
              <Link
                key={it.href}
                href={it.href}
                className={`block px-4 py-4 text-base transition-colors ${
                  active
                    ? "text-champagne bg-[#111111]"
                    : "text-[#f5e7ce] hover:bg-[#111111] active:bg-[#161616]"
                }`}
              >
                {it.label}
              </Link>
            );
          })}
          {(isAdmin || isManager) && (
            <Link
              href={isAdmin ? "/portal/admin" : "/portal/manager"}
              className="block px-4 py-4 text-base text-champagne hover:bg-champagne/[0.06] border-t border-champagne/10 mt-2"
            >
              {isAdmin ? "Admin" : "Manager"}
            </Link>
          )}
        </nav>

        <div className="px-3 pb-6 pt-2 border-t border-champagne/10 mt-2">
          <form action="/portal/logout" method="post">
            <button
              type="submit"
              className="w-full text-left px-4 py-4 text-cream/55 hover:text-champagne text-sm"
            >
              Logout
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
