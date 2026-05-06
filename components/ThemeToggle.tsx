"use client";

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // SSR-Stub damit kein Flash entsteht
  if (!mounted) {
    return <div className={`w-8 h-8 ${className}`} aria-hidden="true" />;
  }

  const current = (theme === "system" ? resolvedTheme : theme) || "dark";
  const next = current === "dark" ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(next)}
      aria-label={current === "dark" ? "Auf Light-Mode wechseln" : "Auf Dark-Mode wechseln"}
      title={current === "dark" ? "Light-Mode" : "Dark-Mode"}
      className={`inline-flex items-center justify-center w-9 h-9 rounded-full border border-champagne/30 hover:border-champagne text-champagne transition ${className}`}
    >
      {current === "dark" ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
    </button>
  );
}
