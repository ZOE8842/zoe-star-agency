"use client";

// ZOE⭐ Star Agency — Member Onboarding 7-Step-Flow.
// Editorial Mood: italic display Headlines, generous whitespace,
// gold nur auf Fokus-Punkten. Steps fadet weich in zentraler Card,
// kein Page-Wechsel.

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { OnboardingProgress } from "@/components/onboarding/Progress";
import {
  OnboardingField,
  OnboardingInput,
  OnboardingSelect,
  OnboardingChip,
  OnboardingCheck,
} from "@/components/onboarding/Field";
import {
  TelegramIcon,
  InstagramIcon,
  WhatsAppIcon,
} from "@/components/onboarding/SocialIcons";
import { upsertOnboarding, type OnboardingInput as OnboardingPayload } from "./actions";

interface FormState {
  display_name: string;
  tiktok_username: string;
  language: string;
  region: string;
  creator_category: string;
  live_format: string;
  live_window: string;
  goals: string[];
  extra_focus: string;
  telegram_username: string;
  instagram_username: string;
  whatsapp_url: string;
  bio: string;
  allow_website_showcase: boolean;
  allow_partner_cooperations: boolean;
}

const STORAGE_KEY_BASE = "zoe_onboarding_v1";
const TOTAL_STEPS = 7; // Welcome + 5 Eingabe-Schritte + Final
const ENTRY_STEPS = 5; // user-sichtbare "echte" Schritte (ohne Welcome/Final)

const LANGUAGES = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "Englisch" },
  { value: "fr", label: "Franzoesisch" },
  { value: "tr", label: "Tuerkisch" },
  { value: "ar", label: "Arabisch" },
  { value: "other", label: "Andere" },
];

const REGIONS = [
  { value: "DE", label: "Deutschland" },
  { value: "AT", label: "Oesterreich" },
  { value: "CH", label: "Schweiz" },
  { value: "LI", label: "Liechtenstein" },
];

const CATEGORIES = [
  { value: "Lifestyle", label: "Lifestyle" },
  { value: "Beauty", label: "Beauty" },
  { value: "Fashion", label: "Fashion" },
  { value: "Familie", label: "Familie" },
  { value: "Gaming", label: "Gaming" },
  { value: "Comedy", label: "Comedy" },
  { value: "Talk", label: "Talk" },
  { value: "Musik", label: "Musik" },
  { value: "Motivation", label: "Motivation" },
  { value: "Sonstiges", label: "Sonstiges" },
];

const LIVE_FORMATS = [
  { value: "Solo", label: "Solo LIVE" },
  { value: "Battles", label: "Battles / Matches" },
  { value: "Talk", label: "Talk" },
  { value: "Gaming", label: "Gaming" },
  { value: "Musik", label: "Musik" },
  { value: "Verkauf", label: "Verkauf / Produkte" },
  { value: "Gast-LIVE", label: "Gast-LIVE" },
  { value: "Sonstiges", label: "Sonstiges" },
];

const LIVE_WINDOWS = [
  { value: "tag", label: "Tag" },
  { value: "abend", label: "Abend" },
  { value: "nacht", label: "Nacht" },
  { value: "wochenende", label: "Wochenende" },
  { value: "flex", label: "Flexibel" },
];

const GOALS = [
  { value: "community", label: "Community" },
  { value: "ranking", label: "Ranking" },
  { value: "brand_deals", label: "Brand-Deals" },
  { value: "wachstum", label: "Wachstum" },
  { value: "matches", label: "Matches" },
  { value: "reichweite", label: "Reichweite" },
];

const DEFAULT_STATE: FormState = {
  display_name: "",
  tiktok_username: "",
  language: "de",
  region: "DE",
  creator_category: "",
  live_format: "",
  live_window: "flex",
  goals: [],
  extra_focus: "",
  telegram_username: "",
  instagram_username: "",
  whatsapp_url: "",
  bio: "",
  allow_website_showcase: false,
  allow_partner_cooperations: false,
};

