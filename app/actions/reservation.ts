'use server'

import { createHash } from 'node:crypto'
import { lockVehicle, unlockVehicle, rateLimit } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { getPublicSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export interface ReservationInput {
  vehicleId: string
  stockNumber: string
  customerEmail: string
  customerPhone?: string
  customerName?: string
}

export interface ReservationResult {
  success?: boolean
  error?: string
  checkoutUrl?: string | null
  clientSecret?: string | null
  reservationId?: string
  sessionId?: string
  remaining?: number
}

export async function createReservation(input: ReservationInput): Promise<ReservationResult> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const cfConnectingIp = headersList.get('cf-connecting-ip')
  const ipCandidate = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown'
  const normalizedIp = ipCandidate.toLowerCase()
  const normalizedEmail = input.customerEmail.trim().toLowerCase()
  const rateLimitScopeHash = createHash('sha256')
    .update(`${normalizedIp}:${normalizedEmail}`)
    .digest('hex')

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Rate limit: 12 reservation attempts per hour per user+network scope.
  // This avoids blocking legitimate retries from shared proxy IPs while still curbing abuse.
  const rateLimitResult = await rateLimit(`reservation:${rateLimitScopeHash}`, 12, 3600)
  if (!rateLimitResult.success) {
    return { 
      error: 'Too many reservation attempts. Please try again later.',
      remaining: rateLimitResult.remaining 
    }
  }

  // Acquire Redis lock as a fast distributed mutex (defense-in-depth).
  // The real serialization happens in the DB via SELECT FOR UPDATE.
  const locked = await lockVehicle(input.stockNumber, input.customerEmail)
  if (!locked) {
    return { error: 'This vehicle is currently being reserved by another customer. Please try again.' }
  }

  // Get Stripe instance
  const stripe = getStripe()

  try {
    // Get product for $250 reservation
    const product = getProductById('vehicle-reservation')
    if (!product) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Reservation product not found.' }
    }

    // --- ATOMIC claim via DB-level SELECT FOR UPDATE ---
    // This replaces the old TOCTOU pattern (read status → check → insert) with a
    // single RPC call that locks the vehicle row, checks status, checks for
    // conflicting reservations, and inserts/reuses a reservation — all in one TX.
    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch (e) {
      console.error('Admin client not configured — SUPABASE_SERVICE_ROLE_KEY is required for reservation RPC:', e)
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Service configuration error. Please try again later.' }
    }

    const { data: claimResult, error: claimError } = await adminClient
      .rpc('claim_vehicle_for_reservation', {
        p_vehicle_id: input.vehicleId,
        p_user_id: user?.id || null,
        p_customer_email: input.customerEmail,
        p_customer_phone: input.customerPhone || null,
        p_customer_name: input.customerName || null,
        p_deposit_amount: product.priceInCents,
        p_notes: `Reservation created from web checkout`,
      })

    if (claimError) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      console.error('claim_vehicle_for_reservation RPC error:', claimError)
      return { error: 'Unable to process reservation. Please try again.' }
    }

    const claim = claimResult as { success: boolean; error?: string; reservation_id?: string; stock_number?: string }
    if (!claim?.success) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: claim?.error || 'Vehicle is not available for reservation.' }
    }

    const reservationId = claim.reservation_id!

    // Create Stripe Checkout session
    const baseUrl = getPublicSiteUrl()
    const checkoutAttemptWindow = Math.floor(Date.now() / (15 * 60 * 1000))
    const idempotencyKey = createHash('sha256')
      .update(`reservation:${reservationId}:${input.customerEmail}:${input.stockNumber}:${checkoutAttemptWindow}`)
      .digest('hex')
    
    const enableAcssDebit = process.env.STRIPE_ENABLE_ACSS_DEBIT === 'true'

    const createSessionParams = (includeAcssDebit: boolean) => ({
      ui_mode: 'embedded' as const,
      redirect_on_completion: 'never' as const,
      mode: 'payment' as const,
      payment_method_types: includeAcssDebit
        ? (['card', 'acss_debit'] as Array<'card' | 'acss_debit'>)
        : (['card'] as Array<'card' | 'acss_debit'>),
      ...(includeAcssDebit
        ? {
            payment_method_options: {
              acss_debit: {
                currency: 'cad' as const,
                mandate_options: {
                  payment_schedule: 'sporadic' as const,
                  transaction_type: 'personal' as const,
                },
              },
            },
          }
        : {}),
      line_items: [
        {
          price_data: {
            currency: 'cad',
            product_data: {
              name: product.name,
              description: `Reserve ${input.stockNumber} - ${product.description}`,
            },
            unit_amount: product.priceInCents,
          },
          quantity: 1,
        },
      ],
      customer_email: input.customerEmail,
      metadata: {
        reservationId,
        vehicleId: input.vehicleId,
        stockNumber: input.stockNumber,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || '',
        customerName: input.customerName || '',
        type: 'vehicle-reservation',
      },
      payment_intent_data: {
        metadata: {
          reservationId,
          vehicleId: input.vehicleId,
          stockNumber: input.stockNumber,
          customerEmail: input.customerEmail,
          type: 'vehicle-reservation',
        },
      },
      return_url: `${baseUrl}/vehicles/${input.vehicleId}?reservation=complete`,
      expires_at: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    })

    let session
    try {
      session = await stripe.checkout.sessions.create(createSessionParams(enableAcssDebit), {
        idempotencyKey,
      })
    } catch (sessionError) {
      const stripeErrorCode =
        typeof sessionError === 'object' &&
        sessionError !== null &&
        'code' in sessionError &&
        typeof (sessionError as { code?: unknown }).code === 'string'
          ? (sessionError as { code: string }).code
          : ''
      const sessionErrorMessage = sessionError instanceof Error ? sessionError.message.toLowerCase() : ''
      const canRetryCardOnly =
        enableAcssDebit &&
        (
          stripeErrorCode === 'payment_method_not_available' ||
          stripeErrorCode === 'payment_method_invalid_parameter' ||
          sessionErrorMessage.includes('acss') ||
          sessionErrorMessage.includes('payment_method_options')
        )

      if (!canRetryCardOnly) {
        throw sessionError
      }

      console.warn('ACSS checkout session failed, retrying with card only', {
        reservationId,
        stockNumber: input.stockNumber,
        errorCode: stripeErrorCode || undefined,
        error: sessionErrorMessage,
      })

      session = await stripe.checkout.sessions.create(createSessionParams(false), {
        idempotencyKey: `${idempotencyKey}:card-only`,
      })
    }

    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        stripe_checkout_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reservationId)

    if (updateError) {
      console.error('Failed to persist reservation checkout session:', updateError)
    }

    return { 
      success: true,
      checkoutUrl: session.url,
      clientSecret: session.client_secret,
      reservationId,
      sessionId: session.id,
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorMessageLower = errorMessage.toLowerCase()
    const isStripeLike =
      typeof error === 'object' &&
      error !== null &&
      'type' in error &&
      typeof (error as { type?: unknown }).type === 'string'

    const customerEmailHash = createHash('sha256')
      .update(input.customerEmail.trim().toLowerCase())
      .digest('hex')
      .slice(0, 12)

    console.error('Reservation error:', {
      error: errorMessage,
      vehicleId: input.vehicleId,
      stockNumber: input.stockNumber,
      customerEmailHash,
      stack: error instanceof Error ? error.stack : undefined,
    })
    await unlockVehicle(input.stockNumber, input.customerEmail)
    
    // Return more specific error messages to help with debugging
    if (
      isStripeLike ||
      errorMessageLower.includes('stripe') ||
      errorMessageLower.includes('payment_method') ||
      errorMessageLower.includes('checkout') ||
      errorMessageLower.includes('acss')
    ) {
      return { error: 'Payment system error. Please try again in a moment.' }
    }
    if (errorMessageLower.includes('vehicle')) {
      return { error: 'Unable to verify vehicle details. Please refresh and try again.' }
    }
    if (
      errorMessageLower.includes('database') ||
      errorMessageLower.includes('supabase') ||
      errorMessageLower.includes('permission') ||
      errorMessageLower.includes('relation') ||
      errorMessageLower.includes('column') ||
      errorMessageLower.includes('row-level security')
    ) {
      return { error: 'Database error. Please try again shortly.' }
    }
    
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function cancelReservation(
  reservationId: string, 
  stockNumber: string, 
  email: string
): Promise<{ success?: boolean; error?: string }> {
  // Release the vehicle lock
  await unlockVehicle(stockNumber, email)
  return { success: true }
}

export async function getReservationStatus(
  sessionId: string
): Promise<{ reservation?: Record<string, unknown>; error?: string }> {
  const stripe = getStripe()
  const supabase = await createClient()
  
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    const reservationId = session.metadata?.reservationId
    let reservationRecord: Record<string, unknown> | null = null

    if (reservationId) {
      const { data } = await supabase
        .from('reservations')
        .select('id, status, deposit_status, expires_at, vehicle_id, customer_email')
        .eq('id', reservationId)
        .maybeSingle()
      reservationRecord = data
    }
    
    return { 
      reservation: {
        id: reservationId || session.id,
        status: session.payment_status,
        customerEmail: session.customer_email,
        metadata: session.metadata,
        amountTotal: session.amount_total,
        record: reservationRecord,
      }
    }
  } catch {
    return { error: 'Reservation not found.' }
  }
}
