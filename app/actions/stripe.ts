'use server'

import { getStripe } from '@/lib/stripe'

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
}

export async function startVehicleCheckout(data: VehicleCheckoutData) {
  const stripe = getStripe()
  const lineItems: any[] = []
  
  lineItems.push({
    price_data: {
      currency: 'cad',
      product_data: {
        name: data.depositOnly ? `Deposit - ${data.vehicleName}` : data.vehicleName,
        description: data.depositOnly ? 'Refundable vehicle deposit' : 'Vehicle purchase',
      },
      unit_amount: data.vehiclePriceCents,
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
    metadata: { vehicleId: data.vehicleId, depositOnly: String(data.depositOnly || false) },
    ...(data.customerEmail && { customer_email: data.customerEmail }),
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
  })

  return session.client_secret
}
