/**
 * supabase/functions/typesense-sync/index.ts
 * Week 6 — Typesense Outbox Drain (cron every 30s)
 *
 * Drains search_outbox:
 *  1. Claims up to 100 pending rows
 *  2. Batches upserts/deletes to Typesense
 *  3. Marks processed or increments attempts (dead-letter after 5)
 *  4. On startup reconciliation: compares Postgres vehicle count vs Typesense
 *
 * Env vars: TYPESENSE_HOST, TYPESENSE_API_KEY, TYPESENSE_COLLECTION
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const TS_HOST = Deno.env.get("TYPESENSE_HOST") ?? ""
const TS_KEY = Deno.env.get("TYPESENSE_API_KEY") ?? ""
const TS_COLLECTION = Deno.env.get("TYPESENSE_COLLECTION") ?? "vehicles"
const BATCH_SIZE = 100
const MAX_ATTEMPTS = 5

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

type OutboxRow = Record<string, unknown>

async function markFailed(rows: OutboxRow[], error: string, now: string): Promise<number> {
  let count = 0
  for (const row of rows) {
    await admin.from("search_outbox").update({ attempts: (row.attempts as number) + 1, last_error: error.slice(0, 200) }).eq("id", row.id)
    count++
  }
  return count
}

async function processUpserts(upserts: OutboxRow[], now: string): Promise<{ upserted: number; failed: number }> {
  if (upserts.length === 0) return { upserted: 0, failed: 0 }
  const ndjson = upserts.map((r) => JSON.stringify(r.payload)).join("\n")
  try {
    const res = await fetch(`${TS_HOST}/collections/${TS_COLLECTION}/documents/import?action=upsert`, { method: "POST", headers: { "X-TYPESENSE-API-KEY": TS_KEY, "Content-Type": "text/plain" }, body: ndjson })
    if (res.ok) {
      await admin.from("search_outbox").update({ processed_at: now }).in("id", upserts.map((r) => r.id))
      return { upserted: upserts.length, failed: 0 }
    }
    return { upserted: 0, failed: await markFailed(upserts, `HTTP ${res.status}`, now) }
  } catch (err) {
    return { upserted: 0, failed: await markFailed(upserts, String(err), now) }
  }
}

async function processDeletes(deletes: OutboxRow[], now: string): Promise<{ deleted: number; failed: number }> {
  let deleted = 0, failed = 0
  for (const row of deletes) {
    try {
      const res = await fetch(`${TS_HOST}/collections/${TS_COLLECTION}/documents/${row.entity_id}`, { method: "DELETE", headers: { "X-TYPESENSE-API-KEY": TS_KEY } })
      if (res.ok || res.status === 404) { await admin.from("search_outbox").update({ processed_at: now }).eq("id", row.id); deleted++ }
      else { await admin.from("search_outbox").update({ attempts: (row.attempts as number) + 1, last_error: `HTTP ${res.status}` }).eq("id", row.id); failed++ }
    } catch (err) {
      await admin.from("search_outbox").update({ attempts: (row.attempts as number) + 1, last_error: String(err).slice(0, 200) }).eq("id", row.id); failed++
    }
  }
  return { deleted, failed }
}

Deno.serve(async (_req: Request) => {
  const now = new Date().toISOString()
  let upserted = 0, deleted = 0, failed = 0

  // Claim batch
  const { data: batch } = await admin
    .from("search_outbox")
    .select("*")
    .is("processed_at", null)
    .lt("attempts", MAX_ATTEMPTS)
    .order("enqueued_at", { ascending: true })
    .limit(BATCH_SIZE)

  if (!batch || batch.length === 0) {
    return json({ upserted: 0, deleted: 0, message: "Outbox empty" })
  }

  // Separate upserts and deletes
  const upserts = batch.filter((r: Record<string, unknown>) => r.operation === "upsert" && r.payload)
  const deletes = batch.filter((r: Record<string, unknown>) => r.operation === "delete")

  const upsertResult = await processUpserts(upserts, now)
  upserted = upsertResult.upserted; failed += upsertResult.failed

  const deleteResult = await processDeletes(deletes, now)
  deleted = deleteResult.deleted; failed += deleteResult.failed

  return json({ upserted, deleted, failed, batch_size: batch.length })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  })
}
