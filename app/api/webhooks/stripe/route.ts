import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractNotificationData, sendPaymentNotifications } from '@/lib/webhook-notifications'
import { isValidLicensePath } from '@/lib/license-path'

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
  supabase: ReturnType<typeof createAdminClient>,
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
  supabase: ReturnType<typeof createAdminClient>,
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
  supabase: ReturnType<typeof createAdminClient>,
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

export async function handleCheckoutSessionCompleted(
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
        const { data: transitioned, error: holdVehicleError } = await supabase
          .rpc('transition_vehicle_status', {
            p_vehicle_id: vehicleId,
            p_from_statuses: ['available', 'reserved'],
            p_to_status: 'reserved',
          })

        if (holdVehicleError) {
          throw new Error(`Failed to hold vehicle ${vehicleId} while payment is pending: ${holdVehicleError.message}`)
        }
        if (!transitioned) {
          console.warn(`[webhook] Vehicle ${vehicleId} hold while payment pending was a no-op.`)
        }
      }

      console.info(`[webhook] Reservation ${reservationId} checkout completed with unsettled funds (payment_status=${session.payment_status}).`)
      return
    }

    // Confirm the reservation deposit
    const utmData: Record<string, string> = {}
    if (session.metadata?.utm_source) utmData.utm_source = session.metadata.utm_source
    if (session.metadata?.utm_medium) utmData.utm_medium = session.metadata.utm_medium
    if (session.metadata?.utm_campaign) utmData.utm_campaign = session.metadata.utm_campaign
    if (session.metadata?.utm_content) utmData.utm_content = session.metadata.utm_content
    if (session.metadata?.utm_term) utmData.utm_term = session.metadata.utm_term

    const rawLicensePath = session.metadata?.licenseStoragePath || null
    const licenseStoragePath = rawLicensePath && vehicleId && isValidLicensePath(rawLicensePath, vehicleId)
      ? rawLicensePath
      : null
    if (rawLicensePath && !licenseStoragePath) {
      console.warn(`[webhook] Dropped invalid licenseStoragePath from reservation ${reservationId}: failed validation`)
    }

    const { error: reservationError } = await supabase
      .from('reservations')
      .update({
        deposit_status: 'paid',
        status: 'confirmed',
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
        ...utmData,
        ...(licenseStoragePath && { license_storage_path: licenseStoragePath }),
      })
      .eq('id', reservationId)

    if (reservationError) {
      throw new Error(`Failed to confirm reservation ${reservationId}: ${reservationError.message}`)
    }

    // Atomically mark vehicle as reserved using row-level lock.
    if (vehicleId) {
      const { data: transitioned, error: vehicleError } = await supabase
        .rpc('transition_vehicle_status', {
          p_vehicle_id: vehicleId,
          p_from_statuses: ['available', 'reserved'],
          p_to_status: 'reserved',
        })

      if (vehicleError) {
        throw new Error(`Failed to update vehicle ${vehicleId} after reservation confirmation: ${vehicleError.message}`)
      }
      if (!transitioned) {
        console.warn(`[webhook] Vehicle ${vehicleId} status transition to 'reserved' was a no-op (already transitioned by concurrent webhook).`)
      }
    }

    console.info(`[webhook] Reservation ${reservationId} confirmed, vehicle ${vehicleId} reserved.`)

    // Fire-and-forget: CRM lead + customer/admin email notifications
    const notificationData = extractNotificationData(session)
    if (notificationData) {
      sendPaymentNotifications(notificationData).catch((err) =>
        console.error('[webhook] Post-payment notification error (non-blocking):', err)
      )
    }

    return
  }

  // Checkout-flow deposits: type === 'vehicle-reservation' but no reservationId
  // (created via startVehicleCheckout with depositOnly=true, not via createReservation)
  if (type === 'vehicle-reservation' && !reservationId && vehicleId) {
    if (!isSettled) {
      // Delayed payment methods (e.g. ACSS debit) may complete checkout before settlement.
      const { data: transitioned, error: holdVehicleError } = await supabase
        .rpc('transition_vehicle_status', {
          p_vehicle_id: vehicleId,
          p_from_statuses: ['available', 'reserved'],
          p_to_status: 'reserved',
        })

      if (holdVehicleError) {
        throw new Error(`Failed to hold vehicle ${vehicleId} while payment is pending: ${holdVehicleError.message}`)
      }
      if (!transitioned) {
        console.warn(`[webhook] Vehicle ${vehicleId} hold while payment pending was a no-op.`)
      }

      console.info(`[webhook] Checkout-flow deposit for vehicle ${vehicleId} completed with unsettled funds (payment_status=${session.payment_status}).`)
      return
    }

    // Confirmed checkout-flow deposit: create reservation record
    const utmData: Record<string, string> = {}
    if (session.metadata?.utm_source) utmData.utm_source = session.metadata.utm_source
    if (session.metadata?.utm_medium) utmData.utm_medium = session.metadata.utm_medium
    if (session.metadata?.utm_campaign) utmData.utm_campaign = session.metadata.utm_campaign
    if (session.metadata?.utm_content) utmData.utm_content = session.metadata.utm_content
    if (session.metadata?.utm_term) utmData.utm_term = session.metadata.utm_term

    const licenseStoragePath = session.metadata?.licenseStoragePath || null
    const customerEmail = session.customer_email || session.customer_details?.email || ''

    // Insert a new reservation record for this checkout-flow deposit
    const { error: insertError } = await supabase
      .from('reservations')
      .insert({
        vehicle_id: vehicleId,
        customer_email: customerEmail,
        customer_name: session.customer_details?.name || null,
        deposit_amount: session.amount_total || 25000, // Default to $250 deposit
        deposit_status: 'paid',
        status: 'confirmed',
        stripe_checkout_session_id: session.id,
        ...(licenseStoragePath && { license_storage_path: licenseStoragePath }),
        ...utmData,
      })

    if (insertError) {
      throw new Error(`Failed to create reservation for vehicle ${vehicleId}: ${insertError.message}`)
    }

    // Atomically mark vehicle as reserved using row-level lock.
    const { data: transitioned, error: vehicleError } = await supabase
      .rpc('transition_vehicle_status', {
        p_vehicle_id: vehicleId,
        p_from_statuses: ['available', 'reserved'],
        p_to_status: 'reserved',
      })

    if (vehicleError) {
      throw new Error(`Failed to update vehicle ${vehicleId} after checkout-flow deposit: ${vehicleError.message}`)
    }
    if (!transitioned) {
      console.warn(`[webhook] Vehicle ${vehicleId} status transition to 'reserved' was a no-op (already transitioned by concurrent webhook).`)
    }

    console.info(`[webhook] Checkout-flow deposit confirmed, vehicle ${vehicleId} reserved.`)

    // Fire-and-forget: CRM lead + customer/admin email notifications
    const notificationData = extractNotificationData(session)
    if (notificationData) {
      sendPaymentNotifications(notificationData).catch((err) =>
        console.error('[webhook] Post-payment notification error (non-blocking):', err)
      )
    }

    return
  }

  if (type !== 'vehicle-reservation' && vehicleId) {
    if (!isSettled) {
      console.info(`[webhook] Vehicle checkout completed with unsettled funds for ${vehicleId} (payment_status=${session.payment_status}).`)
      return
    }

    // Full vehicle checkout: mark order payment as confirmed.
    // Orders are created separately; link via Stripe session metadata.
    const utmData: Record<string, string> = {}
    if (session.metadata?.utm_source) utmData.utm_source = session.metadata.utm_source
    if (session.metadata?.utm_medium) utmData.utm_medium = session.metadata.utm_medium
    if (session.metadata?.utm_campaign) utmData.utm_campaign = session.metadata.utm_campaign
    if (session.metadata?.utm_content) utmData.utm_content = session.metadata.utm_content
    if (session.metadata?.utm_term) utmData.utm_term = session.metadata.utm_term

    const rawLicensePathFromCheckout = session.metadata?.licenseStoragePath || null
    const licenseStoragePathFromCheckout = rawLicensePathFromCheckout && isValidLicensePath(rawLicensePathFromCheckout, vehicleId)
      ? rawLicensePathFromCheckout
      : null
    if (rawLicensePathFromCheckout && !licenseStoragePathFromCheckout) {
      console.warn(`[webhook] Dropped invalid licenseStoragePath from order for vehicle ${vehicleId}: failed validation`)
    }

    const { error: orderError } = await supabase
      .from('orders')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
        ...utmData,
        ...(licenseStoragePathFromCheckout && { license_storage_path: licenseStoragePathFromCheckout }),
      })
      .eq('vehicle_id', vehicleId)
      .eq('status', 'created')

    if (orderError) {
      throw new Error(`Failed to confirm order for vehicle ${vehicleId}: ${orderError.message}`)
    }

    // Best-effort: also link license to any matching reservation
    if (licenseStoragePathFromCheckout && session.customer_email) {
      const { error: resLinkError } = await supabase
        .from('reservations')
        .update({
          license_storage_path: licenseStoragePathFromCheckout,
          updated_at: new Date().toISOString(),
        })
        .eq('vehicle_id', vehicleId)
        .eq('customer_email', session.customer_email.toLowerCase())
        .in('status', ['pending', 'confirmed'])

      if (resLinkError) {
        console.error(`[webhook] Best-effort reservation license link failed for ${vehicleId}:`, resLinkError.message)
      }
    }

    const { data: transitioned, error: vehicleError } = await supabase
      .rpc('transition_vehicle_status', {
        p_vehicle_id: vehicleId,
        p_from_statuses: ['available', 'reserved', 'pending', 'checkout_in_progress'],
        p_to_status: 'pending',
      })

    if (vehicleError) {
      throw new Error(`Failed to transition vehicle ${vehicleId} after order confirmation: ${vehicleError.message}`)
    }
    if (!transitioned) {
      console.warn(`[webhook] Vehicle ${vehicleId} status transition to 'pending' was a no-op.`)
    }

    // Fire-and-forget: CRM lead + customer/admin email notifications
    const notificationData = extractNotificationData(session)
    if (notificationData) {
      sendPaymentNotifications(notificationData).catch((err) =>
        console.error('[webhook] Post-payment notification error (non-blocking):', err)
      )
    }

    console.info(`[webhook] Vehicle ${vehicleId} order confirmed.`)
  }
}

