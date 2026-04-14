'use client'

import { useCallback } from 'react'
import {
  EmbeddedCheckout,
  EmbeddedCheckoutProvider,
} from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

import { startCheckoutSession } from '../app/actions/stripe'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "")

export default function Checkout({ productId }: { productId: string }) {
  const fetchClientSecret = useCallback(
    async () => {
      const clientSecret = await startCheckoutSession(productId)
      if (!clientSecret) {
        throw new Error("Failed to create checkout session")
      }
      return clientSecret
    },
    [productId],
  )

  return (
    <div id="checkout">
      <EmbeddedCheckoutProvider
        stripe={stripePromise}
        options={{ fetchClientSecret }}
      >
        <EmbeddedCheckout />
      </EmbeddedCheckoutProvider>
    </div>
  )
}
