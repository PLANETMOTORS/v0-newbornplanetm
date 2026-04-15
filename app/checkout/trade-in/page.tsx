"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function TradeInPage() {
  const router = useRouter()
  const [vin, setVin] = useState("")

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Step 2 — Trade-In</h1>

        <div className="space-y-6 mb-8">
          <div>
            <label htmlFor="vin-input" className="block text-sm font-medium mb-2">
              Enter your vehicle VIN (optional)
            </label>
            <input
              id="vin-input"
              data-testid="field-vin"
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              placeholder="e.g. 1HGBH41JXMN109186"
              className="w-full rounded-lg border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <button
            data-testid="btn-continue-step2"
            onClick={() => router.push("/checkout/deal-customization")}
            disabled={!vin}
            className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
          >
            Continue with Trade-In
          </button>
        </div>

        <button
          data-testid="btn-no-trade-in"
          onClick={() => router.push("/checkout/deal-customization")}
          className="w-full min-h-[48px] rounded-lg border-2 border-muted bg-background px-6 py-3 font-medium hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          No Trade-In — Skip
        </button>
      </div>
    </main>
  )
}
