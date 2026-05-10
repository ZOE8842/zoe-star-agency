"use client";

// Onboarding Field-Wrapper — Editorial-Style.
// Label oben (eyebrow), darunter Input/Select/Textarea, weicher Hint-Text
// fuer Errors (kein roter Border-Spam). border-bottom-only,
// border wird gold beim Focus.

import type { ReactNode } from "react";

interface FieldProps {
  label: string;
  hint?: string;
  error?: string | null;
  children: ReactNode;
  optional?: boolean;
}

export function OnboardingField({ label, hint, error, optional, children }: FieldProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <label className="eyebrow text-cream/70">{label}</label>
        {optional && (
          <span className="text-cream/30 text-[9px] uppercase tracking-[0.25em]">
            optional
          </span>
        )}
      </div>
      {children}
      {error ? (
        <p className="text-champagne/70 text-xs italic">{error}</p>
      ) : hint ? (
        <p className="text-cream/35 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}

// Atomares Text-Input — border-bottom only, gold on focus.
interface TextInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  prefix?: string;
  type?: string;
  maxLength?: number;
  autoFocus?: boolean;
  inputMode?: "text" | "email" | "tel" | "url";
  autoComplete?: string;
}

export function OnboardingInput({
  value, onChange, placeholder, prefix, type = "text",
  maxLength, autoFocus, inputMode, autoComplete,
}: TextInputProps) {
  return (
    <div className="flex items-center border-b border-champagne/20 focus-within:border-champagne transition-colors">
      {prefix && (
        <span className="text-champagne/60 text-base md:text-lg pr-1 select-none">
          {prefix}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={maxLength}
        autoFocus={autoFocus}
        inputMode={inputMode}
        autoComplete={autoComplete}
        className="w-full bg-transparent text-cream text-base md:text-lg py-3 placeholder-cream/25 focus:outline-none"
      />
    </div>
  );
}

// Atomares Select — Editorial-Style, kein Browser-Default.
interface SelectInputProps {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string }>;
  placeholder?: string;
}

export function OnboardingSelect({ value, onChange, options, placeholder }: SelectInputProps) {
  return (
    <div className="relative border-b border-champagne/20 focus-within:border-champagne transition-colors">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none w-full bg-transparent text-cream text-base md:text-lg py-3 pr-8 focus:outline-none cursor-pointer"
      >
        {placeholder && <option value="" className="bg-ink text-cream/50">{placeholder}</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-ink text-cream">
            {o.label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        className="absolute right-1 top-1/2 -translate-y-1/2 text-champagne/60 pointer-events-none text-xs"
      >
        ▾
      </span>
    </div>
  );
}

// Toggle-Chip fuer Multi-Select (Step 4 Goals)
interface ChipProps {
  label: string;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}

export function OnboardingChip({ label, active, disabled, onToggle }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !active}
      className={`px-4 py-2.5 text-sm border transition-all duration-200 ${
        active
          ? "border-champagne bg-champagne/10 text-champagne"
          : disabled
          ? "border-champagne/10 text-cream/25 cursor-not-allowed"
          : "border-champagne/20 text-cream/70 hover:border-champagne/50 hover:text-cream"
      }`}
    >
      {active && <span className="mr-1.5">✓</span>}
      {label}
    </button>
  );
}

// Soft-Checkbox fuer Showcase / Cooperations
interface CheckProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}

export function OnboardingCheck({ checked, onChange, label, description }: CheckProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="w-full text-left flex items-start gap-3 p-3 -m-3 hover:bg-champagne/5 transition-colors group"
    >
      <span
        className={`shrink-0 mt-0.5 w-4 h-4 border flex items-center justify-center text-[10px] transition-all ${
          checked
            ? "border-champagne bg-champagne text-ink"
            : "border-champagne/30 group-hover:border-champagne/60"
        }`}
      >
        {checked ? "✓" : ""}
      </span>
      <span className="flex-1">
        <span className="block text-cream text-sm">{label}</span>
        {description && (
          <span className="block text-cream/45 text-xs mt-1 leading-relaxed">{description}</span>
        )}
      </span>
    </button>
  );
}
