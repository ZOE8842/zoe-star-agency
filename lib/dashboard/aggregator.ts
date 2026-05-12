// Dashboard-Aggregator · sammelt parallel alle Daten fuer Today-Queue,
// Warnings und Recommendations. Keine neue Migration noetig — alles
// aus bestehenden Tabellen.

import type { SupabaseClient } from "@supabase/supabase-js";

export type QueueItem = {
  id: string;
  eyebrow: string;
  headline: string;
  hint?: string;
  href: string;
  urgency: "now" | "soon" | "info";
};

export type Warning = {
  id: string;
  headline: string;
  body: string;
  href: string;
  severity: "high" | "medium";
};

export type Recommendation = {
  id: string;
  eyebrow: string;
  headline: string;
  body: string;
  href: string;
};

export type DashboardData = {
  queue: QueueItem[];
  warnings: Warning[];
  recommendations: Recommendation[];
};

type ProfileLike = {
  id: string;
  bio: string | null;
  display_name: string | null;
  avatar_url: string | null;
  allow_website_showcase: boolean | null;
  allow_partner_cooperations: boolean | null;
  allow_partner_cooperations_confirmed: boolean | null;
  showcase_interest_decided_at?: string | null;
  cooperation_interest_decided_at?: string | null;
  last_active_at?: string | null;
};

