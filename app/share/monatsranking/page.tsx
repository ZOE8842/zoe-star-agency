// /share/monatsranking
// Standalone Story-Render-Page · 1080×1920 · Dark Premium
// Wird von Playwright (Workstation) screenshotted → PNG → Telegram
//
// SCOPE:
//   - Kein PortalNav · kein Footer · kein Admin-UI
//   - Bearer-Schutz via ?k=<token> · ohne Token → 401
//   - Service-Role-Read aus creator_monthly_metrics
//   - Top-3 pro Kategorie · Diamanten OHNE Werte
//
// FORMAT:
//   - 1080×1920 px (Story 9:16)
//   - Schwarzer Luxury-BG · Champagne/Gold-Akzente
//   - 7 Cards: Diamanten · LIVE-Stunden · LIVE-Tage · Zuschauer ·
//     Neue Follower · Schenkende · Wiedergabezeit
//   - Layout: 6 Cards 2-Spalten-Grid + Karte 7 in voller Breite

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface Row {
  display_name: string | null;
  tiktok_username: string;
  valid_live_days: number;
  live_minutes_total: number;
  live_hours_display: number | null;
  average_viewers: number;
  diamonds_month: number | null;
  followers_gained: number | null;
  gifters_count: number | null;
  watchtime_avg_seconds: number | null;
  approx_total_viewers: number;
}

