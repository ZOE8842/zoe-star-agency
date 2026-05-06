// ZOE Star Agency — Logo-Komponente
// Nutzt finale v3-SVG-Assets aus public/brand/
// 5 Varianten: avatar (default dark), avatar-mini, lockup-horizontal,
//              lockup-mono-black (auf Cream), lockup-mono-white

interface LogoProps {
  variant?: "avatar" | "avatar-mini" | "horizontal" | "horizontal-cream" | "monogram";
  className?: string;
  alt?: string;
}

const SOURCES: Record<NonNullable<LogoProps["variant"]>, string> = {
  "avatar":           "/brand/zoe_avatar_v3.svg",
  "avatar-mini":      "/brand/zoe_avatar_mini_v3.svg",
  "horizontal":       "/brand/zoe_lockup_dark_v3.svg",
  "horizontal-cream": "/brand/zoe_lockup_v3.svg",
  "monogram":         "/brand/zoe_monogram_v3.svg",
};

export function Logo({ variant = "horizontal", className = "h-8", alt = "ZOE Star Agency" }: LogoProps) {
  const src = SOURCES[variant];
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} className={className} />;
}
