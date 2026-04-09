import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const PROTECTION_PLAN_PRICES_CENTS: Record<string, number> = {
  essential: 195000,
  smart: 300000,
  lifeproof: 485000,
}

function toCents(value: unknown): number {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }
  return numericValue >= 1_000_000 ? Math.round(numericValue) : Math.round(numericValue * 100)
}

function fromCents(value: number | null | undefined): number {
  return Math.round((Number(value || 0) / 100) * 100) / 100
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 36 ** 3).toString(36).toUpperCase().padStart(3, '0')
  return `PM-${ts}-${rand}`
}

// POST /api/v1/orders - Create order
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  }

  const body = await request.json()

  const {
    customerId,
    vehicleId,
    financingOfferId,
    paymentMethod,
    tradeInOfferId,
    deliveryType,
    deliveryAddressId,
    hubId,
    preferredDate,
    preferredTimeSlot,
    protectionPlanId,
    downPayment,
  } = body

  if (!vehicleId || !paymentMethod) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'vehicleId and paymentMethod are required',
        },
      },
      { status: 400 }
    )
  }

  const effectiveCustomerId = customerId || user.id
  if (effectiveCustomerId !== user.id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'customerId must match authenticated user',
        },
      },
      { status: 403 }
    )
  }

  if (!['financing', 'cash', 'bank_draft'].includes(String(paymentMethod))) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INVALID_PAYMENT_METHOD',
          message: 'paymentMethod must be one of financing, cash, bank_draft',
        },
      },
      { status: 400 }
    )
  }

  const normalizedDeliveryType = deliveryType === 'delivery' ? 'delivery' : 'pickup'

  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, year, make, model, trim, price, status')
    .eq('id', vehicleId)
    .maybeSingle()

  if (vehicleError) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: vehicleError.message } }, { status: 500 })
  }

  if (!vehicle) {
    return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } }, { status: 404 })
  }

  if (!['available', 'reserved'].includes(String(vehicle.status || ''))) {
    return NextResponse.json(
      { success: false, error: { code: 'VEHICLE_UNAVAILABLE', message: 'Vehicle is not available for ordering' } },
      { status: 409 }
    )
  }

  const vehiclePriceCents = toCents(vehicle.price)
  const documentationFeeCents = 49900
  const omvicFeeCents = 1000
  const deliveryFeeCents = normalizedDeliveryType === 'delivery' ? 0 : 0
  const protectionPlanFeeCents = protectionPlanId ? (PROTECTION_PLAN_PRICES_CENTS[String(protectionPlanId)] || 0) : 0
  const taxRatePercent = 13

  const subtotalCents = vehiclePriceCents + documentationFeeCents + omvicFeeCents + deliveryFeeCents + protectionPlanFeeCents
  const taxAmountCents = Math.round(subtotalCents * (taxRatePercent / 100))
  const totalBeforeCreditsCents = subtotalCents + taxAmountCents

  const tradeInCreditCents = 0
  const downPaymentCents = toCents(downPayment)
  const totalCreditsCents = tradeInCreditCents + downPaymentCents
  const totalPriceCents = Math.max(0, totalBeforeCreditsCents - totalCreditsCents)
  const amountFinancedCents = paymentMethod === 'financing' ? totalPriceCents : 0

  const orderNumber = generateOrderNumber()
  const nowIso = new Date().toISOString()
  const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const timeline = [
    { step: 'Order Created', status: 'complete', date: nowIso },
    { step: 'Documents Pending', status: 'current', date: null },
    { step: 'Payment Processing', status: 'pending', date: null },
    { step: 'Vehicle Preparation', status: 'pending', date: null },
    { step: 'Delivery Scheduled', status: 'pending', date: null },
    { step: 'Delivered', status: 'pending', date: null },
  ]
  const documentsRequired = [
    { type: 'drivers_license', name: "Driver's License", status: 'pending' },
    { type: 'proof_of_insurance', name: 'Proof of Insurance', status: 'pending' },
    { type: 'financing_agreement', name: 'Financing Agreement', status: paymentMethod === 'financing' ? 'pending' : 'not_required' },
    { type: 'purchase_agreement', name: 'Purchase Agreement', status: 'pending' },
  ]
  const returnPolicy = {
    eligible: true,
    deadline: new Date(Date.now() + 17 * 24 * 60 * 60 * 1000).toISOString(),
    maxMileage: 750,
    conditions: [
      'Vehicle must be in same condition as delivered',
      'Maximum 750 km driven',
      'All original documents present',
      'No modifications made',
    ],
  }

  const { data: insertedOrder, error: insertError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: effectiveCustomerId,
      vehicle_id: vehicle.id,
      status: 'created',
      payment_method: paymentMethod,
      financing_offer_id: financingOfferId || null,
      trade_in_offer_id: tradeInOfferId || null,
      delivery_type: normalizedDeliveryType,
      delivery_address_id: deliveryAddressId || null,
      hub_id: normalizedDeliveryType === 'pickup' ? (hubId || null) : null,
      preferred_date: preferredDate || null,
      preferred_time_slot: preferredTimeSlot || null,
      protection_plan_id: protectionPlanId || null,
      vehicle_price_cents: vehiclePriceCents,
      documentation_fee_cents: documentationFeeCents,
      omvic_fee_cents: omvicFeeCents,
      delivery_fee_cents: deliveryFeeCents,
      protection_plan_fee_cents: protectionPlanFeeCents,
      tax_rate_percent: taxRatePercent,
      tax_amount_cents: taxAmountCents,
      total_before_credits_cents: totalBeforeCreditsCents,
      trade_in_credit_cents: tradeInCreditCents,
      down_payment_cents: downPaymentCents,
      total_credits_cents: totalCreditsCents,
      total_price_cents: totalPriceCents,
      amount_financed_cents: amountFinancedCents,
      timeline,
      documents_required: documentsRequired,
      return_policy: returnPolicy,
    })
    .select('id, order_number, status, created_at')
    .single()

  if (insertError || !insertedOrder) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'DB_ERROR',
          message: insertError?.message || 'Failed to create order',
        },
      },
      { status: 500 }
    )
  }

  return NextResponse.json({
    success: true,
    data: {
      order: {
        id: insertedOrder.id,
        orderNumber: insertedOrder.order_number,
        customerId: effectiveCustomerId,
        vehicleId: vehicle.id,
        status: insertedOrder.status,
        vehicle: {
          id: vehicle.id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          price: fromCents(vehiclePriceCents),
        },
        pricing: {
          vehiclePrice: fromCents(vehiclePriceCents),
          documentationFee: fromCents(documentationFeeCents),
          omvicFee: fromCents(omvicFeeCents),
          deliveryFee: fromCents(deliveryFeeCents),
          protectionPlanPrice: fromCents(protectionPlanFeeCents),
          subtotal: fromCents(subtotalCents),
          taxRate: taxRatePercent / 100,
          taxAmount: fromCents(taxAmountCents),
          totalBeforeCredits: fromCents(totalBeforeCreditsCents),
          tradeInCredit: fromCents(tradeInCreditCents),
          downPayment: fromCents(downPaymentCents),
          totalCredits: fromCents(totalCreditsCents),
          totalPrice: fromCents(totalPriceCents),
        },
        financing: paymentMethod === 'financing'
          ? {
              offerId: financingOfferId || null,
              amountFinanced: fromCents(amountFinancedCents),
            }
          : null,
        tradeIn: tradeInOfferId
          ? {
              offerId: tradeInOfferId,
              value: fromCents(tradeInCreditCents),
            }
          : null,
        delivery: {
          type: normalizedDeliveryType,
          addressId: deliveryAddressId || null,
          hubId: normalizedDeliveryType === 'pickup' ? (hubId || null) : null,
          preferredDate: preferredDate || null,
          preferredTimeSlot: preferredTimeSlot || null,
          estimatedDate,
        },
        protectionPlan: protectionPlanId
          ? {
              id: protectionPlanId,
              price: fromCents(protectionPlanFeeCents),
            }
          : null,
        timeline,
        documentsRequired,
        returnPolicy,
        createdAt: insertedOrder.created_at,
        updatedAt: insertedOrder.created_at,
      },
      message: `Order ${insertedOrder.order_number} created successfully`,
      nextSteps: [
        'Upload required documents',
        'Complete e-signatures',
        'Confirm delivery date',
        'Make down payment',
      ],
    },
  })
}

