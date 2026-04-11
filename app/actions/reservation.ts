'use server'

import { createHash } from 'node:crypto'
import { lockVehicle, unlockVehicle, getVehicleLock, rateLimit } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { createClient } from '@/lib/supabase/server'
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
  const ip = headersList.get('x-forwarded-for') || 'unknown'
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Rate limit: 5 reservations per hour per IP
  const rateLimitResult = await rateLimit(`reservation:${ip}`, 5, 3600)
  if (!rateLimitResult.success) {
    return { 
      error: 'Too many reservation attempts. Please try again later.',
      remaining: rateLimitResult.remaining 
    }
  }

  // Check if vehicle is already locked/reserved
  const existingLock = await getVehicleLock(input.stockNumber)
  if (existingLock && existingLock !== input.customerEmail) {
    return { error: 'This vehicle is currently being reserved by another customer.' }
  }

  // Lock the vehicle in Redis (15 minute reservation window)
  const locked = await lockVehicle(input.stockNumber, input.customerEmail)
  if (!locked) {
    return { error: 'Unable to reserve this vehicle. Please try again.' }
  }

  // Get Stripe instance
  const stripe = getStripe()

  try {
    const { data: vehicle, error: vehicleError } = await supabase
      .from('vehicles')
      .select('id, stock_number, year, make, model, status')
      .eq('id', input.vehicleId)
      .maybeSingle()

    if (vehicleError) {
      throw new Error(vehicleError.message)
    }

    if (!vehicle) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Vehicle not found.' }
    }

    if (vehicle.stock_number !== input.stockNumber) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Vehicle details do not match.' }
    }

    if (!['available', 'reserved'].includes(String(vehicle.status || ''))) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'This vehicle is not available for reservation.' }
    }

    // Enforce exclusivity at the reservation-record level, not just Redis lock TTL.
    const { data: conflictingReservation } = await supabase
      .from('reservations')
      .select('id, customer_email, status, expires_at')
      .eq('vehicle_id', input.vehicleId)
      .neq('customer_email', input.customerEmail)
      .in('status', ['pending', 'confirmed'])
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (conflictingReservation) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'This vehicle already has an active reservation.' }
    }

    // Get product for $250 reservation
    const product = getProductById('vehicle-reservation')
    if (!product) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Reservation product not found.' }
    }

    const reservationNow = new Date().toISOString()
    const reservationExpiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
    const { data: existingReservation } = await supabase
      .from('reservations')
      .select('id, stripe_checkout_session_id, status, expires_at')
      .eq('vehicle_id', input.vehicleId)
      .eq('customer_email', input.customerEmail)
      .in('status', ['pending', 'confirmed'])
      .gt('expires_at', reservationNow)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    let reservationId = existingReservation?.id

    if (!reservationId) {
      const { data: reservation, error: insertError } = await supabase
        .from('reservations')
        .insert({
          vehicle_id: input.vehicleId,
          user_id: user?.id || null,
          customer_email: input.customerEmail,
          customer_phone: input.customerPhone || null,
          customer_name: input.customerName || null,
          deposit_amount: product.priceInCents,
          deposit_status: 'pending',
          status: 'pending',
          expires_at: reservationExpiresAt,
          notes: `Reservation created from web checkout for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
        })
        .select('id')
        .single()

      if (insertError || !reservation) {
        await unlockVehicle(input.stockNumber, input.customerEmail)
        return { error: insertError?.message || 'Failed to create reservation record.' }
      }

      reservationId = reservation.id
    }

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ev.planetmotors.ca'
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
      const sessionErrorMessage = sessionError instanceof Error ? sessionError.message.toLowerCase() : ''
      const canRetryCardOnly = enableAcssDebit && (sessionErrorMessage.includes('acss') || sessionErrorMessage.includes('payment_method_options'))

      if (!canRetryCardOnly) {
        throw sessionError
      }

      console.warn('ACSS checkout session failed, retrying with card only', {
        reservationId,
        stockNumber: input.stockNumber,
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

    console.error('Reservation error:', {
      error: errorMessage,
      vehicleId: input.vehicleId,
      stockNumber: input.stockNumber,
      email: input.customerEmail,
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
