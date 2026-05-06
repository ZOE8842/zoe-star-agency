// ZOE Logo · Inline-SVG aus final_master Trace
// Bewusst inline für SSR-Performance + Theming

interface LogoProps {
  variant?: "horizontal" | "monogram" | "avatar";
  className?: string;
}

export function Logo({ variant = "horizontal", className = "h-8" }: LogoProps) {
  if (variant === "monogram") {
    return (
      <svg viewBox="0 0 1000 1000" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="500" cy="500" r="380" stroke="#C9A86A" strokeWidth="4" fill="none" />
        <text
          x="510" y="760" textAnchor="middle"
          fontFamily="'Playfair Display', serif" fontWeight="900" fontStyle="italic"
          fontSize="720" fill="#C9A86A" stroke="#C9A86A" strokeWidth="4"
        >Z</text>
        <polygon
          points="615,395 617.9,404.4 628.7,404.3 620.4,409.6 623.5,419.7 615,414 606.5,419.7 609.6,409.6 601.3,404.3 612.1,404.4"
          fill="#C9A86A"
        />
      </svg>
    );
  }

  if (variant === "avatar") {
    return (
      <svg viewBox="0 0 1000 1000" className={className} xmlns="http://www.w3.org/2000/svg">
        <circle cx="500" cy="500" r="500" fill="#0A0A0A" />
        <circle cx="500" cy="500" r="455" stroke="#C9A86A" strokeWidth="4" fill="none" />
        <text
          x="510" y="760" textAnchor="middle"
          fontFamily="'Playfair Display', serif" fontWeight="900" fontStyle="italic"
          fontSize="720" fill="#C9A86A" stroke="#C9A86A" strokeWidth="4"
        >Z</text>
        <polygon
          points="615,395 617.9,404.4 628.7,404.3 620.4,409.6 623.5,419.7 615,414 606.5,419.7 609.6,409.6 601.3,404.3 612.1,404.4"
          fill="#C9A86A"
        />
      </svg>
    );
  }

  // horizontal lockup (default): Avatar-Mini links + Wordmark rechts
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <svg viewBox="0 0 1000 1000" className="h-full aspect-square" xmlns="http://www.w3.org/2000/svg">
        <circle cx="500" cy="500" r="500" fill="#0A0A0A" />
        <circle cx="500" cy="500" r="455" stroke="#C9A86A" strokeWidth="4" fill="none" />
        <text
          x="510" y="760" textAnchor="middle"
          fontFamily="'Playfair Display', serif" fontWeight="900" fontStyle="italic"
          fontSize="720" fill="#C9A86A" stroke="#C9A86A" strokeWidth="4"
        >Z</text>
        <polygon
          points="615,395 617.9,404.4 628.7,404.3 620.4,409.6 623.5,419.7 615,414 606.5,419.7 609.6,409.6 601.3,404.3 612.1,404.4"
          fill="#C9A86A"
        />
      </svg>
      <div className="flex flex-col leading-none">
        <span className="font-display font-black text-champagne text-[1.4em] tracking-[0.08em]">ZOE</span>
        <span className="text-champagne text-[0.4em] uppercase tracking-[0.4em] font-light mt-1">Star Agency</span>
      </div>
    </div>
  );
}
