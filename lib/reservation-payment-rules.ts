/**
 * lib/reservation-payment-rules.ts
 *
 * Centralized payment validation rules for reservations.
 *
 * Rule: Only Stripe-approved payments can create confirmed reservations.
 * This module provides application-level enforcement that complements
 * the database trigger (023_reservation_payment_validation.sql).
 */

import type Stripe from "stripe"
import { getStripe } from "@/lib/stripe"
import { logger } from "@/lib/logger"

export interface PaymentValidationResult {
  valid: boolean
  reason: string
}

export interface ReservationPaymentFields {
  deposit_status: string | null
  stripe_payment_intent_id: string | null
  stripe_checkout_session_id: string | null
  status: string | null
  expires_at: string | null
}

/**
 * Validate that a reservation meets all payment requirements before
 * it can be confirmed. Call this before any status transition to "confirmed".
 */
export function validateReservationForConfirmation(
  reservation: ReservationPaymentFields
): PaymentValidationResult {
  if (reservation.deposit_status !== "paid") {
    return {
      valid: false,
      reason: `Deposit not paid (current status: ${reservation.deposit_status ?? "unknown"})`,
    }
  }

  if (
    !reservation.stripe_payment_intent_id &&
    !reservation.stripe_checkout_session_id
  ) {
    return {
      valid: false,
      reason: "No Stripe payment reference found on reservation",
    }
  }

  if (reservation.expires_at && new Date(reservation.expires_at) < new Date()) {
    return {
      valid: false,
      reason: "Reservation has expired",
    }
  }

  return { valid: true, reason: "Payment verified" }
}

/**
 * Verify a Stripe PaymentIntent status directly with the Stripe API.
 * Use this as an extra safety layer when confirming reservations via webhooks.
 */
export async function verifyStripePaymentIntent(
  paymentIntentId: string
): Promise<PaymentValidationResult> {
  try {
    const stripe = getStripe()
    const paymentIntent: Stripe.PaymentIntent =
      await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status === "succeeded") {
      return { valid: true, reason: "Stripe payment succeeded" }
    }

    return {
      valid: false,
      reason: `Stripe payment not approved (status: ${paymentIntent.status})`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error("[PaymentValidation] Failed to verify PaymentIntent:", message)
    return {
      valid: false,
      reason: `Unable to verify payment with Stripe: ${message}`,
    }
  }
}

/**
 * Verify a Stripe Checkout Session payment status directly with the Stripe API.
 */
export async function verifyStripeCheckoutSession(
  sessionId: string
): Promise<PaymentValidationResult> {
  try {
    const stripe = getStripe()
    const session: Stripe.Checkout.Session =
      await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      return { valid: true, reason: "Stripe checkout session paid" }
    }

    return {
      valid: false,
      reason: `Stripe checkout not paid (payment_status: ${session.payment_status})`,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    logger.error("[PaymentValidation] Failed to verify Checkout Session:", message)
    return {
      valid: false,
      reason: `Unable to verify checkout session with Stripe: ${message}`,
    }
  }
}

/**
 * Full payment verification pipeline: checks local reservation state AND
 * verifies with Stripe API. Use for high-stakes transitions (e.g., admin confirm).
 */
export async function fullPaymentVerification(
  reservation: ReservationPaymentFields
): Promise<PaymentValidationResult> {
  // Step 1: Local validation
  const localCheck = validateReservationForConfirmation(reservation)
  if (!localCheck.valid) return localCheck

  // Step 2: Verify with Stripe API
  if (reservation.stripe_payment_intent_id) {
    return verifyStripePaymentIntent(reservation.stripe_payment_intent_id)
  }

  if (reservation.stripe_checkout_session_id) {
    return verifyStripeCheckoutSession(reservation.stripe_checkout_session_id)
  }

  return { valid: false, reason: "No Stripe payment reference to verify" }
}
