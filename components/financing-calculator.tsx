"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Calculator } from "lucide-react"

export function FinancingCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState(35000)
  const [downPayment, setDownPayment] = useState(5000)
  const [interestRate, setInterestRate] = useState(6.99)
  const [term, setTerm] = useState("60")

  const principal = Math.max(vehiclePrice - downPayment, 0)
  const monthlyRate = interestRate / 100 / 12
  const months = parseInt(term)
  const monthlyPayment = principal > 0 && monthlyRate > 0
    ? (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1)
    : principal > 0 ? principal / months : 0
  const totalCost = monthlyPayment * months
  const totalInterest = totalCost - principal

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-lg">Payment Estimator</h3>
      </div>

      <div className="space-y-2">
        <Label>Vehicle Price</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            value={vehiclePrice}
            onChange={(e) => setVehiclePrice(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
          />
        </div>
        <Slider
          value={[vehiclePrice]}
          onValueChange={([v]) => setVehiclePrice(v)}
          min={5000}
          max={120000}
          step={1000}
          className="mt-2"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>$5,000</span>
          <span>$120,000</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Down Payment</Label>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">$</span>
          <Input
            type="number"
            value={downPayment}
            onChange={(e) => setDownPayment(Math.max(0, parseInt(e.target.value) || 0))}
            min={0}
          />
        </div>
        <Slider
          value={[downPayment]}
          onValueChange={([v]) => setDownPayment(v)}
          min={0}
          max={Math.min(vehiclePrice, 50000)}
          step={500}
          className="mt-2"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Interest Rate (%)</Label>
          <Input
            type="number"
            value={interestRate}
            onChange={(e) => setInterestRate(Math.max(0, parseFloat(e.target.value) || 0))}
            min={0}
            max={30}
            step={0.1}
          />
        </div>
        <div className="space-y-2">
          <Label>Loan Term</Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger><SelectValue /></SelectTrigger>
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
          <p className="text-3xl font-bold text-primary">
            ${Math.round(monthlyPayment).toLocaleString()}<span className="text-base font-normal">/mo</span>
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm pt-2 border-t border-primary/10">
          <div>
            <p className="text-muted-foreground">Total Interest</p>
            <p className="font-medium">${Math.round(totalInterest).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Total Cost</p>
            <p className="font-medium">${Math.round(totalCost).toLocaleString()}</p>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        *Estimate only. Actual rates and payments depend on credit approval. Taxes and fees not included.
      </p>
    </div>
  )
}
