'use server'

import { lockVehicle, unlockVehicle, getVehicleLock, rateLimit } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
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
  reservationId?: string
  sessionId?: string
  remaining?: number
}

export async function createReservation(input: ReservationInput): Promise<ReservationResult> {
  const headersList = await headers()
  const ip = headersList.get('x-forwarded-for') || 'unknown'
  
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
  const stripe = await getStripe()
  if (!stripe) {
    // If Stripe is not configured, return success with mock data for development
    return {
      success: true,
      checkoutUrl: null,
      reservationId: `mock-${Date.now()}`,
      sessionId: `mock-session-${Date.now()}`,
    }
  }

  try {
    // Get product for $250 reservation
    const product = getProductById('vehicle-reservation')
    if (!product) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Reservation product not found.' }
    }

    // Create Stripe Checkout session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://planetmotors.ca'
    
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
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
        vehicleId: input.vehicleId,
        stockNumber: input.stockNumber,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone || '',
        customerName: input.customerName || '',
        type: 'vehicle-reservation',
      },
      success_url: `${baseUrl}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/vehicles/${input.stockNumber}?reservation=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    })

    return { 
      success: true,
      checkoutUrl: session.url,
      reservationId: session.id,
      sessionId: session.id,
    }
  } catch (error) {
    console.error('Reservation error:', error)
    await unlockVehicle(input.stockNumber, input.customerEmail)
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
  const stripe = await getStripe()
  
  if (!stripe) {
    return { error: 'Stripe is not configured.' }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    
    return { 
      reservation: {
        id: session.id,
        status: session.payment_status,
        customerEmail: session.customer_email,
        metadata: session.metadata,
        amountTotal: session.amount_total,
      }
    }
  } catch {
    return { error: 'Reservation not found.' }
  }
}
