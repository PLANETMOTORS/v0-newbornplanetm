"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"

export default function PaymentTypePage() {
  const router = useRouter()
  const [selected, setSelected] = useState<"cash" | "finance" | null>(null)
  const submittedRef = useRef(false)

  const handleContinue = () => {
    if (submittedRef.current) return
    submittedRef.current = true
    // POST to /api/checkout to record selection (double-click prevention via ref)
    fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ step: 1, paymentType: selected }),
    }).catch(() => {})
    router.push("/checkout/trade-in")
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <h1 className="text-2xl font-bold mb-8">Step 1 — Payment Type</h1>

        <div className="flex gap-4 mb-8" role="tablist" aria-label="Payment type">
          <button
            data-testid="toggle-cash"
            role="tab"
            aria-selected={selected === "cash"}
            onClick={() => setSelected("cash")}
            className={`flex-1 min-h-[48px] min-w-[48px] rounded-lg border-2 px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              selected === "cash"
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-background text-foreground hover:border-primary/50"
            }`}
          >
            Cash
          </button>
          <button
            data-testid="toggle-finance"
            role="tab"
            aria-selected={selected === "finance"}
            onClick={() => setSelected("finance")}
            className={`flex-1 min-h-[48px] min-w-[48px] rounded-lg border-2 px-6 py-3 font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${
              selected === "finance"
                ? "border-primary bg-primary/10 text-primary"
                : "border-muted bg-background text-foreground hover:border-primary/50"
            }`}
          >
            Finance
          </button>
        </div>

        <button
          data-testid="btn-continue-step1"
          onClick={handleContinue}
          disabled={!selected}
          className="w-full min-h-[48px] rounded-lg bg-primary text-primary-foreground px-6 py-3 font-medium transition-colors hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
        >
          Continue
        </button>
      </div>
    </main>
  )
}
