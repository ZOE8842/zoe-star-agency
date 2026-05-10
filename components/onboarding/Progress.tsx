"use client";

// Onboarding-Progress — feiner Gold-Strich oben, kein Counter.
// Animiert smooth via CSS width-transition. Bewusst minimal:
// gibt Position ohne Aufmerksamkeit zu klauen.

interface ProgressProps {
  step: number; // 0-indexed
  total: number;
}

export function OnboardingProgress({ step, total }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, ((step + 1) / total) * 100));
  return (
    <div
      className="fixed top-0 inset-x-0 z-40 h-px bg-champagne/10 pointer-events-none"
      role="progressbar"
      aria-valuenow={step + 1}
      aria-valuemin={1}
      aria-valuemax={total}
    >
      <div
        className="h-full bg-gradient-to-r from-champagne/40 via-champagne to-champagne/40 transition-[width] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
