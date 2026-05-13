// Aura-Runtime-Diagnostics — harte DB-Wahrheit fuer Live-Bug-Lokalisierung.
// Nur Admin. Service-Role-Read auf events, conversations, conversation_members.
// Kein Cache, kein Filter — purer DB-State.

import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/supabase/auth-helpers";
import { PortalNav } from "@/components/PortalNav";

export const dynamic = "force-dynamic";

function sr() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}

export default async function DiagnosticsPage() {
  const { profile } = await requireAdmin();
  const db = sr();

  const [
    eventsRes,
    convsRes,
    membersRes,
    profilesRes,
    schemaEventsRes,
  ] = await Promise.all([
    db
      .from("events")
      .select("id, title, status, source, requires_registration, visibility_mode, created_at")
      .order("created_at", { ascending: false })
      .limit(15),
    db
      .from("conversations")
      .select("id, type, title, created_by, created_at, last_message_at")
      .order("created_at", { ascending: false })
      .limit(15),
    db
      .from("conversation_members")
      .select("id, conversation_id, profile_id, role, joined_at")
      .order("joined_at", { ascending: false })
      .limit(50),
    db
      .from("profiles")
      .select("id, display_name, tiktok_username, role, status")
      .order("created_at", { ascending: false })
      .limit(40),
    // Schema-Check: Spalte requires_registration in events vorhanden?
    // PostgREST kennt information_schema nicht direkt → wir machen einen
    // Select-Test der bei fehlender Spalte einen Error wirft.
    db.from("events").select("requires_registration").limit(1),
  ]);

  const buildSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "local";

  return (
    <>
      <PortalNav userId={profile.id} displayName={profile.display_name}
        avatarUrl={profile.avatar_url} isAdmin />
      <main className="container-luxe py-12 max-w-4xl">
        <p className="eyebrow mb-3">Diagnostics</p>
        <h1 className="heading-display text-3xl mb-2">DB Runtime State.</h1>
        <p className="text-cream/45 text-xs uppercase tracking-[0.25em] mb-12">
          Build · {buildSha} · Server-Role-Read · {new Date().toISOString()}
        </p>

        <Section title="Schema-Check events.requires_registration">
          {schemaEventsRes.error ? (
            <pre className="text-red-300 text-xs whitespace-pre-wrap">
              ERROR: {schemaEventsRes.error.message}
              {"\n"}→ Spalte NICHT in PostgREST-Schema. Migration 0035 fehlt oder NOTIFY pgrst erforderlich.
            </pre>
          ) : (
            <pre className="text-green-300 text-xs whitespace-pre-wrap">
              OK · Spalte vorhanden · sample: {JSON.stringify(schemaEventsRes.data)}
            </pre>
          )}
        </Section>

        <Section title={`Events (top 15, neueste oben) · count=${eventsRes.data?.length ?? 0}`}>
          {eventsRes.error && <pre className="text-red-300 text-xs">{eventsRes.error.message}</pre>}
          <Table
            rows={eventsRes.data ?? []}
            cols={["id", "title", "status", "source", "requires_registration", "visibility_mode", "created_at"]}
          />
        </Section>

        <Section title={`Conversations (top 15) · count=${convsRes.data?.length ?? 0}`}>
          {convsRes.error && <pre className="text-red-300 text-xs">{convsRes.error.message}</pre>}
          <Table
            rows={convsRes.data ?? []}
            cols={["id", "type", "title", "created_by", "created_at", "last_message_at"]}
          />
        </Section>

        <Section title={`Conversation Members (top 50) · count=${membersRes.data?.length ?? 0}`}>
          {membersRes.error && <pre className="text-red-300 text-xs">{membersRes.error.message}</pre>}
          <Table
            rows={membersRes.data ?? []}
            cols={["id", "conversation_id", "profile_id", "role", "joined_at"]}
          />
        </Section>

        <Section title={`Profiles (top 40) · count=${profilesRes.data?.length ?? 0}`}>
          {profilesRes.error && <pre className="text-red-300 text-xs">{profilesRes.error.message}</pre>}
          <Table
            rows={profilesRes.data ?? []}
            cols={["id", "display_name", "tiktok_username", "role", "status"]}
          />
        </Section>

        <p className="text-cream/35 text-xs mt-12">
          Wenn ein Event mit requires_registration=false hier auftaucht aber im Portal trotzdem Anmelde-Button rendert,
          ist der Bug im Render-Path. Wenn KEIN Event mit requires_registration=false existiert obwohl Admin "Nur Info" gespeichert hat,
          ist der Bug im Save-Path (Action/PostgREST).
        </p>
        <p className="text-cream/35 text-xs mt-2">
          Wenn eine Conversation existiert aber kein Member-Row fuer den Creator: Insert hat Member nicht gespeichert.
          Wenn Member-Row existiert aber Creator sieht "Keine Gruppen": RLS blockt Creator-Read.
        </p>
      </main>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <p className="eyebrow mb-3">{title}</p>
      {children}
    </section>
  );
}

function Table({ rows, cols }: { rows: Record<string, unknown>[]; cols: string[] }) {
  if (rows.length === 0) {
    return <p className="text-cream/35 text-xs">— keine Daten —</p>;
  }
  return (
    <div className="overflow-x-auto border border-champagne/15">
      <table className="text-xs w-full">
        <thead className="bg-champagne/5">
          <tr>
            {cols.map((c) => (
              <th key={c} className="text-left p-2 text-cream/55 uppercase tracking-[0.15em] text-[10px] border-b border-champagne/15">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-cream/[0.05]">
              {cols.map((c) => {
                const v = r[c];
                const display = v === null
                  ? <span className="text-cream/30">null</span>
                  : v === undefined
                  ? <span className="text-cream/30">undef</span>
                  : typeof v === "boolean"
                  ? <span className={v ? "text-green-300" : "text-red-300"}>{String(v)}</span>
                  : typeof v === "string" && v.length > 36
                  ? v.slice(0, 8) + "…"
                  : String(v);
                return (
                  <td key={c} className="p-2 text-cream/85 font-mono text-[11px]">
                    {display}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
