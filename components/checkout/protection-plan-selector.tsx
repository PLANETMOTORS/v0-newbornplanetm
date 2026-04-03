"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, Check } from "lucide-react"

const PROTECTION_PLANS = [
  {
    id: "none",
    name: "No Protection",
    price: 0,
    features: [],
  },
  {
    id: "essential",
    name: "PlanetCare Essential",
    price: 1950,
    badge: "Basic",
    features: [
      "3-Year Powertrain Coverage",
      "24/7 Roadside Assistance",
      "Trip Interruption Coverage",
    ],
  },
  {
    id: "smart",
    name: "PlanetCare Smart",
    price: 3000,
    badge: "Popular",
    features: [
      "5-Year Comprehensive Coverage",
      "24/7 Roadside Assistance",
      "Trip Interruption Coverage",
      "Rental Car Reimbursement",
      "Tire & Wheel Protection",
    ],
  },
  {
    id: "lifeproof",
    name: "PlanetCare Life Proof",
    price: 4850,
    badge: "Best Value",
    features: [
      "7-Year Bumper-to-Bumper Coverage",
      "24/7 Premium Roadside Assistance",
      "Trip Interruption Coverage",
      "Rental Car Reimbursement",
      "Tire & Wheel Protection",
      "Dent & Ding Protection",
      "Key Fob Replacement",
      "$0 Deductible",
    ],
  },
]

interface ProtectionPlanSelectorProps {
  value: string
  onChange: (value: string) => void
}

export function ProtectionPlanSelector({ value, onChange }: ProtectionPlanSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5" />
          Protection Plan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={value} onValueChange={onChange} className="space-y-3">
          {PROTECTION_PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex items-start p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                value === plan.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
              onClick={() => onChange(plan.id)}
            >
              <RadioGroupItem value={plan.id} id={plan.id} className="mt-1" />
              <Label htmlFor={plan.id} className="flex-1 ml-3 cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{plan.name}</span>
                    {plan.badge && (
                      <Badge variant={plan.badge === "Best Value" ? "default" : "secondary"} className="text-xs">
                        {plan.badge}
                      </Badge>
                    )}
                  </div>
                  <span className="font-bold text-lg">
                    {plan.price === 0 ? "Free" : `$${plan.price.toLocaleString()}`}
                  </span>
                </div>
                {plan.features.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="w-3 h-3 text-green-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                )}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}

export { PROTECTION_PLANS }
