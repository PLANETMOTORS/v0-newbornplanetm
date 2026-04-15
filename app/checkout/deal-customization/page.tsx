"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function DealCustomizationPage() {
  const router = useRouter()
  const [downPayment, setDownPayment] = useState(5000)
  const [frequency, setFrequency] = useState<"biweekly" | "monthly">("monthly")

  const vehiclePrice = 36200
  const financed = vehiclePrice - downPayment
  const monthlyPayment = frequency === "monthly"
    ? (financed / 60).toFixed(2)
    : (financed / 130).toFixed(2)

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Step 3 — Deal Customization</h1>

        {/* Down Payment Slider */}
        <div className="mb-8">
          <label htmlFor="down-payment" className="block text-sm font-medium mb-2">
            Down Payment: ${downPayment.toLocaleString()}
          </label>
          <input
            id="down-payment"
            data-testid="slider-down-payment"
            type="range"
            min={0}
            max={vehiclePrice}
            step={500}
            value={downPayment}
            onChange={(e) => setDownPayment(Number(e.target.value))}
            className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {/* Payment Frequency Toggles */}
        <div className="flex gap-4 mb-8" role="tablist" aria-label="Payment frequency">
          <button
            data-testid="toggle-biweekly"
            role="tab"
            aria-selected={frequency === "biweekly"}
            onClick={() => setFrequency("biweekly")}
            className={`flex-1 min-h-[48px] rounded-lg border-2 px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              frequency === "biweekly"
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-background text-foreground hover:border-primary/50"
            }`}
          >
            Bi-Weekly
          </button>
          <button
            data-testid="toggle-monthly"
            role="tab"
            aria-selected={frequency === "monthly"}
            onClick={() => setFrequency("monthly")}
            className={`flex-1 min-h-[48px] rounded-lg border-2 px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              frequency === "monthly"
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-background text-foreground hover:border-primary/50"
            }`}
          >
            Monthly
          </button>
        </div>

        {/* Finance Summary Card */}
        <div data-testid="finance-summary-card" className="rounded-xl border bg-card p-6 mb-8">
          <h3 className="font-semibold text-lg mb-4">Finance Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Vehicle Price</span>
              <span>${vehiclePrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span>Down Payment</span>
              <span>-${downPayment.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2 mt-2">
              <span>{frequency === "biweekly" ? "Bi-Weekly" : "Monthly"} Payment</span>
              <span>${monthlyPayment}</span>
            </div>
          </div>
        </div>

        <button
          data-testid="btn-continue-step3"
          onClick={() => router.push("/checkout/personal-info")}
          className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </main>
  )
}
