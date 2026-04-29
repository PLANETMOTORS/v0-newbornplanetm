'use server'

import { createHash } from 'node:crypto'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { isValidLicensePath } from '@/lib/license-path'
import { rateLimit } from '@/lib/redis'

const PROTECTION_PLANS: Record<string, { name: string; priceInCents: number }> = {
  'essential': { name: 'PlanetCare Essential', priceInCents: 195000 },
  'smart': { name: 'PlanetCare Smart', priceInCents: 300000 },
  'certified': { name: 'PlanetCare Certified™', priceInCents: 300000 },
  'lifeproof': { name: 'PlanetCare Life Proof', priceInCents: 485000 },
  'certified-plus': { name: 'PlanetCare Certified Plus™', priceInCents: 485000 },
}

interface VehicleCheckoutData {
  vehicleId: string
  vehicleName: string
  protectionPlanId?: string
  depositOnly?: boolean
  customerEmail?: string
  customerName?: string
  customerPhone?: string
  licenseStoragePath?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
}

const MAX_VEHICLE_PRICE_CENTS = 50_000_000 // $500,000 CAD

function validateCentsAmount(value: unknown): number {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error('Invalid vehicle price')
  }

  if (numericValue > MAX_VEHICLE_PRICE_CENTS) {
    throw new Error('Vehicle price exceeds maximum allowed amount')
  }

  // Prices in `vehicles` are persisted in cents; do not apply dollar->cent conversion.
  return Math.round(numericValue)
}

// S3776 helpers for startVehicleCheckout/startCheckoutSession.

type LockedVehicle = { id: string; year: number; make: string; model: string; price: number; status: string }
type LockResultEnvelope =
  | { success: boolean; error?: string; id?: string; year?: number; make?: string; model?: string; price?: number; status?: string }
  | boolean
  | null

async function authenticateAndRateLimit(scope: 'vehicle' | 'generic') {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    throw new Error('Authentication required to start checkout')
  }
  const rl = await rateLimit(`checkout:${scope}:${user.id}`, 10, 15 * 60)
  if (!rl.success) {
    throw new Error('Too many checkout attempts. Please wait a few minutes before trying again.')
  }
  return { supabase, user }
}

function getAdminClientOrThrow(): ReturnType<typeof createAdminClient> {
  try {
    return createAdminClient()
  } catch (e) {
    console.error('Admin client not configured — SUPABASE_SERVICE_ROLE_KEY is required for checkout RPC:', e)
    throw new Error('Service configuration error. Please try again later.', { cause: e })
  }
}

function fromLockEnvelope(lock: LockResultEnvelope): LockedVehicle | null {
  if (typeof lock !== 'object' || lock === null) return null
  if (!lock.success) {
    throw new Error(lock.error || 'Vehicle is not available for checkout')
  }
  return {
    id: lock.id as string,
    year: lock.year as number,
    make: lock.make as string,
    model: lock.model as string,
    price: lock.price as number,
    status: lock.status as string,
  }
}

async function fromScalarLockFallback(
  adminClient: ReturnType<typeof createAdminClient>,
  vehicleId: string,
): Promise<LockedVehicle> {
  const { data: vehicleRow, error: vehicleError } = await adminClient
    .from('vehicles')
    .select('id, year, make, model, price, status')
    .eq('id', vehicleId)
    .single()
  if (vehicleError || !vehicleRow) {
    throw new Error('Failed to fetch vehicle details after lock')
  }
  if (
    vehicleRow.id == null ||
    vehicleRow.year == null ||
    vehicleRow.make == null ||
    vehicleRow.model == null ||
    vehicleRow.price == null
  ) {
    throw new Error('Vehicle data incomplete after lock')
  }
  return {
    id: vehicleRow.id as string,
    year: vehicleRow.year as number,
    make: vehicleRow.make as string,
    model: vehicleRow.model as string,
    price: vehicleRow.price as number,
    status: vehicleRow.status as string,
  }
}

