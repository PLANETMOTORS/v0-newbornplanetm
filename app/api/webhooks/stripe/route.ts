import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

// Stripe requires raw body for signature verification — Next.js must NOT parse it.
export const dynamic = 'force-dynamic'

/**
 * Atomically claim a Stripe event for processing.
 *
 * Status lifecycle:  processing → processed (success) | failed (error)
 *
 * Strategy:
 * 1. INSERT with status='processing' using ignoreDuplicates:true.
 *    - If the INSERT writes a new row (data is non-empty), this worker owns the event.
 *    - If the INSERT conflicts (data is empty), check the existing row's status:
 *      - 'processed'  → skip; event already handled.
 *      - 'processing' → skip; another worker is currently handling it.
 *      - 'failed'     → Stripe retry allowed: UPDATE status back to 'processing'
 *                       using a conditional update (.eq('status', 'failed')) to
 *                       avoid racing with another concurrent retry.
 * 2. Any DB / network error is thrown so the caller returns 500 and Stripe retries.
 *
 * Returns true when this worker successfully claimed the event, false to skip.
 */
async function claimEvent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  eventType: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .upsert(
      {
        stripe_event_id: eventId,
        event_type: eventType,
        status: 'processing',
        processed_at: new Date().toISOString(),
      },
      { onConflict: 'stripe_event_id', ignoreDuplicates: true }
    )
    .select('stripe_event_id')

  if (error) {
    // DB / network failure — throw so the caller returns 500 and Stripe retries.
    throw new Error(`[webhook] Failed to claim event ${eventId}: ${error.message}`)
  }

  // New row was inserted: this worker owns the event.
  if (Array.isArray(data) && data.length > 0) {
    return true
  }

  // Row already existed — inspect its status to decide if a retry is allowed.
  const { data: existing, error: fetchError } = await supabase
    .from('stripe_webhook_events')
    .select('status')
    .eq('stripe_event_id', eventId)
    .maybeSingle()

  if (fetchError) {
    throw new Error(`[webhook] Failed to read event status ${eventId}: ${fetchError.message}`)
  }

  if (existing?.status === 'failed') {
    // Previous attempt failed — Stripe is retrying. Re-claim by updating back to
    // 'processing', but only if still 'failed' so two concurrent retries don't
    // both claim the event.
    const { data: updated, error: updateError } = await supabase
      .from('stripe_webhook_events')
      .update({
        status: 'processing',
        error_message: null,
        processed_at: new Date().toISOString(),
      })
      .eq('stripe_event_id', eventId)
      .eq('status', 'failed')
      .select('stripe_event_id')

    if (updateError) {
      throw new Error(`[webhook] Failed to re-claim failed event ${eventId}: ${updateError.message}`)
    }

    // If the update returned a row, this worker won the re-claim race.
    return Array.isArray(updated) && updated.length > 0
  }

  // Status is 'processing' (another worker) or 'processed' (done) — skip.
  return false
}

async function markEventProcessed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string
) {
  await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'processed',
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', eventId)
    .eq('status', 'processing')
}

async function markEventFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  eventId: string,
  errorMessage: string
) {
  await supabase
    .from('stripe_webhook_events')
    .update({
      status: 'failed',
      error_message: errorMessage,
      processed_at: new Date().toISOString(),
    })
    .eq('stripe_event_id', eventId)
    .eq('status', 'processing')
}

async function handleCheckoutSessionCompleted(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session
) {
  const { reservationId, vehicleId, type } = session.metadata || {}

  if (type === 'vehicle-reservation' && reservationId) {
    // Confirm the reservation deposit
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        deposit_status: 'paid',
        status: 'confirmed',
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (reservationError) {
      throw new Error(`Failed to confirm reservation ${reservationId}: ${reservationError.message}`)
    }

    // Mark vehicle as reserved
    if (vehicleId) {
      await supabase
        .from('vehicles')
        .update({ status: 'reserved', updated_at: new Date().toISOString() })
        .eq('id', vehicleId)
        .in('status', ['available', 'reserved'])
    }

    console.log(`[webhook] Reservation ${reservationId} confirmed, vehicle ${vehicleId} reserved.`)
    return
  }

  if (type !== 'vehicle-reservation' && vehicleId) {
    // Full vehicle checkout: mark order payment as confirmed.
    // Orders are created separately; link via Stripe session metadata.
    await supabase
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'created')

    await supabase
      .from('vehicles')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)

    console.log(`[webhook] Vehicle ${vehicleId} order confirmed.`)
  }
}

