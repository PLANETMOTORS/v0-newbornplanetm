/**
 * supabase/functions/stripe-webhook/index.ts
 * Week 2 — Stripe Webhook → deposits + deal_events projection
 *
 * Handles:
 *   payment_intent.succeeded   → deposits.state = 'succeeded', deal → deposit_paid
 *   payment_intent.created     → deposits.state = 'pending'
 *   payment_intent.payment_failed → deposits.state = 'failed'
 *   charge.dispute.created     → deposits.state = 'disputed'
 *   charge.refunded            → deposits.state = 'refunded'
 *
 * Security: Stripe-Signature header verified with STRIPE_WEBHOOK_SECRET
 * Idempotency: (source='stripe', idempotency_key=stripe_event_id) on deal_events
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 })

  const body = await req.text()
  const sig = req.headers.get("stripe-signature") ?? ""

  // Verify Stripe signature (HMAC-SHA256)
  const verified = await verifyStripeSignature(body, sig, STRIPE_WEBHOOK_SECRET)
  if (!verified) {
    console.error("Stripe signature verification failed")
    return new Response("Unauthorized", { status: 401 })
  }

  const event = JSON.parse(body)
  const eventId = event.id as string
  const eventType = event.type as string
  const occurredAt = new Date(event.created * 1000).toISOString()

  console.log(`Stripe event: ${eventType} (${eventId})`)

  try {
    switch (eventType) {
      case "payment_intent.created":
        await handlePaymentIntentCreated(event.data.object, eventId, occurredAt)
        break
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object, eventId, occurredAt)
        break
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object, eventId, occurredAt)
        break
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object, eventId, occurredAt)
        break
      case "charge.refunded":
        await handleChargeRefunded(event.data.object, eventId, occurredAt)
        break
      default:
        console.log(`Unhandled event type: ${eventType}`)
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" }
    })
  } catch (err) {
    console.error(`Error handling ${eventType}:`, err)
    return new Response("Internal error", { status: 500 })
  }
})

// ── Handlers ──────────────────────────────────────────────────────────────

async function handlePaymentIntentCreated(pi: Record<string, unknown>, eventId: string, occurredAt: string) {
  const dealId = (pi.metadata as Record<string, string>)?.deal_id
  const userId = (pi.metadata as Record<string, string>)?.user_id
  if (!dealId || !userId) return

  await admin.from("deposits").upsert({
    deal_id: dealId,
    user_id: userId,
    stripe_payment_intent_id: pi.id as string,
    stripe_customer_id: pi.customer as string ?? null,
    amount_cents: pi.amount as number,
    currency: (pi.currency as string) ?? "cad",
    state: "pending",
  }, { onConflict: "stripe_payment_intent_id" })

  await appendDealEvent(dealId, "deposit.created", "stripe", eventId, occurredAt, {
    payment_intent_id: pi.id,
    amount_cents: pi.amount,
  })
}

async function handlePaymentIntentSucceeded(pi: Record<string, unknown>, eventId: string, occurredAt: string) {
  const dealId = (pi.metadata as Record<string, string>)?.deal_id
  if (!dealId) return

  const now = new Date().toISOString()

  // Update deposit state
  await admin.from("deposits")
    .update({ state: "succeeded", paid_at: now })
    .eq("stripe_payment_intent_id", pi.id as string)

  // Advance deal to deposit_paid
  const { data: deal } = await admin.from("deals")
    .select("stage")
    .eq("id", dealId)
    .single()

  if (deal?.stage === "approved") {
    await admin.from("deals").update({
      stage: "deposit_paid",
      stage_changed_at: now,
      updated_at: now,
    }).eq("id", dealId)

    // Enqueue customer notification
    const { data: dealFull } = await admin.from("deals").select("user_id, vin").eq("id", dealId).single()
    if (dealFull) {
      await admin.from("notifications_queue").insert({
        user_id: dealFull.user_id,
        deal_id: dealId,
        template: "deal.deposit_paid",
        payload: { deal_id: dealId, vin: dealFull.vin, amount_cents: pi.amount },
        channels: ["email", "sms", "push"],
      })
    }
  }

  await appendDealEvent(dealId, "deposit.succeeded", "stripe", eventId, occurredAt, {
    payment_intent_id: pi.id,
    amount_cents: pi.amount,
  })
}

async function handlePaymentIntentFailed(pi: Record<string, unknown>, eventId: string, occurredAt: string) {
  const dealId = (pi.metadata as Record<string, string>)?.deal_id
  if (!dealId) return

  await admin.from("deposits")
    .update({ state: "failed" })
    .eq("stripe_payment_intent_id", pi.id as string)

  await appendDealEvent(dealId, "deposit.failed", "stripe", eventId, occurredAt, {
    payment_intent_id: pi.id,
    failure_message: (pi.last_payment_error as Record<string, unknown>)?.message,
  })
}

async function handleDisputeCreated(charge: Record<string, unknown>, eventId: string, occurredAt: string) {
  const piId = charge.payment_intent as string
  if (!piId) return

  const { data: deposit } = await admin.from("deposits")
    .select("deal_id")
    .eq("stripe_payment_intent_id", piId)
    .single()

  await admin.from("deposits")
    .update({ state: "disputed" })
    .eq("stripe_payment_intent_id", piId)

  if (deposit?.deal_id) {
    await appendDealEvent(deposit.deal_id, "deposit.disputed", "stripe", eventId, occurredAt, {
      charge_id: charge.id,
      dispute_reason: charge.dispute_reason,
    })
  }
}

async function handleChargeRefunded(charge: Record<string, unknown>, eventId: string, occurredAt: string) {
  const piId = charge.payment_intent as string
  if (!piId) return

  const { data: deposit } = await admin.from("deposits")
    .select("deal_id")
    .eq("stripe_payment_intent_id", piId)
    .single()

  await admin.from("deposits")
    .update({ state: "refunded", refunded_at: new Date().toISOString() })
    .eq("stripe_payment_intent_id", piId)

  if (deposit?.deal_id) {
    await appendDealEvent(deposit.deal_id, "deposit.refunded", "stripe", eventId, occurredAt, {
      charge_id: charge.id,
      amount_refunded: charge.amount_refunded,
    })
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────

async function appendDealEvent(
  dealId: string, eventType: string, source: string,
  sourceEventId: string, occurredAt: string, payload: Record<string, unknown>
) {
  await admin.from("deal_events").insert({
    deal_id: dealId,
    event_type: eventType,
    source,
    payload,
    source_event_id: sourceEventId,
    source_occurred_at: occurredAt,
    idempotency_key: sourceEventId,
  }).onConflict("source,idempotency_key").ignore()
}

async function verifyStripeSignature(body: string, sig: string, secret: string): Promise<boolean> {
  try {
    const parts = sig.split(",").reduce((acc: Record<string, string>, part) => {
      const [k, v] = part.split("=")
      acc[k] = v
      return acc
    }, {})
    const timestamp = parts["t"]
    const v1 = parts["v1"]
    if (!timestamp || !v1) return false

    const payload = `${timestamp}.${body}`
    const key = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    )
    const sig_bytes = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
    const computed = Array.from(new Uint8Array(sig_bytes))
      .map(b => b.toString(16).padStart(2, "0")).join("")
    return computed === v1
  } catch {
    return false
  }
}
