// POST /api/sync/backstage-creator-meta
// Push-Senke für Backstage Creator-Karte Stammdaten + Status.
// Auth: Bearer <BACKSTAGE_SYNC_BEARER>. Admin-only Data.
//
// Phase C₃ · Migration 0059 · Spec 03_Umsatz_Reiter/00_Workflow.md §6.5.
// UPSERT by Design · KEIN force-Flag · COALESCE-Schutz in Sync-Library.

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { checkSyncAuth } from "@/lib/security/sync-auth";
import {
  syncBackstageCreatorMeta,
  type BackstageMetaRow,
} from "@/lib/sync/backstage-creator-meta";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_ROWS_PER_BATCH = 1000;
const MAX_BODY_BYTES = 1_000_000;

const BackstageMetaRowSchema = z.object({
  tiktok_username: z.string().min(1),

  agent_email: z.string().email().nullable().optional(),
  management_period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  management_period_end:   z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  group_name: z.string().max(200).nullable().optional(),
  invitation_type: z.enum(["Regulär", "Premium", "Elite"]).nullable().optional(),
  backstage_language: z.string().max(50).nullable().optional(),
  bio: z.string().max(2000).nullable().optional(),

  is_new_creator: z.boolean().nullable().optional(),
  graduation_status_label: z.string().max(200).nullable().optional(),
  last_live_at_observed: z.string().datetime().nullable().optional(),

  follower_count_snapshot: z.number().int().nonnegative().nullable().optional(),
  videos_count_snapshot: z.number().int().nonnegative().nullable().optional(),
  likes_count_snapshot: z.number().int().nonnegative().nullable().optional(),

  source_schema_version: z.string().max(50),
  raw_snapshot: z.record(z.string(), z.unknown()).optional(),
});

const BodySchema = z.object({
  rows: z.array(BackstageMetaRowSchema).min(1).max(MAX_ROWS_PER_BATCH),
  // KEIN force-Flag · UPSERT überschreibt immer, COALESCE schützt Stamm-Felder.
});

async function readBodyWithCap(request: NextRequest): Promise<unknown> {
  const reader = request.body?.getReader();
  if (!reader) return await request.json();
  let total = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.length;
      if (total > MAX_BODY_BYTES) throw new Error("body_too_large");
      chunks.push(value);
    }
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) { bytes.set(c, offset); offset += c.length; }
  const text = new TextDecoder("utf-8").decode(bytes);
  return JSON.parse(text);
}

export async function POST(request: NextRequest) {
  const authResp = checkSyncAuth(request);
  if (authResp) return authResp;

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: `body too large (max ${MAX_BODY_BYTES} bytes)` },
      { status: 413 },
    );
  }

  let raw: unknown;
  try {
    raw = await readBodyWithCap(request);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "invalid body";
    if (msg === "body_too_large") {
      return NextResponse.json(
        { error: `body too large (max ${MAX_BODY_BYTES} bytes)` },
        { status: 413 },
      );
    }
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "invalid body schema", issues: parsed.error.issues.slice(0, 20) },
      { status: 400 },
    );
  }

  try {
    const result = await syncBackstageCreatorMeta(
      parsed.data.rows as BackstageMetaRow[],
    );
    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown error";
    Sentry.captureException(e);
    console.error("[sync/backstage-creator-meta] crash:", msg);
    return NextResponse.json({ error: "internal_server_error" }, { status: 500 });
  }
}
