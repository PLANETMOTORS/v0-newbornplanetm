"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Check, X, Star, SlidersHorizontal } from "lucide-react"

const PLANS = [
  {
    id: "essential",
    name: "PlanetCare Essential Shield",
    price: 1950,
    badge: null,
    recommended: false,
    highlight: false,
    duration: "3 years",
    features: [
      "3-Year Powertrain Coverage",
      "24/7 Roadside Assistance",
      "Trip Interruption Coverage",
      "GAP Insurance Included",
    ],
    comparisonFeatures: {
      "Powertrain Coverage": true,
      "Roadside Assistance": "24/7",
      "Trip Interruption": true,
      "Rental Car Reimbursement": false,
      "Tire & Wheel Protection": false,
      "Dent & Ding Protection": false,
      "Key Fob Replacement": false,
      "Anti-Theft": false,
      "GAP Insurance": true,
      "Deductible": "$200",
    },
  },
  {
    id: "smart",
    name: "PlanetCare Smart Secure",
    price: 3000,
    badge: "Most Popular",
    recommended: true,
    highlight: true,
    duration: "5 years",
    features: [
      "5-Year Comprehensive Coverage",
      "24/7 Roadside Assistance",
      "Trip Interruption Coverage",
      "Rental Car Reimbursement",
      "Tire & Wheel Protection",
      "$0 Deductible",
    ],
    comparisonFeatures: {
      "Powertrain Coverage": true,
      "Roadside Assistance": "24/7",
      "Trip Interruption": true,
      "Rental Car Reimbursement": true,
      "Tire & Wheel Protection": true,
      "Dent & Ding Protection": false,
      "Key Fob Replacement": false,
      "Anti-Theft": false,
      "GAP Insurance": true,
      "Deductible": "$0",
    },
  },
  {
    id: "lifeproof",
    name: "PlanetCare Life Proof",
    price: 4850,
    badge: "Best Value",
    recommended: false,
    highlight: false,
    duration: "7 years",
    features: [
      "7-Year Bumper-to-Bumper Coverage",
      "24/7 Premium Roadside Assistance",
      "Trip Interruption Coverage",
      "Rental Car Reimbursement",
      "Tire & Wheel Protection",
      "Dent & Ding Protection",
      "Key Fob Replacement",
      "InvisiTrak Anti-Theft",
      "$0 Deductible",
    ],
    comparisonFeatures: {
      "Powertrain Coverage": true,
      "Roadside Assistance": "24/7 Premium",
      "Trip Interruption": true,
      "Rental Car Reimbursement": true,
      "Tire & Wheel Protection": true,
      "Dent & Ding Protection": true,
      "Key Fob Replacement": true,
      "Anti-Theft": true,
      "GAP Insurance": true,
      "Deductible": "$0",
    },
  },
] as const

export type ProtectionPlanId = "none" | "essential" | "smart" | "lifeproof"

export interface ProtectionData {
  selectedPlan: ProtectionPlanId
}

interface ProtectionPlansStepProps {
  data: ProtectionData
  onChange: (data: ProtectionData) => void
  onContinue: () => void
}

const COMPARISON_ROWS = [
  "Powertrain Coverage",
  "Roadside Assistance",
  "Trip Interruption",
  "Rental Car Reimbursement",
  "Tire & Wheel Protection",
  "Dent & Ding Protection",
  "Key Fob Replacement",
  "Anti-Theft",
  "GAP Insurance",
  "Deductible",
] as const

