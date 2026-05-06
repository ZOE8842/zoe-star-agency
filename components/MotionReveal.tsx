"use client";

import { motion, useReducedMotion } from "framer-motion";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: "div" | "section" | "article" | "h1" | "h2" | "p";
}

export function MotionReveal({ children, delay = 0, className, as = "div" }: Props) {
  const reduce = useReducedMotion();
  const Component = motion[as] as any;

  return (
    <Component
      initial={reduce ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.7, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </Component>
  );
}

interface StaggerProps {
  children: ReactNode[];
  staggerDelay?: number;
  className?: string;
}

export function MotionStagger({ children, staggerDelay = 0.08, className }: StaggerProps) {
  return (
    <div className={className}>
      {children.map((child, i) => (
        <MotionReveal key={i} delay={i * staggerDelay}>
          {child}
        </MotionReveal>
      ))}
    </div>
  );
}
