/**
 * app/api/webhooks/stripe/route.ts
 *
 * Stripe Webhook Handler — Idempotent Deposit & Reservation Processing
 *
 * Events handled:
 *  - checkout.session.completed           → confirm reservation/order, lock vehicle
 *  - checkout.session.expired             → expire reservation, release vehicle
 *  - checkout.session.async_payment_failed → fail reservation, release vehicle
 *  - payment_intent.succeeded             → confirm deposit, hold vehicle
 *  - payment_intent.payment_failed        → fail deposit, release vehicle
 *
 * Security:
 *  - Stripe-Signature header verified with STRIPE_WEBHOOK_SECRET
 *  - Raw body preserved for signature verification
 *
 * Environment variables:
 *  STRIPE_SECRET_KEY        — Stripe secret key (sk_live_... or sk_test_...)
 *  STRIPE_WEBHOOK_SECRET    — Webhook signing secret (whsec_...)
 */

import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { getStripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"

// ── Type alias ─────────────────────────────────────────────────────────────

type SupabaseAdminClient = ReturnType<typeof createAdminClient>

// ── Exported handlers (testable with injected supabase) ────────────────────

/**
 * checkout.session.completed
 * - reservation type → update reservations table + transition vehicle to 'reserved'
 * - purchase type    → update orders table + transition vehicle to 'pending'
 */
export async function handleCheckoutSessionCompleted(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const { reservationId, vehicleId, type } = session.metadata ?? {}

  logger.info("[Stripe] checkout.session.completed", {
    sessionId: session.id,
    paymentStatus: session.payment_status,
    reservationId,
    vehicleId,
    type,
  })

  const isReservation = type === "vehicle-reservation" || (type !== "purchase" && !!reservationId)

  if (isReservation && reservationId) {
    await supabase
      .from("reservations")
      .update({
        status: session.payment_status === "paid" ? "confirmed" : "pending_payment",
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
  } else if (vehicleId) {
    await supabase
      .from("orders")
      .update({
        status: "confirmed",
        updated_at: new Date().toISOString(),
      })
      .eq("vehicle_id", vehicleId)
  }

  if (vehicleId) {
    const toStatus = isReservation ? "reserved" : "pending"
    await supabase.rpc("transition_vehicle_status", {
      p_vehicle_id: vehicleId,
      p_to_status: toStatus,
    })
  }
}

/**
 * checkout.session.expired
 * - Expire reservation, release vehicle back to available
 */
export async function handleCheckoutSessionExpired(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const { reservationId, vehicleId } = session.metadata ?? {}

  logger.info("[Stripe] checkout.session.expired", { sessionId: session.id, reservationId, vehicleId })

  if (reservationId) {
    await supabase
      .from("reservations")
      .update({ status: "expired", updated_at: new Date().toISOString() })
      .eq("id", reservationId)
  }

  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", {
      p_vehicle_id: vehicleId,
      p_to_status: "available",
    })
  }
}

/**
 * checkout.session.async_payment_failed
 * - Fail reservation, release vehicle back to available
 */
export async function handleCheckoutSessionAsyncPaymentFailed(
  supabase: SupabaseAdminClient,
  session: Stripe.Checkout.Session
): Promise<void> {
  const { reservationId, vehicleId } = session.metadata ?? {}

  logger.warn("[Stripe] checkout.session.async_payment_failed", { sessionId: session.id, reservationId, vehicleId })

  if (reservationId) {
    await supabase
      .from("reservations")
      .update({ status: "payment_failed", updated_at: new Date().toISOString() })
      .eq("id", reservationId)
  }

  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", {
      p_vehicle_id: vehicleId,
      p_to_status: "available",
    })
  }
}

/**
 * payment_intent.succeeded
 * - reservation type → update reservations + hold vehicle as 'reserved'
 * - purchase type    → update orders + transition vehicle to 'pending'
 */
export async function handlePaymentIntentSucceeded(
  supabase: SupabaseAdminClient,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { reservationId, vehicleId, type } = paymentIntent.metadata ?? {}

  logger.info("[Stripe] payment_intent.succeeded", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
    reservationId,
    vehicleId,
    type,
  })

  const isReservation = type !== "purchase" && (!!reservationId || type === "vehicle-reservation")

  if (isReservation && reservationId) {
    await supabase
      .from("reservations")
      .update({
        deposit_status: "paid",
        deposit_amount: paymentIntent.amount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", reservationId)
  } else if (vehicleId) {
    await supabase
      .from("orders")
      .update({
        status: "payment_received",
        updated_at: new Date().toISOString(),
      })
      .eq("vehicle_id", vehicleId)
  }

  if (vehicleId) {
    const toStatus = isReservation ? "reserved" : "pending"
    await supabase.rpc("transition_vehicle_status", {
      p_vehicle_id: vehicleId,
      p_to_status: toStatus,
    })
  }
}

/**
 * payment_intent.payment_failed
 * - Mark deposit as failed, release vehicle back to available
 */
export async function handlePaymentIntentFailed(
  supabase: SupabaseAdminClient,
  paymentIntent: Stripe.PaymentIntent
): Promise<void> {
  const { reservationId, vehicleId } = paymentIntent.metadata ?? {}

  logger.warn("[Stripe] payment_intent.payment_failed", {
    paymentIntentId: paymentIntent.id,
    lastError: paymentIntent.last_payment_error?.message,
    reservationId,
    vehicleId,
  })

  if (reservationId) {
    await supabase
      .from("reservations")
      .update({ deposit_status: "failed", updated_at: new Date().toISOString() })
      .eq("id", reservationId)
  }

  if (vehicleId) {
    await supabase.rpc("transition_vehicle_status", {
      p_vehicle_id: vehicleId,
      p_to_status: "available",
    })
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

  const supabase = createAdminClient()

  // Route to handler
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          supabase,
          event.data.object as Stripe.Checkout.Session
        )
        break

      case "checkout.session.expired":
        await handleCheckoutSessionExpired(
          supabase,
          event.data.object as Stripe.Checkout.Session
        )
        break

      case "checkout.session.async_payment_failed":
        await handleCheckoutSessionAsyncPaymentFailed(
          supabase,
          event.data.object as Stripe.Checkout.Session
        )
        break

      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(
          supabase,
          event.data.object as Stripe.PaymentIntent
        )
        break

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(
          supabase,
          event.data.object as Stripe.PaymentIntent
        )
        break

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
