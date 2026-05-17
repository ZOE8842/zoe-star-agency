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
  const requestedIso = sp.date && /^\d{4}-\d{2}-\d{2}$/.test(sp.date) ? sp.date : auto.iso;

  const db = srClient();
  const DAILY_SELECT = "tiktok_username, tiktok_handle_normalized, diamonds, live_minutes, viewers, new_followers, gifters, gifts, watchtime_avg_seconds";

  // Defensive Fallback: wenn Race-Condition (Stories triggern bevor Autopilot
  // den Tag in die DB geschoben hat) den requested Tag leer macht, nimm den
  // juengsten verfuegbaren Tag <= requestedIso. Header zeigt das tatsaechlich
  // verwendete Datum + verzoegert-Hint.
  let { data: metrics } = await db
    .from("creator_daily_metrics")
    .select(DAILY_SELECT)
    .eq("metric_date", requestedIso);

  let effectiveIso = requestedIso;
  let fallbackUsed = false;

  if (!metrics || metrics.length === 0) {
    const { data: latest } = await db
      .from("creator_daily_metrics")
      .select("metric_date")
      .lte("metric_date", requestedIso)
      .order("metric_date", { ascending: false })
      .limit(1);
    if (latest && latest.length > 0 && latest[0].metric_date && latest[0].metric_date !== requestedIso) {
      effectiveIso = latest[0].metric_date;
      fallbackUsed = true;
      const r = await db
        .from("creator_daily_metrics")
        .select(DAILY_SELECT)
        .eq("metric_date", effectiveIso);
      metrics = r.data;
    }
  }

  const targetLong = new Date(effectiveIso).toLocaleDateString("de-DE", { day: "2-digit", month: "long", year: "numeric" });

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
        <div style={{ paddingTop: 70, paddingLeft: 80, paddingRight: 80, textAlign: "center" }}>
          <div style={{
            fontSize: 22, letterSpacing: "0.65em", color: "#b58a3a",
            fontWeight: 500, textTransform: "uppercase",
          }}>
            ZOE ⭐
          </div>
          <div style={{ height: 34 }} />
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
            fontWeight: 700, fontSize: 118, lineHeight: 0.92, margin: 0,
            color: "#231706", letterSpacing: "-0.025em",
            textShadow: "0 2px 14px rgba(176,128,60,0.18)",
          }}>
            Tages<span style={{ color: "#b58a3a" }}>ranking</span>
          </h1>
          <div style={{ height: 22 }} />
          <div className="gold-line" />
          <div style={{ height: 24 }} />
          <div style={{
            fontSize: 26, color: "#b58a3a",
            letterSpacing: "0.5em", textTransform: "uppercase", fontWeight: 400,
          }}>
            {targetLong}
          </div>
          <div style={{ height: 12 }} />
          <div style={{ fontSize: 17, color: "#7a5b2a", fontStyle: "italic", letterSpacing: "0.01em" }}>
            {fallbackUsed
              ? "Top 3 je Kategorie · letzter verfuegbarer Tagesstand"
              : "Top 3 je Kategorie im aktuellen Tagesstand"}
          </div>
        </div>

        {/* ============ 7 CARDS ============ */}
        <div style={{
          marginTop: 56, paddingLeft: 56, paddingRight: 56,
          display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20,
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

        {/* FOOTER LOCKED-OUT (User-Decision V11.3):
            Kein Z.O.E.-Wortmark, kein Stern, kein Branding-Block unten.
            Brand-Identitaet kommt allein aus dem Header. */}
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
      border: "1px solid rgba(181,138,58,0.42)",
      background: "linear-gradient(165deg, rgba(255,250,236,0.45) 0%, rgba(238,222,180,0.18) 100%)",
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
      padding: wide ? "26px 32px" : "26px 28px",
      minHeight: wide ? 175 : 245,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 4 }}>
        <span style={{ fontSize: 26 }}>{emoji}</span>
        <span style={{
          fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic", fontWeight: 700,
          fontSize: 30, color: "#1a1004", letterSpacing: "0.005em",
        }}>
          {title}
        </span>
      </div>
      <div style={{
        height: 1, background: "linear-gradient(90deg, #a07028 0%, rgba(160,112,40,0.3) 30%, transparent 100%)",
        marginTop: 10, marginBottom: 12, opacity: 0.7,
      }} />
      {entries.length === 0 ? (
        <div style={{ fontSize: 17, color: "#7a5b2a", fontStyle: "italic" }}>noch keine Daten</div>
      ) : (
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {entries.map((e) => {
            const isFirst = e.rank === 1;
            return (
              <li key={e.rank} style={{
                display: "flex", alignItems: "baseline", justifyContent: "space-between",
                padding: "12px 0", borderBottom: "1px solid rgba(181,138,58,0.18)",
              }}>
                <span style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
                  <span style={{
                    fontFamily: "'Cormorant Garamond', serif", fontStyle: "italic",
                    fontWeight: 700, fontSize: 32, color: "#a07028", width: 28,
                  }}>{e.rank}.</span>
                  <span style={{
                    fontSize: isFirst ? 26 : 25,
                    color: isFirst ? "#0d0701" : "#1a1004",
                    fontWeight: isFirst ? 500 : 400,
                    letterSpacing: "0.005em",
                  }}>{e.name}</span>
                </span>
                {showValues && e.value && (
                  <span style={{
                    fontSize: 21, color: isFirst ? "#5a3a14" : "#7a5b2a", fontWeight: 500,
                    fontVariantNumeric: "tabular-nums",
                  }}>
                    {e.value}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