export async function handleCheckoutSessionAsyncPaymentFailed(
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

    console.warn(`[webhook] Async payment failed for reservation ${reservationId}.`)
  }

  if (vehicleId) {
    const { data: transitioned, error: vehicleError } = await supabase
      .rpc('transition_vehicle_status', {
        p_vehicle_id: vehicleId,
        p_from_statuses: ['reserved', 'checkout_in_progress'],
        p_to_status: 'available',
      })

    if (vehicleError) {
      throw new Error(`Failed to release vehicle ${vehicleId} after async payment failure: ${vehicleError.message}`)
    }
    if (!transitioned) {
      console.warn(`[webhook] Vehicle ${vehicleId} release after async payment failure was a no-op.`)
    }
  }
}

export async function handleCheckoutSessionExpired(
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

    console.info(`[webhook] Reservation ${reservationId} expired.`)
  }

  if (vehicleId) {
    const { data: transitioned, error: vehicleError } = await supabase
      .rpc('transition_vehicle_status', {
        p_vehicle_id: vehicleId,
        p_from_statuses: ['reserved', 'checkout_in_progress'],
        p_to_status: 'available',
      })

    if (vehicleError) {
      throw new Error(`Failed to release vehicle ${vehicleId} after session expiration: ${vehicleError.message}`)
    }
    if (!transitioned) {
      console.warn(`[webhook] Vehicle ${vehicleId} release after session expiration was a no-op.`)
    }
  }
}

