"use client"

import { useCallback, useState } from "react"
import { useParams } from "next/navigation"
import { loadStripe } from "@stripe/stripe-js"
import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js"
import { startVehicleCheckout } from "@/app/actions/stripe"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Loader2 } from "lucide-react"
import Link from "next/link"

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export default function PaymentPage() {
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)

  const getClientSecret = useCallback(
    () => startVehicleCheckout({
      vehicleId: params.id as string,
      vehicleName: "Vehicle Deposit",
      vehiclePriceCents: 25000, // $250 deposit
      depositOnly: true,
    }).then((secret) => {
      if (!secret) {
        throw new Error("Missing checkout client secret")
      }
      setIsLoading(false)
      return secret
    }).catch((error) => {
      console.error("Failed to create checkout session:", error)
      setIsLoading(false)
      throw error
    }),
    [params.id]
  )

  const options = { fetchClientSecret: getClientSecret }

  return (
    <div className="min-h-screen bg-muted/30 py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Button variant="ghost" asChild className="mb-6">
          <Link href={`/checkout/${params.id}`}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Checkout
          </Link>
        </Button>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-600" />
              Secure Payment - $250 Deposit
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your refundable deposit secures this vehicle while we prepare the paperwork.
            </p>
          </CardHeader>
          <CardContent>
            {isLoading && (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3">Loading payment form...</span>
              </div>
            )}
            <div id="checkout" className="min-h-[400px]">
              <EmbeddedCheckoutProvider stripe={stripePromise} options={options}>
                <EmbeddedCheckout />
              </EmbeddedCheckoutProvider>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Stripe. Your payment information is secure and encrypted.
        </p>
      </div>
    </div>
  )
}
