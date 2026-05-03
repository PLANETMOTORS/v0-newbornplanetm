'use server'

import { createHash } from 'node:crypto'
import type Stripe from 'stripe'
import { z } from 'zod'
import { lockVehicle, unlockVehicle, rateLimit } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { getPublicSiteUrl } from '@/lib/site-url'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

// ── Zod Schemas ──────────────────────────────────────────────────────────

const reservationInputSchema = z.object({
  vehicleId: z.string().uuid('Invalid vehicle ID'),
  stockNumber: z.string().min(1, 'Stock number is required').max(50),
  customerEmail: z.string().trim().email('Invalid email address').max(254),
  customerPhone: z.string().max(20).optional(),
  customerName: z.string().max(200).optional(),
})

const cancelReservationSchema = z.object({
  reservationId: z.string().uuid('Invalid reservation ID'),
  stockNumber: z.string().min(1).max(50),
  email: z.string().trim().email().max(254),
})

const reservationStatusSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required').max(200),
})

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

type StructuredError = {
  code?: unknown
  type?: unknown
  message?: unknown
}

function getStructuredErrorCode(error: unknown): string {
  if (typeof error !== 'object' || error === null) return ''
  const candidate = (error as StructuredError).code
  return typeof candidate === 'string' ? candidate.toLowerCase() : ''
}

function getStructuredErrorType(error: unknown): string {
  if (typeof error !== 'object' || error === null) return ''
  const candidate = (error as StructuredError).type
  return typeof candidate === 'string' ? candidate.toLowerCase() : ''
}

const PAYMENT_ERROR_CODES = new Set([
  'payment_method_not_available',
  'payment_method_invalid_parameter',
  'parameter_invalid_empty',
  'parameter_invalid_integer',
  'resource_missing',
  'card_declined',
  'processing_error',
  'api_connection_error',
  'api_error',
  'idempotency_key_in_use',
  'rate_limit',
])

async function buildRateLimitScope(email: string): Promise<string> {
  const headersList = await headers()
  const forwardedFor = headersList.get('x-forwarded-for')
  const realIp = headersList.get('x-real-ip')
  const cfConnectingIp = headersList.get('cf-connecting-ip')
  const ipCandidate = forwardedFor?.split(',')[0]?.trim() || realIp || cfConnectingIp || 'unknown'
  return createHash('sha256')
    .update(`${ipCandidate.toLowerCase()}:${email.trim().toLowerCase()}`)
    .digest('hex')
}

function mapReservationError(error: unknown): string {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const errorMessageLower = errorMessage.toLowerCase()
  const structuredErrorCode = getStructuredErrorCode(error)
  const structuredErrorType = getStructuredErrorType(error)
  const isStripeLike = structuredErrorType.startsWith('stripe') || PAYMENT_ERROR_CODES.has(structuredErrorCode)

  if (
    PAYMENT_ERROR_CODES.has(structuredErrorCode) ||
    isStripeLike ||
    errorMessageLower.includes('stripe') ||
    errorMessageLower.includes('payment_method') ||
    errorMessageLower.includes('checkout') ||
    errorMessageLower.includes('acss')
  ) {
    return 'Payment system error. Please try again in a moment.'
  }
  if (errorMessageLower.includes('vehicle')) {
    return 'Unable to verify vehicle details. Please refresh and try again.'
  }
  if (
    errorMessageLower.includes('database') ||
    errorMessageLower.includes('supabase') ||
    errorMessageLower.includes('permission') ||
    errorMessageLower.includes('relation') ||
    errorMessageLower.includes('column') ||
    errorMessageLower.includes('row-level security')
  ) {
    return 'Database error. Please try again shortly.'
  }
  return 'An unexpected error occurred. Please try again.'
}

type StripeInstance = ReturnType<typeof getStripe>

async function createStripeSessionWithFallback(
  stripe: StripeInstance,
  buildParams: (includeAcss: boolean) => Stripe.Checkout.SessionCreateParams,
  enableAcssDebit: boolean,
  idempotencyKey: string,
  logContext?: Record<string, unknown>,
) {
  try {
    return await stripe.checkout.sessions.create(buildParams(enableAcssDebit), {
      idempotencyKey,
    })
  } catch (sessionError) {
    const stripeErrorCode = getStructuredErrorCode(sessionError)
    const sessionErrorMessage = sessionError instanceof Error ? sessionError.message.toLowerCase() : ''
    const canRetryCardOnly =
      enableAcssDebit &&
      (
        stripeErrorCode === 'payment_method_not_available' ||
        stripeErrorCode === 'payment_method_invalid_parameter' ||
        sessionErrorMessage.includes('acss') ||
        sessionErrorMessage.includes('payment_method_options')
      )
    if (!canRetryCardOnly) throw sessionError

    console.warn('ACSS checkout session failed, retrying with card only', {
      ...logContext,
      errorCode: stripeErrorCode || undefined,
      error: sessionErrorMessage,
    })
    return await stripe.checkout.sessions.create(buildParams(false), {
      idempotencyKey: `${idempotencyKey}:card-only`,
    })
  }
}

function logReservationError(error: unknown, input: ReservationInput) {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error'
  const customerEmailHash = createHash('sha256')
    .update(input.customerEmail.trim().toLowerCase())
    .digest('hex')
    .slice(0, 12)
  const isProd = process.env.NODE_ENV === 'production'
  console.error('Reservation error:', {
    error: errorMessage,
    vehicleId: input.vehicleId,
    stockNumber: input.stockNumber,
    customerEmailHash,
    ...(isProd ? {} : { stack: error instanceof Error ? error.stack : undefined }),
  })
}
export async function createReservation(rawInput: ReservationInput): Promise<ReservationResult> {
  const parsed = reservationInputSchema.safeParse(rawInput)
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join('. ') }
  }
  const input = parsed.data
  const rateLimitScopeHash = await buildRateLimitScope(input.customerEmail)

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

    const reservationId = claim.reservation_id ?? ""

    // Look up vehicle details for notification metadata
    const { data: vehicle } = await adminClient
      .from('vehicles')
      .select('year, make, model')
      .eq('id', input.vehicleId)
      .maybeSingle()
    const vehicleName = vehicle
      ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim()
      : `Vehicle ${input.stockNumber}`

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
        vehicleName,
        vehicleYear: vehicle ? String(vehicle.year ?? '') : '',
        vehicleMake: vehicle ? String(vehicle.make ?? '') : '',
        vehicleModel: vehicle ? String(vehicle.model ?? '') : '',
        depositOnly: 'true',
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

    const session = await createStripeSessionWithFallback(
      stripe, createSessionParams, enableAcssDebit, idempotencyKey,
      { reservationId, stockNumber: input.stockNumber },
    )

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
    logReservationError(error, input)
    await unlockVehicle(input.stockNumber, input.customerEmail)
    return { error: mapReservationError(error) }
  }
}

export async function cancelReservation(
  reservationId: string,
  stockNumber: string,
  email: string
): Promise<{ success?: boolean; error?: string }> {
  const parsed = cancelReservationSchema.safeParse({ reservationId, stockNumber, email })
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join('. ') }
  }
  // Release the vehicle lock
  await unlockVehicle(parsed.data.stockNumber, parsed.data.email)
  return { success: true }
}

export async function getReservationStatus(
  sessionId: string
): Promise<{ reservation?: Record<string, unknown>; error?: string }> {
  const parsed = reservationStatusSchema.safeParse({ sessionId })
  if (!parsed.success) {
    return { error: parsed.error.issues.map(i => i.message).join('. ') }
  }
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
