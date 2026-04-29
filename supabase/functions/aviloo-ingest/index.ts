/**
 * supabase/functions/aviloo-ingest/index.ts
 * Week 5 — Aviloo SOH Report Ingest
 *
 * Called by staff after receiving an Aviloo PDF report.
 * Stores the SOH reading in aviloo_soh_history and updates
 * vehicle_dossiers.current_aviloo_soh_pct + next_aviloo_due_at.
 *
 * Request body:
 *   { vin, soh_pct, capacity_kwh?, tested_at?, storage_path, title }
 *
 * Auth: staff only
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

const ALLOWED_ORIGINS = [
  "https://www.planetmotors.ca",
  "https://planetmotors.ca",
  "https://staging.planetmotors.ca",
]

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") ?? ""
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

// Re-test cadence: 18 months
const RETEST_MONTHS = 18

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Access-Control-Allow-Headers": "authorization, content-type, apikey",
        "Vary": "Origin",
      }
    })
  }
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405, req)

  // Auth: staff only
  const authHeader = req.headers.get("Authorization")
  if (!authHeader) return json({ error: "Unauthorized" }, 401, req)

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } }
  })
  const { data: { user } } = await userClient.auth.getUser()
  if (!user) return json({ error: "Unauthorized" }, 401, req)

  const { data: staff } = await admin.from("staff_members")
    .select("role").eq("user_id", user.id).eq("active", true).single()
  if (!staff) return json({ error: "Forbidden: staff only" }, 403, req)

  const body = await req.json()
  const { vin, soh_pct, capacity_kwh, tested_at, storage_path, title } = body as {
    vin: string; soh_pct: number; capacity_kwh?: number
    tested_at?: string; storage_path: string; title: string
  }

  if (!vin || !soh_pct || !storage_path) {
    return json({ error: "vin, soh_pct, and storage_path are required" }, 400, req)
  }

  const testedAt = tested_at ?? new Date().toISOString()
  const nextDue = new Date(testedAt)
  nextDue.setMonth(nextDue.getMonth() + RETEST_MONTHS)

  // Find or create dossier
  let { data: dossier } = await admin.from("vehicle_dossiers")
    .select("id").eq("vin", vin).single()

  if (!dossier) {
    const { data: newDossier } = await admin.from("vehicle_dossiers")
      .insert({ vin, current_aviloo_soh_pct: soh_pct, current_aviloo_tested_at: testedAt, next_aviloo_due_at: nextDue.toISOString() })
      .select("id").single()
    dossier = newDossier
  }

  if (!dossier) return json({ error: "Failed to find or create dossier" }, 500, req)

  // Insert dossier document
  const { data: doc } = await admin.from("dossier_documents").insert({
    dossier_id: dossier.id,
    kind: "aviloo_soh",
    storage_path,
    title: title ?? `Aviloo SOH Report — ${soh_pct}%`,
    issued_at: testedAt,
    metadata: { soh_pct, capacity_kwh: capacity_kwh ?? null },
    uploaded_by: user.id,
  }).select("id").single()

  // Insert SOH history row
  await admin.from("aviloo_soh_history").insert({
    dossier_id: dossier.id,
    tested_at: testedAt,
    soh_pct,
    capacity_kwh: capacity_kwh ?? null,
    report_document_id: doc?.id ?? null,
    tested_by: "Planet Motors",
  })

  // Update dossier current SOH
  await admin.from("vehicle_dossiers").update({
    current_aviloo_soh_pct: soh_pct,
    current_aviloo_tested_at: testedAt,
    next_aviloo_due_at: nextDue.toISOString(),
    updated_at: new Date().toISOString(),
  }).eq("id", dossier.id)

  // Notify owner if exists
  const { data: dossierFull } = await admin.from("vehicle_dossiers")
    .select("current_owner_user_id").eq("id", dossier.id).single()

  if (dossierFull?.current_owner_user_id) {
    await admin.from("notifications_queue").insert({
      user_id: dossierFull.current_owner_user_id,
      template: "aviloo.soh_updated",
      payload: { vin, soh_pct, capacity_kwh, tested_at: testedAt, next_due: nextDue.toISOString() },
      channels: ["email"],
    })
  }

  return json({ success: true, dossier_id: dossier.id, soh_pct, next_aviloo_due_at: nextDue.toISOString() }, 200, req)
})

function json(body: unknown, status = 200, req?: Request) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": req ? getAllowedOrigin(req) : ALLOWED_ORIGINS[0],
      "Vary": "Origin",
    },
  })
}
