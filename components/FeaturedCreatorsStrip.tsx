// FeaturedCreatorsStrip — horizontal scroll mobile, grid desktop.
// Sammelt mehrere CreatorShowcaseCards in einem Layout.
// Public-Site nutzt diese Komponente; Datenquelle wird in Phase B
// auf Supabase-Tabelle "showcase_creators" (approved=true) umgestellt.

import { CreatorShowcaseCard, CreatorShowcase } from "./CreatorShowcaseCard";

interface Props {
  creators: CreatorShowcase[];
  className?: string;
}

export function FeaturedCreatorsStrip({ creators, className = "" }: Props) {
  return (
    <div className={className}>
      <div className="flex md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-5 overflow-x-auto md:overflow-visible no-scrollbar px-6 md:px-0 pb-4">
        {creators.map((c, i) => (
          <div key={`${c.displayName}-${i}`} className="shrink-0 w-[260px] md:w-auto">
            <CreatorShowcaseCard {...c} />
          </div>
        ))}
      </div>
    </div>
  );
}
