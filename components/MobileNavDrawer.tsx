"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

const SOLID_BLACK = "#050505";
const GOLD = "#d4af6b";
const GOLD_TEXT = "#f5e7ce";
const GOLD_DIVIDER = "rgba(212,175,107,0.10)";
const GOLD_DIVIDER_SOFT = "rgba(212,175,107,0.08)";
const ACTIVE_BG = "#14110c";

export function MobileNavDrawer({
  items, isAdmin, isManager, displayName, tiktokUsername, avatarUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
  }, [open]);

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
      {/* Burger-Button (im Header, nur Mobile) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Menue oeffnen"
        className="md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2"
        style={{ color: GOLD }}
      >
        <span className="sr-only">Menue</span>
        <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
          <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" />
          <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </button>

      {/* Overlay · solides Schwarz + Blur · z-9998 */}
      <div
        onClick={() => setOpen(false)}
        aria-hidden
        className={`fixed inset-0 z-[9998] transition-all duration-300 ${
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        }`}
        style={{
          background: "rgba(0,0,0,0.96)",
          backdropFilter: "blur(14px)",
          WebkitBackdropFilter: "blur(14px)",
        }}
      />

      {/* Drawer · echtes solides Panel · z-9999 · keine Transparenz */}
      <aside
        role="dialog" aria-modal="true" aria-label="Hauptmenue"
        className={`fixed top-0 right-0 h-screen z-[9999] transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          width: "88%",
          maxWidth: "430px",
          background: SOLID_BLACK,
          borderLeft: "1px solid rgba(212,175,107,0.22)",
          boxShadow: "-20px 0 80px rgba(0,0,0,0.98)",
        }}
      >
        <div
          className="flex flex-col"
          style={{ background: SOLID_BLACK, minHeight: "100%" }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-6"
            style={{
              height: "72px",
              borderBottom: `1px solid ${GOLD_DIVIDER}`,
              background: SOLID_BLACK,
            }}
          >
            <Link
              href="/portal"
              onClick={() => setOpen(false)}
              className="text-lg font-medium"
              style={{ color: GOLD }}
            >
              ZOE⭐️
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Menue schliessen"
              className="text-3xl leading-none w-11 h-11 -mr-2 inline-flex items-center justify-center"
              style={{ color: GOLD }}
            >
              ×
            </button>
          </div>

          {/* User-Card */}
          <div
            className="px-6 py-5 flex items-center gap-3"
            style={{
              background: SOLID_BLACK,
              borderBottom: `1px solid ${GOLD_DIVIDER_SOFT}`,
            }}
          >
            {avatarUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={avatarUrl} alt="" loading="lazy"
                className="w-10 h-10 rounded-full object-cover"
                style={{ border: "1px solid rgba(212,175,107,0.30)" }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-display italic"
                style={{
                  background: "rgba(212,175,107,0.08)",
                  border: "1px solid rgba(212,175,107,0.30)",
                  color: GOLD,
                }}
              >
                {initials || "?"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="text-lg font-medium truncate" style={{ color: GOLD_TEXT }}>
                {displayName || "Creator"}
              </div>
              {tiktokUsername && (
                <div className="text-sm mt-0.5 truncate" style={{ color: "#9f8d6a" }}>
                  @{tiktokUsername}
                </div>
              )}
            </div>
          </div>

          {/* Nav · ALLES inline-style damit nichts durchscheint */}
          <nav className="flex-1" style={{ background: SOLID_BLACK }}>
            {items.map((it) => {
              const active = pathname === it.href || (it.href !== "/portal" && pathname?.startsWith(it.href));
              return (
                <Link
                  key={it.href}
                  href={it.href}
                  className="block px-6 py-5 text-[17px]"
                  style={{
                    color: active ? GOLD : GOLD_TEXT,
                    background: active ? ACTIVE_BG : SOLID_BLACK,
                    borderBottom: `1px solid ${GOLD_DIVIDER_SOFT}`,
                  }}
                >
                  {it.label}
                </Link>
              );
            })}
            {/* V4: Admin/Manager-Master ist bereits als erster Nav-Punkt
                ueber buildNavItems eingebaut. Kein parallel-Eintrag mehr. */}
          </nav>

          {/* Logout · solid Card-Style */}
          <div
            className="p-6"
            style={{
              background: SOLID_BLACK,
              borderTop: `1px solid ${GOLD_DIVIDER_SOFT}`,
            }}
          >
            <form action="/portal/logout" method="post">
              <button
                type="submit"
                className="w-full py-4 text-left px-4"
                style={{
                  color: GOLD_TEXT,
                  background: "#111111",
                  border: "1px solid rgba(212,175,107,0.14)",
                }}
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