function nextMondayIso(now = new Date()): string {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=So, 1=Mo
  const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

function plural(n: number, one: string, more: string): string {
  return n === 1 ? one : more;
}

export async function loadDashboardData(
  supabase: SupabaseClient,
  profile: ProfileLike,
): Promise<DashboardData> {
  const now = new Date();
  const nowIso = now.toISOString();
  const in48hIso = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
  const sinceCutoff = profile.last_active_at
    ?? new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString();
  const nextMon = nextMondayIso(now);

  const [
    unreadRes,
    ackPendingRes,
    contentDoneRes,
    pushNextRes,
    matchOpenRes,
    phoneOpenRes,
    showcaseRes,
    nextEventRes,
    activeChallengeRes,
    lastLessonReadRes,
    coopAckTokenRes,
  ] = await Promise.all([
    // 1) Ungelesene Messages
    supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`),
    // 2) Acks-erforderlich (messages mit requires_ack ohne acknowledged_at)
    supabase
      .from("messages")
      .select("id, subject, requires_ack")
      .or(`recipient_id.eq.${profile.id},recipient_group.eq.all_creators`)
      .eq("requires_ack", true)
      .limit(20),
    // 3) Content-Reviews fertig seit last_active
    supabase
      .from("content_reviews")
      .select("id, kind, reviewed_at, status")
      .eq("profile_id", profile.id)
      .in("status", ["done", "reviewed"])
      .gte("reviewed_at", sinceCutoff)
      .order("reviewed_at", { ascending: false })
      .limit(3),
    // 4) Push-Anfrage fuer naechste Woche
    supabase
      .from("tiktok_push_requests")
      .select("id, status")
      .eq("profile_id", profile.id)
      .eq("week_start_monday", nextMon)
      .maybeSingle(),
    // 5) Match-Requests offen
    supabase
      .from("match_requests")
      .select("id, status")
      .eq("profile_id", profile.id)
      .in("status", ["requested", "reviewing", "partner_found", "planned"])
      .order("created_at", { ascending: false })
      .limit(3),
    // 6) Phone-Call-Requests offen
    supabase
      .from("phone_call_requests")
      .select("id, status")
      .eq("profile_id", profile.id)
      .in("status", ["open", "planned"])
      .order("created_at", { ascending: false })
      .limit(3),
    // 7) Showcase + Bilder-Anzahl
    supabase
      .from("showcase_creators")
      .select("id, is_approved, is_featured, showcase_images")
      .eq("profile_id", profile.id)
      .maybeSingle(),
    // 8) Naechstes Event in 48h (mit eigenem signup)
    supabase
      .from("event_signups")
      .select("id, event:events(id, title, start_at, status)")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(10),
    // 9) Aktive Academy-Challenge
    supabase
      .from("academy_challenges")
      .select("id, slug, title, ends_at")
      .eq("is_active", true)
      .or(`ends_at.gt.${nowIso},ends_at.is.null`)
      .order("starts_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // 10) Letzter Lesson-Read fuer Recommendation
    supabase
      .from("academy_lesson_reads")
      .select("created_at")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    // 11) Acknowledged messages map fuer Ack-Pending-Diff
    supabase
      .from("message_reads")
      .select("message_id, acknowledged_at")
      .eq("reader_id", profile.id)
      .not("acknowledged_at", "is", null),
  ]);

  const queue: QueueItem[] = [];
  const warnings: Warning[] = [];
  const recommendations: Recommendation[] = [];

  // QUEUE 1 — Ungelesene Nachrichten
  const unreadCount = unreadRes.count ?? 0;
  if (unreadCount > 0) {
    queue.push({
      id: "inbox-unread",
      eyebrow: "Inbox",
      headline: `${unreadCount} ${plural(unreadCount, "Nachricht ungelesen", "Nachrichten ungelesen")}`,
      href: "/portal/inbox",
      urgency: "soon",
    });
  }

  // QUEUE 2 — Ack-pflichtige Messages noch ohne Ack
  const ackedIds = new Set((coopAckTokenRes.data ?? []).map((r) => r.message_id));
  const ackPending = (ackPendingRes.data ?? []).filter((m) => !ackedIds.has(m.id));
  if (ackPending.length > 0) {
    queue.push({
      id: "inbox-ack",
      eyebrow: "Inbox",
      headline: `${ackPending.length} ${plural(ackPending.length, "Bestätigung", "Bestätigungen")} offen`,
      href: `/portal/inbox/${ackPending[0].id}`,
      urgency: "now",
    });
  }

  // QUEUE 3 — Content-Reviews fertig
  const contentDone = contentDoneRes.data ?? [];
  if (contentDone.length > 0) {
    const first = contentDone[0];
    queue.push({
      id: "content-done",
      eyebrow: "Content",
      headline: contentDone.length === 1
        ? "Dein Content-Review ist fertig"
        : `${contentDone.length} Reviews fertig`,
      hint: first.kind === "image" ? "Bild" : first.kind === "video_link" ? "Video" : first.kind,
      href: `/portal/services/content-helper/${first.id}`,
      urgency: "soon",
    });
  }

  // QUEUE 4 — Push-Anfrage fehlt fuer naechste Woche
  if (!pushNextRes.data) {
    queue.push({
      id: "push-missing",
      eyebrow: "Push",
      headline: "Wunschzeit fuer naechste Woche setzen",
      href: "/portal/services/tiktok-push",
      urgency: "soon",
    });
  }

  // QUEUE 5 — Match-Requests in Bearbeitung
  const matchOpen = matchOpenRes.data ?? [];
  if (matchOpen.length > 0) {
    const m = matchOpen[0];
    const statusLabel = m.status === "partner_found" ? "Partner gefunden"
      : m.status === "planned" ? "Geplant"
      : m.status === "reviewing" ? "In Pruefung"
      : "Angefragt";
    queue.push({
      id: "match-open",
      eyebrow: "Match",
      headline: matchOpen.length === 1
        ? `Match · ${statusLabel}`
        : `${matchOpen.length} Match-Anfragen offen`,
      href: "/portal/services/big-match",
      urgency: "info",
    });
  }

  // QUEUE 6 — Phone-Call offen
  const phoneOpen = phoneOpenRes.data ?? [];
  if (phoneOpen.length > 0) {
    queue.push({
      id: "phone-open",
      eyebrow: "Telefon",
      headline: phoneOpen.length === 1
        ? "Rueckruf-Anfrage offen"
        : `${phoneOpen.length} Rueckruf-Anfragen offen`,
      href: "/portal/services/phone-request",
      urgency: "info",
    });
  }

  // QUEUE 7 — Showcase pending review
  const showcase = showcaseRes.data as null | {
    is_approved: boolean | null;
    is_featured: boolean | null;
    showcase_images: unknown;
  };
  const imageCount = Array.isArray(showcase?.showcase_images)
    ? (showcase!.showcase_images as Array<{ url?: string }>).filter((i) => i?.url).length
    : 0;
  if (showcase && !showcase.is_approved && imageCount >= 2) {
    queue.push({
      id: "showcase-review",
      eyebrow: "Showcase",
      headline: "Showcase wartet auf Freigabe",
      href: "/portal/profile/showcase",
      urgency: "info",
    });
  }

  // QUEUE 8 — Setup-Schritte (kompakt: nur wenn etwas fehlt)
  const profileGaps: string[] = [];
  if (!profile.display_name) profileGaps.push("Name");
  if (!profile.avatar_url) profileGaps.push("Profilbild");
  if (!profile.bio) profileGaps.push("Bio");
  if (profileGaps.length > 0 && profileGaps.length <= 2) {
    queue.push({
      id: "profile-setup",
      eyebrow: "Profil",
      headline: `${profileGaps.join(" + ")} fehlt`,
      href: "/portal/profile",
      urgency: "info",
    });
  }

  // QUEUE 9 — Event in <48h mit Signup
  type SignupRow = {
    event?: { id?: string; title?: string; start_at?: string; status?: string } | null;
  };
  const nearEvent = (nextEventRes.data as SignupRow[] | null ?? [])
    .map((r) => r.event)
    .find((e) => {
      if (!e || !e.start_at || e.status !== "open") return false;
      return e.start_at >= nowIso && e.start_at <= in48hIso;
    });
  if (nearEvent && nearEvent.id) {
    const dt = nearEvent.start_at ? new Date(nearEvent.start_at) : null;
    queue.push({
      id: "event-near",
      eyebrow: "Event",
      headline: nearEvent.title || "Event bald",
      hint: dt ? dt.toLocaleString("de-DE", { weekday: "short", hour: "2-digit", minute: "2-digit" }) : undefined,
      href: "/portal/events",
      urgency: "soon",
    });
  }

  // WARNING 1 — Showcase aktiv aber unvollstaendig (< 2 Bilder)
  if (showcase && imageCount < 2 && (profile.allow_website_showcase || profile.allow_partner_cooperations)) {
    warnings.push({
      id: "showcase-incomplete",
      headline: "Showcase unvollstaendig",
      body: `Du hast Showcase oder Kooperationen aktiviert, aber nur ${imageCount} von 2 Bildern hochgeladen.`,
      href: "/portal/profile/showcase",
      severity: "high",
    });
  }

  // WARNING 2 — Coop aktiv aber Email-Bestaetigung nicht erfolgt
  if (
    profile.allow_partner_cooperations
    && !profile.allow_partner_cooperations_confirmed
    && profile.cooperation_interest_decided_at
  ) {
    const decided = new Date(profile.cooperation_interest_decided_at).getTime();
    const days = (now.getTime() - decided) / (24 * 3600 * 1000);
    if (days > 7) {
      warnings.push({
        id: "coop-unconfirmed",
        headline: "Email-Bestaetigung fuer Kooperationen offen",
        body: "Deine Coop-Freigabe wartet seit ueber 7 Tagen auf die Email-Bestaetigung.",
        href: "/portal/profile/showcase",
        severity: "medium",
      });
    }
  }

  // RECO 1 — Keine Academy-Lesson in letzten 14 Tagen
  const lastLessonAt = lastLessonReadRes.data?.created_at as string | undefined;
  const noRecentLesson =
    !lastLessonAt
    || (now.getTime() - new Date(lastLessonAt).getTime()) > 14 * 24 * 3600 * 1000;
  if (noRecentLesson) {
    recommendations.push({
      id: "academy-lesson",
      eyebrow: "Academy",
      headline: "Eine Lesson lesen",
      body: "Seit ueber 14 Tagen keine Lesson. Kurz reinschauen reicht.",
      href: "/portal/academy",
    });
  }

  // RECO 2 — Aktive Challenge ohne Submission
  if (activeChallengeRes.data) {
    const ch = activeChallengeRes.data;
    const { data: ownSubmission } = await supabase
      .from("academy_challenge_submissions")
      .select("id")
      .eq("challenge_id", ch.id)
      .eq("profile_id", profile.id)
      .maybeSingle();
    if (!ownSubmission) {
      recommendations.push({
        id: "academy-challenge",
        eyebrow: "Challenge",
        headline: ch.title,
        body: "Aktive Challenge laeuft — du bist noch nicht dabei.",
        href: `/portal/academy/quiz/${ch.slug ?? ""}`,
      });
    }
  }

  return {
    queue: queue.slice(0, 6),
    warnings,
    recommendations,
  };
}
