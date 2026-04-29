/**
 * supabase/functions/deal-transition/index.ts
 *
 * Deal Stage Transition — Guarded RPC
 *
 * Called by staff via: supabase.functions.invoke('deal-transition', { body: {...} })
 *
 * Guards:
 *  1. Auth: caller must be authenticated
 *  2. Staff: caller must be in staff_members with active=true
 *  3. Valid transition: enforces the allowed state machine
 *  4. Audit: every transition is logged to audit_log via log_audit()
 *  5. Event: appends a deal_events row (source='staff', event_type='deal.stage_changed')
 *  6. SLA: sets sla_respond_by on inquiry→application transitions
 *
 * Allowed transitions (deal_stage state machine):
 *   inquiry       → application | cancelled
 *   application   → approved | cancelled
 *   approved      → deposit_paid | cancelled
 *   deposit_paid  → contracted | cancelled
 *   contracted    → funded | cancelled
 *   funded        → delivered
 *   delivered     → closed
 *   cancelled     → (terminal)
 *   closed        → (terminal)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!

// ── State machine ──────────────────────────────────────────────────────────

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  inquiry:      ["application", "cancelled"],
  application:  ["approved", "cancelled"],
  approved:     ["deposit_paid", "cancelled"],
  deposit_paid: ["contracted", "cancelled"],
  contracted:   ["funded", "cancelled"],
  funded:       ["delivered"],
  delivered:    ["closed"],
  cancelled:    [],
  closed:       [],
}

// SLA: staff must respond within N hours of these transitions
const SLA_HOURS: Record<string, number> = {
  inquiry:     2,   // 2h to respond to new inquiry
  application: 4,   // 4h to review application
  approved:    24,  // 24h to collect deposit
}

const ALLOWED_ORIGINS = [
  "https://www.planetmotors.ca",
  "https://planetmotors.ca",
  "https://staging.planetmotors.ca",
]

function getAllowedOrigin(req: Request): string {
  const origin = req.headers.get("Origin") ?? ""
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

// ── Handler ────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": getAllowedOrigin(req),
        "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
        "Vary": "Origin",
      },
    })
  }

  try {
    // 1. Parse body
    const body = await req.json()
    const { deal_id, to_stage, reason, internal_note } = body as {
      deal_id: string
      to_stage: string
      reason?: string
      internal_note?: string
    }

    if (!deal_id || !to_stage) {
      return json({ error: "deal_id and to_stage are required" }, 400, req)
    }

    // 2. Auth: get caller identity from JWT
    const authHeader = req.headers.get("Authorization")
    if (!authHeader) return json({ error: "Unauthorized" }, 401, req)

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user }, error: authError } = await userClient.auth.getUser()
    if (authError || !user) return json({ error: "Unauthorized" }, 401, req)

    // 3. Staff check
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    const { data: staffRow } = await adminClient
      .from("staff_members")
      .select("role, display_name")
      .eq("user_id", user.id)
      .eq("active", true)
      .single()

    if (!staffRow) return json({ error: "Forbidden: staff only" }, 403, req)

    // 4. Load current deal
    const { data: deal, error: dealError } = await adminClient
      .from("deals")
      .select("id, stage, customer_id, user_id, vin")
      .eq("id", deal_id)
      .single()

    if (dealError || !deal) return json({ error: "Deal not found" }, 404, req)

    // 5. Validate transition
    const allowed = ALLOWED_TRANSITIONS[deal.stage] ?? []
    if (!allowed.includes(to_stage)) {
      return json({
        error: `Invalid transition: ${deal.stage} → ${to_stage}`,
        allowed,
      }, 422, req)
    }

    // 6. Compute SLA deadline
    const slaHours = SLA_HOURS[to_stage]
    const slaRespondBy = slaHours
      ? new Date(Date.now() + slaHours * 60 * 60 * 1000).toISOString()
      : null

    // 7. Update deal stage (atomic)
    const now = new Date().toISOString()
    const updatePayload: Record<string, unknown> = {
      stage: to_stage,
      stage_changed_at: now,
      updated_at: now,
    }
    if (slaRespondBy) updatePayload.sla_respond_by = slaRespondBy
    if (internal_note) updatePayload.internal_notes = internal_note

    const { error: updateError } = await adminClient
      .from("deals")
      .update(updatePayload)
      .eq("id", deal_id)

    if (updateError) {
      console.error("Deal update failed:", updateError)
      return json({ error: "Failed to update deal stage" }, 500, req)
    }

    // 8. Append deal event (idempotent key = deal_id + to_stage + now-minute)
    const idempotencyKey = `${deal_id}:stage_changed:${to_stage}:${now.slice(0, 16)}`
    await adminClient.from("deal_events").insert({
      deal_id,
      event_type: "deal.stage_changed",
      source: "staff",
      actor_user_id: user.id,
      payload: {
        from_stage: deal.stage,
        to_stage,
        reason: reason ?? null,
        sla_respond_by: slaRespondBy,
        staff_name: staffRow.display_name,
      },
      source_occurred_at: now,
      idempotency_key: idempotencyKey,
    }).onConflict("source,idempotency_key").ignore()

    // 9. Audit log
    await adminClient.rpc("log_audit", {
      p_actor_user_id: user.id,
      p_actor_role: staffRow.role,
      p_action: "update",
      p_resource_type: "deal",
      p_resource_id: deal_id,
      p_before_snapshot: { stage: deal.stage },
      p_after_snapshot: { stage: to_stage, sla_respond_by: slaRespondBy },
    })

    // 10. Enqueue notification to customer
    await adminClient.from("notifications_queue").insert({
      user_id: deal.user_id,
      deal_id,
      template: `deal.${to_stage}`,
      payload: {
        deal_id,
        from_stage: deal.stage,
        to_stage,
        vin: deal.vin,
        staff_name: staffRow.display_name,
        reason: reason ?? null,
      },
      channels: ["email", "sms", "push"],
    })

    return json({
      success: true,
      deal_id,
      from_stage: deal.stage,
      to_stage,
      sla_respond_by: slaRespondBy,
    }, 200, req)

  } catch (err) {
    console.error("deal-transition error:", err)
    return json({ error: "Internal server error" }, 500, req)
  }
})

function json(body: unknown, status = 200, req?: Request): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": req ? getAllowedOrigin(req) : ALLOWED_ORIGINS[0],
      "Vary": "Origin",
    },
  })
}