function ComparisonModal({ onClose }: { onClose: () => void }) {
  const modalRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    // Capture the element that triggered the modal
    triggerRef.current = document.activeElement as HTMLElement

    // Focus the modal
    if (modalRef.current) {
      const firstFocusable = modalRef.current.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      if (firstFocusable) {
        firstFocusable.focus()
      } else {
        modalRef.current.focus()
      }
    }

    // Handle Escape key
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)

    // Cleanup: restore focus
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      triggerRef.current?.focus()
    }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="comparison-modal-title"
        tabIndex={-1}
        className="bg-background rounded-2xl shadow-xl max-w-3xl w-full max-h-[85vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-background rounded-t-2xl z-10">
          <h2 id="comparison-modal-title" className="text-xl font-bold">Compare Coverage</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close comparison">
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-4 font-medium text-muted-foreground w-1/4">Feature</th>
                {PLANS.map((plan) => (
                  <th key={plan.id} className="p-4 text-center">
                    <p className="font-semibold">{plan.name.replace("PlanetCare ", "")}</p>
                    <p className="text-muted-foreground font-normal">${plan.price.toLocaleString()}</p>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON_ROWS.map((row) => (
                <tr key={row} className="border-b last:border-0">
                  <td className="p-4 font-semibold">{row}</td>
                  {PLANS.map((plan) => {
                    const val = plan.comparisonFeatures[row]
                    return (
                      <td key={plan.id} className="p-4 text-center">
                        {val === true ? (
                          <>
                            <Check className="w-5 h-5 text-green-600 mx-auto" aria-hidden="true" />
                            <span className="sr-only">Included</span>
                          </>
                        ) : val === false ? (
                          <>
                            <span className="text-muted-foreground" aria-hidden="true">—</span>
                            <span className="sr-only">Not included</span>
                          </>
                        ) : (
                          <span className="font-semibold">{val}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export function ProtectionPlansStep({ data, onChange, onContinue }: ProtectionPlansStepProps) {
  const [showComparison, setShowComparison] = useState(false)

  const handleSelect = useCallback((id: ProtectionPlanId) => {
    onChange({ selectedPlan: id })
  }, [onChange])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">
          <Shield className="w-7 h-7 inline-block mr-2 text-blue-600 align-text-bottom" aria-hidden="true" />
          PlanetCare Protection
        </h1>
        <p className="text-muted-foreground">
          Protect your investment with comprehensive coverage designed for Canadian drivers.
        </p>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700 transition-colors font-semibold"
          onClick={() => setShowComparison(true)}
        >
          Compare coverage
        </button>
      </div>

      <div className="grid gap-4" role="radiogroup" aria-label="Protection plan options">
        {PLANS.map((plan) => {
          const selected = data.selectedPlan === plan.id
          return (
            <Card
              key={plan.id}
              role="radio"
              tabIndex={0}
              aria-checked={selected}
              aria-label={`${plan.name} — $${plan.price.toLocaleString()}`}
              className={`cursor-pointer transition-all relative ${
                selected
                  ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/20"
                  : plan.highlight
                    ? "border-blue-300 hover:border-blue-500"
                    : "hover:border-blue-300"
              }`}
              onClick={() => handleSelect(plan.id as ProtectionPlanId)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  // Don't handle if event comes from a nested button
                  if ((e.target as HTMLElement).closest('button') && e.target !== e.currentTarget) {
                    return
                  }
                  e.preventDefault()
                  handleSelect(plan.id as ProtectionPlanId)
                }
              }}
            >
              {plan.recommended && (
                <div className="absolute -top-3 left-4">
                  <Badge className="bg-amber-600 text-white text-xs px-2.5 py-0.5 shadow-sm">
                    <Star className="w-3 h-3 mr-1 fill-current" aria-hidden="true" />
                    Recommended for you
                  </Badge>
                </div>
              )}
              <CardContent className={`p-6 ${plan.recommended ? "pt-7" : ""}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-lg">{plan.name}</h3>
                      {plan.badge && (
                        <Badge
                          variant={plan.badge === "Best Value" ? "default" : "secondary"}
                          className="text-xs"
                        >
                          {plan.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{plan.duration} coverage</p>
                  </div>
                  <span className="font-bold text-xl whitespace-nowrap">
                    ${plan.price.toLocaleString()}
                  </span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-1.5 mb-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" aria-hidden="true" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <button
                  type="button"
                  className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation()
                    setShowComparison(true)
                  }}
                >
                  <SlidersHorizontal className="w-3 h-3" aria-hidden="true" />
                  Customize duration &amp; mileage
                </button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-col items-center gap-3">
        <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
          {data.selectedPlan === "none" ? "Continue without protection" : "Continue with protection"}
        </Button>

        {data.selectedPlan !== "none" ? (
          <button
            type="button"
            className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground transition-colors"
            onClick={() => {
              onChange({ selectedPlan: "none" })
              onContinue()
            }}
          >
            I choose to decline coverage and continue
          </button>
        ) : (
          <button
            type="button"
            className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700 transition-colors"
            onClick={() => setShowComparison(true)}
          >
            Compare all coverage options
          </button>
        )}
      </div>

      {showComparison && <ComparisonModal onClose={() => setShowComparison(false)} />}
    </div>
  )
}

export { PLANS as PROTECTION_PLANS_DETAIL }