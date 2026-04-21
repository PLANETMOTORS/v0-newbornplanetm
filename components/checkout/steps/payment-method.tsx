"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Building2 } from "lucide-react"

export interface PaymentMethodData {
  purchaseType: "finance" | "cash"
}

interface PaymentMethodStepProps {
  data: PaymentMethodData
  onChange: (data: PaymentMethodData) => void
  onContinue: () => void
}

export function PaymentMethodStep({ data, onChange, onContinue }: PaymentMethodStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Cash or finance?</h1>
        <p className="text-muted-foreground">
          Choose how you&apos;d like to pay for your vehicle.
        </p>
      </div>

      <RadioGroup
        value={data.purchaseType}
        onValueChange={(v) => onChange({ purchaseType: v as "finance" | "cash" })}
        className="grid gap-4"
      >
        <Card
          className={`cursor-pointer transition-colors ${
            data.purchaseType === "finance" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ purchaseType: "finance" })}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <RadioGroupItem value="finance" id="finance" className="shrink-0" />
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <Label htmlFor="finance" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-lg">Finance with Planet Motors</span>
                <Badge variant="secondary" className="text-xs">85% choose this</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Get pre-qualified in minutes with no impact to your credit score.
                Rates from 6.99% APR OAC.
              </p>
            </Label>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${
            data.purchaseType === "cash" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ purchaseType: "cash" })}
        >
          <CardContent className="flex items-center gap-4 p-6">
            <RadioGroupItem value="cash" id="cash" className="shrink-0" />
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-muted-foreground" />
            </div>
            <Label htmlFor="cash" className="flex-1 cursor-pointer">
              <span className="font-semibold text-lg">Pay with cash</span>
              <p className="text-sm text-muted-foreground mt-1">
                Pay the full amount via bank transfer, certified cheque, or credit card.
              </p>
            </Label>
          </CardContent>
        </Card>
      </RadioGroup>

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
        Continue
      </Button>
    </div>
  )
}
