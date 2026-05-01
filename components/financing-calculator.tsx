"use client"

import { useState, useMemo } from "react"
import { Calculator, ArrowRight } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { RATE_FLOOR } from "@/lib/rates"

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const HST_RATE = 0.13
const VEHICLE_PRICE_MIN = 5_000
const VEHICLE_PRICE_MAX = 120_000
const DOWN_PAYMENT_MAX = 50_000
const TRADE_IN_MAX = 80_000
const INTEREST_RATE_MIN = 0
const INTEREST_RATE_MAX = 30
const INTEREST_RATE_STEP = 0.01
const DESIRED_PAYMENT_MIN = 50
const DESIRED_PAYMENT_MAX = 3_000

const TERM_OPTIONS = [24, 36, 48, 60, 72, 84, 96] as const
type PaymentFrequency = "monthly" | "biweekly"

const FREQUENCY_LABELS: Record<PaymentFrequency, string> = {
  monthly: "Monthly",
  biweekly: "Bi-weekly",
}

// ---------------------------------------------------------------------------
// Calculation helpers
// ---------------------------------------------------------------------------
const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max)

const fmt = (value: number) =>
  value.toLocaleString("en-CA", { maximumFractionDigits: 0 })

interface PaymentResult {
  payment: number
  totalInterest: number
  totalLoanAmount: number
  vehiclePriceDisplay: number
  hstAmount: number
}

function computePayment(
  vehiclePrice: number,
  downPayment: number,
  tradeIn: number,
  annualRate: number,
  termMonths: number,
  frequency: PaymentFrequency,
): PaymentResult {
  const taxableAmount = Math.max(vehiclePrice - tradeIn, 0)
  const hstAmount = taxableAmount * HST_RATE
  const principal = Math.max(taxableAmount + hstAmount - downPayment, 0)

  const periodsPerYear = frequency === "biweekly" ? 26 : 12
  const totalPeriods = (termMonths / 12) * periodsPerYear
  const periodicRate = annualRate / 100 / periodsPerYear

  let periodicPayment: number
  if (principal <= 0 || totalPeriods <= 0) {
    periodicPayment = 0
  } else if (periodicRate === 0) {
    periodicPayment = principal / totalPeriods
  } else {
    periodicPayment =
      (principal * periodicRate * Math.pow(1 + periodicRate, totalPeriods)) /
      (Math.pow(1 + periodicRate, totalPeriods) - 1)
  }

  const safePmt = Number.isFinite(periodicPayment) ? periodicPayment : 0
  const totalPaid = safePmt * totalPeriods
  const totalInterest = Math.max(totalPaid - principal, 0)

  return {
    payment: safePmt,
    totalInterest,
    totalLoanAmount: principal,
    vehiclePriceDisplay: vehiclePrice,
    hstAmount,
  }
}

interface AffordabilityResult {
  vehiclePrice: number
  hstAmount: number
  totalInterest: number
  totalLoanAmount: number
}

function computeAffordability(
  desiredPayment: number,
  downPayment: number,
  tradeIn: number,
  annualRate: number,
  termMonths: number,
  frequency: PaymentFrequency,
): AffordabilityResult {
  const periodsPerYear = frequency === "biweekly" ? 26 : 12
  const totalPeriods = (termMonths / 12) * periodsPerYear
  const periodicRate = annualRate / 100 / periodsPerYear

  let presentValue: number
  if (periodicRate === 0) {
    presentValue = desiredPayment * totalPeriods
  } else {
    presentValue =
      desiredPayment *
      ((1 - Math.pow(1 + periodicRate, -totalPeriods)) / periodicRate)
  }

  const safePV = Number.isFinite(presentValue) ? presentValue : 0
  const vehiclePrice = Math.max(
    (safePV + downPayment) / (1 + HST_RATE) + tradeIn,
    0,
  )
  const taxableAmount = Math.max(vehiclePrice - tradeIn, 0)
  const hstAmount = taxableAmount * HST_RATE
  const totalLoanAmount = safePV
  const totalPaid = desiredPayment * totalPeriods
  const totalInterest = Math.max(totalPaid - totalLoanAmount, 0)

  return { vehiclePrice, hstAmount, totalInterest, totalLoanAmount }
}

// ---------------------------------------------------------------------------
// Shared input row — reduces repetition across both tabs
// ---------------------------------------------------------------------------
interface SliderInputProps {
  readonly id: string
  readonly label: string
  readonly value: number
  readonly min: number
  readonly max: number
  readonly step: number
  readonly onChange: (v: number) => void
  readonly prefix?: string
  readonly suffix?: string
}