async function lockAndResolveVehicle(
  adminClient: ReturnType<typeof createAdminClient>,
  vehicleId: string,
): Promise<LockedVehicle> {
  const { data: lockResult, error: lockError } = await adminClient
    .rpc('lock_vehicle_for_checkout', {
      p_vehicle_id: vehicleId,
      p_allowed_statuses: ['available', 'reserved'],
    })
  if (lockError) {
    throw new Error(`Failed to verify vehicle availability: ${lockError.message}`)
  }
  const lock = lockResult as LockResultEnvelope
  const fromObj = fromLockEnvelope(lock)
  if (fromObj) return fromObj
  if (lock === true) return fromScalarLockFallback(adminClient, vehicleId)
  throw new Error('Vehicle is not available for checkout')
}

async function createReservationOrNull(
  adminClient: ReturnType<typeof createAdminClient>,
  data: VehicleCheckoutData,
): Promise<string | undefined> {
  if (!data.depositOnly) return undefined
  const { data: reservation, error: reservationError } = await adminClient
    .from('reservations')
    .insert({
      vehicle_id: data.vehicleId,
      customer_email: data.customerEmail || null,
      customer_name: data.customerName || null,
      customer_phone: data.customerPhone || null,
      deposit_amount: 25000,
      deposit_status: 'pending',
      status: 'pending',
      expires_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      notes: 'Reservation created from web checkout',
    })
    .select('id')
    .single()
  if (reservationError || !reservation) {
    throw new Error(`Failed to create reservation: ${reservationError?.message || 'unknown error'}`)
  }
  return reservation.id
}

