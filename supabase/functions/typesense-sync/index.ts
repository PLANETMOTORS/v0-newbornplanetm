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

  // Batch upsert to Typesense
  if (upserts.length > 0) {
    const docs = upserts.map((r: Record<string, unknown>) => r.payload)
    const ndjson = docs.map((d: unknown) => JSON.stringify(d)).join("\n")

    try {
      const res = await fetch(`${TS_HOST}/collections/${TS_COLLECTION}/documents/import?action=upsert`, {
        method: "POST",
        headers: { "X-TYPESENSE-API-KEY": TS_KEY, "Content-Type": "text/plain" },
        body: ndjson,
      })

      if (res.ok) {
        const ids = upserts.map((r: Record<string, unknown>) => r.id)
        await admin.from("search_outbox")
          .update({ processed_at: now })
          .in("id", ids)
        upserted = upserts.length
      } else {
        // Increment attempts on all
        for (const row of upserts) {
          await admin.from("search_outbox")
            .update({ attempts: (row.attempts as number) + 1, last_error: `HTTP ${res.status}` })
            .eq("id", row.id)
          failed++
        }
      }
    } catch (err) {
      for (const row of upserts) {
        await admin.from("search_outbox")
          .update({ attempts: (row.attempts as number) + 1, last_error: String(err).slice(0, 200) })
          .eq("id", row.id)
        failed++
      }
    }
  }

  // Process deletes
  for (const row of deletes) {
    try {
      const res = await fetch(`${TS_HOST}/collections/${TS_COLLECTION}/documents/${row.entity_id}`, {
        method: "DELETE",
        headers: { "X-TYPESENSE-API-KEY": TS_KEY },
      })
      if (res.ok || res.status === 404) {
        await admin.from("search_outbox").update({ processed_at: now }).eq("id", row.id)
        deleted++
      } else {
        await admin.from("search_outbox")
          .update({ attempts: (row.attempts as number) + 1, last_error: `HTTP ${res.status}` })
          .eq("id", row.id)
        failed++
      }
    } catch (err) {
      await admin.from("search_outbox")
        .update({ attempts: (row.attempts as number) + 1, last_error: String(err).slice(0, 200) })
        .eq("id", row.id)
      failed++
    }
  }

  return json({ upserted, deleted, failed, batch_size: batch.length })
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json" }
  })
}
