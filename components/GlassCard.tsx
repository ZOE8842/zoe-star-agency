// GlassCard — backdrop-blur Premium-Card mit safe Fallback.
// "default" für ruhige Cards, "strong" mit champagne-Touch für Hero-Kontext.

import { ElementType, ReactNode, HTMLAttributes } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  variant?: "default" | "strong";
  as?: "div" | "section" | "article" | "a";
  className?: string;
}

export function GlassCard({
  children,
  variant = "default",
  as = "div",
  className = "",
  ...rest
}: GlassCardProps) {
  const Component = as as ElementType;
  const variantClass = variant === "strong" ? "glass-card-strong" : "glass-card";
  return (
    <Component className={`${variantClass} ${className}`} {...rest}>
      {children}
    </Component>
  );
}
