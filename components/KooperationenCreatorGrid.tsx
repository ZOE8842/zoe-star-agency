"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useMemo } from "react";
import { ArrowExternalIcon } from "./SocialIcons";

export interface CoopCreatorItem {
  profileId: string;
  displayName: string;
  tiktokUsername: string;
  category: string | null;
  language: string | null;
  region: string | null;
  showcaseImage: string | null;
}

export interface FilterOption {
  value: string;
  count: number;
}

interface Props {
  creators: CoopCreatorItem[];
  filterCategories: FilterOption[];
  filterLanguages: FilterOption[];
  filterRegions: FilterOption[];
}

export function KooperationenCreatorGrid({
  creators,
  filterCategories,
  filterLanguages,
  filterRegions,
}: Props) {
  const [category, setCategory] = useState<string>("");
  const [language, setLanguage] = useState<string>("");
  const [region, setRegion] = useState<string>("");

  const filtered = useMemo(() => {
    return creators.filter((c) => {
      if (category && c.category !== category) return false;
      if (language && c.language !== language) return false;
      if (region && c.region !== region) return false;
      return true;
    });
  }, [creators, category, language, region]);

  const hasFilter = !!(category || language || region);

  return (
    <>
      {/* FILTER */}
      <div className="space-y-3 mb-8">
        <FilterRow
          label="Kategorie"
          value={category}
          options={filterCategories}
          onChange={setCategory}
        />
        <FilterRow
          label="Sprache"
          value={language}
          options={filterLanguages}
          onChange={setLanguage}
        />
        <FilterRow
          label="Region"
          value={region}
          options={filterRegions}
          onChange={setRegion}
        />
        {hasFilter && (
          <div className="flex items-baseline justify-between gap-3 pt-2">
            <p className="text-cream/55 text-sm">
              {filtered.length} {filtered.length === 1 ? "Treffer" : "Treffer"}
            </p>
            <button
              type="button"
              onClick={() => {
                setCategory("");
                setLanguage("");
                setRegion("");
              }}
              className="text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em]"
            >
              Filter zuruecksetzen
            </button>
          </div>
        )}
      </div>

      {/* GRID */}
      {filtered.length === 0 ? (
        <div className="border border-champagne/15 p-12 text-center">
          <p className="text-cream/55 italic font-display text-xl mb-2">
            Keine Creator passen zu deiner Auswahl.
          </p>
          <p className="text-cream/35 text-sm">
            Filter zuruecksetzen oder direkt anfragen — wir finden gemeinsam den passenden Match.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map((c) => (
            <article
              key={c.profileId}
              className="border border-champagne/15 hover:border-champagne/40 transition-colors group"
            >
              <Link
                href={`/creator/${encodeURIComponent(c.tiktokUsername)}`}
                className="block"
              >
                <div className="aspect-[4/5] overflow-hidden bg-ink relative">
                  {c.showcaseImage ? (
                    <Image
                      src={c.showcaseImage}
                      alt={c.displayName}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-cream/30 font-display italic text-sm">
                      Kein Bild
                    </div>
                  )}
                  <div
                    className="absolute inset-x-0 bottom-0 h-1/3 pointer-events-none"
                    aria-hidden
                    style={{
                      background:
                        "linear-gradient(180deg, transparent 0%, rgba(10,10,10,0.85) 75%, rgb(10,10,10) 100%)",
                    }}
                  />
                  <div className="absolute bottom-3 left-4 right-4 z-10">
                    <h3 className="font-display italic text-cream text-lg md:text-xl leading-tight">
                      {c.displayName}
                    </h3>
                    {c.category && (
                      <p className="text-cream/55 text-[10px] uppercase tracking-[0.25em] mt-1">
                        {c.category}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
              <div className="p-3 border-t border-champagne/10">
                <a
                  href={`#anfrage`}
                  onClick={(e) => {
                    e.preventDefault();
                    const el = document.getElementById("anfrage");
                    if (el) {
                      // Form-Felder via CustomEvent vorausfuellen
                      window.dispatchEvent(
                        new CustomEvent("zoe:coop-prefill", {
                          detail: {
                            tiktokUsername: c.tiktokUsername,
                            displayName: c.displayName,
                            profileId: c.profileId,
                          },
                        }),
                      );
                      el.scrollIntoView({ behavior: "smooth", block: "start" });
                    }
                  }}
                  className="flex items-center justify-between text-champagne hover:text-champagne-300 text-[10px] uppercase tracking-[0.25em] py-2 group/btn"
                >
                  <span>Kooperation anfragen</span>
                  <ArrowExternalIcon className="w-3 h-3 group-hover/btn:translate-x-0.5 transition-transform rotate-[-45deg]" />
                </a>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}

function FilterRow({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (v: string) => void;
}) {
  if (options.length === 0) return null;
  return (
    <div className="flex items-baseline gap-3 flex-wrap">
      <span className="shrink-0 text-cream/45 text-[10px] uppercase tracking-[0.25em] w-20">
        {label}
      </span>
      <div className="flex flex-wrap gap-2 flex-1">
        <button
          type="button"
          onClick={() => onChange("")}
          className={`px-3 py-1.5 border text-[11px] transition-colors ${
            value === ""
              ? "border-champagne bg-champagne text-ink"
              : "border-champagne/25 text-cream/65 hover:border-champagne/50"
          }`}
        >
          Alle
        </button>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(value === o.value ? "" : o.value)}
            className={`px-3 py-1.5 border text-[11px] transition-colors ${
              value === o.value
                ? "border-champagne bg-champagne text-ink"
                : "border-champagne/25 text-cream/65 hover:border-champagne/50"
            }`}
          >
            {o.value} <span className="opacity-60">· {o.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
