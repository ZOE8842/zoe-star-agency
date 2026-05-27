// /portal/rankings · Creator-facing Rankings (Top 3 pro Kategorie)
//
// REGEL · KEINE Zahlen-Leaks anderer Creator:
//   ✗ Diamanten-Zahl       ✗ LIVE-Stunden       ✗ LIVE-Tage
//   ✗ Umsatz / Bonus       ✗ Forecast
//   ✓ Nur Namen + Platzierungen + Kategorien
//
// Datenquellen:
//   Monat: creator_live_performance_monthly (current_diamonds)
//          + creator_monthly_metrics (viewers, followers, schenkende, gifts, watchtime)
//   Tag:   creator_daily_metrics (alle Felder)

import { redirect } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { getAuthedProfile } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

interface RankRow {
  username: string;
  display_name: string | null;
  category: string | null;
  value: number;
}

function sr() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function currentMonthIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

function targetDailyDate(): string {
  // Berlin-Zeit: vor 12:00 → -2 Tage, sonst -1 Tag (gleiche Logic wie Admin)
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin", hour: "2-digit", hour12: false,
  });
  const berlinHour = parseInt(fmt.format(new Date()), 10);
  const now = new Date();
  const berlin = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const t = new Date(berlin);
  t.setDate(t.getDate() - (berlinHour < 12 ? 2 : 1));
  return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
}

function monthLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
}

function dailyLabel(iso: string): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    weekday: "long", day: "2-digit", month: "long", year: "numeric",
  });
}

const CATEGORIES = [
  { key: "diamonds",   icon: "💎", label: "Diamanten",    hint: "Wer am stärksten war." },
  { key: "viewers",    icon: "👀", label: "Zuschauer",     hint: "Wer die meisten erreicht hat." },
  { key: "followers",  icon: "📈", label: "Neue Follower", hint: "Wer am meisten gewachsen ist." },
  { key: "gifters",    icon: "👤", label: "Schenkende",    hint: "Wer die meiste Community-Liebe bekommen hat." },
  { key: "gifts",      icon: "🎁", label: "Gifts",         hint: "Wer die meisten Geschenke gesammelt hat." },
  { key: "watchtime",  icon: "⏳", label: "Wiedergabezeit", hint: "Wer am längsten gefesselt hat." },
];

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