function srClient() {
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

function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("de-DE");
}
function fmtHours(min: number, display: number | null): string {
  if (display != null) return `${display.toString().replace(".", ",")}h`;
  if (min <= 0) return "0h";
  return `${(min / 60).toFixed(1).replace(".", ",")}h`;
}
function fmtSeconds(sec: number | null): string {
  if (sec === null || sec === undefined) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function pickTop3(
  rows: Row[],
  sortKey: (r: Row) => number,
  renderValue: (r: Row) => string,
): Array<{ rank: number; name: string; value: string }> {
  const sorted = [...rows]
    .filter((r) => sortKey(r) > 0)
    .sort((a, b) => sortKey(b) - sortKey(a))
    .slice(0, 3);
  return sorted.map((r, i) => ({
    rank: i + 1,
    name: r.display_name || r.tiktok_username,
    value: renderValue(r),
  }));
}

interface PageProps {
  searchParams: Promise<{ k?: string }>;
}

export default async function MonatsrankingSharePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const expected = process.env.BACKSTAGE_SYNC_BEARER;
  if (!expected || sp.k !== expected) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", background: "#000", color: "#fff", minHeight: "100vh" }}>
        401 · Unauthorized
      </div>
    );
  }

  const db = srClient();
  const month = currentMonthIso();
  const { data: metrics } = await db
    .from("creator_monthly_metrics")
    .select(
      "tiktok_username, tiktok_handle_normalized, valid_live_days, live_minutes_total, live_hours_display, average_viewers, diamonds_month, followers_gained, gifters_count, watchtime_avg_seconds",
    )
    .eq("month", month);

  const handles = (metrics ?? []).map((m) => m.tiktok_handle_normalized);
  const { data: profiles } = handles.length > 0
    ? await db
        .from("profiles")
        .select("tiktok_handle_normalized, display_name")
        .in("tiktok_handle_normalized", handles)
    : { data: [] };
  const nameByHandle = new Map((profiles ?? []).map((p) => [p.tiktok_handle_normalized, p.display_name]));

  const rows: Row[] = (metrics ?? []).map((m) => {
    const days = m.valid_live_days || 0;
    const avg = m.average_viewers || 0;
    return {
      display_name: nameByHandle.get(m.tiktok_handle_normalized) ?? null,
      tiktok_username: m.tiktok_username ?? "",
      valid_live_days: days,
      live_minutes_total: m.live_minutes_total,
      live_hours_display: m.live_hours_display,
      average_viewers: avg,
      diamonds_month: m.diamonds_month,
      followers_gained: m.followers_gained ?? null,
      gifters_count: m.gifters_count ?? null,
      watchtime_avg_seconds: m.watchtime_avg_seconds ?? null,
      approx_total_viewers: avg * days,
    };
  });

  const diamanten   = pickTop3(rows, (r) => r.diamonds_month ?? 0,        () => "");
  const liveStunden = pickTop3(rows, (r) => r.live_minutes_total,         (r) => fmtHours(r.live_minutes_total, r.live_hours_display));
  const liveTage    = pickTop3(rows, (r) => r.valid_live_days,            (r) => `${r.valid_live_days} Tage`);
  const zuschauer   = pickTop3(rows, (r) => r.approx_total_viewers,       (r) => fmtInt(r.approx_total_viewers));
  const neueFol     = pickTop3(rows, (r) => r.followers_gained ?? 0,      (r) => fmtInt(r.followers_gained));
  const schenkende  = pickTop3(rows, (r) => r.gifters_count ?? 0,         (r) => fmtInt(r.gifters_count));
  const wiedergabe  = pickTop3(rows, (r) => r.watchtime_avg_seconds ?? 0, (r) => fmtSeconds(r.watchtime_avg_seconds));

  const monthLabel = new Date(month).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        html, body { margin: 0; padding: 0; background: #07050a; }
        body { font-family: 'Inter', system-ui, sans-serif; }
        .story {
          width: 1080px; height: 1920px; position: relative; overflow: hidden;
          background:
            radial-gradient(ellipse 800px 600px at center top, rgba(232,201,144,0.14), transparent 60%),
            radial-gradient(ellipse at bottom right, rgba(232,201,144,0.05), transparent 65%),
            linear-gradient(180deg, #0c0804 0%, #100b06 45%, #08060b 100%);
          color: #f5edd6;
        }
        .grain { position:absolute; inset:0; pointer-events:none; opacity:0.05;
                 background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .vignette { position:absolute; inset:0; pointer-events:none;
                    box-shadow: inset 0 0 220px 40px rgba(0,0,0,0.7); }
        .gold-line { width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #e8c990, transparent); margin: 0 auto; }
      `}</style>
      <div className="story">
        <div className="grain" />
        <div className="vignette" />

        {/* ============ HEADER ============ */}
        <div style={{ paddingTop: 70, paddingLeft: 80, paddingRight: 80, textAlign: "center" }}>
          <div style={{
            fontSize: 22, letterSpacing: "0.65em", color: "#e8c990",
            fontWeight: 500, textTransform: "uppercase",
            textShadow: "0 0 25px rgba(232,201,144,0.25)",
          }}>
            ZOE ⭐
          </div>
          <div style={{ height: 34 }} />
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontWeight: 700, fontSize: 118, lineHeight: 0.92, margin: 0,
            color: "#faecc6", letterSpacing: "-0.025em",
            textShadow: "0 4px 28px rgba(232,201,144,0.18)",
          }}>
            Monats<span style={{ color: "#e8c990" }}>ranking</span>
          </h1>
          <div style={{ height: 22 }} />
          <div className="gold-line" />
          <div style={{ height: 24 }} />
          <div style={{
            fontSize: 26, color: "#e8c990",
            letterSpacing: "0.5em", textTransform: "uppercase", fontWeight: 400,
          }}>
            {monthLabel}
          </div>
          <div style={{ height: 12 }} />
          <div style={{ fontSize: 17, color: "#a89776", fontStyle: "italic", letterSpacing: "0.01em" }}>
            Top 3 je Kategorie im aktuellen Monatsstand
          </div>
        </div>

        {/* ============ 7 CARDS · 6 in 2-spalt + 1 voll ============ */}
        <div style={{
          marginTop: 56, paddingLeft: 56, paddingRight: 56,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
        }}>
          <Card emoji="💎" title="Diamanten" entries={diamanten} showValues={false} />
          <Card emoji="⏱"  title="LIVE-Stunden" entries={liveStunden} showValues={true} />
          <Card emoji="🔥" title="LIVE-Tage" entries={liveTage} showValues={true} />
          <Card emoji="👀" title="Zuschauer" entries={zuschauer} showValues={true} />
          <Card emoji="📈" title="Neue Follower" entries={neueFol} showValues={true} />
          <Card emoji="👤" title="Schenkende" entries={schenkende} showValues={true} />
          {/* Karte 7 in voller Breite */}
          <div style={{ gridColumn: "span 2" }}>
            <Card emoji="⏳" title="Wiedergabezeit" entries={wiedergabe} showValues={true} wide />
          </div>
        </div>

        {/* ============ FOOTER (minimal · nur Wortmark) ============ */}
        <div style={{
          position: "absolute", bottom: 46, left: 0, right: 0, textAlign: "center",
        }}>
          <div className="gold-line" />
          <div style={{ height: 18 }} />
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: 22, color: "#e8c990", letterSpacing: "0.18em",
          }}>
            Z.O.E. Star Agency
          </div>
        </div>
      </div>
    </>
  );
}

interface CardProps {
  emoji: string;
  title: string;
  entries: Array<{ rank: number; name: string; value: string }>;
  showValues: boolean;
  wide?: boolean;
}

function Card({ emoji, title, entries, showValues, wide }: CardProps) {
  return (
    <div style={{
      border: "1px solid rgba(232,201,144,0.28)",
      background: "linear-gradient(165deg, rgba(232,201,144,0.06) 0%, rgba(20,12,4,0.55) 100%)",
      boxShadow: "inset 0 1px 0 rgba(232,201,144,0.12), 0 6px 24px rgba(0,0,0,0.45)",
      padding: wide ? "22px 28px" : "22px 24px",
      minHeight: wide ? 150 : 210,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 26 }}>{emoji}</span>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600,
          fontSize: 30, color: "#faecc6", letterSpacing: "0.005em",
        }}>
          {title}
        </span>
      </div>
      <div style={{
        height: 1, background: "linear-gradient(90deg, #e8c990 0%, rgba(232,201,144,0.4) 40%, transparent 100%)",
        marginTop: 10, marginBottom: 14, opacity: 0.7,
      }} />
      {entries.length === 0 ? (
        <div style={{ fontSize: 17, color: "#8a7a5a", fontStyle: "italic" }}>noch keine Daten</div>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {entries.map((e) => (
            <li key={e.rank} style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              padding: "8px 0", borderBottom: "1px solid rgba(232,201,144,0.10)",
            }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                  fontWeight: 600, fontSize: 25, color: "#e8c990", width: 22,
                }}>{e.rank}.</span>
                <span style={{ fontSize: 21, color: "#f5edd6", fontWeight: 400 }}>{e.name}</span>
              </span>
              {showValues && e.value && (
                <span style={{
                  fontSize: 19, color: "#e8c990", fontWeight: 500,
                  fontVariantNumeric: "tabular-nums",
                }}>
                  {e.value}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
