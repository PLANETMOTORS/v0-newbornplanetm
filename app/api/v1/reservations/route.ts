import { NextRequest, NextResponse } from 'next/server'
import { createReservation } from '@/app/actions/reservation'
import { trackInitiateCheckout } from '@/lib/meta-capi-helpers'
import { reservationToAdfProspect } from '@/lib/adf/adapters'
import { forwardLeadToAutoRaptor } from '@/lib/adf/forwarder'

const RESERVATION_DEPOSIT_CAD = 250

/**
 * POST /api/v1/reservations
 *
 * Thin HTTP wrapper around the createReservation server action so that
 * load-testing tools (k6, Artillery) can exercise the reservation flow
 * without needing a browser / React Server-Action transport.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vehicleId, stockNumber, customerEmail, customerPhone, customerName } = body

    if (!vehicleId || !stockNumber || !customerEmail) {
      return NextResponse.json(
        { success: false, error: 'vehicleId, stockNumber, and customerEmail are required' },
        { status: 400 }
      )
    }

    const result = await createReservation({
      vehicleId,
      stockNumber,
      customerEmail,
      customerPhone,
      customerName,
    })

    if (result.error) {
      const isConflict =
        result.error.includes('already has an active reservation') ||
        result.error.includes('currently being reserved') ||
        result.error.includes('not available') ||
        result.error.includes('not available for reservation')
      return NextResponse.json(
        { success: false, error: result.error },
        { status: isConflict ? 409 : 422 }
      )
    }

    // Fire Meta CAPI InitiateCheckout event (non-blocking)
    trackInitiateCheckout(request, {
      email: customerEmail,
      phone: customerPhone,
      firstName: customerName,
      contentName: `Vehicle ${stockNumber}`,
      contentIds: [vehicleId],
      value: RESERVATION_DEPOSIT_CAD,
    })

    // Forward to AutoRaptor as ADF/XML email (non-blocking)
    void forwardLeadToAutoRaptor(
      reservationToAdfProspect({
        reservationId: result.reservationId ?? `res-${Date.now().toString(36)}`,
        customerName,
        customerEmail,
        customerPhone,
        stockNumber,
        depositAmount: RESERVATION_DEPOSIT_CAD,
      }),
    ).catch((cause) => console.error('[reservations] ADF forward failed:', cause))

    return NextResponse.json({
      success: true,
      reservationId: result.reservationId,
      sessionId: result.sessionId,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