interface Props {
  profileId: string;
  initialDisplayName?: string | null;
  initialTiktok?: string | null;
  initialLanguage?: string | null;
  initialRegion?: string | null;
}

export function OnboardingFlow({
  profileId, initialDisplayName, initialTiktok, initialLanguage, initialRegion,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    ...DEFAULT_STATE,
    display_name: initialDisplayName ?? "",
    tiktok_username: initialTiktok ?? "",
    language: initialLanguage ?? "de",
    region: initialRegion ?? "DE",
  });

  // User-scoped Storage-Key (verhindert Cross-Account-Collision)
  const storageKey = `${STORAGE_KEY_BASE}:${profileId}`;

  // localStorage-Resume
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<FormState>;
      setForm((prev) => ({ ...prev, ...parsed }));
    } catch {
      // ignore corrupt storage
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(form));
    } catch {
      // ignore quota
    }
  }, [form]);

  const update = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm((p) => ({ ...p, [k]: v }));
  };

  const toggleGoal = (g: string) => {
    setForm((p) => {
      if (p.goals.includes(g)) {
        return { ...p, goals: p.goals.filter((x) => x !== g) };
      }
      return { ...p, goals: [...p.goals, g] };
    });
  };

  // Per-Step Validation — weich
  const stepValid = useMemo(() => {
    switch (step) {
      case 0: return true;
      case 1:
        return (
          form.display_name.trim().length > 0 &&
          form.tiktok_username.trim().length > 0
        );
      case 2:
        return form.creator_category.length > 0 && form.live_format.length > 0;
      case 3: return true;       // goals optional
      case 4: return true;       // kommunikation optional
      case 5: return true;       // showcase optional
      case 6: return true;
      default: return false;
    }
  }, [step, form]);

  const canBack = step > 0 && step < TOTAL_STEPS - 1;
  const isLast = step === TOTAL_STEPS - 1;
  const isPreFinal = step === TOTAL_STEPS - 2; // Step 6 (Showcase) → Submit

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    const payload: OnboardingPayload = {
      display_name: form.display_name,
      tiktok_username: form.tiktok_username,
      language: form.language,
      region: form.region,
      creator_category: form.creator_category,
      live_format: form.live_format,
      live_window: form.live_window,
      goals: form.goals,
      extra_focus: form.extra_focus || undefined,
      telegram_username: form.telegram_username || undefined,
      instagram_username: form.instagram_username || undefined,
      whatsapp_url: form.whatsapp_url || undefined,
      bio: form.bio || undefined,
      allow_website_showcase: form.allow_website_showcase,
      allow_partner_cooperations: form.allow_partner_cooperations,
    };
    const r = await upsertOnboarding(payload);
    if (!r.ok) {
      setError(r.error || "Konnte nicht speichern.");
      setSubmitting(false);
      return;
    }
    try { window.localStorage.removeItem(storageKey); } catch {}
    setStep(TOTAL_STEPS - 1); // → emotional Final-Screen
    setSubmitting(false);
  };

  const next = () => {
    setError(null);
    if (!stepValid) return;
    if (isPreFinal) { void submit(); return; }
    if (step < TOTAL_STEPS - 1) setStep(step + 1);
  };

  const back = () => {
    setError(null);
    if (canBack) setStep(step - 1);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !(e.target as HTMLElement).matches("textarea")) {
      e.preventDefault();
      next();
    }
  };

  const goToDashboard = () => {
    router.push("/portal");
    router.refresh();
  };

  return (
    <>
      <OnboardingProgress step={step} total={TOTAL_STEPS} />

      <main
        className="min-h-screen flex flex-col"
        onKeyDown={onKeyDown}
      >
        <div className="atelier-atmosphere" />
        <div className="atelier-grain" />

        <div className="relative z-10 flex-1 flex items-center justify-center px-6 py-16 md:py-24 pb-32">
          <div className="w-full max-w-md">

            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              >
                {step === 0 && <Step1Welcome />}
                {step === 1 && (
                  <Step2Basis
                    form={form} update={update}
                  />
                )}
                {step === 2 && (
                  <Step3LiveProfile form={form} update={update} />
                )}
                {step === 3 && (
                  <Step4Goals form={form} update={update} toggleGoal={toggleGoal} />
                )}
                {step === 4 && (
                  <Step5Communication form={form} update={update} />
                )}
                {step === 5 && (
                  <Step6Showcase form={form} update={update} />
                )}
                {step === 6 && (
                  <Step7Done
                    displayName={form.display_name}
                    onContinue={goToDashboard}
                  />
                )}
              </motion.div>
            </AnimatePresence>

            {error && step !== 6 && (
              <p className="mt-6 text-champagne/70 text-xs italic text-center">
                {error}
              </p>
            )}
          </div>
        </div>

        {/* Bottom-CTA-Bar — fixed, safe-area-respecting */}
        {step < TOTAL_STEPS - 1 && (
          <div
            className="fixed inset-x-0 bottom-0 z-20 border-t border-champagne/10 bg-ink/85 backdrop-blur-md"
            style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          >
            <div className="max-w-md mx-auto px-6 py-4 flex items-center justify-between gap-3">
              {canBack ? (
                <button
                  type="button"
                  onClick={back}
                  className="text-cream/55 hover:text-cream text-[11px] uppercase tracking-[0.25em] py-2 px-2 -ml-2 transition-colors"
                >
                  ← Zurueck
                </button>
              ) : (
                <span className="text-cream/30 text-[11px] uppercase tracking-[0.25em]">
                  {step === 0 ? "" : ""}
                </span>
              )}

              <button
                type="button"
                onClick={next}
                disabled={!stepValid || submitting}
                className="btn-cta btn-shimmer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {submitting
                  ? "Wird eingerichtet…"
                  : step === 0
                  ? "Profil einrichten"
                  : isPreFinal
                  ? "Abschliessen"
                  : "Weiter"}
                {!submitting && <span className="btn-cta-arrow" aria-hidden>→</span>}
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}

// ============================================================
// STEP COMPONENTS
// ============================================================

function Step1Welcome() {
  return (
    <div className="text-center">
      <p className="eyebrow mb-6">Onboarding</p>
      <h1 className="font-display italic text-cream text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] mb-6">
        Willkommen im
        <br />
        <span className="text-champagne">ZOE⭐ Creator Network.</span>
      </h1>
      <p className="text-cream/60 text-base md:text-lg leading-relaxed max-w-sm mx-auto">
        In fuenf ruhigen Schritten richten wir dein Creator-Profil ein.
        Du entscheidest was rein darf.
      </p>
      <div className="mt-12 mx-auto w-px h-12 bg-gradient-to-b from-champagne/40 to-transparent" />
    </div>
  );
}

function Step2Basis({
  form, update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">Schritt 1</p>
      <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.1] tracking-[-0.01em] mb-10">
        Wie sieht dein
        <br />
        <span className="text-champagne">Name auf TikTok aus?</span>
      </h2>

      <div className="space-y-7">
        <OnboardingField
          label="TikTok Anzeigename"
          hint="So wie er bei dir im LIVE oben steht."
        >
          <OnboardingInput
            value={form.display_name}
            onChange={(v) => update("display_name", v)}
            placeholder="z.B. Selin ⭐"
            autoFocus
            autoComplete="off"
          />
        </OnboardingField>

        <OnboardingField label="TikTok Username" hint="der technische @-Handle">
          <OnboardingInput
            value={form.tiktok_username}
            onChange={(v) => update("tiktok_username", v.replace(/^@+/, ""))}
            placeholder="z.B. selin_livee"
            prefix="@"
            autoComplete="off"
          />
        </OnboardingField>

        <OnboardingField label="Sprache">
          <OnboardingSelect
            value={form.language}
            onChange={(v) => update("language", v)}
            options={LANGUAGES}
          />
        </OnboardingField>

        <OnboardingField label="Region">
          <OnboardingSelect
            value={form.region}
            onChange={(v) => update("region", v)}
            options={REGIONS}
          />
        </OnboardingField>
      </div>
    </div>
  );
}

