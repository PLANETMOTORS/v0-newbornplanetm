"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { CreditCard, Building2, Check, Landmark } from "lucide-react"

export interface PaymentMethodData {
  purchaseType: "finance" | "cash" | "pre-approved"
  preApprovedLender?: string
}

interface PaymentMethodStepProps {
  data: PaymentMethodData
  onChange: (data: PaymentMethodData) => void
  onContinue: () => void
}

export function PaymentMethodStep({ data, onChange, onContinue }: PaymentMethodStepProps) {
  const [lenderName, setLenderName] = useState(data.preApprovedLender ?? "")

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">Cash or finance?</h1>
        <p className="text-muted-foreground">
          Select how you would like to pay for your vehicle
        </p>
      </div>

      <RadioGroup
        value={data.purchaseType}
        onValueChange={(v) => {
          const type = v as PaymentMethodData["purchaseType"]
          onChange({ purchaseType: type, preApprovedLender: type === "pre-approved" ? lenderName : undefined })
        }}
        className="grid gap-4"
      >
        <Card
          className={`cursor-pointer transition-colors relative ${
            data.purchaseType === "finance" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ purchaseType: "finance" })}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2">
            <Badge className="bg-blue-700 text-white text-xs px-3 py-0.5 shadow-sm">
              85% of customers choose this option
            </Badge>
          </div>
          <CardContent className="flex items-start gap-4 p-6 pt-7">
            <RadioGroupItem value="finance" id="finance" className="shrink-0 mt-1" />
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
              <Building2 className="w-6 h-6 text-blue-600" aria-hidden="true" />
            </div>
            <Label htmlFor="finance" className="flex-1 cursor-pointer">
              <span className="font-semibold text-lg">Finance with Planet Motors</span>
              <ul className="mt-2 space-y-1.5">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
                  <strong>No hit</strong> to your credit score
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
                  Get pre-qualified in <strong>under 2 minutes</strong>
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
                  <strong>Customize</strong> your monthly and down payment
                </li>
              </ul>
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
              <CreditCard className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
            </div>
            <Label htmlFor="cash" className="flex-1 cursor-pointer">
              <span className="font-semibold text-lg">Pay with cash</span>
              <p className="text-sm text-muted-foreground mt-1">
                I plan to pay with funds from my bank account.
              </p>
            </Label>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-colors ${
            data.purchaseType === "pre-approved" ? "border-blue-600 bg-blue-50" : "hover:border-blue-300"
          }`}
          onClick={() => onChange({ purchaseType: "pre-approved", preApprovedLender: lenderName })}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <RadioGroupItem value="pre-approved" id="pre-approved" className="shrink-0" />
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Landmark className="w-6 h-6 text-muted-foreground" aria-hidden="true" />
              </div>
              <Label htmlFor="pre-approved" className="flex-1 cursor-pointer">
                <span className="font-semibold text-lg">I&apos;m pre-approved with another lender</span>
                <p className="text-sm text-muted-foreground mt-1">
                  I already have financing arranged through my bank or credit union.
                </p>
              </Label>
            </div>
            {data.purchaseType === "pre-approved" && (
              <div className="mt-4 ml-16">
                <Label htmlFor="lender-name" className="text-sm font-medium mb-1.5 block">
                  Lender name
                </Label>
                <Input
                  id="lender-name"
                  placeholder="e.g. RBC, TD, Scotiabank"
                  value={lenderName}
                  onChange={(e) => {
                    setLenderName(e.target.value)
                    onChange({ purchaseType: "pre-approved", preApprovedLender: e.target.value })
                  }}
                  autoComplete="organization"
                />
              </div>
            )}
          </CardContent>
        </Card>
      </RadioGroup>

      <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
        Continue
      </Button>
    </div>
  )
}
