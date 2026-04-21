"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Car, ArrowRight } from "lucide-react"

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

export function TradeInStep({ data, onChange, onContinue }: TradeInStepProps) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-1">Trade-in</h1>
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
            <CardContent className="flex items-center gap-4 p-6">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <Car className="w-7 h-7 text-blue-600" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">Get a trade-in offer</h3>
                <p className="text-sm text-muted-foreground">
                  Enter your vehicle details and get an instant market valuation.
                  {data.tradeInValue > 0 && (
                    <span className="block mt-1 text-green-600 font-medium">
                      Estimated value: ${data.tradeInValue.toLocaleString()}
                      {data.tradeInVehicle && ` — ${data.tradeInVehicle}`}
                    </span>
                  )}
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" />
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