function Step3LiveProfile({
  form, update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">Schritt 2</p>
      <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.1] tracking-[-0.01em] mb-10">
        Was machst du
        <br />
        <span className="text-champagne">im LIVE?</span>
      </h2>

      <div className="space-y-7">
        <OnboardingField label="Creator-Kategorie">
          <OnboardingSelect
            value={form.creator_category}
            onChange={(v) => update("creator_category", v)}
            options={CATEGORIES}
            placeholder="Bitte waehlen"
          />
        </OnboardingField>

        <OnboardingField label="LIVE-Format">
          <OnboardingSelect
            value={form.live_format}
            onChange={(v) => update("live_format", v)}
            options={LIVE_FORMATS}
            placeholder="Bitte waehlen"
          />
        </OnboardingField>

        <OnboardingField
          label="LIVE-Zeitfenster"
          hint="Wann gehst du meistens live?"
        >
          <OnboardingSelect
            value={form.live_window}
            onChange={(v) => update("live_window", v)}
            options={LIVE_WINDOWS}
          />
        </OnboardingField>
      </div>
    </div>
  );
}

function Step4Goals({
  form, update, toggleGoal,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  toggleGoal: (g: string) => void;
}) {
  const count = form.goals.length;
  return (
    <div>
      <p className="eyebrow mb-4">Schritt 3</p>
      <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.1] tracking-[-0.01em] mb-4">
        Worauf willst du
        <br />
        <span className="text-champagne">fokussieren?</span>
      </h2>
      <p className="text-cream/45 text-xs md:text-sm mb-8">
        Mehrfachauswahl. {count === 0 ? "Such dir aus was passt." : count === 1 ? "1 ausgewaehlt." : `${count} ausgewaehlt.`}
      </p>

      <div className="flex flex-wrap gap-2.5 mb-10">
        {GOALS.map((g) => {
          const active = form.goals.includes(g.value);
          return (
            <OnboardingChip
              key={g.value}
              label={g.label}
              active={active}
              onToggle={() => toggleGoal(g.value)}
            />
          );
        })}
      </div>

      <OnboardingField
        label="Extra Fokus"
        hint={`${form.extra_focus.length}/160 Zeichen`}
        optional
      >
        <OnboardingInput
          value={form.extra_focus}
          onChange={(v) => update("extra_focus", v.slice(0, 160))}
          placeholder="z.B. Events, Moderation, Team, TikTok Shop"
          maxLength={160}
        />
      </OnboardingField>
      <p className="text-cream/35 text-xs mt-3">
        Gibt es noch etwas, worauf du dich fokussieren moechtest?
      </p>
    </div>
  );
}

