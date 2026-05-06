import Link from "next/link";
import { Logo } from "./Logo";

const navItems = [
  { href: "/portal", label: "Dashboard" },
  { href: "/portal/inbox", label: "Inbox" },
  { href: "/portal/events", label: "Events" },
  { href: "/portal/slots", label: "Slots" },
  { href: "/portal/downloads", label: "Downloads" },
  { href: "/portal/info", label: "Info" },
  { href: "/portal/support", label: "Support" },
  { href: "/portal/profile", label: "Profile" },
];

interface Props {
  displayName: string;
  email: string;
  isAdmin?: boolean;
  isManager?: boolean;
  avatarUrl?: string | null;
}

export function PortalNav({ displayName, email, isAdmin, isManager, avatarUrl }: Props) {
  const initials = (displayName || email)
    .split(/\s+/)
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <header className="border-b border-champagne/10 sticky top-0 bg-ink/95 backdrop-blur z-50">
      <div className="container-luxe py-4 flex items-center justify-between gap-6">
        <Link href="/portal" aria-label="ZOE Star Agency" className="shrink-0">
          <Logo variant="horizontal" className="h-8" />
        </Link>

        <div className="flex items-center gap-4 shrink-0">
          <span className="hidden sm:block text-cream/50 text-[10px] uppercase tracking-[0.25em] truncate max-w-[180px]">
            {displayName || email}
          </span>
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
                className="w-9 h-9 rounded-full object-cover border border-champagne/30 hover:border-champagne transition"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-champagne/10 border border-champagne/30 hover:border-champagne flex items-center justify-center text-champagne text-xs font-display italic transition">
                {initials || "?"}
              </div>
            )}
          </Link>
          <form action="/portal/logout" method="post">
            <button className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] py-2 px-1">
              Logout
            </button>
          </form>
        </div>
      </div>

      <nav className="container-luxe pb-3 -mt-1 flex items-center gap-6 overflow-x-auto">
        {navItems.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className="text-cream/70 hover:text-champagne text-[10px] uppercase tracking-[0.25em] transition-colors whitespace-nowrap"
          >
            {label}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/portal/admin" className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] whitespace-nowrap">
            Admin
          </Link>
        )}
        {isManager && !isAdmin && (
          <Link href="/portal/manager" className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] whitespace-nowrap">
            Manager
          </Link>
        )}
      </nav>
    </header>
  );
}
