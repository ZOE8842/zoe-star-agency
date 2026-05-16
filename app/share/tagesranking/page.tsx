// /share/tagesranking
// Standalone Story-Render-Page · 1080×1920 · Cream Premium
// Bearer-Schutz via ?k=<token>

import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

interface DRow {
  display_name: string | null;
  tiktok_username: string;
  diamonds: number | null;
  live_minutes: number | null;
  viewers: number | null;
  new_followers: number | null;
  gifters: number | null;
  gifts: number | null;
  watchtime_avg_seconds: number | null;
}

function srClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

function fmtInt(n: number | null | undefined): string {
  if (n === null || n === undefined) return "—";
  return Number(n).toLocaleString("de-DE");
}
function fmtMinAsHM(min: number | null): string {
  if (min === null || min === undefined) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
function fmtSeconds(sec: number | null): string {
  if (sec === null || sec === undefined) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s}s`;
}

function pickTop3(
  rows: DRow[],
  sortKey: (r: DRow) => number,
  renderValue: (r: DRow) => string,
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

function targetDateBerlin(): { iso: string; long: string } {
  const now = new Date();
  const berlinHour = parseInt(
    new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Berlin", hour: "2-digit", hour12: false }).format(now),
    10,
  );
  const berlinDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Berlin" }));
  const t = new Date(berlinDate);
  t.setDate(t.getDate() - (berlinHour < 12 ? 2 : 1));
  const iso = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
  const long = t.toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });
  return { iso, long };
}

interface PageProps {
  searchParams: Promise<{ k?: string; date?: string }>;
}

export default async function TagesrankingSharePage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const expected = process.env.BACKSTAGE_SYNC_BEARER;
  if (!expected || sp.k !== expected) {
    return (
      <div style={{ padding: 40, fontFamily: "system-ui", background: "#fff", color: "#000", minHeight: "100vh" }}>
        401 · Unauthorized
      </div>
    );
  }

  const auto = targetDateBerlin();
  const targetIso = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : auto.iso;
  const targetLong = sp.date
    ? new Date(targetIso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" })
    : auto.long;

  const db = srClient();
  const { data: metrics } = await db
    .from("creator_daily_metrics")
    .select(
      "tiktok_username, tiktok_handle_normalized, diamonds, live_minutes, viewers, new_followers, gifters, gifts, watchtime_avg_seconds",
    )
    .eq("metric_date", targetIso);

  const handles = (metrics ?? []).map((m) => m.tiktok_handle_normalized);
  const { data: profiles } = handles.length > 0
    ? await db
        .from("profiles")
        .select("tiktok_handle_normalized, display_name")
        .in("tiktok_handle_normalized", handles)
    : { data: [] };
  const nameByHandle = new Map((profiles ?? []).map((p) => [p.tiktok_handle_normalized, p.display_name]));

  const rows: DRow[] = (metrics ?? []).map((m) => ({
    display_name: nameByHandle.get(m.tiktok_handle_normalized) ?? null,
    tiktok_username: m.tiktok_username ?? "",
    diamonds: m.diamonds,
    live_minutes: m.live_minutes,
    viewers: m.viewers,
    new_followers: m.new_followers,
    gifters: m.gifters,
    gifts: m.gifts,
    watchtime_avg_seconds: m.watchtime_avg_seconds,
  }));

  const diamanten   = pickTop3(rows, (r) => r.diamonds ?? 0,              () => "");
  const liveZeit    = pickTop3(rows, (r) => r.live_minutes ?? 0,          (r) => fmtMinAsHM(r.live_minutes));
  const zuschauer   = pickTop3(rows, (r) => r.viewers ?? 0,               (r) => fmtInt(r.viewers));
  const neueFol     = pickTop3(rows, (r) => r.new_followers ?? 0,         (r) => fmtInt(r.new_followers));
  const schenkende  = pickTop3(rows, (r) => r.gifters ?? 0,               (r) => fmtInt(r.gifters));
  const gifts       = pickTop3(rows, (r) => r.gifts ?? 0,                 (r) => fmtInt(r.gifts));
  const wiedergabe  = pickTop3(rows, (r) => r.watchtime_avg_seconds ?? 0, (r) => fmtSeconds(r.watchtime_avg_seconds));

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@1,400;1,500;1,600;1,700&family=Inter:wght@300;400;500;600;700&display=swap');
        html, body { margin: 0; padding: 0; background: #f4ead2; }
        body { font-family: 'Inter', system-ui, sans-serif; }
        .story {
          width: 1080px; height: 1920px; position: relative; overflow: hidden;
          background:
            radial-gradient(ellipse 800px 600px at center top, rgba(192,143,72,0.12), transparent 60%),
            radial-gradient(ellipse at bottom left, rgba(192,143,72,0.05), transparent 65%),
            linear-gradient(180deg, #faf0d7 0%, #f4e6c7 45%, #ecdbb5 100%);
          color: #2a1d0a;
        }
        .grain { position:absolute; inset:0; pointer-events:none; opacity:0.06;
                 background-image:url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
        .vignette { position:absolute; inset:0; pointer-events:none;
                    box-shadow: inset 0 0 200px 30px rgba(176,128,60,0.15); }
        .gold-line { width: 100px; height: 1px; background: linear-gradient(90deg, transparent, #b58a3a, transparent); margin: 0 auto; }
      `}</style>
      <div className="story">
        <div className="grain" />
        <div className="vignette" />

        {/* ============ HEADER ============ */}
        <div style={{ paddingTop: 100, paddingLeft: 80, paddingRight: 80, textAlign: "center" }}>
          <div style={{
            fontSize: 24, letterSpacing: "0.65em", color: "#b58a3a",
            fontWeight: 500, textTransform: "uppercase",
          }}>
            ZOE ⭐
          </div>
          <div style={{ height: 46 }} />
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontWeight: 700, fontSize: 132, lineHeight: 0.92, margin: 0,
            color: "#231706", letterSpacing: "-0.025em",
            textShadow: "0 2px 14px rgba(176,128,60,0.18)",
          }}>
            Tages<span style={{ color: "#b58a3a" }}>ranking</span>
          </h1>
          <div style={{ height: 28 }} />
          <div className="gold-line" />
          <div style={{ height: 32 }} />
          <div style={{
            fontSize: 30, color: "#b58a3a",
            letterSpacing: "0.5em", textTransform: "uppercase", fontWeight: 400,
          }}>
            {targetLong}
          </div>
          <div style={{ height: 16 }} />
          <div style={{ fontSize: 19, color: "#7a5b2a", fontStyle: "italic", letterSpacing: "0.01em" }}>
            Top 3 je Kategorie im aktuellen Tagesstand
          </div>
        </div>

        {/* ============ 7 CARDS ============ */}
        <div style={{
          marginTop: 76, paddingLeft: 60, paddingRight: 60,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24,
        }}>
          <Card emoji="💎" title="Diamanten"      entries={diamanten}   showValues={false} />
          <Card emoji="⏱"  title="LIVE-Zeit"      entries={liveZeit}    showValues={true} />
          <Card emoji="👀" title="Zuschauer"      entries={zuschauer}   showValues={true} />
          <Card emoji="📈" title="Neue Follower"  entries={neueFol}     showValues={true} />
          <Card emoji="👤" title="Schenkende"     entries={schenkende}  showValues={true} />
          <Card emoji="🎁" title="Gifts"          entries={gifts}       showValues={true} />
          <div style={{ gridColumn: "span 2" }}>
            <Card emoji="⏳" title="Wiedergabezeit" entries={wiedergabe} showValues={true} wide />
          </div>
        </div>

        {/* ============ FOOTER ============ */}
        <div style={{
          position: "absolute", bottom: 70, left: 0, right: 0, textAlign: "center",
        }}>
          <div className="gold-line" />
          <div style={{ height: 26 }} />
          <div style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontSize: 26, color: "#b58a3a", letterSpacing: "0.18em",
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
      border: "1px solid rgba(181,138,58,0.36)",
      background: "linear-gradient(165deg, rgba(255,250,236,0.55) 0%, rgba(238,222,180,0.20) 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4), 0 4px 16px rgba(140,100,40,0.12)",
      padding: wide ? "28px 32px" : "26px 28px",
      minHeight: wide ? 170 : 235,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 13, marginBottom: 4 }}>
        <span style={{ fontSize: 30 }}>{emoji}</span>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 600,
          fontSize: 34, color: "#231706", letterSpacing: "0.005em",
        }}>
          {title}
        </span>
      </div>
      <div style={{
        height: 1, background: "linear-gradient(90deg, #b58a3a 0%, rgba(181,138,58,0.4) 40%, transparent 100%)",
        marginTop: 10, marginBottom: 14, opacity: 0.6,
      }} />
      {entries.length === 0 ? (
        <div style={{ fontSize: 17, color: "#7a5b2a", fontStyle: "italic" }}>noch keine Daten</div>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {entries.map((e) => (
            <li key={e.rank} style={{
              display: "flex", alignItems: "baseline", justifyContent: "space-between",
              padding: "10px 0", borderBottom: "1px solid rgba(181,138,58,0.16)",
            }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                <span style={{
                  fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                  fontWeight: 600, fontSize: 28, color: "#b58a3a", width: 24,
                }}>{e.rank}.</span>
                <span style={{ fontSize: 23, color: "#231706", fontWeight: 400 }}>{e.name}</span>
              </span>
              {showValues && e.value && (
                <span style={{
                  fontSize: 21, color: "#6f5024", fontWeight: 500,
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
