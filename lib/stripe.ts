// Stripe utilities - only initializes when env vars are present

import type Stripe from 'stripe'

let stripeInstance: Stripe | null = null

export async function getStripe(): Promise<Stripe | null> {
  if (stripeInstance) return stripeInstance
  
  if (!process.env.STRIPE_SECRET_KEY) {
    return null
  }
  
  try {
    const { default: Stripe } = await import('stripe')
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
    return stripeInstance
  } catch {
    return null
  }
}

// Export for backwards compatibility
export const stripe = {
  get instance() {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY is not configured')
    }
    return getStripe()
  }
}
