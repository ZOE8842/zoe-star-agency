"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
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

// Hash-Sentinel für History-Back-Button-Close (Android PWA-Standard)
const HASH = "#nav";

export function MobileNavDrawer({
  items, isAdmin, isManager, displayName, tiktokUsername, avatarUrl,
}: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Stabilisierter Toggle/Close (für Burger-Re-Toggle UND History)
  const close = useCallback(() => setOpen(false), []);
  const toggle = useCallback(() => setOpen((o) => !o), []);

  // Bei Routenwechsel automatisch schließen
  useEffect(() => { setOpen(false); }, [pathname]);

  // Body-Scroll-Lock (iOS-safe: html overflow + touch-action + overscroll-behavior)
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const body = document.body;
    const prevHtmlOverflow = html.style.overflow;
    const prevBodyOverflow = body.style.overflow;
    const prevTouchAction = body.style.touchAction;
    const prevOverscroll = body.style.overscrollBehavior;
    html.style.overflow = "hidden";
    body.style.overflow = "hidden";
    body.style.touchAction = "none";
    body.style.overscrollBehavior = "contain";
    return () => {
      html.style.overflow = prevHtmlOverflow;
      body.style.overflow = prevBodyOverflow;
      body.style.touchAction = prevTouchAction;
      body.style.overscrollBehavior = prevOverscroll;
    };
  }, [open]);

  // ESC schließt
  useEffect(() => {
    if (!open) return;
    function handle(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handle);
    return () => window.removeEventListener("keydown", handle);
  }, [open, close]);

  // History-State · Hardware-Back (Android) + PWA-Swipe schließen Drawer statt Page
  useEffect(() => {
    if (!open) return;
    // Hash setzen (kein neuer Route-Push, nur History-Eintrag)
    if (window.location.hash !== HASH) {
      try { window.history.pushState({ nav: true }, "", HASH); } catch {}
    }
    function onPop() { setOpen(false); }
    window.addEventListener("popstate", onPop);
    return () => {
      window.removeEventListener("popstate", onPop);
      // Sentinel-Hash entfernen wenn noch da (sauber halten ohne History-Verlauf)
      if (window.location.hash === HASH) {
        try { window.history.replaceState({}, "", window.location.pathname + window.location.search); } catch {}
      }
    };
  }, [open]);

  // Swipe-to-close: iOS-PWA-Standalone hat KEINE Back-Geste.
  // Drawer öffnet von rechts → Wischen nach rechts (oder unten) schließt.
  const touchStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const [dragX, setDragX] = useState(0);
  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY, t: Date.now() };
    setDragX(0);
  }, []);
  const onTouchMove = useCallback((e: React.TouchEvent) => {
    const start = touchStart.current;
    if (!start) return;
    const dx = e.touches[0].clientX - start.x;
    if (dx > 0) setDragX(dx);  // nur Right-Swipe (Drawer öffnet von rechts)
  }, []);
  const onTouchEnd = useCallback(() => {
    const start = touchStart.current;
    touchStart.current = null;
    const finalDx = dragX;
    setDragX(0);
    if (!start) return;
    const elapsed = Date.now() - start.t;
    // Swipe-Threshold: >120px ODER schnell (>0.5 px/ms)
    if (finalDx > 120 || (elapsed > 0 && finalDx / elapsed > 0.5 && finalDx > 50)) {
      close();
    }
  }, [dragX, close]);

  const initials = (displayName || tiktokUsername || "")
    .split(/\s+/)
    .map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();

  return (
    <>
      {/* Burger-/Toggle-Button (im Header, nur Mobile)
          Wird bei offenem Drawer ÜBER das Overlay gehoben, damit Re-Toggle möglich ist. */}
      <button
        onClick={toggle}
        aria-label={open ? "Menue schliessen" : "Menue oeffnen"}
        aria-expanded={open}
        aria-controls="zoe-mobile-drawer"
        className={`md:hidden inline-flex items-center justify-center w-11 h-11 -mr-2 transition-colors relative ${
          open ? "z-[10000]" : ""
        }`}
        style={{ color: GOLD }}
      >
        <span className="sr-only">Menue</span>
        {open ? (
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            <line x1="3" y1="3" x2="17" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
            <line x1="17" y1="3" x2="3" y2="17" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="22" height="14" viewBox="0 0 22 14" fill="none" aria-hidden>
            <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="7" x2="22" y2="7" stroke="currentColor" strokeWidth="1.5" />
            <line x1="0" y1="13" x2="22" y2="13" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        )}
      </button>

      {/* Overlay · solides Schwarz + Blur · z-9998 · Klick schliesst */}
      <div
        onClick={close}
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

      {/* Drawer · echtes solides Panel · z-9999 · keine Transparenz
          Swipe-Geste NUR auf dedicated Drag-Handle (linker Edge),
          NICHT auf gesamtes <aside> — sonst werden Tap-Events der
          Nav-Links geschluckt (Regression aus cedcccf). */}
      <aside
        id="zoe-mobile-drawer"
        role="dialog" aria-modal="true" aria-label="Hauptmenue"
        aria-hidden={!open}
        className={`fixed top-0 right-0 h-[100dvh] z-[9999] ${
          dragX > 0 ? "" : "transition-transform duration-300 ease-out"
        } ${open ? "translate-x-0" : "translate-x-full"}`}
        style={{
          width: "88%",
          maxWidth: "430px",
          background: SOLID_BLACK,
          borderLeft: "1px solid rgba(212,175,107,0.22)",
          boxShadow: "-20px 0 80px rgba(0,0,0,0.98)",
          transform: dragX > 0 ? `translateX(${dragX}px)` : undefined,
        }}
      >
        {/* Drag-Handle · 16px breit am linken Drawer-Rand
            Nur HIER sind Touch-Handler aktiv → Nav-Links bleiben tap-bar */}
        <div
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onTouchCancel={onTouchEnd}
          className="absolute top-0 left-0 h-full w-4 z-10"
          style={{ touchAction: "pan-y" }}
          aria-hidden
        >
          {/* visueller Grip-Indikator · vertikaler Champagne-Strich */}
          <div
            className="absolute top-1/2 -translate-y-1/2 left-1.5 w-0.5 h-12 rounded-full opacity-50"
            style={{ background: GOLD }}
          />
        </div>
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
              className="text-lg font-medium"
              style={{ color: GOLD }}
            >
              ZOE⭐️
            </Link>
            <button
              onClick={close}
              aria-label="Menue schliessen"
              className="text-3xl leading-none w-12 h-12 -mr-2 inline-flex items-center justify-center"
              style={{ color: GOLD }}
            >
              ×
            </button>
          </div>

          {/* Schließen-Hint · zeigt 2 Wege: Drag-Handle ODER X */}
          <div
            className="text-center py-1.5 text-[10px] tracking-[0.2em] uppercase"
            style={{
              color: "rgba(212,175,107,0.45)",
              borderBottom: `1px solid ${GOLD_DIVIDER_SOFT}`,
              background: SOLID_BLACK,
            }}
          >
            × oben rechts · oder links am rand wischen
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
              <Image
                src={avatarUrl} alt=""
                width={40} height={40}
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
                  className="block px-6 py-5 text-[17px] active:opacity-70"
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