function Step5Communication({
  form, update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">Schritt 4</p>
      <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.1] tracking-[-0.01em] mb-4">
        Wie duerfen wir
        <br />
        <span className="text-champagne">dich kontaktieren?</span>
      </h2>
      <p className="text-cream/45 text-xs md:text-sm mb-10">
        Optional. Nur fuer Creator-Management, Rueckfragen und
        wichtige Updates.
      </p>

      <div className="space-y-7">
        <OnboardingField label="Telegram" optional>
          <OnboardingInput
            value={form.telegram_username}
            onChange={(v) => update("telegram_username", v.replace(/^@+/, ""))}
            placeholder="username"
            prefix="@"
            icon={<TelegramIcon />}
          />
        </OnboardingField>

        <OnboardingField label="Instagram" optional>
          <OnboardingInput
            value={form.instagram_username}
            onChange={(v) => update("instagram_username", v.replace(/^@+/, ""))}
            placeholder="handle"
            prefix="@"
            icon={<InstagramIcon />}
          />
        </OnboardingField>

        <OnboardingField
          label="WhatsApp"
          hint="Du kannst einen wa.me-Link nutzen. Wenn du eine Nummer angibst, ist sie fuer das ZOE Team sichtbar."
          optional
        >
          <OnboardingInput
            value={form.whatsapp_url}
            onChange={(v) => update("whatsapp_url", v)}
            placeholder="https://wa.me/..."
            type="url"
            inputMode="url"
            icon={<WhatsAppIcon />}
          />
        </OnboardingField>
      </div>

      <p className="text-cream/35 text-xs mt-8">
        Nur angeben, wenn wir dich darueber kontaktieren duerfen.
      </p>
    </div>
  );
}

