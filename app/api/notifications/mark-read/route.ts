// POST /api/notifications/mark-read
// Markiert Notifications als read.
// Body: { ids?: string[] }  - ohne ids = alle ungelesen werden markiert.

import { NextRequest, NextResponse } from "next/server";
import { createClient as ssrClient } from "@/lib/supabase/server";
import { markRead, countUnread } from "@/lib/notifications/center";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const sb = await ssrClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ error: "auth_required" }, { status: 401 });

  let body: { ids?: unknown } = {};
  try { body = await req.json(); } catch { /* leeren Body erlauben = alle */ }

  let ids: string[] | undefined;
  if (Array.isArray(body.ids)) {
    ids = body.ids.filter((x): x is string => typeof x === "string").slice(0, 100);
  }

  const changed = await markRead(user.id, ids);
  const unread  = await countUnread(user.id);
  return NextResponse.json({ success: true, changed, unread });
}
