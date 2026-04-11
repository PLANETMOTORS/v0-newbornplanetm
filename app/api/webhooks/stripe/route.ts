import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

// Stripe requires raw body for signature verification — Next.js must NOT parse it.
export const dynamic = 'force-dynamic'

function getExpectedStripeLivemode(): boolean {
  const explicit = process.env.STRIPE_EXPECT_LIVEMODE
  if (explicit === 'true') return true
  if (explicit === 'false') return false
  return process.env.NODE_ENV === 'production'
}

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
  const isSettled = session.payment_status === 'paid'

  if (type === 'vehicle-reservation' && reservationId) {
    if (!isSettled) {
      // Delayed payment methods (e.g. ACSS debit) may complete checkout before settlement.
      // Keep the reservation pending until async success confirms funds.
      if (vehicleId) {
        const { error: holdVehicleError } = await supabase
          .from('vehicles')
          .update({ status: 'reserved', updated_at: new Date().toISOString() })
          .eq('id', vehicleId)
          .in('status', ['available', 'reserved'])

        if (holdVehicleError) {
          throw new Error(`Failed to hold vehicle ${vehicleId} while payment is pending: ${holdVehicleError.message}`)
        }
      }

      console.log(`[webhook] Reservation ${reservationId} checkout completed with unsettled funds (payment_status=${session.payment_status}).`)
      return
    }

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
    if (!isSettled) {
      console.log(`[webhook] Vehicle checkout completed with unsettled funds for ${vehicleId} (payment_status=${session.payment_status}).`)
      return
    }

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

async function handleCheckoutSessionAsyncPaymentFailed(
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
      .in('deposit_status', ['pending'])

    if (reservationError) {
      throw new Error(`Failed to mark reservation ${reservationId} async payment failure: ${reservationError.message}`)
    }

    console.log(`[webhook] Async payment failed for reservation ${reservationId}.`)
  }

  if (vehicleId) {
    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'available', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)
      .eq('status', 'reserved')

    if (vehicleError) {
      throw new Error(`Failed to release vehicle ${vehicleId} after async payment failure: ${vehicleError.message}`)
    }
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
  // Idempotent backup confirmation when checkout-session events are delayed/missed.
  const { reservationId, vehicleId, type } = paymentIntent.metadata || {}

  if (reservationId) {
    const { error } = await supabase
      .from('reservations')
      .update({
        deposit_status: 'paid',
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)
      .in('deposit_status', ['pending'])

    if (error) {
      throw new Error(`Failed to mark reservation ${reservationId} as paid: ${error.message}`)
    }

    if (vehicleId) {
      const { error: vehicleError } = await supabase
        .from('vehicles')
        .update({ status: 'reserved', updated_at: new Date().toISOString() })
        .eq('id', vehicleId)
        .in('status', ['available', 'reserved'])

      if (vehicleError) {
        throw new Error(`Failed to hold vehicle ${vehicleId} after payment success: ${vehicleError.message}`)
      }
    }

    return
  }

  if (vehicleId && type !== 'vehicle-reservation') {
    const { error: orderError } = await supabase
      .from('orders')
      .update({ status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'created')

    if (orderError) {
      throw new Error(`Failed to confirm order from payment intent for vehicle ${vehicleId}: ${orderError.message}`)
    }

    const { error: vehicleError } = await supabase
      .from('vehicles')
      .update({ status: 'pending', updated_at: new Date().toISOString() })
      .eq('id', vehicleId)

    if (vehicleError) {
      throw new Error(`Failed to transition vehicle ${vehicleId} after payment intent success: ${vehicleError.message}`)
    }
  }
}

async function hydrateCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<Stripe.Checkout.Session> {
  const hasMetadata = session.metadata && Object.keys(session.metadata).length > 0
  if (hasMetadata) return session

  if (!session.id) return session

  try {
    return await stripe.checkout.sessions.retrieve(session.id)
  } catch (error) {
    console.error(`[webhook] Failed to hydrate checkout session ${session.id}:`, error)
    return session
  }
}

async function hydratePaymentIntent(
  stripe: Stripe,
  paymentIntent: Stripe.PaymentIntent
): Promise<Stripe.PaymentIntent> {
  const hasMetadata = paymentIntent.metadata && Object.keys(paymentIntent.metadata).length > 0
  if (hasMetadata) return paymentIntent

  if (!paymentIntent.id) return paymentIntent

  try {
    return await stripe.paymentIntents.retrieve(paymentIntent.id)
  } catch (error) {
    console.error(`[webhook] Failed to hydrate payment intent ${paymentIntent.id}:`, error)
    return paymentIntent
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
  const stripe = getStripe()
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[webhook] Signature verification failed: ${message}`)
    return NextResponse.json({ error: `Webhook signature invalid: ${message}` }, { status: 400 })
  }

  const supabase = createAdminClient()

  const expectedLivemode = getExpectedStripeLivemode()
  if (event.livemode !== expectedLivemode) {
    const mismatchMessage = `Ignored webhook ${event.id}: livemode mismatch (event=${event.livemode}, expected=${expectedLivemode})`
    console.warn(`[webhook] ${mismatchMessage}`)
    try {
      await markEventProcessed(supabase, event.id, event.type, 'failed', mismatchMessage)
    } catch (auditError) {
      console.error(`[webhook] Failed to record livemode mismatch audit for ${event.id}:`, auditError)
    }
    return NextResponse.json({ received: true, skipped: 'livemode_mismatch' })
  }

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
      case 'checkout.session.completed': {
        const rawSession = event.data.object as Stripe.Checkout.Session
        const session = await hydrateCheckoutSession(stripe, rawSession)
        await handleCheckoutSessionCompleted(supabase, session)
        break
      }
      case 'checkout.session.expired': {
        const rawSession = event.data.object as Stripe.Checkout.Session
        const session = await hydrateCheckoutSession(stripe, rawSession)
        await handleCheckoutSessionExpired(supabase, session)
        break
      }
      case 'checkout.session.async_payment_succeeded': {
        const rawSession = event.data.object as Stripe.Checkout.Session
        const session = await hydrateCheckoutSession(stripe, rawSession)
        await handleCheckoutSessionCompleted(supabase, session)
        break
      }
      case 'checkout.session.async_payment_failed': {
        const rawSession = event.data.object as Stripe.Checkout.Session
        const session = await hydrateCheckoutSession(stripe, rawSession)
        await handleCheckoutSessionAsyncPaymentFailed(supabase, session)
        break
      }
      case 'payment_intent.succeeded': {
        const rawPaymentIntent = event.data.object as Stripe.PaymentIntent
        const paymentIntent = await hydratePaymentIntent(stripe, rawPaymentIntent)
        await handlePaymentIntentSucceeded(supabase, paymentIntent)
        break
      }
      case 'payment_intent.payment_failed': {
        const rawPaymentIntent = event.data.object as Stripe.PaymentIntent
        const paymentIntent = await hydratePaymentIntent(stripe, rawPaymentIntent)
        await handlePaymentIntentFailed(supabase, paymentIntent)
        break
      }
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
