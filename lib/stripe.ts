import Stripe from 'stripe'

// Stripe client — only initialize on the server when secret key is available.
// This file must only be imported in server-side code (API routes, Server
// Components, Server Actions).  Always call getStripe() to obtain a validated
// instance; it throws with a clear message when STRIPE_SECRET_KEY is absent.

let stripeInstance: Stripe | null = null

function getStripeInstance(): Stripe | null {
  if (typeof window !== 'undefined') {
    // Never run on client
    return null
  }
  if (!stripeInstance && process.env.STRIPE_SECRET_KEY) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY)
  }
  return stripeInstance
}

export function getStripe(): Stripe {
  const instance = getStripeInstance()
  if (!instance) {
    throw new Error('Stripe is not configured. Please add STRIPE_SECRET_KEY environment variable.')
  }
  return instance
}