function Step6Showcase({
  form, update,
}: {
  form: FormState;
  update: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
}) {
  return (
    <div>
      <p className="eyebrow mb-4">Schritt 5</p>
      <h2 className="font-display italic text-cream text-3xl md:text-4xl leading-[1.1] tracking-[-0.01em] mb-4">
        Erzaehl was
        <br />
        <span className="text-champagne">ueber dich.</span>
      </h2>
      <p className="text-cream/45 text-xs md:text-sm mb-10">
        Alles optional. Bild kannst du spaeter im Profil hochladen.
      </p>

      <div className="space-y-8">
        <OnboardingField
          label="Bio"
          hint={`${form.bio.length}/240 Zeichen · wenn deine TikTok-Bio spaeter erkannt wird, kannst du sie als Vorschlag uebernehmen.`}
          optional
        >
          <textarea
            value={form.bio}
            onChange={(e) => update("bio", e.target.value.slice(0, 240))}
            placeholder="Kurz und ehrlich."
            rows={3}
            maxLength={240}
            className="w-full bg-transparent border-b border-champagne/20 focus:border-champagne text-cream text-base py-3 placeholder-cream/25 focus:outline-none transition-colors resize-none"
          />
        </OnboardingField>

        <div className="space-y-1 pt-2">
          <p className="eyebrow text-cream/55 mb-3">Freigaben</p>
          <OnboardingCheck
            checked={form.allow_website_showcase}
            onChange={(v) => update("allow_website_showcase", v)}
            label="Showcase auf der Webseite"
            description="Dein TikTok-Profil + Display-Name + Kategorie duerfen auf zoe-star.de erscheinen. Erst nach Admin-Freigabe sichtbar."
          />
          <OnboardingCheck
            checked={form.allow_partner_cooperations}
            onChange={(v) => update("allow_partner_cooperations", v)}
            label="Brand-Kooperationen"
            description="Wir kommen auf dich zu wenn ein Partner zu deinem Profil passt. Du entscheidest, ob du teilnehmen willst."
          />
        </div>
      </div>
    </div>
  );
}

function Step7Done({
  displayName, onContinue,
}: {
  displayName: string;
  onContinue: () => void;
}) {
  const first = displayName.split(/\s+/)[0] || "";
  return (
    <div className="text-center relative">
      {/* Soft champagne radial-glow hinter der Headline */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 35%, rgba(224,196,130,0.16), transparent 60%)",
        }}
      />

      <div className="relative">
        <p className="eyebrow mb-6">Willkommen</p>
        <h1 className="font-display italic text-cream text-5xl md:text-6xl leading-[1.0] tracking-[-0.02em] mb-6">
          {first ? `${first}, ` : ""}
          <span className="text-champagne">du bist drin.</span>
        </h1>
        <p className="text-cream/65 text-base md:text-lg leading-relaxed max-w-sm mx-auto mb-12">
          Dein Creator-Profil ist eingerichtet. Ab jetzt findest du
          alles im Member-Bereich — Services, Inbox, Events, deine
          Monatszahlen.
        </p>

        <button
          type="button"
          onClick={onContinue}
          className="btn-cta btn-shimmer"
        >
          Zum Dashboard
          <span className="btn-cta-arrow" aria-hidden>→</span>
        </button>

        <p className="mt-10 text-cream/35 text-[10px] uppercase tracking-[0.32em]">
          ZOE⭐ Star Agency · Creator Network
        </p>
      </div>
    </div>
  );
}
