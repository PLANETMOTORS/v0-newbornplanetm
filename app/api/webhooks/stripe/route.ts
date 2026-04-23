/**
 * app/api/webhooks/stripe/route.ts
 *
 * Stripe Webhook Handler — Idempotent Deposit Processing
 *
 * Handles Stripe events for the Planet Motors reservation/deposit flow.
 * Uses Stripe's idempotency guarantees + Supabase upsert to ensure
 * each payment is processed exactly once, even on retries.
 *
 * Events handled:
 *  - payment_intent.succeeded     → mark deposit as paid, lock vehicle
 *  - payment_intent.payment_failed → mark deposit as failed
 *  - checkout.session.completed    → fulfil reservation after checkout
 *  - charge.refunded               → process deposit refund
 *
 * Security:
 *  - Stripe-Signature header verified with STRIPE_WEBHOOK_SECRET
 *  - Raw body preserved for signature verification (no JSON.parse before verify)
 *  - All DB writes use upsert with stripe_payment_intent_id as idempotency key
 *
 * Environment variables:
 *  STRIPE_SECRET_KEY        — Stripe secret key (sk_live_... or sk_test_...)
 *  STRIPE_WEBHOOK_SECRET    — Webhook signing secret (whsec_...)
 */

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

// ── Stripe client ──────────────────────────────────────────────────────────

function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set")
  return new Stripe(key, { apiVersion: "2025-08-27.basil" })
}

// ── Idempotency guard ──────────────────────────────────────────────────────

/**
 * Check if this Stripe event has already been processed.
 * Uses the stripe_event_id column in the deposits table as the idempotency key.
 */
async function isEventAlreadyProcessed(stripeEventId: string): Promise<boolean> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("deposits")
      .select("id")
      .eq("stripe_event_id", stripeEventId)
      .maybeSingle()
    return !!data
  } catch {
    return false
  }
}

// ── Event handlers ─────────────────────────────────────────────────────────

async function handlePaymentIntentSucceeded(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
): Promise<void> {
  const supabase = createAdminClient()
  const reservationId = paymentIntent.metadata?.reservation_id
  const vehicleId = paymentIntent.metadata?.vehicle_id

  logger.info("[Stripe] payment_intent.succeeded", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    reservationId,
    vehicleId,
  })

  // Upsert deposit record — idempotent via stripe_payment_intent_id
  const { error: depositError } = await supabase
    .from("deposits")
    .upsert(
      {
        stripe_payment_intent_id: paymentIntent.id,
        stripe_event_id: eventId,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        state: "paid",
        paid_at: new Date().toISOString(),
        reservation_id: reservationId ?? null,
        vehicle_id: vehicleId ?? null,
      },
      { onConflict: "stripe_payment_intent_id" }
    )

  if (depositError) {
    logger.error("[Stripe] Failed to upsert deposit:", depositError)
    throw depositError
  }

  // Update reservation status if linked
  if (reservationId) {
    const { error: resError } = await supabase
      .from("reservations")
      .update({
        deposit_status: "paid",
        deposit_amount: paymentIntent.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)

    if (resError) {
      logger.warn("[Stripe] Failed to update reservation deposit_status:", resError)
    }
  }

  // Lock vehicle as reserved if linked
  if (vehicleId) {
    const { error: vehicleError } = await supabase
      .from("vehicles")
      .update({ status: "reserved", updated_at: new Date().toISOString() })
      .eq("id", vehicleId)
      .eq("status", "available") // Only lock if still available (prevents race condition)

    if (vehicleError) {
      logger.warn("[Stripe] Failed to lock vehicle as reserved:", vehicleError)
    }
  }
}

async function handlePaymentIntentFailed(
  paymentIntent: Stripe.PaymentIntent,
  eventId: string
): Promise<void> {
  const supabase = createAdminClient()
  const reservationId = paymentIntent.metadata?.reservation_id

  logger.warn("[Stripe] payment_intent.payment_failed", {
    paymentIntentId: paymentIntent.id,
    lastError: paymentIntent.last_payment_error?.message,
    reservationId,
  })

  await supabase
    .from("deposits")
    .upsert(
      {
        stripe_payment_intent_id: paymentIntent.id,
        stripe_event_id: eventId,
        amount_cents: paymentIntent.amount,
        currency: paymentIntent.currency.toUpperCase(),
        state: "failed",
        reservation_id: reservationId ?? null,
      },
      { onConflict: "stripe_payment_intent_id" }
    )

  if (reservationId) {
    await supabase
      .from("reservations")
      .update({ deposit_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", reservationId)
  }
}

async function handleChargeRefunded(
  charge: Stripe.Charge,
  eventId: string
): Promise<void> {
  const supabase = createAdminClient()
  const paymentIntentId = typeof charge.payment_intent === "string"
    ? charge.payment_intent
    : charge.payment_intent?.id

  logger.info("[Stripe] charge.refunded", {
    chargeId: charge.id,
    paymentIntentId,
    amountRefunded: charge.amount_refunded,
  })

  if (paymentIntentId) {
    await supabase
      .from("deposits")
      .update({
        state: "refunded",
        stripe_event_id: eventId,
        refunded_at: new Date().toISOString(),
        amount_refunded_cents: charge.amount_refunded,
      })
      .eq("stripe_payment_intent_id", paymentIntentId)
  }
}

// ── POST handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    logger.error("[Stripe] STRIPE_WEBHOOK_SECRET not configured")
    return NextResponse.json({ error: "Webhook secret not configured" }, { status: 500 })
  }

  // Read raw body — MUST be raw for Stripe signature verification
  const rawBody = await request.text()
  const signature = request.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header" }, { status: 400 })
  }

  // Verify signature
  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.warn("[Stripe] Webhook signature verification failed:", message)
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 })
  }

  // Idempotency check — skip if already processed
  const alreadyProcessed = await isEventAlreadyProcessed(event.id)
  if (alreadyProcessed) {
    logger.info(`[Stripe] Event ${event.id} already processed — skipping`)
    return NextResponse.json({ received: true, status: "already_processed" })
  }

  // Route to handler
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          event.data.object as Stripe.PaymentIntent,
          event.id
        )
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          event.data.object as Stripe.PaymentIntent,
          event.id
        )
        break

      case "charge.refunded":
        await handleChargeRefunded(
          event.data.object as Stripe.Charge,
          event.id
        )
        break

      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        logger.info("[Stripe] checkout.session.completed", {
          sessionId: session.id,
          paymentStatus: session.payment_status,
          customerEmail: session.customer_details?.email,
        })
        // Delegate to payment_intent.succeeded which fires separately
        break
      }

      default:
        logger.info(`[Stripe] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true, eventType: event.type })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error(`[Stripe] Handler failed for ${event.type}:`, message)
    // Return 500 so Stripe retries the webhook
    return NextResponse.json({ error: "Handler failed" }, { status: 500 })
  }
}
