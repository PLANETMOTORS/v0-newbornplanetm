/**
 * app/api/webhooks/stripe/route.ts
 *
 * Stripe Webhook Handler — Idempotent Deposit & Reservation Processing
 *
 * Idempotency strategy:
 *  - Every Stripe event has a unique `event.id` (e.g. "evt_1ABC...").
 *  - We use `event.id` as the `idempotency_key` in `deal_events` which has a
 *    UNIQUE constraint on (source, idempotency_key). If Stripe retries the
 *    same event, the INSERT will be a no-op and we return 200 immediately —
 *    preventing double-charges or double-state-transitions.
 *  - The `deposits` table uses `stripe_payment_intent_id` as a UNIQUE column,
 *    so upserts are safe even if the webhook fires multiple times.
 *
 * Events handled:
 *  - payment_intent.created                → create pending deposit row
 *  - payment_intent.succeeded              → mark deposit succeeded, hold vehicle
 *  - payment_intent.payment_failed         → mark deposit failed, release vehicle
 *  - checkout.session.completed            → confirm reservation/order, lock vehicle
 *  - checkout.session.expired              → expire reservation, release vehicle
 *  - checkout.session.async_payment_failed → fail reservation, release vehicle
 *
 * Security:
 *  - Stripe-Signature header verified with STRIPE_WEBHOOK_SECRET
 *  - Raw body preserved for signature verification
 */

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"
import { validateReservationForConfirmation } from "@/lib/reservation-payment-rules"

// ── Type alias ─────────────────────────────────────────────────────────────

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

// ── Idempotency guard ──────────────────────────────────────────────────────

async function isEventAlreadyProcessed(
  supabase: SupabaseAdminClient,
  stripeEventId: string
): Promise<boolean> {
  const { data } = await supabase
    .from("deal_events")
    .select("id")
    .eq("source", "stripe")
    .eq("idempotency_key", stripeEventId)
    .limit(1)
    .maybeSingle()
  return !!data
}

async function appendDealEvent(
  supabase: SupabaseAdminClient,
  params: {
    dealId: string
    eventType: string
    stripeEventId: string
    stripeOccurredAt: number
    payload: Record<string, unknown>
  }
): Promise<void> {
  const { error } = await supabase.from("deal_events").insert({
    deal_id: params.dealId,
    event_type: params.eventType,
    source: "stripe",
    idempotency_key: params.stripeEventId,
    source_event_id: params.stripeEventId,
    source_occurred_at: new Date(params.stripeOccurredAt * 1000).toISOString(),
    payload: params.payload,
  })
  if (error && !error.message.includes("duplicate")) {
    logger.warn("[Stripe] deal_events insert error:", error.message)
  }
}

// ── Deposit helpers ────────────────────────────────────────────────────────

async function upsertDeposit(
  supabase: SupabaseAdminClient,
  params: {
    dealId: string
    userId: string
    paymentIntentId: string
    stripeCustomerId: string | null
    amountCents: number
    currency: string
    state: "pending" | "succeeded" | "failed" | "refunded" | "disputed"
    paidAt?: string | null
  }
): Promise<void> {
  const { error } = await supabase.from("deposits").upsert(
    {
      deal_id: params.dealId,
      user_id: params.userId,
      stripe_payment_intent_id: params.paymentIntentId,
      stripe_customer_id: params.stripeCustomerId,
      amount_cents: params.amountCents,
      currency: params.currency,
      state: params.state,
      paid_at: params.paidAt ?? null,
    },
    { onConflict: "stripe_payment_intent_id", ignoreDuplicates: false }
  )
  if (error) logger.warn("[Stripe] deposits upsert error:", error.message)
}

