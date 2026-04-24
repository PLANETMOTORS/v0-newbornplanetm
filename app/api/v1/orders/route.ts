import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { PROVINCE_TAX_RATES } from '@/lib/tax/canada'

const PROTECTION_PLAN_PRICES_CENTS: Record<string, number> = {
  essential: 195000,
  smart: 300000,
  lifeproof: 485000,
}

function parseDollarsToCents(value: unknown): number {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }
  return Math.round(numericValue * 100)
}

function validateCentsAmount(value: unknown): number {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return 0
  }
  return Math.round(numericValue)
}

function fromCents(value: number | null | undefined): number {
  return Math.round((Number(value || 0) / 100) * 100) / 100
}

function generateOrderNumber() {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 36 ** 3).toString(36).toUpperCase().padStart(3, '0')
  return `PM-${ts}-${rand}`
}

async function rollbackVehicleStatus(
  adminClient: ReturnType<typeof createAdminClient>,
  vehicleId: string,
  previousStatus: string
): Promise<void> {
  await adminClient
    .from('vehicles')
    .update({ status: previousStatus, updated_at: new Date().toISOString() })
    .eq('id', vehicleId)
    .eq('status', 'pending')
}

function buildClaimErrorResponse(errorMsg: string) {
  const isNotFound = errorMsg.includes('not found')
  return NextResponse.json(
    { success: false, error: { code: isNotFound ? 'NOT_FOUND' : 'VEHICLE_UNAVAILABLE', message: errorMsg } },
    { status: isNotFound ? 404 : 409 }
  )
}

function resolveProvinceAndTax(province: unknown): {
  resolvedProvince: string
  taxInfo: (typeof PROVINCE_TAX_RATES)[string]
  error?: NextResponse
} {
  const hasProvince = typeof province === 'string' && province.trim() !== ''
  if (hasProvince && !(String(province).toUpperCase() in PROVINCE_TAX_RATES)) {
    return {
      resolvedProvince: 'ON',
      taxInfo: PROVINCE_TAX_RATES['ON'],
      error: NextResponse.json({
        success: false,
        error: { code: 'INVALID_PROVINCE', message: `Unknown province code "${province}". Use a valid 2-letter Canadian province code (e.g. ON, BC, AB).` },
      }, { status: 400 }),
    }
  }
  const resolvedProvince = hasProvince ? String(province).toUpperCase() : 'ON'
  return { resolvedProvince, taxInfo: PROVINCE_TAX_RATES[resolvedProvince] }
}

function validateOrderInputs(
  vehicleId: unknown, paymentMethod: unknown, customerId: unknown, userId: string
): { effectiveCustomerId: string; error?: NextResponse } {
  if (!vehicleId || !paymentMethod) {
    return { effectiveCustomerId: '', error: NextResponse.json({ success: false, error: { code: 'MISSING_FIELDS', message: 'vehicleId and paymentMethod are required' } }, { status: 400 }) }
  }
  const effectiveCustomerId = (customerId as string | undefined) || userId
  if (effectiveCustomerId !== userId) {
    return { effectiveCustomerId, error: NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'customerId must match authenticated user' } }, { status: 403 }) }
  }
  if (!['financing', 'cash', 'bank_draft'].includes(String(paymentMethod))) {
    return { effectiveCustomerId, error: NextResponse.json({ success: false, error: { code: 'INVALID_PAYMENT_METHOD', message: 'paymentMethod must be one of financing, cash, bank_draft' } }, { status: 400 }) }
  }
  return { effectiveCustomerId }
}

function buildInsertFailureResponse(insertError: { code?: string; message?: string } | null): NextResponse {
  if (insertError?.code === '23505') {
    return NextResponse.json({ success: false, error: { code: 'VEHICLE_UNAVAILABLE', message: 'An active order already exists for this vehicle' } }, { status: 409 })
  }
  return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: insertError?.message || 'Failed to create order' } }, { status: 500 })
}

