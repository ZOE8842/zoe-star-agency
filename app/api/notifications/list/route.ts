// GET /api/notifications/list
// Liefert die letzten N Notifications + Unread-Count fuer den eingeloggten User.
// Query: ?limit=20 (max 50)

import { NextRequest, NextResponse } from "next/server";
import { createClient as ssrClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sb = await ssrClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  const url = new URL(req.url);
  let limit = Number(url.searchParams.get("limit") || "20");
  if (!Number.isFinite(limit) || limit < 1) limit = 20;
  if (limit > 50) limit = 50;

  // RLS: User sieht nur eigene -> kein expliciter user_id-Filter noetig,
  // aber wir filtern trotzdem als Defense-in-Depth.
  const { data: items } = await sb
    .from("user_notifications")
    .select("id, type, title, body, target_url, metadata, priority, read_at, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const { count: unread } = await sb
    .from("user_notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .is("read_at", null);

  return NextResponse.json({
    items: items ?? [],
    unread: typeof unread === "number" ? unread : 0,
  });
}
