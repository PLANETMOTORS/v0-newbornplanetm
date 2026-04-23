/**
 * supabase/functions/routeone-webhook/index.ts
 * Week 4 — RouteOne Finance Application Webhook
 *
 * RouteOne posts credit decision updates to this endpoint.
 * Maps RouteOne decision states to finance_app_state enum.
 *
 * Idempotency: (source='routeone', idempotency_key=routeone_ref_id+status)
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const ROUTEONE_WEBHOOK_SECRET = Deno.env.get("ROUTEONE_WEBHOOK_SECRET") ?? ""

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

// RouteOne decision → finance_app_state
const DECISION_MAP: Record<string, string> = {
  "APPROVED":          "approved",
  "APPROVED_WITH_STIPS": "pending_stips",
  "DECLINED":          "declined",
  "PENDING":           "submitted",
  "COUNTER_OFFER":     "pending_stips",
  "FUNDED":            "funded",
  "CONTRACTED":        "contracted",
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const body = await req.text()

  // Basic shared-secret auth (RouteOne uses header-based auth)
  const authHeader = req.headers.get("x-routeone-secret") ?? ""
  if (ROUTEONE_WEBHOOK_SECRET && authHeader !== ROUTEONE_WEBHOOK_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  let payload: Record<string, unknown>
  try {
    payload = JSON.parse(body)
  } catch {
    return new Response("Invalid JSON", { status: 400 })
  }

  const refId = payload.referenceId as string
  const decision = payload.decision as string
  const lender = payload.lenderName as string
  const aprBps = payload.aprBps as number ?? null
  const termMonths = payload.termMonths as number ?? null
  const amountCents = payload.amountFinancedCents as number ?? null
  const stips = payload.stips as unknown[] ?? []
  const occurredAt = payload.occurredAt as string ?? new Date().toISOString()

  if (!refId || !decision) return new Response("Missing referenceId or decision", { status: 400 })

  const newState = DECISION_MAP[decision] ?? "submitted"
  const idempotencyKey = `${refId}:${decision}`

  // Find the finance application by routeone_ref_id
  const { data: app } = await admin
    .from("finance_applications")
    .select("id, deal_id, user_id, state")
    .eq("routeone_ref_id", refId)
    .single()

  if (!app) {
    console.error(`No finance application found for RouteOne ref: ${refId}`)
    return new Response("Not found", { status: 404 })
  }

  const now = new Date().toISOString()

  // Update finance application
  await admin.from("finance_applications").update({
    state: newState,
    state_changed_at: now,
    lender: lender ?? null,
    apr_bps: aprBps,
    term_months: termMonths,
    amount_financed_cents: amountCents,
    stips_outstanding: stips,
    decline_reason: decision === "DECLINED" ? (payload.declineReason as string ?? null) : null,
    updated_at: now,
  }).eq("id", app.id)

  // Append deal event (idempotent)
  await admin.from("deal_events").insert({
    deal_id: app.deal_id,
    event_type: `finance.${newState}`,
    source: "routeone",
    payload: { ref_id: refId, decision, lender, apr_bps: aprBps, term_months: termMonths, stips },
    source_event_id: refId,
    source_occurred_at: occurredAt,
    idempotency_key: idempotencyKey,
  }).onConflict("source,idempotency_key").ignore()

  // Enqueue customer notification
  const { data: deal } = await admin.from("deals").select("user_id, vin").eq("id", app.deal_id).single()
  if (deal) {
    await admin.from("notifications_queue").insert({
      user_id: deal.user_id,
      deal_id: app.deal_id,
      template: `finance.${newState}`,
      payload: { deal_id: app.deal_id, vin: deal.vin, lender, decision, stips_count: stips.length },
      channels: ["email", "sms", "push"],
    })
  }

  return new Response(JSON.stringify({ received: true, state: newState }), {
    headers: { "Content-Type": "application/json" }
  })
})
