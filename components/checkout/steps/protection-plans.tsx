"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Shield, Check } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: "essential",
    name: "PlanetCare Essential Shield",
    price: 1950,
    badge: null,
    highlight: false,
    features: [
      "3-Year Powertrain Coverage",
      "24/7 Roadside Assistance",
      "Trip Interruption Coverage",
      "GAP Insurance Included",
    ],
  },
  {
    id: "smart",
    name: "PlanetCare Smart Secure",
    price: 3000,
    badge: "Most Popular",
    highlight: true,
    features: [
      "5-Year Comprehensive Coverage",
      "24/7 Roadside Assistance",
      "Trip Interruption Coverage",
      "Rental Car Reimbursement",
      "Tire & Wheel Protection",
      "$0 Deductible",
    ],
  },
  {
    id: "lifeproof",
    name: "PlanetCare Life Proof",
    price: 4850,
    badge: "Best Value",
    highlight: false,
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

export function ProtectionPlansStep({ data, onChange, onContinue }: ProtectionPlansStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">
          <Shield className="w-7 h-7 inline-block mr-2 text-blue-600 align-text-bottom" />
          PlanetCare Protection
        </h1>
        <p className="text-muted-foreground">
          Protect your investment with comprehensive coverage designed for Canadian drivers.
        </p>
      </div>

      <div className="grid gap-4">
        {PLANS.map((plan) => {
          const selected = data.selectedPlan === plan.id
          return (
            <Card
              key={plan.id}
              className={`cursor-pointer transition-all ${
                selected
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-600"
                  : plan.highlight
                    ? "border-blue-300 hover:border-blue-500"
                    : "hover:border-blue-300"
              }`}
              onClick={() => onChange({ selectedPlan: plan.id })}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
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
                  </div>
                  <span className="font-bold text-xl whitespace-nowrap">
                    ${plan.price.toLocaleString()}
                  </span>
                </div>
                <ul className="grid sm:grid-cols-2 gap-1.5">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Check className="w-3.5 h-3.5 text-green-600 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
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
          <Link
            href="/protection-plans"
            target="_blank"
            className="text-sm text-blue-600 underline underline-offset-4 hover:text-blue-700 transition-colors"
          >
            Compare all coverage options
          </Link>
        )}
      </div>
    </div>
  )
}

export { PLANS as PROTECTION_PLANS_DETAIL }
