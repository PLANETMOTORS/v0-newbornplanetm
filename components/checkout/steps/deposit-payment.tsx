"use client"

import { useCallback, useState } from "react"
import dynamic from "next/dynamic"
import { Shield, LockKeyhole, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { startVehicleCheckout } from "@/app/actions/stripe"
import { getUTMParams } from "@/lib/hooks/use-utm-params"
import type { ProtectionPlanId } from "./protection-plans"

const EmbeddedCheckoutProvider = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => ({ default: m.EmbeddedCheckoutProvider })),
  { ssr: false, loading: () => <StripeLoadingFallback /> }
)
const EmbeddedCheckout = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => ({ default: m.EmbeddedCheckout })),
  { ssr: false, loading: () => <StripeLoadingFallback /> }
)

function StripeLoadingFallback() {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="Loading payment form">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">Loading secure payment form…</p>
      </div>
    </div>
  )
}

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromise: ReturnType<typeof import("@stripe/stripe-js").loadStripe> | null = null
function getStripePromise() {
  if (!stripePromise && stripeKey) {
    stripePromise = import("@stripe/stripe-js").then((m) => m.loadStripe(stripeKey))
  }
  return stripePromise
}

interface DepositPaymentStepProps {
  vehicleId: string
  vehicleName: string
  customerEmail: string
  protectionPlanId: ProtectionPlanId
}

export function DepositPaymentStep({
  vehicleId,
  vehicleName,
  customerEmail,
  protectionPlanId,
}: DepositPaymentStepProps) {
  const [error, setError] = useState("")
  const depositAmount = 250

  const fetchClientSecret = useCallback(async () => {
    try {
      const utmParams = getUTMParams()
      const secret = await startVehicleCheckout({
        vehicleId,
        vehicleName,
        protectionPlanId: protectionPlanId !== "none" ? protectionPlanId : undefined,
        customerEmail: customerEmail || undefined,
        depositOnly: true,
        ...(utmParams?.utm_source && { utmSource: utmParams.utm_source }),
        ...(utmParams?.utm_medium && { utmMedium: utmParams.utm_medium }),
        ...(utmParams?.utm_campaign && { utmCampaign: utmParams.utm_campaign }),
        ...(utmParams?.utm_content && { utmContent: utmParams.utm_content }),
        ...(utmParams?.utm_term && { utmTerm: utmParams.utm_term }),
      })
      if (!secret) throw new Error("Failed to create checkout session")
      return secret
    } catch (err) {
      const message = err instanceof Error ? err.message : "Payment initialization failed"
      setError(message)
      throw err
    }
  }, [vehicleId, vehicleName, customerEmail, protectionPlanId])

  if (!stripeKey) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold mb-1">Secure your vehicle</h1>
        </div>
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            Payment system is temporarily unavailable. Please try again later or call us at (866) 797-3332.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Secure your vehicle</h1>
        <p className="text-muted-foreground">
          Pay a ${depositAmount} refundable deposit to reserve this vehicle while we finalize your order.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Shield className="w-5 h-5 text-green-600 shrink-0" aria-hidden="true" />
        <div className="text-sm">
          <p className="font-medium text-green-800">${depositAmount} Refundable Deposit</p>
          <p className="text-green-700">
            Holds this vehicle for 48 hours while we process your order. Fully refundable if you change your mind.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-lg" role="alert">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <div className="text-sm">
            <p className="font-medium text-destructive">Payment error</p>
            <p className="text-destructive/80">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => { setError(""); window.location.reload() }}
            >
              Try again
            </Button>
          </div>
        </div>
      )}

      <div className="min-h-[400px] border rounded-xl overflow-hidden">
        <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <LockKeyhole className="w-3.5 h-3.5" aria-hidden="true" />
        Powered by Stripe. Your payment information is secure and encrypted.
      </p>
    </div>
  )
}