async function resolveDealId(
  supabase: SupabaseAdminClient,
  params: { reservationId?: string; vehicleId?: string }
): Promise<string | null> {
  if (params.reservationId) {
    const { data } = await supabase
      .from("deals")
      .select("id")
      .eq("id", params.reservationId)
      .maybeSingle()
    if (data) return data.id
  }
  if (params.vehicleId) {
    const { data } = await supabase
      .from("deals")
      .select("id")
      .eq("vehicle_id", params.vehicleId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (data) return data.id
  }
  return null
}

// ── Exported handlers (testable with injected supabase) ────────────────────

export async function handlePaymentIntentCreated(
  supabase: SupabaseAdminClient,
  paymentIntent: Stripe.PaymentIntent,
  stripeEventId: string
): Promise<void> {
  const { reservationId, vehicleId, userId } = paymentIntent.metadata ?? {}
  logger.info("[Stripe] payment_intent.created", { paymentIntentId: paymentIntent.id })
  if (!userId) return
  const dealId = await resolveDealId(supabase, { reservationId, vehicleId })
  if (!dealId) return
  await upsertDeposit(supabase, {
    dealId,
    userId,
    paymentIntentId: paymentIntent.id,
    stripeCustomerId: typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
    amountCents: paymentIntent.amount,
    currency: paymentIntent.currency,
    state: "pending",
  })
  await appendDealEvent(supabase, {
    dealId,
    eventType: "deposit.pending",
    stripeEventId,
    stripeOccurredAt: paymentIntent.created,
    payload: { payment_intent_id: paymentIntent.id, amount_cents: paymentIntent.amount, currency: paymentIntent.currency },
  })
}

export async function handlePaymentIntentSucceeded(
  supabase: SupabaseAdminClient,
  paymentIntent: Stripe.PaymentIntent,
  stripeEventId: string
): Promise<void> {
  const { reservationId, vehicleId, type, userId } = paymentIntent.metadata ?? {}
  logger.info("[Stripe] payment_intent.succeeded", { paymentIntentId: paymentIntent.id, amount: paymentIntent.amount })
  const isReservation = type !== "purchase" && (!!reservationId || type === "vehicle-reservation")
  const paidAt = new Date().toISOString()

  if (userId) {
    const dealId = await resolveDealId(supabase, { reservationId, vehicleId })
    if (dealId) {
      await upsertDeposit(supabase, {
        dealId, userId,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency,
        state: "succeeded",
        paidAt,
      })
      await appendDealEvent(supabase, {
        dealId,
        eventType: "deposit.succeeded",
        stripeEventId,
        stripeOccurredAt: paymentIntent.created,
        payload: { payment_intent_id: paymentIntent.id, amount_cents: paymentIntent.amount, currency: paymentIntent.currency, is_reservation: isReservation },
      })
    }
  }

  if (isReservation && reservationId) {
    await supabase.from("reservations").update({
      deposit_status: "paid",
      deposit_amount: paymentIntent.amount,
      stripe_payment_intent_id: paymentIntent.id,
      updated_at: paidAt,
    }).eq("id", reservationId)
  } else if (vehicleId) {
    await supabase.from("orders").update({ status: "confirmed", updated_at: paidAt }).eq("vehicle_id", vehicleId)
  }

  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", { p_vehicle_id: vehicleId, p_to_status: isReservation ? "reserved" : "pending" })
  }
}

export async function handlePaymentIntentFailed(
  supabase: SupabaseAdminClient,
  paymentIntent: Stripe.PaymentIntent,
  stripeEventId: string
): Promise<void> {
  const { reservationId, vehicleId, userId } = paymentIntent.metadata ?? {}
  logger.warn("[Stripe] payment_intent.payment_failed", { paymentIntentId: paymentIntent.id, lastError: paymentIntent.last_payment_error?.message })

  if (userId) {
    const dealId = await resolveDealId(supabase, { reservationId, vehicleId })
    if (dealId) {
      await upsertDeposit(supabase, {
        dealId, userId,
        paymentIntentId: paymentIntent.id,
        stripeCustomerId: typeof paymentIntent.customer === "string" ? paymentIntent.customer : null,
        amountCents: paymentIntent.amount,
        currency: paymentIntent.currency,
        state: "failed",
      })
      await appendDealEvent(supabase, {
        dealId,
        eventType: "deposit.failed",
        stripeEventId,
        stripeOccurredAt: paymentIntent.created,
        payload: { payment_intent_id: paymentIntent.id, error: paymentIntent.last_payment_error?.message ?? "unknown" },
      })
    }
  }

  if (reservationId) {
    await supabase.from("reservations").update({ deposit_status: "failed", updated_at: new Date().toISOString() }).eq("id", reservationId)
  }
  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", { p_vehicle_id: vehicleId, p_to_status: "available" })
  }
}

