import Link from "next/link";
import type { SupabaseClient } from "@supabase/supabase-js";

interface Row {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  status: string;
  bundle_key: string | null;
  bundle_count: number;
  created_at: string;
  read_at: string | null;
}

const TYPE_TONE: Record<string, string> = {
  match: "bg-champagne text-ink",
  analysis: "border border-champagne/40 text-champagne",
  badge: "bg-champagne text-ink",
  event: "border border-blue-400/40 text-blue-300/85",
  academy: "border border-emerald-400/40 text-emerald-300/85",
  reminder: "border border-cream/30 text-cream/70",
  support: "border border-red-400/40 text-red-300/85",
  message: "border border-cream/20 text-cream/55",
  slot: "border border-cream/20 text-cream/55",
};

const TYPE_LABEL: Record<string, string> = {
  match: "Big Match",
  analysis: "Analyse",
  badge: "Status",
  event: "Event",
  academy: "Academy",
  reminder: "Reminder",
  support: "Support",
  message: "Nachricht",
  slot: "Slot",
};

function rel(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60_000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} h`;
  const d = Math.floor(h / 24);
  return `vor ${d} t`;
}

export async function SystemNotificationsList({
  supabase,
  userId,
}: {
  supabase: SupabaseClient;
  userId: string;
}) {
  const { data } = await supabase
    .from("notifications")
    .select("id, type, title, body, link, status, bundle_key, bundle_count, created_at, read_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15);
  const rows = (data as Row[]) ?? [];
  if (rows.length === 0) return null;

  const unreadCount = rows.filter((r) => r.status === "unread").length;

  return (
    <section className="mb-12">
      <div className="flex items-baseline justify-between mb-4">
        <p className="eyebrow">System-Hinweise{unreadCount > 0 ? ` · ${unreadCount} neu` : ""}</p>
        <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
          {rows.length} {rows.length === 1 ? "Eintrag" : "Eintraege"}
        </span>
      </div>

      <ul className="space-y-2">
        {rows.map((r) => {
          const unread = r.status === "unread";
          const inner = (
            <div className={`flex items-start gap-4 p-4 md:p-5 transition-colors ${
              unread
                ? "border border-champagne/30 bg-champagne/[0.03] hover:bg-champagne/[0.06]"
                : "border border-cream/[0.08] hover:border-cream/15"
            }`}>
              <div className="shrink-0 mt-0.5">
                <span className={`inline-block px-2 py-0.5 text-[9px] uppercase tracking-[0.22em] ${TYPE_TONE[r.type] ?? TYPE_TONE.message}`}>
                  {TYPE_LABEL[r.type] ?? r.type}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-3 flex-wrap mb-1.5">
                  <p className={`text-sm md:text-base leading-tight ${unread ? "text-cream font-medium" : "text-cream/70"}`}>
                    {r.title}
                    {r.bundle_count > 1 && (
                      <span className="ml-2 text-champagne/70 text-xs">×{r.bundle_count}</span>
                    )}
                  </p>
                  <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em] shrink-0">
                    {rel(r.created_at)}
                  </span>
                </div>
                {r.body && (
                  <p className="text-cream/55 text-xs md:text-sm leading-relaxed line-clamp-2">
                    {r.body}
                  </p>
                )}
              </div>
              {unread && (
                <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-champagne" aria-hidden />
              )}
            </div>
          );
          return (
            <li key={r.id}>
              {r.link ? (
                <Link href={r.link} className="block">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
