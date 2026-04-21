"use client"

import { useCallback } from "react"
import dynamic from "next/dynamic"
import { Shield, LockKeyhole } from "lucide-react"
import { startVehicleCheckout } from "@/app/actions/stripe"
import { getUTMParams } from "@/lib/hooks/use-utm-params"
import type { ProtectionPlanId } from "./protection-plans"

const EmbeddedCheckoutProvider = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => ({ default: m.EmbeddedCheckoutProvider })),
  { ssr: false }
)
const EmbeddedCheckout = dynamic(
  () => import("@stripe/react-stripe-js").then((m) => ({ default: m.EmbeddedCheckout })),
  { ssr: false }
)

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
  const fetchClientSecret = useCallback(async () => {
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
    })
    if (!secret) throw new Error("Failed to create checkout session")
    return secret
  }, [vehicleId, vehicleName, customerEmail, protectionPlanId])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Secure your vehicle</h1>
        <p className="text-muted-foreground">
          Pay a $250 refundable deposit to reserve this vehicle while we finalize your order.
        </p>
      </div>

      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
        <Shield className="w-5 h-5 text-green-600 shrink-0" />
        <div className="text-sm">
          <p className="font-medium text-green-800">$250 Refundable Deposit</p>
          <p className="text-green-700">
            Holds this vehicle for 48 hours while we process your order. Fully refundable if you change your mind.
          </p>
        </div>
      </div>

      <div className="min-h-[400px] border rounded-xl overflow-hidden">
        <EmbeddedCheckoutProvider stripe={getStripePromise()} options={{ fetchClientSecret }}>
          <EmbeddedCheckout />
        </EmbeddedCheckoutProvider>
      </div>

      <p className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
        <LockKeyhole className="w-3.5 h-3.5" />
        Powered by Stripe. Your payment information is secure and encrypted.
      </p>
    </div>
  )
}
