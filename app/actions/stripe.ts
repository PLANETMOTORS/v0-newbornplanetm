'use server'

import { createHash } from 'node:crypto'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

const PROTECTION_PLANS: Record<string, { name: string; priceInCents: number }> = {
  'essential': { name: 'PlanetCare Essential', priceInCents: 195000 },
  'smart': { name: 'PlanetCare Smart', priceInCents: 300000 },
  'lifeproof': { name: 'PlanetCare Life Proof', priceInCents: 485000 },
}

interface VehicleCheckoutData {
  vehicleId: string
  vehicleName: string
  vehiclePriceCents: number
  protectionPlanId?: string
  depositOnly?: boolean
  customerEmail?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  utmContent?: string
  utmTerm?: string
}

function validateCentsAmount(value: unknown): number {
  const numericValue = typeof value === 'string' ? Number.parseFloat(value) : Number(value)

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    throw new Error('Invalid vehicle price')
  }

  // Prices in `vehicles` are persisted in cents; do not apply dollar->cent conversion.
  return Math.round(numericValue)
}

export async function startVehicleCheckout(data: VehicleCheckoutData) {
  const stripe = getStripe()
  const enableAcssDebit = process.env.STRIPE_ENABLE_ACSS_DEBIT === 'true'
  const paymentMethodTypes: Array<'card' | 'acss_debit'> = enableAcssDebit
    ? ['card', 'acss_debit']
    : ['card']
  // Use atomic SELECT FOR UPDATE via RPC to prevent concurrent checkouts.
  // Without this, 50 concurrent users all read status='available' and all get Stripe sessions.
  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch (e) {
    console.error('Admin client not configured — SUPABASE_SERVICE_ROLE_KEY is required for checkout RPC:', e)
    throw new Error('Service configuration error. Please try again later.', { cause: e })
  }

  const { data: lockResult, error: lockError } = await adminClient
    .rpc('lock_vehicle_for_checkout', { p_vehicle_id: data.vehicleId })

  if (lockError) {
    throw new Error(`Failed to verify vehicle availability: ${lockError.message}`)
  }

  const lock = lockResult as { success: boolean; error?: string; id?: string; year?: number; make?: string; model?: string; price?: number; status?: string }
  if (!lock?.success) {
    throw new Error(lock?.error || 'Vehicle is not available for checkout')
  }

  const vehicle = {
    id: lock.id as string,
    year: lock.year as number,
    make: lock.make as string,
    model: lock.model as string,
    price: lock.price as number,
    status: lock.status as string,
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = []
  const serverVehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}`.trim() || data.vehicleName
  const vehicleAmount = data.depositOnly ? 25000 : validateCentsAmount(vehicle.price)
  const checkoutAttemptWindow = Math.floor(Date.now() / (15 * 60 * 1000))
  const idempotencyKey = createHash('sha256')
    .update([
      data.vehicleId,
      data.protectionPlanId || 'none',
      data.depositOnly ? 'deposit' : 'full',
      data.customerEmail || 'guest',
      String(checkoutAttemptWindow),
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
  
  if (data.protectionPlanId && PROTECTION_PLANS[data.protectionPlanId]) {
    const plan = PROTECTION_PLANS[data.protectionPlanId]
    lineItems.push({
      price_data: {
        currency: 'cad',
        product_data: { name: plan.name, description: 'Vehicle protection' },
        unit_amount: data.depositOnly ? 25000 : plan.priceInCents,
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
      depositOnly: String(data.depositOnly || false),
      protectionPlanId: data.protectionPlanId || '',
      amountSource: 'server',
      type: data.depositOnly ? 'vehicle-reservation' : 'vehicle-purchase',
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
