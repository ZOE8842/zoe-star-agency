// FeaturedCreatorsStrip — asymmetrisches Editorial-Layout.
// Desktop: 1 grosse Featured-Card + 3 kleinere mit leichtem Versatz.
// Mobile: horizontal scroll (gleiche Höhe, Touch-snap).

import { CreatorShowcaseCard, CreatorShowcase } from "./CreatorShowcaseCard";

interface Props {
  creators: CreatorShowcase[];
  className?: string;
}

export function FeaturedCreatorsStrip({ creators, className = "" }: Props) {
  if (creators.length === 0) return null;

  const featured = creators[0];
  const rest = creators.slice(1, 4);

  return (
    <div className={className}>
      {/* DESKTOP — asymmetrisches grid */}
      <div className="hidden md:grid md:grid-cols-12 gap-5 lg:gap-6">
        {/* Big featured card — col-span-5, taller */}
        <div className="md:col-span-5 lg:col-span-5">
          <div className="relative w-full" style={{ aspectRatio: "3/4.4" }}>
            <CreatorShowcaseCard {...featured} className="absolute inset-0 [&>div]:h-full [&>div]:aspect-auto" />
          </div>
        </div>

        {/* Right-side: 3 cards in custom flow */}
        <div className="md:col-span-7 lg:col-span-7 grid grid-cols-2 gap-5 lg:gap-6">
          {/* Top-right card — slightly down */}
          {rest[0] && (
            <div className="mt-6 md:mt-10">
              <CreatorShowcaseCard {...rest[0]} rotation={-1} />
            </div>
          )}
          {/* Top-right2 — at top */}
          {rest[1] && (
            <div>
              <CreatorShowcaseCard {...rest[1]} rotation={1.5} />
            </div>
          )}
          {/* Bottom — spans 2-cols, wider but shorter */}
          {rest[2] && (
            <div className="col-span-2 -mt-2 md:-mt-4">
              <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
                <CreatorShowcaseCard
                  {...rest[2]}
                  className="absolute inset-0 [&>div]:h-full [&>div]:aspect-auto"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MOBILE — horizontal scroll */}
      <div className="md:hidden flex gap-4 overflow-x-auto no-scrollbar px-6 pb-4 -mx-6">
        {creators.map((c, i) => (
          <div key={`${c.displayName}-${i}`} className="shrink-0 w-[260px]">
            <CreatorShowcaseCard {...c} rotation={i % 2 === 0 ? -0.5 : 1} />
          </div>
        ))}
      </div>
    </div>
  );
}