function buildFinancingField(paymentMethod: string, financingOfferId: string | undefined, amountFinancedCents: number) {
  return paymentMethod === 'financing'
    ? { offerId: financingOfferId || null, amountFinanced: fromCents(amountFinancedCents) }
    : null
}
function buildTradeInField(tradeInOfferId: string | undefined, tradeInCreditCents: number) {
  return tradeInOfferId ? { offerId: tradeInOfferId, value: fromCents(tradeInCreditCents) } : null
}
function buildDeliveryField(
  type: string, addressId: string | undefined, hubId: string | undefined,
  preferredDate: string | undefined, preferredTimeSlot: string | undefined, estimatedDate: string
) {
  return {
    type, addressId: addressId || null,
    hubId: type === 'pickup' ? (hubId || null) : null,
    preferredDate: preferredDate || null,
    preferredTimeSlot: preferredTimeSlot || null,
    estimatedDate,
  }
}
function buildProtectionPlanField(protectionPlanId: string | undefined, feeCents: number) {
  return protectionPlanId ? { id: protectionPlanId, price: fromCents(feeCents) } : null
}

function buildOrderInsertPayload(opts: {
  orderNumber: string; customerId: string; vehicleId: string; paymentMethod: string
  financingOfferId?: string; tradeInOfferId?: string; normalizedDeliveryType: string
  deliveryAddressId?: string; hubId?: string; preferredDate?: string; preferredTimeSlot?: string
  protectionPlanId?: string; vehiclePriceCents: number; documentationFeeCents: number
  omvicFeeCents: number; deliveryFeeCents: number; protectionPlanFeeCents: number
  taxRate: number; taxAmountCents: number; totalBeforeCreditsCents: number
  tradeInCreditCents: number; downPaymentCents: number; totalCreditsCents: number
  totalPriceCents: number; amountFinancedCents: number
  timeline: unknown; documentsRequired: unknown; returnPolicy: unknown
}) {
  return {
    order_number: opts.orderNumber,
    customer_id: opts.customerId,
    vehicle_id: opts.vehicleId,
    status: 'created',
    payment_method: opts.paymentMethod,
    financing_offer_id: opts.financingOfferId || null,
    trade_in_offer_id: opts.tradeInOfferId || null,
    delivery_type: opts.normalizedDeliveryType,
    delivery_address_id: opts.deliveryAddressId || null,
    hub_id: opts.normalizedDeliveryType === 'pickup' ? (opts.hubId || null) : null,
    preferred_date: opts.preferredDate || null,
    preferred_time_slot: opts.preferredTimeSlot || null,
    protection_plan_id: opts.protectionPlanId || null,
    vehicle_price_cents: opts.vehiclePriceCents,
    documentation_fee_cents: opts.documentationFeeCents,
    omvic_fee_cents: opts.omvicFeeCents,
    delivery_fee_cents: opts.deliveryFeeCents,
    protection_plan_fee_cents: opts.protectionPlanFeeCents,
    tax_rate_percent: opts.taxRate * 100,
    tax_amount_cents: opts.taxAmountCents,
    total_before_credits_cents: opts.totalBeforeCreditsCents,
    trade_in_credit_cents: opts.tradeInCreditCents,
    down_payment_cents: opts.downPaymentCents,
    total_credits_cents: opts.totalCreditsCents,
    total_price_cents: opts.totalPriceCents,
    amount_financed_cents: opts.amountFinancedCents,
    timeline: opts.timeline,
    documents_required: opts.documentsRequired,
    return_policy: opts.returnPolicy,
  }
}

function buildOrderTimeline(nowIso: string) {
  return [
    { step: 'Order Created', status: 'complete', date: nowIso },
    { step: 'Documents Pending', status: 'current', date: null },
    { step: 'Payment Processing', status: 'pending', date: null },
    { step: 'Vehicle Preparation', status: 'pending', date: null },
    { step: 'Delivery Scheduled', status: 'pending', date: null },
    { step: 'Delivered', status: 'pending', date: null },
  ]
}