function SliderInput({
  id,
  label,
  value,
  min,
  max,
  step,
  onChange,
  prefix = "$",
  suffix,
}: SliderInputProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <Label htmlFor={id} className="text-sm font-semibold">
          {label}
        </Label>
        <div className="flex items-center gap-1">
          {prefix && (
            <span className="text-sm text-muted-foreground">{prefix}</span>
          )}
          <Input
            id={id}
            type="number"
            value={value}
            onChange={(e) =>
              onChange(clamp(Number.parseFloat(e.target.value) || 0, min, max))
            }
            min={min}
            max={max}
            step={step}
            className="w-28 text-right tabular-nums"
          />
          {suffix && (
            <span className="text-sm text-muted-foreground">{suffix}</span>
          )}
        </div>
      </div>
      <Slider
        aria-label={label}
        value={[value]}
        onValueChange={([v]) => onChange(v)}
        min={min}
        max={max}
        step={step}
      />
      <div className="flex justify-between text-xs text-muted-foreground tabular-nums">
        <span>
          {prefix}
          {fmt(min)}
          {suffix}
        </span>
        <span>
          {prefix}
          {fmt(max)}
          {suffix}
        </span>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Summary card (right column)
// ---------------------------------------------------------------------------
interface SummaryPanelProps {
  readonly headline: string
  readonly headlineValue: string
  readonly vehiclePrice: number
  readonly hstAmount: number
  readonly totalInterest: number
  readonly totalLoanAmount: number
  readonly tradeInValue: number
  readonly downPayment: number
  readonly frequencyLabel: string
  readonly showFrequency?: boolean
}

function SummaryPanel({
  headline,
  headlineValue,
  vehiclePrice,
  hstAmount,
  totalInterest,
  totalLoanAmount,
  tradeInValue,
  downPayment,
  frequencyLabel,
  showFrequency = true,
}: SummaryPanelProps) {
  return (
    <Card className="sticky top-24 border-2 border-primary/20 shadow-xl overflow-hidden py-0 gap-0">
      <CardHeader className="bg-primary/5 text-center py-6 px-6">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          {headline}
        </p>
        <h2 className="text-4xl font-black text-primary tabular-nums mt-2">
          {headlineValue}
          {showFrequency && (
            <span className="text-base font-normal text-muted-foreground ml-1">
              /{frequencyLabel.toLowerCase()}
            </span>
          )}
        </h2>
      </CardHeader>

      <CardContent className="space-y-0 p-6">
        <div className="space-y-3 pt-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Vehicle Price</span>
            <span className="font-semibold tabular-nums">
              ${fmt(vehiclePrice)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">HST (13%)</span>
            <span className="font-semibold tabular-nums">
              ${fmt(hstAmount)}
            </span>
          </div>
          {tradeInValue > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Trade-in Value</span>
              <span className="font-semibold text-green-600 tabular-nums">
                -${fmt(tradeInValue)}
              </span>
            </div>
          )}
          {downPayment > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Down Payment</span>
              <span className="font-semibold text-green-600 tabular-nums">
                -${fmt(downPayment)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Interest Paid</span>
            <span className="font-semibold tabular-nums">
              ${fmt(totalInterest)}
            </span>
          </div>
          <div className="flex justify-between text-base font-bold pt-4 border-t border-dashed">
            <span>Total Loan Amount</span>
            <span className="tabular-nums">${fmt(totalLoanAmount)}</span>
          </div>
        </div>

        <Button
          asChild
          size="lg"
          className="w-full mt-6 rounded-full text-base py-6 bg-primary hover:bg-primary/90"
        >
          <a href="/financing/application">
            Get Pre-Approved
            <ArrowRight className="ml-2 size-4" />
          </a>
        </Button>

        <p className="text-[11px] text-muted-foreground text-center mt-3 leading-relaxed">
          For illustrative purposes only. All payment and affordability
          estimates are subject to credit approval (O.A.C.) and may vary based
          on individual creditworthiness, lender terms, and vehicle selection.
          HST (13%) is included in calculations. Applicable licensing,
          registration, and OMVIC fees are not included.
        </p>
      </CardContent>
    </Card>
  )
}

// ---------------------------------------------------------------------------
// Main calculator export
// ---------------------------------------------------------------------------
export function FinancingCalculator() {
  const [vehiclePrice, setVehiclePrice] = useState(35_000)
  const [downPayment, setDownPayment] = useState(5_000)
  const [tradeInValue, setTradeInValue] = useState(0)
  const [interestRate, setInterestRate] = useState(RATE_FLOOR)
  const [term, setTerm] = useState("72")
  const [frequency, setFrequency] = useState<PaymentFrequency>("biweekly")
  const [desiredPayment, setDesiredPayment] = useState(300)

  const termMonths = Number.parseInt(term, 10)

  function handleVehiclePriceChange(next: number) {
    setVehiclePrice(next)
    setDownPayment((prev) =>
      clamp(prev, 0, Math.min(next, DOWN_PAYMENT_MAX)),
    )
    setTradeInValue((prev) => clamp(prev, 0, Math.min(next, TRADE_IN_MAX)))
  }

  const paymentResult = useMemo(
    () =>
      computePayment(
        vehiclePrice,
        downPayment,
        tradeInValue,
        interestRate,
        termMonths,
        frequency,
      ),
    [vehiclePrice, downPayment, tradeInValue, interestRate, termMonths, frequency],
  )

  const affordResult = useMemo(
    () =>
      computeAffordability(
        desiredPayment,
        downPayment,
        tradeInValue,
        interestRate,
        termMonths,
        frequency,
      ),
    [desiredPayment, downPayment, tradeInValue, interestRate, termMonths, frequency],
  )

  const tradeInHstBenefit = tradeInValue * HST_RATE
  const frequencyLabel = FREQUENCY_LABELS[frequency]

  const sharedControls = (
    <div className="space-y-6">
      {/* Interest Rate */}
      <SliderInput
        id="calc-interest-rate"
        label="Interest Rate"
        value={interestRate}
        min={INTEREST_RATE_MIN}
        max={INTEREST_RATE_MAX}
        step={INTEREST_RATE_STEP}
        onChange={setInterestRate}
        prefix=""
        suffix="%"
      />

      {/* Term & Frequency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="calc-term" className="text-sm font-semibold">
            Loan Term
          </Label>
          <Select value={term} onValueChange={setTerm}>
            <SelectTrigger id="calc-term" aria-label="Loan term">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TERM_OPTIONS.map((t) => (
                <SelectItem key={t} value={String(t)}>
                  {t} months
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="calc-frequency" className="text-sm font-semibold">
            Payment Frequency
          </Label>
          <Select
            value={frequency}
            onValueChange={(v) => setFrequency(v as PaymentFrequency)}
          >
            <SelectTrigger id="calc-frequency" aria-label="Payment frequency">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="biweekly">Bi-weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Down Payment */}
      <SliderInput
        id="calc-down-payment"
        label="Down Payment"
        value={downPayment}
        min={0}
        max={DOWN_PAYMENT_MAX}
        step={500}
        onChange={setDownPayment}
      />

      {/* Trade-in Value */}
      <div className="space-y-3">
        <SliderInput
          id="calc-trade-in"
          label="Trade-in Value"
          value={tradeInValue}
          min={0}
          max={TRADE_IN_MAX}
          step={500}
          onChange={setTradeInValue}
        />
        {tradeInValue > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm">
            <p className="text-green-800">
              <span className="font-semibold">HST Benefit:</span> Your trade-in
              saves you an additional{" "}
              <span className="font-bold tabular-nums">
                ${fmt(tradeInHstBenefit)}
              </span>{" "}
              in HST — total credit of{" "}
              <span className="font-bold tabular-nums">
                ${fmt(tradeInValue + tradeInHstBenefit)}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <Calculator className="size-5 text-primary" />
        <h3 className="font-semibold text-lg">Payment Estimator</h3>
      </div>

      <Tabs defaultValue="payment" className="w-full">
        <TabsList className="w-full grid grid-cols-2 h-11">
          <TabsTrigger value="payment" className="text-sm">
            What&apos;s my payment?
          </TabsTrigger>
          <TabsTrigger value="afford" className="text-sm">
            What can I afford?
          </TabsTrigger>
        </TabsList>

        {/* ---- TAB 1: PAYMENT CALCULATOR ---- */}
        <TabsContent value="payment">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Left: Inputs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Vehicle Price */}
              <SliderInput
                id="calc-vehicle-price"
                label="Vehicle Price"
                value={vehiclePrice}
                min={VEHICLE_PRICE_MIN}
                max={VEHICLE_PRICE_MAX}
                step={1_000}
                onChange={handleVehiclePriceChange}
              />

              {sharedControls}
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-5">
              <SummaryPanel
                headline="Your Estimated Payment"
                headlineValue={`$${fmt(paymentResult.payment)}`}
                vehiclePrice={paymentResult.vehiclePriceDisplay}
                hstAmount={paymentResult.hstAmount}
                totalInterest={paymentResult.totalInterest}
                totalLoanAmount={paymentResult.totalLoanAmount}
                tradeInValue={tradeInValue}
                downPayment={downPayment}
                frequencyLabel={frequencyLabel}
              />
            </div>
          </div>
        </TabsContent>

        {/* ---- TAB 2: AFFORDABILITY CALCULATOR ---- */}
        <TabsContent value="afford">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-6">
            {/* Left: Inputs */}
            <div className="lg:col-span-7 space-y-6">
              {/* Desired Payment */}
              <SliderInput
                id="calc-desired-payment"
                label={`Desired ${frequencyLabel} Payment`}
                value={desiredPayment}
                min={DESIRED_PAYMENT_MIN}
                max={DESIRED_PAYMENT_MAX}
                step={10}
                onChange={setDesiredPayment}
              />

              {sharedControls}
            </div>

            {/* Right: Summary */}
            <div className="lg:col-span-5">
              <SummaryPanel
                headline="Your Estimated Budget"
                headlineValue={`$${fmt(affordResult.vehiclePrice)}`}
                vehiclePrice={affordResult.vehiclePrice}
                hstAmount={affordResult.hstAmount}
                totalInterest={affordResult.totalInterest}
                totalLoanAmount={affordResult.totalLoanAmount}
                showFrequency={false}
                tradeInValue={tradeInValue}
                downPayment={downPayment}
                frequencyLabel={frequencyLabel}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