async function handleCheckoutSessionExpired(
  supabase: Awaited<ReturnType<typeof createClient>>,
  session: Stripe.Checkout.Session
) {
  const { reservationId, vehicleId } = session.metadata || {}

  if (reservationId) {
    await supabase
      .from('reservations')
      .update({
        status: 'expired',
        deposit_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .in('status', ['pending'])

    console.log(`[webhook] Reservation ${reservationId} expired.`)
  }

  if (vehicleId) {
    // Only release lock if vehicle is still in reserved state from this reservation
    await supabase
      .from('vehicles')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('status', 'reserved')
  }
}

async function handlePaymentIntentFailed(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paymentIntent: Stripe.PaymentIntent
) {
  const { reservationId, vehicleId } = paymentIntent.metadata || {}

  if (reservationId) {
    await supabase
      .from('reservations')
      .update({
        deposit_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .in('deposit_status', ['pending'])

    console.log(`[webhook] Payment failed for reservation ${reservationId}.`)
  }

  if (vehicleId) {
    await supabase
      .from('vehicles')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('status', 'reserved')
  }
}

async function handlePaymentIntentSucceeded(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Idempotent backup confirmation — checkout.session.completed is the primary trigger.
  const { reservationId } = paymentIntent.metadata || {}
  if (!reservationId) return

  await supabase
    .from('reservations')
    .update({
      deposit_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .in('deposit_status', ['pending'])
}

export async function POST(request: NextRequest) {
  // Only accept Stripe endpoint signing secrets (whsec_...).
  // Never fall back to other key types such as STRIPE_MCP_KEY.
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[webhook] Stripe webhook secret is not set')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!webhookSecret.startsWith('whsec_')) {
    console.error('[webhook] Configured webhook secret is not a Stripe endpoint signing secret')
    return NextResponse.json(
      { error: 'Webhook secret must be a Stripe endpoint signing secret (whsec_...)' },
      { status: 500 }
    )
  }

  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing Stripe-Signature header' }, { status: 400 })
  }

  const rawBody = await request.text()

  let event: Stripe.Event
  try {
    const stripe = getStripe()
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[webhook] Signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 })
  }

  const supabase = await createClient()

  // Atomic idempotency claim: only one concurrent worker can INSERT the row
  // (status='processing'). The handler then transitions it to 'processed' on
  // success or 'failed' on error, allowing Stripe retries for failed events.
  // Any DB error in claimEvent throws and returns 500 so Stripe retries.
  const claimed = await claimEvent(supabase, event.id, event.type)
  if (!claimed) {
    return NextResponse.json({ received: true, skipped: 'already_processed' })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(supabase, event.data.object as Stripe.Checkout.Session)
        break
      case 'checkout.session.expired':
        await handleCheckoutSessionExpired(supabase, event.data.object as Stripe.Checkout.Session)
        break
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(supabase, event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(supabase, event.data.object as Stripe.PaymentIntent)
        break
      default:
        // Log unhandled event types but still return 200 so Stripe doesn't retry.
        console.log(`[webhook] Unhandled event type: ${event.type}`)
    }

    // Mark the event as fully processed only after the handler succeeded.
    await markEventProcessed(supabase, event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown handler error'
    console.error(`[webhook] Handler error for ${event.type} (${event.id}): ${message}`)
    // Mark the event as failed so Stripe retries it and the operator can investigate.
    await markEventFailed(supabase, event.id, message)
    // Return 500 so Stripe retries the event.
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
