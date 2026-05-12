import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";
import { RowActions } from "./RowActions";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, string> = {
  queued: "Wartet",
  sending: "Senden…",
  sent: "Gesendet",
  failed: "Fehler",
  skipped: "Uebersprungen",
};

const STATUS_TONE: Record<string, string> = {
  queued: "border border-champagne/40 text-champagne",
  sending: "border border-champagne/60 text-champagne",
  sent: "bg-champagne text-ink",
  failed: "border border-red-400/40 text-red-300/85",
  skipped: "border border-cream/20 text-cream/55",
};

const TYPE_LABEL: Record<string, string> = {
  match_scheduled: "Match · Geplant",
  match_partner_found: "Match · Partner",
  match_rejected: "Match · Abgelehnt",
  analysis_ready: "Analyse · Fertig",
  showcase_approved: "Showcase · Approved",
  event_started: "Event · Started",
  academy_challenge: "Academy · Challenge",
  inactivity_reminder: "Inaktiv-Reminder",
  service_update: "Service-Update",
  live_warning: "LIVE-Warning",
  push_selected: "TikTok-Push",
};

export default async function AdminNotificationsQueuePage() {
  const { supabase, profile } = await requireAdmin();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const since24h = new Date(Date.now() - 24 * 3600_000).toISOString();

  const [{ data: rows }, { count: totalToday }, { count: queuedAll }, { count: failedAll }, { count: sentAll }] = await Promise.all([
    supabase
      .from("platform_notifications")
      .select("id, profile_id, type, priority, title, body, context_url, status, attempts, last_attempt_at, error_message, sent_at, cooldown_until, created_at")
      .gte("created_at", since24h)
      .order("priority", { ascending: true })
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("platform_notifications")
      .select("id", { head: true, count: "exact" })
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("platform_notifications")
      .select("id", { head: true, count: "exact" })
      .eq("status", "queued"),
    supabase
      .from("platform_notifications")
      .select("id", { head: true, count: "exact" })
      .eq("status", "failed"),
    supabase
      .from("platform_notifications")
      .select("id", { head: true, count: "exact" })
      .eq("status", "sent")
      .gte("created_at", todayStart.toISOString()),
  ]);

  const ids = Array.from(new Set((rows ?? []).map((r) => r.profile_id)));
  const { data: profs } = ids.length
    ? await supabase.from("profiles").select("id, display_name, tiktok_username").in("id", ids)
    : { data: [] };
  const map = new Map((profs ?? []).map((p) => [p.id, p]));

  // Showcase-Status laden — nur fuer Creators, die in der Queue
  // showcase_approved-Eintraege haben. Wenn der Showcase bereits LIVE
  // (approved + featured) ist, ist die DM redundant.
  const showcaseProfileIds = Array.from(new Set(
    (rows ?? [])
      .filter((r) => r.type === "showcase_approved")
      .map((r) => r.profile_id),
  ));
  const showcaseLiveSet = new Set<string>();
  if (showcaseProfileIds.length > 0) {
    const { data: showcases } = await supabase
      .from("showcase_creators")
      .select("profile_id, is_approved, is_featured")
      .in("profile_id", showcaseProfileIds);
    for (const s of showcases ?? []) {
      if (s.is_approved && s.is_featured) showcaseLiveSet.add(s.profile_id);
    }
  }

  // Auto-Skip: showcase_approved-Eintraege mit status=queued, deren
  // Showcase bereits LIVE ist, werden automatisch auf "skipped" gesetzt.
  // Damit verschwindet das widerspruechliche "Wartet" auf LIVE-Cards.
  const autoSkipIds: string[] = [];
  for (const r of rows ?? []) {
    if (r.type === "showcase_approved" && r.status === "queued" && showcaseLiveSet.has(r.profile_id)) {
      autoSkipIds.push(r.id);
    }
  }
  if (autoSkipIds.length > 0) {
    await supabase
      .from("platform_notifications")
      .update({
        status: "skipped",
        error_message: "auto: showcase bereits live",
      })
      .in("id", autoSkipIds);
    // Lokale rows-Liste synchron halten — Render zeigt direkt "Uebersprungen"
    for (const r of rows ?? []) {
      if (autoSkipIds.includes(r.id)) {
        r.status = "skipped";
        r.error_message = "auto: showcase bereits live";
      }
    }
  }

  return (
    <>
      <PortalNav
        userId={profile.id}
        displayName={profile.display_name}
        tiktokUsername={profile.tiktok_username}
        avatarUrl={profile.avatar_url}
        isAdmin
      />

      <main className="container-luxe py-12 md:py-16">
        <p className="eyebrow mb-4">Admin · Plattform</p>
        <h1 className="font-display italic text-cream text-4xl md:text-5xl leading-[1.05] tracking-[-0.02em] mb-4">
          TikTok-DM <span className="text-champagne">Queue.</span>
        </h1>
        <p className="text-cream/60 text-base md:text-lg leading-relaxed mb-12 max-w-2xl">
          External-Push via @zoe.star.agency. Worker laeuft lokal auf
          dem Win-PC und verarbeitet die Queue in eingeloggter Browser-
          Session. Inbox + Activity-Feed bleiben primary.
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-14">
          <Count label="Heute gesamt" value={totalToday ?? 0} />
          <Count label="In Queue" value={queuedAll ?? 0} highlight={(queuedAll ?? 0) > 0} />
          <Count label="Heute gesendet" value={sentAll ?? 0} />
          <Count label="Fehler" value={failedAll ?? 0} highlight={(failedAll ?? 0) > 0 && "warn"} />
        </div>

        {(rows ?? []).length === 0 && (
          <p className="text-cream/45 italic font-display text-lg">Keine Events in den letzten 24 h.</p>
        )}

        <ul className="space-y-3">
          {(rows ?? []).map((r) => {
            const creator = map.get(r.profile_id);
            return (
              <li key={r.id} className={`border p-4 md:p-5 ${r.status === "failed" ? "border-red-400/40 bg-red-400/5" : "border-champagne/15"}`}>
                <div className="flex items-baseline justify-between gap-3 mb-2 flex-wrap">
                  <p className="font-display italic text-cream text-lg md:text-xl">
                    {creator?.display_name || creator?.tiktok_username || "—"}{" "}
                    {creator?.tiktok_username && (
                      <span className="text-cream/45 text-sm">@{creator.tiktok_username}</span>
                    )}
                  </p>
                  <span className={`shrink-0 px-2.5 py-0.5 text-[10px] uppercase tracking-[0.25em] ${STATUS_TONE[r.status] ?? ""}`}>
                    {STATUS_LABEL[r.status] ?? r.status}
                  </span>
                </div>

                <p className="text-cream/55 text-[11px] uppercase tracking-[0.22em] mb-2">
                  {TYPE_LABEL[r.type] ?? r.type} · prio {r.priority}
                  {r.attempts > 0 && <> · {r.attempts} versuch{r.attempts === 1 ? "" : "e"}</>}
                  {r.type === "showcase_approved" && showcaseLiveSet.has(r.profile_id) && (
                    <> · <span className="text-champagne">Showcase live</span></>
                  )}
                </p>

                <p className="text-cream text-sm leading-relaxed mb-2 break-words">{r.body}</p>

                {r.context_url && (
                  <p className="text-cream/35 text-[10px] uppercase tracking-[0.25em] mb-2 break-all">
                    {r.context_url}
                  </p>
                )}

                {r.error_message && (
                  <p className="text-red-300/85 text-xs italic mb-2 break-all">{r.error_message}</p>
                )}

                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <span className="text-cream/35 text-[10px] uppercase tracking-[0.25em]">
                    {new Date(r.created_at).toLocaleString("de-DE", { dateStyle: "short", timeStyle: "short" })}
                    {r.sent_at && <> · sent {new Date(r.sent_at).toLocaleTimeString("de-DE")}</>}
                    {r.cooldown_until && <> · cooldown bis {new Date(r.cooldown_until).toLocaleTimeString("de-DE")}</>}
                  </span>
                  <RowActions id={r.id} status={r.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}

function Count({ label, value, highlight }: { label: string; value: number; highlight?: boolean | "warn" }) {
  const tone = highlight === "warn"
    ? "border-red-400/40 bg-red-400/5"
    : highlight
    ? "border-champagne bg-champagne/5"
    : "border-champagne/15";
  const text = highlight === "warn"
    ? "text-red-300/85"
    : highlight
    ? "text-champagne"
    : "text-cream";
  return (
    <div className={`border p-5 md:p-6 ${tone}`}>
      <p className="text-cream/45 text-[10px] uppercase tracking-[0.25em] mb-3">{label}</p>
      <p className={`font-display italic font-black text-3xl md:text-4xl leading-none ${text}`}>{value}</p>
    </div>
  );
}