// Checkout flow stays co-located: idempotency-key derivation, Stripe
// payment-method matrix, ACSS+card line-item assembly, vehicle metadata, and
// protection-plan upsell are tightly coupled. Splitting obscures the audit
// trail required for OMVIC compliance. Refactor tracked as follow-up.
export async function startVehicleCheckout(data: VehicleCheckoutData) {
  if (!data.vehicleId) {
    throw new Error('Vehicle ID is required for vehicle checkout. Use startCheckoutSession for generic deposits.')
  }

  // SEC-001 + SEC-002: Auth gate + rate limit
  const { user } = await authenticateAndRateLimit('vehicle')

  const stripe = getStripe()
  const enableAcssDebit = process.env.STRIPE_ENABLE_ACSS_DEBIT === 'true'
  const paymentMethodTypes: Array<'card' | 'acss_debit'> = enableAcssDebit
    ? ['card', 'acss_debit']
    : ['card']

  // Atomic lock via SELECT FOR UPDATE RPC, then resolve to vehicle data.
  const adminClient = getAdminClientOrThrow()
  const vehicle = await lockAndResolveVehicle(adminClient, data.vehicleId)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  const serverVehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim() || data.vehicleName
  const vehicleAmount = data.depositOnly ? 25000 : validateCentsAmount(vehicle.price)
  // Create a reservation row so the webhook can find and update it after payment.
  const reservationId = await createReservationOrNull(adminClient, data)

  // Include reservationId so each new reservation attempt gets its own Stripe
  // session while retries of the same reservation remain idempotent.
  const idempotencyKey = createHash('sha256')
    .update([
      data.vehicleId,
      data.protectionPlanId || 'none',
      data.depositOnly ? 'deposit' : 'full',
      data.customerEmail || 'guest',
      reservationId || 'no-reservation',
    ].join(':'))
    .digest('hex')

  lineItems.push({
    price_data: {
      currency: 'cad',
      product_data: {
        name: data.depositOnly ? `Deposit - ${serverVehicleName}` : serverVehicleName,
        description: data.depositOnly ? 'Refundable vehicle deposit' : 'Vehicle purchase',
      },
      unit_amount: vehicleAmount,
    },
    quantity: 1,
  })
  
  if (data.protectionPlanId && PROTECTION_PLANS[data.protectionPlanId] && !data.depositOnly) {
    const plan = PROTECTION_PLANS[data.protectionPlanId]
    lineItems.push({
      price_data: {
        currency: 'cad',
        product_data: { name: plan.name, description: 'Vehicle protection' },
        unit_amount: plan.priceInCents,
      },
      quantity: 1,
    })
  }

  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: lineItems,
    mode: 'payment',
    payment_method_types: paymentMethodTypes,
    ...(enableAcssDebit
      ? {
          payment_method_options: {
            acss_debit: {
              currency: 'cad',
              mandate_options: {
                payment_schedule: 'sporadic',
                transaction_type: 'personal',
              },
            },
          },
        }
      : {}),
    metadata: {
      vehicleId: data.vehicleId,
      vehicleName: serverVehicleName,
      vehicleYear: String(vehicle.year ?? ''),
      vehicleMake: String(vehicle.make ?? ''),
      vehicleModel: String(vehicle.model ?? ''),
      depositOnly: String(data.depositOnly || false),
      type: data.depositOnly ? 'vehicle-reservation' : 'vehicle-purchase',
      protectionPlanId: data.protectionPlanId || '',
      amountSource: 'server',
      userId: user.id,
      ...(reservationId && { reservationId }),
      ...(data.licenseStoragePath && isValidLicensePath(data.licenseStoragePath, data.vehicleId) && { licenseStoragePath: data.licenseStoragePath }),
      ...(data.utmSource && { utm_source: data.utmSource }),
      ...(data.utmMedium && { utm_medium: data.utmMedium }),
      ...(data.utmCampaign && { utm_campaign: data.utmCampaign }),
      ...(data.utmContent && { utm_content: data.utmContent }),
      ...(data.utmTerm && { utm_term: data.utmTerm }),
    },
    payment_intent_data: {
      metadata: {
        vehicleId: data.vehicleId,
        depositOnly: String(data.depositOnly || false),
        protectionPlanId: data.protectionPlanId || '',
        amountSource: 'server',
        type: data.depositOnly ? 'vehicle-reservation' : 'vehicle-purchase',
        userId: user.id,
        ...(reservationId && { reservationId }),
        ...(data.utmSource && { utm_source: data.utmSource }),
        ...(data.utmMedium && { utm_medium: data.utmMedium }),
        ...(data.utmCampaign && { utm_campaign: data.utmCampaign }),
        ...(data.utmContent && { utm_content: data.utmContent }),
        ...(data.utmTerm && { utm_term: data.utmTerm }),
      },
    },
    ...(data.customerEmail && { customer_email: data.customerEmail }),
  }, {
    idempotencyKey,
  })

  return session.client_secret
}

export async function startCheckoutSession(productId: string) {
  await authenticateAndRateLimit('generic')

  const PRODUCTS = [
    { id: 'deposit', name: 'Vehicle Deposit', description: 'Refundable deposit', priceInCents: 25000 },
  ]
  const product = PRODUCTS.find((p) => p.id === productId)
  if (!product) throw new Error(`Product "${productId}" not found`)

  const stripe = getStripe()
  const enableAcssDebit = process.env.STRIPE_ENABLE_ACSS_DEBIT === 'true'
  const paymentMethodTypes: Array<'card' | 'acss_debit'> = enableAcssDebit
    ? ['card', 'acss_debit']
    : ['card']
  const session = await stripe.checkout.sessions.create({
    ui_mode: 'embedded',
    redirect_on_completion: 'never',
    line_items: [{
      price_data: {
        currency: 'cad',
        product_data: { name: product.name, description: product.description },
        unit_amount: product.priceInCents,
      },
      quantity: 1,
    }],
    mode: 'payment',
    payment_intent_data: {
      metadata: {
        productId,
        type: productId === 'deposit' ? 'vehicle-reservation' : 'product-purchase',
      },
    },
    payment_method_types: paymentMethodTypes,
    ...(enableAcssDebit
      ? {
          payment_method_options: {
            acss_debit: {
              currency: 'cad',
              mandate_options: {
                payment_schedule: 'sporadic',
                transaction_type: 'personal',
              },
            },
          },
        }
      : {}),
  })

  return session.client_secret
}