function buildDocumentsRequired(paymentMethod: string) {
  return [
    { type: 'drivers_license', name: "Driver's License", status: 'pending' },
    { type: 'proof_of_insurance', name: 'Proof of Insurance', status: 'pending' },
    {
      type: 'financing_agreement',
      name: 'Financing Agreement',
      status: paymentMethod === 'financing' ? 'pending' : 'not_required',
    },
    { type: 'purchase_agreement', name: 'Purchase Agreement', status: 'pending' },
  ]
}

function buildReturnPolicy() {
  return {
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
}

// POST /api/v1/orders - Create order
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Admin client is not configured'
    return NextResponse.json(
      { success: false, error: { code: 'CONFIG_ERROR', message } },
      { status: 500 }
    )
  }
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
    province,
  } = body

  // Validate province and resolve tax rate.
  const { resolvedProvince, taxInfo, error: provinceError } = resolveProvinceAndTax(province)
  if (provinceError) return provinceError
  if (typeof province !== 'string' || !province.trim()) {
    console.warn(`[orders] Province not provided for order by user ${user.id}. Defaulting to ON.`)
  }

  // Validate order inputs and resolve effective customer ID
  const { effectiveCustomerId, error: inputError } = validateOrderInputs(vehicleId, paymentMethod, customerId, user.id)
  if (inputError) return inputError

  const normalizedDeliveryType = deliveryType === 'delivery' ? 'delivery' : 'pickup'

  // --- ATOMIC claim via DB-level SELECT FOR UPDATE ---
  // Replaces the old read-then-update pattern that allowed two concurrent requests
  // to both read status='available' before either transitioned to 'pending'.
  const { data: claimResult, error: claimError } = await adminClient
    .rpc('claim_vehicle_for_order', {
      p_vehicle_id: vehicleId,
      p_user_id: user.id,
    })

  if (claimError) {
    return NextResponse.json({ success: false, error: { code: 'DB_ERROR', message: claimError.message } }, { status: 500 })
  }

  const claim = claimResult as {
    success: boolean; error?: string;
    vehicle_id?: string; stock_number?: string;
    year?: number; make?: string; model?: string; trim?: string; price?: number;
    previous_status?: string;
  }

  if (!claim?.success) {
    const errorMsg = claim?.error || 'Vehicle is not available for ordering'
    return buildClaimErrorResponse(errorMsg)
  }

  const vehicle = {
    id: claim.vehicle_id as string,
    year: claim.year as number,
    make: claim.make as string,
    model: claim.model as string,
    trim: claim.trim as string,
    price: claim.price as number,
    status: claim.previous_status as string,
  }
  const currentVehicleStatus = vehicle.status

  const vehiclePriceCents = validateCentsAmount(vehicle.price)

  if (vehiclePriceCents <= 0) {
    // Rollback the provisional vehicle status lock.
    await rollbackVehicleStatus(adminClient, vehicleId, currentVehicleStatus)
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_VEHICLE', message: 'Vehicle does not have a valid price' } },
      { status: 400 }
    )
  }

  const documentationFeeCents = 49900
  const omvicFeeCents = 1000
  const deliveryFeeCents = normalizedDeliveryType === 'delivery' ? 0 : 0
  const protectionPlanFeeCents = protectionPlanId ? (PROTECTION_PLAN_PRICES_CENTS[String(protectionPlanId)] || 0) : 0
  // taxInfo.total is the full decimal rate (e.g. 0.14975 for QC).
  // taxAmountCents and the stored/returned taxRate both derive from it directly
  // so that taxRate * subtotal always equals taxAmount with no rounding disagreement.
  const taxRate = taxInfo.total  // e.g. 0.13, 0.14975

  const subtotalCents = vehiclePriceCents + documentationFeeCents + omvicFeeCents + deliveryFeeCents + protectionPlanFeeCents
  const taxAmountCents = Math.round(subtotalCents * taxRate)
  const totalBeforeCreditsCents = subtotalCents + taxAmountCents

  const tradeInCreditCents = 0
  const downPaymentCents = parseDollarsToCents(downPayment)
  const totalCreditsCents = tradeInCreditCents + downPaymentCents
  const totalPriceCents = Math.max(0, totalBeforeCreditsCents - totalCreditsCents)
  const amountFinancedCents = paymentMethod === 'financing' ? totalPriceCents : 0

  const orderNumber = generateOrderNumber()
  const nowIso = new Date().toISOString()
  const estimatedDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const timeline = buildOrderTimeline(nowIso)
  const documentsRequired = buildDocumentsRequired(paymentMethod)
  const returnPolicy = buildReturnPolicy()

  const { data: insertedOrder, error: insertError } = await supabase
    .from('orders')
    .insert(buildOrderInsertPayload({
      orderNumber, customerId: effectiveCustomerId, vehicleId: vehicle.id,
      paymentMethod, financingOfferId, tradeInOfferId, normalizedDeliveryType,
      deliveryAddressId, hubId, preferredDate, preferredTimeSlot, protectionPlanId,
      vehiclePriceCents, documentationFeeCents, omvicFeeCents, deliveryFeeCents,
      protectionPlanFeeCents, taxRate, taxAmountCents, totalBeforeCreditsCents,
      tradeInCreditCents, downPaymentCents, totalCreditsCents, totalPriceCents,
      amountFinancedCents, timeline, documentsRequired, returnPolicy,
    }))
    .select('id, order_number, status, created_at')
    .single()

  if (insertError || !insertedOrder) {
    // Best-effort rollback of the provisional vehicle status lock.
    await rollbackVehicleStatus(adminClient, vehicleId, currentVehicleStatus)
    return buildInsertFailureResponse(insertError)
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
          id: vehicle.id, year: vehicle.year, make: vehicle.make,
          model: vehicle.model, trim: vehicle.trim, price: fromCents(vehiclePriceCents),
        },
        pricing: {
          vehiclePrice: fromCents(vehiclePriceCents),
          documentationFee: fromCents(documentationFeeCents),
          omvicFee: fromCents(omvicFeeCents),
          deliveryFee: fromCents(deliveryFeeCents),
          protectionPlanPrice: fromCents(protectionPlanFeeCents),
          subtotal: fromCents(subtotalCents),
          province: resolvedProvince,
          taxRate,
          taxBreakdown: { gst: taxInfo.gst, pst: taxInfo.pst, hst: taxInfo.hst },
          taxAmount: fromCents(taxAmountCents),
          totalBeforeCredits: fromCents(totalBeforeCreditsCents),
          tradeInCredit: fromCents(tradeInCreditCents),
          downPayment: fromCents(downPaymentCents),
          totalCredits: fromCents(totalCreditsCents),
          totalPrice: fromCents(totalPriceCents),
        },
        financing: buildFinancingField(paymentMethod, financingOfferId, amountFinancedCents),
        tradeIn: buildTradeInField(tradeInOfferId, tradeInCreditCents),
        delivery: buildDeliveryField(normalizedDeliveryType, deliveryAddressId, hubId, preferredDate, preferredTimeSlot, estimatedDate),
        protectionPlan: buildProtectionPlanField(protectionPlanId, protectionPlanFeeCents),
        timeline,
        documentsRequired,
        returnPolicy,
        createdAt: insertedOrder.created_at,
        updatedAt: insertedOrder.created_at,
      },
      message: `Order ${insertedOrder.order_number} created successfully`,
      nextSteps: ['Upload required documents', 'Complete e-signatures', 'Confirm delivery date', 'Make down payment'],
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