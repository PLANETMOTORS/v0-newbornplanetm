"use client"

import dynamic from "next/dynamic"

/**
 * Lazy-loaded Stripe Embedded Checkout components.
 * Imported on demand to keep Stripe.js (~40 KB) off the initial bundle.
 */
export const EmbeddedCheckoutProvider = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => ({ default: m.EmbeddedCheckoutProvider })),
  { ssr: false },
)

export const EmbeddedCheckout = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => ({ default: m.EmbeddedCheckout })),
  { ssr: false },
)

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromise: ReturnType<typeof import("@stripe/stripe-js").loadStripe> | null = null

/** Returns a memoized loadStripe promise, or null when no publishable key is configured. */
export function getStripePromise() {
  if (!stripePromise && stripeKey) {
    stripePromise = import("@stripe/stripe-js").then((m) => m.loadStripe(stripeKey))
  }
  return stripePromise
}
