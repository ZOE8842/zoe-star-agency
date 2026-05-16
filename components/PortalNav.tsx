import { Suspense } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { ThemeToggle } from "./ThemeToggle";
import { InboxIndicator } from "./InboxIndicator";
import { MobileNavDrawer } from "./MobileNavDrawer";

// V3 Nav-Reduktion: Showcase ist Profil-Toggle (Profile-Reiter),
// Support ist Card unter /portal/services.
//
// V4 Nav-Refactor: Admin/Manager bekommen "MASTER" → /portal/admin
// statt parallelem "Dashboard" + "Admin"-Extralink.
//
// V7 (2026-05-16): "Ranking" wird zu Admin-LIVE-Analyse, NUR fuer Admin
// sichtbar. Manager verliert den Reiter (Scope-Verschaerfung User-Decision).
function buildNavItems(isStaff: boolean, isAdmin: boolean) {
  const items: Array<{ href: string; label: string; indicator?: true }> = [
    isStaff
      ? { href: "/portal/admin", label: "Master" }
      : { href: "/portal", label: "Dashboard" },
    { href: "/portal/inbox", label: "Inbox", indicator: true as const },
    { href: "/portal/analyse", label: "Analyse" },
    { href: "/portal/events", label: "Events" },
    { href: "/portal/services", label: "Services" },
    { href: "/portal/academy", label: "Academy" },
    { href: "/portal/info", label: "Info" },
    { href: "/portal/profile", label: "Profile" },
  ];
  // V7: Admin-LIVE-Analyse nur fuer Admin, nicht fuer Manager
  if (isAdmin) {
    items.splice(1, 0, { href: "/portal/admin/ranking", label: "LIVE-Analyse" });
  }
  return items;
}

interface Props {
  userId?: string;
  displayName: string;
  /** @deprecated email wird nicht mehr in der UI angezeigt (V3 Datenschutz) */
  email?: string;
  tiktokUsername?: string | null;
  isAdmin?: boolean;
  isManager?: boolean;
  avatarUrl?: string | null;
}

export function PortalNav({ userId, displayName, tiktokUsername, isAdmin, isManager, avatarUrl }: Props) {
  const isStaff = !!isAdmin || !!isManager;
  const navItems = buildNavItems(isStaff, !!isAdmin);
  // V3-Datenschutz: keine Email-Initials. Fallback ist Display-Name oder
  // TikTok-Username (kein PII).
  const initials = (displayName || tiktokUsername || "")
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="border-b border-champagne/10 sticky top-0 bg-ink/95 backdrop-blur z-50">
      <div className="container-luxe py-4 flex items-center justify-between gap-4 md:gap-6">
        <Link href="/portal" aria-label="ZOE Star Agency" className="shrink-0">
          <Logo variant="horizontal" className="h-7 md:h-8" />
        </Link>

        {/* Desktop / Tablet ab md: voller User-Block + Logout */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <span className="text-cream/50 text-[10px] uppercase tracking-[0.25em] truncate max-w-[180px]">
            {displayName || (tiktokUsername ? `@${tiktokUsername}` : "Creator")}
          </span>
          {userId && (
            <Suspense fallback={null}>
              <InboxIndicator userId={userId} variant="bell" />
            </Suspense>
          )}
          <ThemeToggle />
          <Link
            href="/portal/profile"
            aria-label="Profile"
            className="shrink-0 p-1 -m-1 inline-flex"
          >
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                loading="lazy"
                className="w-9 h-9 rounded-full object-cover border border-champagne/30 hover:border-champagne transition"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-champagne/10 border border-champagne/30 hover:border-champagne flex items-center justify-center text-champagne text-xs font-display italic transition">
                {initials || "?"}
              </div>
            )}
          </Link>
          <form action="/portal/logout" method="post">
            <button className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] inline-flex items-center min-h-[40px] px-3">
              Logout
            </button>
          </form>
        </div>

        {/* Mobile: Bell + Burger-Drawer */}
        <div className="md:hidden flex items-center gap-1 shrink-0">
          {userId && (
            <Suspense fallback={null}>
              <InboxIndicator userId={userId} variant="bell" />
            </Suspense>
          )}
          <MobileNavDrawer
            items={navItems.map(({ href, label }) => ({ href, label }))}
            isAdmin={isAdmin}
            isManager={isManager}
            displayName={displayName}
            tiktokUsername={tiktokUsername}
            avatarUrl={avatarUrl}
          />
        </div>
      </div>

      {/* Desktop-Sub-Nav · Mobile hidden */}
      <nav className="hidden md:flex container-luxe pb-1 -mt-1 items-center gap-5 overflow-x-auto">
        {navItems.map(({ href, label, indicator }) => (
          <Link
            key={href}
            href={href}
            className="text-cream/70 hover:text-champagne text-[10px] uppercase tracking-[0.25em] transition-colors whitespace-nowrap py-3 inline-flex items-center"
          >
            <span>{label}</span>
            {indicator && userId && (
              <Suspense fallback={null}>
                <InboxIndicator userId={userId} />
              </Suspense>
            )}
          </Link>
        ))}
        {/* V4: Admin/Manager-Extra-Links wurden in den ersten Nav-Punkt
            ("Master" → /portal/admin) konsolidiert. Kein paralleles
            "Dashboard + Admin" mehr. */}
      </nav>
    </header>
  );
}