export async function handleCheckoutSessionCompleted(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<void> {
  const { reservationId, vehicleId, type, userId } = session.metadata ?? {}
  logger.info("[Stripe] checkout.session.completed", { sessionId: session.id, paymentStatus: session.payment_status })
  const isReservation = type === "vehicle-reservation" || (type !== "purchase" && !!reservationId)

  if (userId) {
    const dealId = await resolveDealId(supabase, { reservationId, vehicleId })
    if (dealId) {
      await appendDealEvent(supabase, {
        dealId,
        eventType: "checkout.completed",
        stripeEventId,
        stripeOccurredAt: session.created,
        payload: { session_id: session.id, payment_status: session.payment_status, is_reservation: isReservation },
      })
    }
  }

  let reservationConfirmed = false

  if (isReservation && reservationId) {
    const now = new Date().toISOString()

    if (session.payment_status === "paid") {
      const { data: reservation } = await supabase
        .from("reservations")
        .select("deposit_status, stripe_payment_intent_id, stripe_checkout_session_id, status, expires_at")
        .eq("id", reservationId)
        .single()

      if (reservation) {
        if (["confirmed", "completed", "cancelled", "expired"].includes(reservation.status ?? "")) {
          reservationConfirmed = reservation.status === "confirmed" || reservation.status === "completed"
        } else {
          await supabase.from("reservations").update({ deposit_status: "paid", stripe_checkout_session_id: session.id, ...(typeof session.payment_intent === "string" ? { stripe_payment_intent_id: session.payment_intent } : {}), updated_at: now }).eq("id", reservationId)

          const updatedReservation = { ...reservation, deposit_status: "paid", stripe_checkout_session_id: session.id, ...(typeof session.payment_intent === "string" ? { stripe_payment_intent_id: session.payment_intent } : {}) }
          const validation = validateReservationForConfirmation(updatedReservation, { skipExpiryCheck: true })
          if (validation.valid) {
            const { error: confirmError } = await supabase.from("reservations").update({ status: "confirmed", updated_at: now }).eq("id", reservationId)
            if (confirmError) {
              logger.warn("[Stripe] Failed to confirm reservation:", { reservationId, error: confirmError.message })
            } else {
              reservationConfirmed = true
            }
          } else {
            logger.warn("[Stripe] Reservation payment validation failed, not confirming:", { reservationId, reason: validation.reason })
            await supabase.from("reservations").update({ status: "pending", updated_at: now }).eq("id", reservationId)
          }
        }
      }
    } else {
      await supabase.from("reservations").update({ status: "pending", updated_at: now }).eq("id", reservationId)
    }
  } else if (vehicleId) {
    await supabase.from("orders").update({ status: "confirmed", updated_at: new Date().toISOString() }).eq("vehicle_id", vehicleId)
  }

  if (vehicleId) {
    const isAsyncPaymentPending = isReservation && session.payment_status === "unpaid"
    let targetStatus: "reserved" | "available" | "pending"
    if (!isReservation) {
      targetStatus = "pending"
    } else if (reservationConfirmed || isAsyncPaymentPending) {
      targetStatus = "reserved"
    } else {
      targetStatus = "available"
    }
    await supabase.rpc("transition_vehicle_status", { p_vehicle_id: vehicleId, p_to_status: targetStatus })
  }
}

export async function handleCheckoutSessionExpired(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<void> {
  const { reservationId, vehicleId, userId } = session.metadata ?? {}
  logger.info("[Stripe] checkout.session.expired", { sessionId: session.id })

  if (userId) {
    const dealId = await resolveDealId(supabase, { reservationId, vehicleId })
    if (dealId) {
      await appendDealEvent(supabase, { dealId, eventType: "checkout.expired", stripeEventId, stripeOccurredAt: session.created, payload: { session_id: session.id } })
    }
  }

  if (reservationId) {
    await supabase.from("reservations").update({ status: "expired", updated_at: new Date().toISOString() }).eq("id", reservationId)
  }
  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", { p_vehicle_id: vehicleId, p_to_status: "available" })
  }
}

export async function handleCheckoutSessionAsyncPaymentFailed(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session,
  stripeEventId: string
): Promise<void> {
  const { reservationId, vehicleId, userId } = session.metadata ?? {}
  logger.warn("[Stripe] checkout.session.async_payment_failed", { sessionId: session.id })

  if (userId) {
    const dealId = await resolveDealId(supabase, { reservationId, vehicleId })
    if (dealId) {
      await appendDealEvent(supabase, { dealId, eventType: "checkout.async_payment_failed", stripeEventId, stripeOccurredAt: session.created, payload: { session_id: session.id } })
    }
  }

  if (reservationId) {
    await supabase.from("reservations").update({ status: "cancelled", deposit_status: "failed", updated_at: new Date().toISOString() }).eq("id", reservationId)
  }
  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", { p_vehicle_id: vehicleId, p_to_status: "available" })
  }
}

// ── POST handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error("[Stripe] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    // Log the precise reason server-side, but never echo it back: an attacker
    // probing the webhook would otherwise learn which signature element is
    // malformed (timestamp drift vs. payload mismatch vs. wrong secret).
    logger.warn("[Stripe] Webhook signature verification failed:", message)
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 })
  }

  const supabase = createAdminClient()

  // ── Idempotency check — skip if already processed ─────────────────────
  const idempotencyCheckedEvents = new Set([
    "payment_intent.created",
    "payment_intent.succeeded",
    "payment_intent.payment_failed",
    "checkout.session.completed",
    "checkout.session.expired",
    "checkout.session.async_payment_failed",
  ])

  if (idempotencyCheckedEvents.has(event.type)) {
    const alreadyProcessed = await isEventAlreadyProcessed(supabase, event.id)
    if (alreadyProcessed) {
      logger.info(`[Stripe] Duplicate event skipped (idempotent): ${event.id} (${event.type})`)
      return NextResponse.json({ received: true, eventType: event.type, duplicate: true })
    }
  }

  try {
    switch (event.type) {
      case "payment_intent.created":
        await handlePaymentIntentCreated(supabase, event.data.object, event.id)
        break
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(supabase, event.data.object, event.id)
        break
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(supabase, event.data.object, event.id)
        break
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(supabase, event.data.object, event.id)
        break
      case "checkout.session.expired":
        await handleCheckoutSessionExpired(supabase, event.data.object, event.id)
        break
      case "checkout.session.async_payment_failed":
        await handleCheckoutSessionAsyncPaymentFailed(supabase, event.data.object, event.id)
        break
      default:
        logger.info(`[Stripe] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true, eventType: event.type })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`[Stripe] Handler failed for ${event.type}:`, message)
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }
}