export async function handlePaymentIntentFailed(
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

    console.warn(`[webhook] Payment failed for reservation ${reservationId}.`)
  }

  if (vehicleId) {
    const { data: transitioned, error: vehicleError } = await supabase
      .rpc('transition_vehicle_status', {
        p_vehicle_id: vehicleId,
        p_from_statuses: ['reserved', 'checkout_in_progress'],
        p_to_status: 'available',
      })

    if (vehicleError) {
      throw new Error(`Failed to release vehicle ${vehicleId} after payment failure: ${vehicleError.message}`)
    }
    if (!transitioned) {
      console.warn(`[webhook] Vehicle ${vehicleId} release after payment failure was a no-op.`)
    }
  }
}

export async function handlePaymentIntentSucceeded(
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
      const { data: transitioned, error: vehicleError } = await supabase
        .rpc('transition_vehicle_status', {
          p_vehicle_id: vehicleId,
          p_from_statuses: ['available', 'reserved'],
          p_to_status: 'reserved',
        })

      if (vehicleError) {
        throw new Error(`Failed to hold vehicle ${vehicleId} after payment success: ${vehicleError.message}`)
      }
      if (!transitioned) {
        console.warn(`[webhook] Vehicle ${vehicleId} hold after payment success was a no-op.`)
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

    const { data: transitioned, error: vehicleError } = await supabase
      .rpc('transition_vehicle_status', {
        p_vehicle_id: vehicleId,
        p_from_statuses: ['available', 'reserved', 'pending', 'checkout_in_progress'],
        p_to_status: 'pending',
      })

    if (vehicleError) {
      throw new Error(`Failed to transition vehicle ${vehicleId} after payment intent success: ${vehicleError.message}`)
    }
    if (!transitioned) {
      console.warn(`[webhook] Vehicle ${vehicleId} transition to pending after payment intent was a no-op.`)
    }
  }
}

async function hydrateCheckoutSession(
  stripe: Stripe,
  session: Stripe.Checkout.Session
): Promise<Stripe.Checkout.Session> {
  const hasRequiredMetadata =
    !!session.metadata &&
    (!!session.metadata.reservationId || !!session.metadata.vehicleId || !!session.metadata.type)
  if (hasRequiredMetadata) return session

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
  const hasRequiredMetadata =
    !!paymentIntent.metadata &&
    (!!paymentIntent.metadata.reservationId || !!paymentIntent.metadata.vehicleId)
  if (hasRequiredMetadata) return paymentIntent

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
        console.warn(`[webhook] Unhandled event type: ${event.type}`)
    }

    await markEventProcessed(supabase, event.id)
    return NextResponse.json({ received: true })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown handler error'
    console.error(`[webhook] Handler error for ${event.type} (${event.id}): ${message}`)
    // Mark the event as failed so Stripe retries it and the operator can investigate.
    // Wrap in try/catch so a DB error here doesn't mask the original handler error.
    try {
      await markEventFailed(supabase, event.id, message)
    } catch (auditError) {
      console.error(`[webhook] Failed to mark event failed for ${event.id}:`, auditError)
    }
    // Return 500 so Stripe retries the event.
    return NextResponse.json({ error: 'Handler error' }, { status: 500 })
  }
}
