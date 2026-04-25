"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Car, ArrowRight, Check } from "lucide-react"

export interface TradeInData {
  hasTradeIn: boolean | null
  tradeInValue: number
  tradeInVehicle: string
}

interface TradeInStepProps {
  data: TradeInData
  onChange: (data: TradeInData) => void
  onContinue: () => void
}

const TRADE_IN_BENEFITS = [
  "Get a real offer in 2 minutes",
  "Reduce your down payment and monthly payments",
  "Save on taxes — trade-in value may be tax-exempt",
]

export function TradeInStep({ data, onChange, onContinue }: Readonly<TradeInStepProps>) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-[-0.01em] mb-1">Add a trade-in</h1>
        <p className="text-muted-foreground">
          Have a vehicle to trade? Get an instant offer to reduce your purchase price.
        </p>
      </div>

      <fieldset>
        <legend className="sr-only">Trade-in option</legend>
        <div className="grid gap-4" role="radiogroup" aria-label="Trade-in option">
          <Card
            role="radio"
            tabIndex={0}
            aria-checked={data.hasTradeIn === true}
            className={`cursor-pointer transition-colors ${
              data.hasTradeIn === true ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/20" : "hover:border-blue-300"
            }`}
            onClick={() => onChange({ ...data, hasTradeIn: true })}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ ...data, hasTradeIn: true }) } }}
          >
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                  <Car className="w-7 h-7 text-blue-600" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">Get trade-in offer</h3>
                  {data.tradeInValue > 0 && (
                    <>
                      <p className="text-green-600 font-semibold text-sm mt-0.5">
                        Estimated value: ${data.tradeInValue.toLocaleString()}
                        {data.tradeInVehicle && ` — ${data.tradeInVehicle}`}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Your offer is valid for 7 days
                      </p>
                    </>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
              </div>
              <ul className="space-y-2 ml-1">
                {TRADE_IN_BENEFITS.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-600 shrink-0" aria-hidden="true" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card
            role="radio"
            tabIndex={0}
            aria-checked={data.hasTradeIn === false}
            className={`cursor-pointer transition-colors ${
              data.hasTradeIn === false ? "border-blue-600 bg-blue-50 ring-2 ring-blue-600/20" : "hover:border-blue-300"
            }`}
            onClick={() => onChange({ ...data, hasTradeIn: false, tradeInValue: 0, tradeInVehicle: "" })}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onChange({ ...data, hasTradeIn: false, tradeInValue: 0, tradeInVehicle: "" }) } }}
          >
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center shrink-0">
                <ArrowRight className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">I don&apos;t have a trade-in</h3>
                <p className="text-sm text-muted-foreground">Skip this step and continue.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </fieldset>

      {data.hasTradeIn !== null && (
        <Button onClick={onContinue} className="w-full h-12 text-base font-semibold">
          {data.hasTradeIn === false
            ? "Continue without trade-in"
            : data.tradeInValue > 0
              ? "Continue with trade-in"
              : "Continue"
          }
        </Button>
      )}
    </div>
  )
}