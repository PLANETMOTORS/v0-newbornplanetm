'use server'

import { createClient } from '@/lib/supabase/server'
import { lockVehicle, unlockVehicle, getVehicleLock, rateLimit } from '@/lib/redis'
import { stripe } from '@/lib/stripe'
import { getProductById } from '@/lib/products'
import { headers } from 'next/headers'

export interface ReservationInput {
  vehicleId: string
  stockNumber: string
  customerEmail: string
  customerPhone?: string
  customerName?: string
}

export async function createReservation(input: ReservationInput) {
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
  if (existingLock) {
    return { error: 'This vehicle is currently being reserved by another customer.' }
  }

  // Lock the vehicle in Redis (15 minute reservation window)
  const locked = await lockVehicle(input.stockNumber, input.customerEmail)
  if (!locked) {
    return { error: 'Unable to reserve this vehicle. Please try again.' }
  }

  try {
    const supabase = await createClient()
    
    // Get product for $250 reservation
    const product = getProductById('vehicle-reservation')
    if (!product) {
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Reservation product not found.' }
    }

    // Create Stripe Checkout session
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
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/reservation/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/vehicles/${input.stockNumber}?reservation=cancelled`,
      expires_at: Math.floor(Date.now() / 1000) + 900, // 15 minutes
    })

    // Create pending reservation in database
    const { data: reservation, error: dbError } = await supabase
      .from('reservations')
      .insert({
        vehicle_id: input.vehicleId,
        customer_email: input.customerEmail,
        customer_phone: input.customerPhone,
        customer_name: input.customerName,
        stripe_checkout_session_id: session.id,
        deposit_amount: product.priceInCents,
        deposit_status: 'pending',
        status: 'pending',
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      await unlockVehicle(input.stockNumber, input.customerEmail)
      return { error: 'Failed to create reservation. Please try again.' }
    }

    return { 
      success: true,
      checkoutUrl: session.url,
      reservationId: reservation.id,
      sessionId: session.id,
    }
  } catch (error) {
    console.error('Reservation error:', error)
    await unlockVehicle(input.stockNumber, input.customerEmail)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}

export async function cancelReservation(reservationId: string, stockNumber: string, email: string) {
  const supabase = await createClient()
  
  // Update reservation status
  const { error } = await supabase
    .from('reservations')
    .update({ 
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', reservationId)
    .eq('customer_email', email)

  if (error) {
    return { error: 'Failed to cancel reservation.' }
  }

  // Release the vehicle lock
  await unlockVehicle(stockNumber, email)

  return { success: true }
}

export async function getReservationStatus(sessionId: string) {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('reservations')
    .select(`
      *,
      vehicles (
        stock_number,
        year,
        make,
        model,
        trim,
        price,
        primary_image_url
      )
    `)
    .eq('stripe_checkout_session_id', sessionId)
    .single()

  if (error) {
    return { error: 'Reservation not found.' }
  }

  return { reservation: data }
}
