import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Stripe requires raw body for signature verification — Next.js must NOT parse it.
export const dynamic = 'force-dynamic'

async function markEventProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string,
  eventType: string,
  status: 'processed' | 'failed',
  errorMessage?: string
) {
  const { error } = await supabase.from('stripe_webhook_events').upsert(
    {
      stripe_event_id: eventId,
      event_type: eventType,
      status,
      error_message: errorMessage || null,
      processed_at: new Date().toISOString(),
    },
    { onConflict: 'stripe_event_id', ignoreDuplicates: false }
  )

  if (error) {
    throw new Error(`Failed to record webhook event ${eventId}: ${error.message}`)
  }
}

async function isAlreadyProcessed(
  supabase: ReturnType<typeof createAdminClient>,
  eventId: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from('stripe_webhook_events')
    .select('status')
    .eq('stripe_event_id', eventId)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to check webhook idempotency for ${eventId}: ${error.message}`)
  }

  return data?.status === 'processed'
}

async function handleCheckoutSessionCompleted(
  supabase: ReturnType<typeof createAdminClient>,
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
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'reserved', updated_at: new Date().toISOString() })
        .eq('id', vehicleId)
        .in('status', ['available', 'reserved'])

      if (vehicleError) {
        throw new Error(`Failed to update vehicle ${vehicleId} after reservation confirmation: ${vehicleError.message}`)
      }
    }

    console.log(`[webhook] Reservation ${reservationId} confirmed, vehicle ${vehicleId} reserved.`)
    return
  }

  if (type !== 'vehicle-reservation' && vehicleId) {
    // Full vehicle checkout: mark order payment as confirmed.
    // Orders are created separately; link via Stripe session metadata.
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'created')

    if (orderError) {
      throw new Error(`Failed to confirm order for vehicle ${vehicleId}: ${orderError.message}`)
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)

    if (vehicleError) {
      throw new Error(`Failed to transition vehicle ${vehicleId} after order confirmation: ${vehicleError.message}`)
    }

    console.log(`[webhook] Vehicle ${vehicleId} order confirmed.`)
  }
}

async function handleCheckoutSessionExpired(
  supabase: ReturnType<typeof createAdminClient>,
  session: Stripe.Checkout.Session
) {
  const { reservationId, vehicleId } = session.metadata || {}

  if (reservationId) {
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        status: 'expired',
        deposit_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .in('status', ['pending'])

    if (reservationError) {
      throw new Error(`Failed to expire reservation ${reservationId}: ${reservationError.message}`)
    }

    console.log(`[webhook] Reservation ${reservationId} expired.`)
  }

  if (vehicleId) {
    // Only release lock if vehicle is still in reserved state from this reservation
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('status', 'reserved')

    if (vehicleError) {
      throw new Error(`Failed to release vehicle ${vehicleId} after session expiration: ${vehicleError.message}`)
    }
  }
}

async function handlePaymentIntentFailed(
  supabase: ReturnType<typeof createAdminClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  const { reservationId, vehicleId } = paymentIntent.metadata || {}

  if (reservationId) {
    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        deposit_status: 'failed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .in('deposit_status', ['pending'])

    if (reservationError) {
      throw new Error(`Failed to mark reservation ${reservationId} payment failure: ${reservationError.message}`)
    }

    console.log(`[webhook] Payment failed for reservation ${reservationId}.`)
  }

  if (vehicleId) {
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('status', 'reserved')

    if (vehicleError) {
      throw new Error(`Failed to release vehicle ${vehicleId} after payment failure: ${vehicleError.message}`)
    }
  }
}

async function handlePaymentIntentSucceeded(
  supabase: ReturnType<typeof createAdminClient>,
  paymentIntent: Stripe.PaymentIntent
) {
  // Idempotent backup confirmation — checkout.session.completed is the primary trigger.
  const { reservationId } = paymentIntent.metadata || {}
  if (!reservationId) return

  const { error } = await supabase
    .from('reservations')
    .update({
      deposit_status: 'paid',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .in('deposit_status', ['pending'])

  if (error) {
    throw new Error(`Failed to mark reservation ${reservationId} as paid: ${error.message}`)
  }
}

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not set — cannot verify Stripe signatures')
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!webhookSecret.startsWith('whsec_')) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET does not look like a Stripe endpoint signing secret (must start with whsec_)')
    return NextResponse.json(
      { error: 'Webhook secret misconfigured' },
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

  const supabase = createAdminClient()

  // Idempotency: skip replayed events.
  // If the idempotency check itself fails, log and continue — better to risk
  // a duplicate handler run than to drop the event with a 500.
  try {
    if (await isAlreadyProcessed(supabase, event.id)) {
      return NextResponse.json({ received: true, skipped: 'already_processed' })
    }
  } catch (idempotencyError) {
    console.error(`[webhook] Idempotency check failed for ${event.id}, processing anyway:`, idempotencyError)
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

    await markEventProcessed(supabase, event.id, event.type, 'processed')
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown handler error'
    console.error(`[webhook] Handler error for ${event.type} (${event.id}): ${message}`)
    // Best-effort audit record — must not throw and mask the original error.
    try {
      await markEventProcessed(supabase, event.id, event.type, 'failed', message)
    } catch (auditError) {
      console.error(`[webhook] Failed to record audit for ${event.id}:`, auditError)
    }
    // Return 500 so Stripe retries the event.
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
