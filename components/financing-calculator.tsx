"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calculator } from "lucide-react"

const VEHICLE_PRICE_MIN = 0
const VEHICLE_PRICE_MAX = 120000
const DOWN_PAYMENT_CAP = 50000
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

export function FinancingCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState(35000)
  const [downPayment, setDownPayment] = useState(5000)
  const [interestRate, setInterestRate] = useState(6.99)
  const [term, setTerm] = useState("60")

  function handleVehiclePriceChange(nextVehiclePrice: number) {
    setVehiclePrice(nextVehiclePrice)
    setDownPayment((prev) => clamp(prev, 0, Math.min(nextVehiclePrice, DOWN_PAYMENT_CAP)))
  }

  const principal = Math.max(vehiclePrice - downPayment, 0)
  const monthlyRate = interestRate / 100 / 12
  const months = parseInt(term)
  const rawMonthly = principal > 0 && monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal > 0 && months > 0 ? principal / months : 0
  const monthlyPayment = Number.isFinite(rawMonthly) ? rawMonthly : 0
  const totalCost = monthlyPayment * months
  const totalInterest = totalCost - principal

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Payment Estimator</h3>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calc-vehicle-price">Vehicle Price</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            id="calc-vehicle-price"
            type="number"
            value={vehiclePrice}
            onChange={(e) => {
              handleVehiclePriceChange(clamp(parseInt(e.target.value) || 0, VEHICLE_PRICE_MIN, VEHICLE_PRICE_MAX))
            }}
            min={VEHICLE_PRICE_MIN}
            max={VEHICLE_PRICE_MAX}
          />
        </div>
        <Slider
          aria-label="Vehicle price"
          value={[vehiclePrice]}
          onValueChange={([v]) => handleVehiclePriceChange(v)}
          min={5000}
          max={VEHICLE_PRICE_MAX}
          step={1000}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$5,000</span>
          <span>$120,000</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="calc-down-payment">Down Payment</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            id="calc-down-payment"
            type="number"
            value={downPayment}
            onChange={(e) =>
              setDownPayment(clamp(parseInt(e.target.value) || 0, 0, Math.min(vehiclePrice, DOWN_PAYMENT_CAP)))
            }
            min={0}
            max={Math.min(vehiclePrice, DOWN_PAYMENT_CAP)}
          />
        </div>
        <Slider
          aria-label="Down payment"
          value={[downPayment]}
          onValueChange={([v]) => setDownPayment(v)}
          min={0}
          max={Math.min(vehiclePrice, DOWN_PAYMENT_CAP)}
          step={500}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="calc-interest-rate">Interest Rate (%)</Label>
          <Input
            id="calc-interest-rate"
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(clamp(parseFloat(e.target.value) || 0, 0, 30))}
            min={0}
            max={30}
            step={0.1}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-loan-term">Loan Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger id="calc-loan-term" aria-label="Loan term"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 months</SelectItem>
              <SelectItem value="36">36 months</SelectItem>
              <SelectItem value="48">48 months</SelectItem>
              <SelectItem value="60">60 months</SelectItem>
              <SelectItem value="72">72 months</SelectItem>
              <SelectItem value="84">84 months</SelectItem>
              <SelectItem value="96">96 months</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-3">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Estimated Monthly Payment</p>
          <p className="text-3xl font-bold text-primary tabular-nums">
            ${Math.round(monthlyPayment).toLocaleString()}<span className="text-base font-normal">/mo</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-primary/10">
          <div>
            <p className="text-muted-foreground">Total Interest</p>
            <p className="font-semibold tabular-nums">${Math.round(totalInterest).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Cost</p>
            <p className="font-semibold tabular-nums">${Math.round(totalCost).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        *Estimate only. Actual rates and payments depend on credit approval. Taxes and fees not included.
      </p>
    </div>
  )
}
