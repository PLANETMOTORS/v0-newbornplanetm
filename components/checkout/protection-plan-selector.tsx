"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Shield, Check } from "lucide-react"
import { CHECKOUT_PLANS } from "@/lib/constants/protection-packages"

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
          {CHECKOUT_PLANS.map((plan) => (
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
                    <span className="font-semibold">{plan.name}</span>
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
                        <Check className="w-3 h-3 text-green-700 flex-shrink-0" />
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

export { CHECKOUT_PLANS as PROTECTION_PLANS } from "@/lib/constants/protection-packages"
