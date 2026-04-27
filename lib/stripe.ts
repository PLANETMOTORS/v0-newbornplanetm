import Stripe from 'stripe'

// Stripe client - only initialize on the server when secret key is available
// This file should only be imported in server-side code (API routes, Server Components, Server Actions)
let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe | null {
  if (globalThis.window !== undefined) {    // Never run on client
    return null
  }
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

export const stripe = getStripeInstance()

export function getStripe(): Stripe {
  const instance = getStripeInstance()
  if (!instance) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY environment variable.')
  }
  return instance
}