// GET /api/v1/orders - List customer orders
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId') || user.id
  const status = searchParams.get('status')
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1)
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '20', 10) || 20))
  const start = (page - 1) * limit
  const end = start + limit - 1

  if (customerId !== user.id) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You can only access your own orders',
        },
      },
      { status: 403 }
    )
  }

  let query = supabase
    .from('orders')
    .select('id, order_number, customer_id, status, total_price_cents, created_at, vehicles(year, make, model, trim)', { count: 'exact' })
    .eq('customer_id', customerId)
    .order('created_at', { ascending: false })
    .range(start, end)

  if (status) {
    query = query.eq('status', status)
  }

  const { data: orders, error, count } = await query

  if (error) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: error.message } }, { status: 500 })
  }

  const mappedOrders = (orders || []).map((order) => {
    const vehicle = Array.isArray(order.vehicles) ? order.vehicles[0] : order.vehicles
    return {
      id: order.id,
      orderNumber: order.order_number,
      customerId: order.customer_id,
      status: order.status,
      vehicle: vehicle
        ? {
            year: vehicle.year,
            make: vehicle.make,
            model: vehicle.model,
            trim: vehicle.trim,
          }
        : null,
      totalPrice: fromCents(order.total_price_cents),
      createdAt: order.created_at,
    }
  })

  return NextResponse.json({
    success: true,
    data: {
      orders: mappedOrders,
      pagination: {
        page,
        limit,
        total: count || 0,
      },
    },
  })
}
