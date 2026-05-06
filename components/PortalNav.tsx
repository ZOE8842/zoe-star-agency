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
}

export function PortalNav({ displayName, email, isAdmin, isManager }: Props) {
  return (
    <header className="border-b border-champagne/10 sticky top-0 bg-ink/95 backdrop-blur z-50">
      <div className="container-luxe py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-10">
          <Link href="/portal" aria-label="ZOE Star Agency">
            <Logo variant="horizontal" className="h-8" />
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-cream/70 hover:text-champagne text-[10px] uppercase tracking-[0.25em] transition-colors"
              >
                {label}
              </Link>
            ))}
            {isAdmin && (
              <Link
                href="/portal/admin"
                className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
              >
                Admin
              </Link>
            )}
            {isManager && !isAdmin && (
              <Link
                href="/portal/manager"
                className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
              >
                Manager
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-5">
          <span className="hidden sm:block text-cream/50 text-[10px] uppercase tracking-[0.25em]">
            {displayName || email}
          </span>
          <form action="/portal/logout" method="post">
            <button className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]">
              Logout
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