export default async function RankingsPage({ searchParams }: PageProps) {
  const auth = await getAuthedProfile();
  if (!auth) redirect("/portal/login?redirect=/portal/rankings");
  const { profile } = auth;
  const sp = await searchParams;
  const activeTab = sp.tab === "monat" ? "monat" : "tag";

  const db = sr();
  const month = currentMonthIso();
  const dailyDate = targetDailyDate();

  // ───── MONAT ─────
  // Map handle → username/displayName via profiles
  const [
    { data: clpm },
    { data: monthly },
  ] = await Promise.all([
    db.from("creator_live_performance_monthly")
      .select("tiktok_handle_normalized, current_diamonds")
      .eq("period_month", month),
    db.from("creator_monthly_metrics")
      .select("tiktok_handle_normalized, tiktok_username, average_viewers, followers_gained, gifters_count, gifts_count, watchtime_avg_seconds, valid_live_days")
      .eq("month", month),
  ]);

  const usernameMap = new Map<string, string>();
  for (const m of (monthly ?? []) as Array<{ tiktok_handle_normalized: string; tiktok_username: string | null }>) {
    if (m.tiktok_username) usernameMap.set(m.tiktok_handle_normalized, m.tiktok_username);
  }
  // Display-Names + Category aus profiles laden
  const handles = Array.from(usernameMap.keys());
  const { data: profiles } = handles.length > 0
    ? await db.from("profiles").select("tiktok_handle_normalized, display_name, category").in("tiktok_handle_normalized", handles)
    : { data: [] };
  const profMap = new Map<string, { display_name: string | null; category: string | null }>();
  for (const p of (profiles ?? []) as Array<{ tiktok_handle_normalized: string; display_name: string | null; category: string | null }>) {
    profMap.set(p.tiktok_handle_normalized, { display_name: p.display_name, category: p.category });
  }

  function nameOf(handle: string): { display_name: string | null; username: string; category: string | null } {
    const username = usernameMap.get(handle) ?? handle;
    const prof = profMap.get(handle);
    return {
      display_name: prof?.display_name ?? null,
      username,
      category: prof?.category ?? null,
    };
  }

  function topMonth(field: "diamonds" | "viewers" | "followers" | "gifters" | "gifts" | "watchtime"): RankRow[] {
    let rows: Array<{ handle: string; value: number }> = [];
    if (field === "diamonds") {
      rows = (clpm ?? [])
        .filter((r) => r.current_diamonds !== null && r.current_diamonds > 0)
        .map((r) => ({ handle: r.tiktok_handle_normalized, value: Number(r.current_diamonds) }));
    } else {
      type MRow = {
        tiktok_handle_normalized: string; average_viewers: number | null;
        followers_gained: number | null; gifters_count: number | null;
        gifts_count: number | null; watchtime_avg_seconds: number | null;
      };
      const fieldMap: Record<string, keyof MRow> = {
        viewers: "average_viewers", followers: "followers_gained",
        gifters: "gifters_count", gifts: "gifts_count", watchtime: "watchtime_avg_seconds",
      };
      const key = fieldMap[field];
      rows = (monthly ?? [])
        .map((r) => {
          const v = (r as MRow)[key];
          return { handle: r.tiktok_handle_normalized, value: v === null || v === undefined ? 0 : Number(v) };
        })
        .filter((r) => r.value > 0);
    }
    return rows
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((r) => {
        const n = nameOf(r.handle);
        return { username: n.username, display_name: n.display_name, category: n.category, value: r.value };
      });
  }

  // ───── TAG ─────
  const { data: daily } = await db
    .from("creator_daily_metrics")
    .select("tiktok_handle_normalized, tiktok_username, diamonds, viewers, new_followers, gifters, gifts, watchtime_avg_seconds")
    .eq("metric_date", dailyDate);

  // Username/Profile-Map auch für Daily (Daily hat tiktok_username schon mit)
  const dailyUsernameMap = new Map<string, string>();
  for (const d of (daily ?? []) as Array<{ tiktok_handle_normalized: string; tiktok_username: string | null }>) {
    if (d.tiktok_username) dailyUsernameMap.set(d.tiktok_handle_normalized, d.tiktok_username);
  }
  const dailyHandles = Array.from(dailyUsernameMap.keys()).filter((h) => !profMap.has(h));
  if (dailyHandles.length > 0) {
    const { data: extraProf } = await db.from("profiles").select("tiktok_handle_normalized, display_name, category").in("tiktok_handle_normalized", dailyHandles);
    for (const p of (extraProf ?? []) as Array<{ tiktok_handle_normalized: string; display_name: string | null; category: string | null }>) {
      profMap.set(p.tiktok_handle_normalized, { display_name: p.display_name, category: p.category });
    }
  }
  // usernameMap mergen
  for (const [h, u] of dailyUsernameMap) {
    if (!usernameMap.has(h)) usernameMap.set(h, u);
  }

  function topDay(field: "diamonds" | "viewers" | "followers" | "gifters" | "gifts" | "watchtime"): RankRow[] {
    type DRow = {
      tiktok_handle_normalized: string; diamonds: number | null; viewers: number | null;
      new_followers: number | null; gifters: number | null; gifts: number | null;
      watchtime_avg_seconds: number | null;
    };
    const fieldMap: Record<string, keyof DRow> = {
      diamonds: "diamonds", viewers: "viewers", followers: "new_followers",
      gifters: "gifters", gifts: "gifts", watchtime: "watchtime_avg_seconds",
    };
    const key = fieldMap[field];
    return (daily ?? [])
      .map((r) => {
        const v = (r as DRow)[key];
        return { handle: r.tiktok_handle_normalized, value: v === null || v === undefined ? 0 : Number(v) };
      })
      .filter((r) => r.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((r) => {
        const n = nameOf(r.handle);
        return { username: n.username, display_name: n.display_name, category: n.category, value: r.value };
      });
  }

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        email={profile.email}
        avatarUrl={profile.avatar_url}
        isAdmin={profile.role === "admin"}
        isManager={profile.role === "manager"}
      />
      <main className="container-luxe py-6 md:py-12 max-w-3xl">
        <div className="mb-6">
          <p className="eyebrow mb-2">Rankings</p>
          <h1 className="font-display italic text-3xl md:text-5xl text-cream leading-tight">
            Wer war diesen Monat stark?
          </h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <a
            href="/portal/rankings?tab=tag"
            className={`flex-1 text-center py-3 border text-[11px] uppercase tracking-[0.22em] transition-colors ${
              activeTab === "tag"
                ? "border-champagne bg-champagne/10 text-champagne"
                : "border-champagne/20 text-cream/55 hover:text-cream"
            }`}
          >
            🥈 Tagesranking
          </a>
          <a
            href="/portal/rankings?tab=monat"
            className={`flex-1 text-center py-3 border text-[11px] uppercase tracking-[0.22em] transition-colors ${
              activeTab === "monat"
                ? "border-champagne bg-champagne/10 text-champagne"
                : "border-champagne/20 text-cream/55 hover:text-cream"
            }`}
          >
            🏆 Monatsranking
          </a>
        </div>

        {/* Header */}
        <div className="mb-6">
          {activeTab === "monat" ? (
            <>
              <h2 className="text-cream text-xl md:text-2xl font-display italic mb-1">
                Monatsranking · {monthLabel(month)}
              </h2>
              <p className="text-cream/45 text-sm">Aktueller Monatsstand</p>
            </>
          ) : (
            <>
              <h2 className="text-cream text-xl md:text-2xl font-display italic mb-1">
                Tagesranking · {dailyLabel(dailyDate)}
              </h2>
              <p className="text-cream/45 text-sm">Letzter vollständiger LIVE-Tag</p>
            </>
          )}
        </div>

        {/* Kategorien · Top 3 pro Kat · KEINE Zahlen */}
        <div className="space-y-5">
          {CATEGORIES.map((cat) => {
            const rows = activeTab === "monat"
              ? topMonth(cat.key as "diamonds")
              : topDay(cat.key as "diamonds");
            return (
              <section
                key={cat.key}
                className="border border-champagne/20 p-4 md:p-5 bg-champagne/[0.02]"
              >
                <div className="mb-3">
                  <p className="text-cream text-lg font-display italic">
                    {cat.icon} {cat.label}
                  </p>
                  <p className="text-cream/45 text-xs mt-0.5">{cat.hint}</p>
                </div>

                {rows.length === 0 ? (
                  <p className="text-cream/40 text-sm italic">
                    Noch keine Daten für diese Kategorie.
                  </p>
                ) : (
                  <ol className="space-y-2">
                    {rows.map((r, i) => (
                      <li key={r.username + i} className="flex items-baseline gap-3">
                        <span className={`font-display italic text-2xl shrink-0 w-7 text-right ${
                          i === 0 ? "text-champagne" : "text-cream/55"
                        }`}>
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-cream text-base leading-tight truncate">
                            {r.display_name || r.username}
                          </p>
                          {r.category && (
                            <p className="text-cream/40 text-[10px] uppercase tracking-[0.18em] mt-0.5 truncate">
                              {r.category}
                            </p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                )}
              </section>
            );
          })}
        </div>

        <p className="text-cream/35 text-[10px] uppercase tracking-[0.22em] mt-8 text-center">
          Stand · {activeTab === "monat" ? monthLabel(month) : dailyLabel(dailyDate)}
        </p>
      </main>
    </>
  );
}
