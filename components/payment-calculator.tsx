"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { FINANCE_ESTIMATE_DISCLAIMER, safeNum } from "@/lib/pricing/format"

// Types for Sanity data
interface CreditTier {
  label: string
  minScore: number
  apr: number
}

interface FinanceSettings {
  taxRate: number
  defaultTerm: number
  defaultDownPayment: number
  averageTradeInValue: number
  creditTiers: CreditTier[]
}

interface PaymentCalculatorProps {
  price: number
  specialPrice?: number | null
  finance: FinanceSettings
  specialFinance?: {
    name: string
    logo?: string
    promoRate: number
    promoEndDate?: string
  } | null
}

export function PaymentCalculator({ 
  price, 
  specialPrice, 
  finance, 
  specialFinance 
}: PaymentCalculatorProps) {
  // Use special price if available — guard against NaN
  const effectivePrice = safeNum(specialPrice || price)
  
  // State for user selections
  const [selectedTierIndex, setSelectedTierIndex] = useState(0)
  const [downPayment, setDownPayment] = useState(finance.defaultDownPayment)
  const [tradeIn, setTradeIn] = useState(finance.averageTradeInValue)
  const [term, setTerm] = useState(finance.defaultTerm)
  
  const selectedTier = finance.creditTiers[selectedTierIndex]
  
  // Calculate with promo rate if available and better than credit tier
  const effectiveApr = specialFinance?.promoRate && specialFinance.promoRate < selectedTier.apr
    ? specialFinance.promoRate
    : selectedTier.apr
  
  // Professional payment calculation with APR multiplier
  const calculation = useMemo(() => {
    // 1. Calculate total with tax
    const totalWithTax = effectivePrice * (1 + (finance.taxRate / 100))
    
    // 2. Subtract equity (down payment + trade-in)
    const principal = totalWithTax - (downPayment + tradeIn)
    
    // 3. Apply APR multiplier for simple interest approximation
    // More accurate PMT formula for compound interest
    const monthlyRate = effectiveApr / 100 / 12
    
    let monthlyPayment: number
    if (monthlyRate === 0) {
      monthlyPayment = principal / term
    } else {
      // Standard PMT formula: P * [r(1+r)^n] / [(1+r)^n - 1]
      monthlyPayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                       (Math.pow(1 + monthlyRate, term) - 1)
    }
    
    // Bi-weekly is roughly half of monthly * 12 / 26
    const biWeeklyPayment = (monthlyPayment * 12) / 26
    
    // Total cost of loan
    const totalCost = monthlyPayment * term
    const totalInterest = totalCost - principal
    
    return {
      principal: Math.max(0, Number.isFinite(principal) ? principal : 0),
      monthlyPayment: Number.isFinite(monthlyPayment) ? Math.round(monthlyPayment) : 0,
      biWeeklyPayment: Number.isFinite(biWeeklyPayment) ? Math.round(biWeeklyPayment) : 0,
      totalCost: Number.isFinite(totalCost) ? Math.round(totalCost) : 0,
      totalInterest: Number.isFinite(totalInterest) ? Math.round(totalInterest) : 0,
      effectiveApr,
    }
  }, [effectivePrice, finance.taxRate, downPayment, tradeIn, term, effectiveApr])

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <span>Payment Calculator</span>
          {specialFinance && (
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              Special Financing Available
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Main Payment Display */}
        <div className="text-center p-6 bg-muted rounded-lg">
          <div className="text-4xl font-bold text-foreground tabular-nums">
            ${calculation.monthlyPayment.toLocaleString()}<span className="text-lg font-normal text-muted-foreground">/mo*</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            <span className="tabular-nums">Estimated for {selectedTier.label} credit at {calculation.effectiveApr}% APR</span>
          </p>
          {specialFinance && calculation.effectiveApr === specialFinance.promoRate && (
            <p className="text-xs text-green-600 mt-1">
              Using {specialFinance.name} promotional rate
            </p>
          )}
        </div>

        {/* Credit Tier Selector */}
        <div className="space-y-2">
          <Label>Your Credit Score</Label>
          <Select 
            value={selectedTierIndex.toString()} 
            onValueChange={(val) => setSelectedTierIndex(Number.parseInt(val))}
          >
            <SelectTrigger aria-label="Credit profile">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {finance.creditTiers.map((tier, idx) => (
                <SelectItem key={tier.label} value={idx.toString()}>
                  {tier.label} ({tier.minScore}+) - {tier.apr}% APR
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Down Payment Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Down Payment</Label>
            <span className="text-sm font-semibold tabular-nums">${downPayment.toLocaleString()}</span>
          </div>
          <Slider
            aria-label="Down payment"
            value={[downPayment]}
            onValueChange={([val]) => setDownPayment(val)}
            min={0}
            max={Math.min(effectivePrice * 0.5, 20000)}
            step={500}
          />
        </div>

        {/* Trade-In Slider */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>Trade-In Value</Label>
            <span className="text-sm font-semibold tabular-nums">${tradeIn.toLocaleString()}</span>
          </div>
          <Slider
            aria-label="Trade-in value"
            value={[tradeIn]}
            onValueChange={([val]) => setTradeIn(val)}
            min={0}
            max={15000}
            step={500}
          />
        </div>

        {/* Term Selector */}
        <div className="space-y-2">
          <Label>Loan Term</Label>
          <Select value={term.toString()} onValueChange={(val) => setTerm(Number.parseInt(val))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="36">36 months (3 years)</SelectItem>
              <SelectItem value="48">48 months (4 years)</SelectItem>
              <SelectItem value="60">60 months (5 years)</SelectItem>
              <SelectItem value="72">72 months (6 years)</SelectItem>
              <SelectItem value="84">84 months (7 years)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Summary */}
        <div className="pt-4 border-t space-y-2 text-sm tabular-nums">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Vehicle Price</span>
            <span>${effectivePrice.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tax ({finance.taxRate}%)</span>
            <span>${Math.round(effectivePrice * finance.taxRate / 100).toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Amount Financed</span>
            <span>${calculation.principal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Interest</span>
            <span>${calculation.totalInterest.toLocaleString()}</span>
          </div>
          <div className="flex justify-between font-semibold pt-2 border-t">
            <span>Total Cost</span>
            <span>${calculation.totalCost.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-muted-foreground">
            <span>Bi-Weekly Payment</span>
            <span>${calculation.biWeeklyPayment.toLocaleString()}</span>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground">
          *{FINANCE_ESTIMATE_DISCLAIMER}
        </p>
      </CardContent>
    </Card>
  )
}
