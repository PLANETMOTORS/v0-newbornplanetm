"use client"

import { useState, useEffect, useMemo } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calculator, Car, DollarSign, Calendar, Percent, CreditCard, FileText, ChevronDown, ChevronUp, Info, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { createClient } from "@/lib/supabase/client"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import { safeNum } from "@/lib/pricing/format"

const HST_RATE = PROVINCE_TAX_RATES.ON.hst

// Loan term options in months
const LOAN_TERMS = [24, 36, 48, 60, 72, 84, 96]

// Payment frequency options
const PAYMENT_FREQUENCIES = [
  { value: "weekly", label: "Weekly", paymentsPerYear: 52 },
  { value: "biweekly", label: "Bi-Weekly", paymentsPerYear: 26 },
  { value: "semimonthly", label: "Semi-Monthly", paymentsPerYear: 24 },
  { value: "monthly", label: "Monthly", paymentsPerYear: 12 },
]

interface Vehicle {
  id: string
  stock_number: string
  vin: string
  year: number
  make: string
  model: string
  trim: string | null
  body_style: string
  exterior_color: string
  interior_color: string
  price: number
  mileage: number
  drivetrain: string
  transmission: string
  fuel_type: string
  primary_image_url: string | null
}

export default function FinanceCalculatorPage() {
  const params = useParams()
  useRouter()
  const searchParams = useSearchParams()
  const vehicleId = params.vehicleId as string

  // Vehicle data
  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)

  // Check for trade-in value from URL (from AI instant quote)
  const urlTradeIn = searchParams.get("tradeIn")
  const urlQuoteId = searchParams.get("quoteId")
  const urlTradeInVehicle = searchParams.get("tradeInVehicle")

  // Finance calculator state
  const [agreementType, setAgreementType] = useState<"finance" | "cash">("finance")
  const [downPayment, setDownPayment] = useState(0)
  const [tradeInValue, setTradeInValue] = useState(urlTradeIn ? (parseInt(urlTradeIn) || 0) : 0)
  const [hasTradeIn, setHasTradeIn] = useState(!!urlTradeIn)
  const [tradeInVehicleInfo] = useState(urlTradeInVehicle ? decodeURIComponent(urlTradeInVehicle) : "")
  const [interestRate, setInterestRate] = useState(7.99)
  const [adminFee, setAdminFee] = useState(895) // Finance Docs Fee
  const [omvicFee] = useState(22) // OMVIC Fee - fixed
  const [certificationFee] = useState(595) // Certification Fee
  const [licensingFee] = useState(59) // Licensing Fee - fixed
  const [deliveryFee] = useState(0) // Delivery Fee - conditional
  const [loanTerm, setLoanTerm] = useState(60)
  const [paymentFrequency, setPaymentFrequency] = useState("biweekly")
  const [showAmortization, setShowAmortization] = useState(false)

  // Fetch vehicle data
  useEffect(() => {
    async function fetchVehicle() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("vehicles")
        .select("*")
        .eq("id", vehicleId)
        .single()

      if (error || !data) {
        console.error("Error fetching vehicle:", error)
        setLoading(false)
        return
      }

      setVehicle(data)
      setLoading(false)
    }

    fetchVehicle()
  }, [vehicleId])

  // Calculate finance details
  const financeDetails = useMemo(() => {
    if (!vehicle) return null

    const vehiclePrice = safeNum(vehicle.price) / 100 // Convert from cents
    
    // Admin fee ($895 Finance Docs Fee) ONLY applies when financing, NOT for cash
    const applicableAdminFee = agreementType === "finance" ? adminFee : 0
    
    // All fees that apply on top of vehicle price
    const totalFees = applicableAdminFee + omvicFee + certificationFee + licensingFee + deliveryFee
    
    // HST applies to vehicle price + all fees
    const subtotalForHst = vehiclePrice + totalFees
    const hstAmount = subtotalForHst * HST_RATE
    const totalBeforeCredits = vehiclePrice + hstAmount + totalFees
    const totalCredits = downPayment + (hasTradeIn ? tradeInValue : 0)
    const amountToFinance = Math.max(0, totalBeforeCredits - totalCredits)

    // Get payment frequency details
    const frequency = PAYMENT_FREQUENCIES.find(f => f.value === paymentFrequency) || PAYMENT_FREQUENCIES[1]
    const paymentsPerYear = frequency.paymentsPerYear
    const totalPayments = (loanTerm / 12) * paymentsPerYear

    // Calculate payment using amortization formula
    const periodicRate = (interestRate / 100) / paymentsPerYear
    let payment = 0
    let totalInterest = 0

    if (agreementType === "finance" && amountToFinance > 0 && periodicRate > 0) {
      payment = amountToFinance * (periodicRate * Math.pow(1 + periodicRate, totalPayments)) / (Math.pow(1 + periodicRate, totalPayments) - 1)
      totalInterest = (payment * totalPayments) - amountToFinance
    } else if (agreementType === "cash") {
      payment = 0
      totalInterest = 0
    }

    const totalCostOfBorrowing = amountToFinance + totalInterest

    return {
      vehiclePrice,
      hstAmount,
      adminFee: applicableAdminFee,
      omvicFee,
      certificationFee,
      licensingFee,
      deliveryFee,
      totalFees,
      totalBeforeCredits,
      downPayment,
      tradeInValue: hasTradeIn ? tradeInValue : 0,
      totalCredits,
      amountToFinance,
      interestRate,
      loanTerm,
      paymentFrequency: frequency.label,
      paymentsPerYear,
      totalPayments,
      payment,
      totalInterest,
      totalCostOfBorrowing,
    }
  }, [vehicle, downPayment, tradeInValue, hasTradeIn, interestRate, adminFee, omvicFee, certificationFee, licensingFee, deliveryFee, loanTerm, paymentFrequency, agreementType])

  // Generate amortization schedule (yearly summary)
  const amortizationSchedule = useMemo(() => {
    if (!financeDetails || agreementType === "cash") return []

    const schedule: Array<{
      year: number
      principalPaid: number
      interestPaid: number
      balance: number
    }> = []

    const frequency = PAYMENT_FREQUENCIES.find(f => f.value === paymentFrequency) || PAYMENT_FREQUENCIES[1]
    const paymentsPerYear = frequency.paymentsPerYear
    const periodicRate = (interestRate / 100) / paymentsPerYear
    let balance = financeDetails.amountToFinance
    const payment = financeDetails.payment

    const years = Math.ceil(loanTerm / 12)

    for (let year = 1; year <= years; year++) {
      let yearlyPrincipal = 0
      let yearlyInterest = 0
      const paymentsThisYear = year === years ? (loanTerm % 12 || 12) * (paymentsPerYear / 12) : paymentsPerYear

      for (let p = 0; p < paymentsThisYear && balance > 0; p++) {
        const interestPayment = balance * periodicRate
        const principalPayment = Math.min(payment - interestPayment, balance)
        
        yearlyInterest += interestPayment
        yearlyPrincipal += principalPayment
        balance = Math.max(0, balance - principalPayment)
      }

      schedule.push({
        year,
        principalPaid: yearlyPrincipal,
        interestPaid: yearlyInterest,
        balance: Math.max(0, balance),
      })

      if (balance <= 0) break
    }

    return schedule
  }, [financeDetails, interestRate, loanTerm, paymentFrequency, agreementType])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading vehicle...</div>
      </div>
    )
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-muted-foreground">Vehicle not found</p>
        <Button asChild>
          <Link href="/inventory">Back to Inventory</Link>
        </Button>
      </div>
    )
  }

  const vehicleName = `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ` ${vehicle.trim}` : ""}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/vehicles/${vehicleId}`}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Vehicle
              </Link>
            </Button>
            <div className="flex items-center gap-2">
              <Calculator className="w-5 h-5 text-primary" />
              <span className="font-semibold">Finance Calculator</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 lg:py-8">
        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Vehicle Info & Calculator Inputs */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vehicle Card */}
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Car className="w-5 h-5" />
                  Vehicle Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="relative w-full sm:w-48 h-32 rounded-lg overflow-hidden bg-muted shrink-0">
                    <Image
                      src={vehicle.primary_image_url || "https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=400"}
                      alt={vehicleName}
                      fill
                      className="object-cover"
                      unoptimized={vehicle.primary_image_url?.includes('unsplash') || false}
                    />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h2 className="text-xl font-bold">{vehicleName}</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                      <div className="text-muted-foreground">Stock #:</div>
                      <div className="font-semibold">{vehicle.stock_number}</div>
                      <div className="text-muted-foreground">VIN:</div>
                      <div className="font-semibold font-mono text-xs">{vehicle.vin}</div>
                      <div className="text-muted-foreground">Colour:</div>
                      <div className="font-semibold">{vehicle.exterior_color}</div>
                      <div className="text-muted-foreground">Mileage:</div>
                      <div className="font-semibold">{vehicle.mileage.toLocaleString()} km</div>
                    </div>
                    <div className="pt-2">
                      <Badge variant={vehicle.fuel_type === "Electric" ? "default" : "secondary"}>
                        {vehicle.fuel_type}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Finance Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Payment Options
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Agreement Type */}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Agreement Type</Label>
                  <Tabs value={agreementType} onValueChange={(v) => setAgreementType(v as "finance" | "cash")}>
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="finance">Finance</TabsTrigger>
                      <TabsTrigger value="cash">Cash</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>

                <Separator />

                {/* Price & Tax */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="vehiclePrice">Vehicle Price</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="vehiclePrice"
                        value={(safeNum(vehicle.price) / 100).toLocaleString()}
                        disabled
                        className="pl-9 bg-muted"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="salesTax">Sales Tax (HST)</Label>
                    <div className="relative mt-1.5">
                      <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="salesTax"
                        value="13"
                        disabled
                        className="pl-9 bg-muted"
                      />
                    </div>
                  </div>
                </div>

                {/* Down Payment & Trade-in */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="downPayment">Down Payment</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="downPayment"
                        type="number"
                        min="0"
                        value={downPayment || ""}
                        onChange={(e) => setDownPayment(Number(e.target.value) || 0)}
                        className="pl-9"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="adminFee">Finance Docs Fee</Label>
                    <div className="relative mt-1.5">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="adminFee"
                        type="number"
                        min="0"
                        value={adminFee}
                        onChange={(e) => setAdminFee(Number(e.target.value) || 0)}
                        className="pl-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Trade-in */}
                <div className="space-y-3">
                  {/* Show AI Quote Banner if trade-in came from URL */}
                  {urlQuoteId && urlTradeIn && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="font-semibold text-green-800">AI Instant Quote Applied</span>
                      </div>
                      <div className="text-sm text-green-700">
                        <p className="font-semibold">Quote ID: {urlQuoteId}</p>
                        {tradeInVehicleInfo && <p>Trade-In: {tradeInVehicleInfo}</p>}
                        <p className="text-lg font-bold mt-1">${tradeInValue.toLocaleString()} applied to your purchase</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasTradeIn"
                      checked={hasTradeIn}
                      onCheckedChange={(checked) => setHasTradeIn(checked === true)}
                    />
                    <Label htmlFor="hasTradeIn" className="cursor-pointer">I have a trade-in vehicle</Label>
                  </div>
                  {hasTradeIn && (
                    <div>
                      <Label htmlFor="tradeInValue">Trade-in Value</Label>
                      <div className="relative mt-1.5">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="tradeInValue"
                          type="number"
                          min="0"
                          value={tradeInValue || ""}
                          onChange={(e) => setTradeInValue(Number(e.target.value) || 0)}
                          className="pl-9"
                          placeholder="0"
                        />
                      </div>
                      {tradeInVehicleInfo && (
                        <p className="text-xs text-muted-foreground mt-1">{tradeInVehicleInfo}</p>
                      )}
                    </div>
                  )}
                </div>

                {agreementType === "finance" && (
                  <>
                    <Separator />

                    {/* Interest Rate */}
                    <div>
                      <Label htmlFor="interestRate">Interest Rate (APR)</Label>
                      <div className="relative mt-1.5">
                        <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="interestRate"
                          type="number"
                          min="0"
                          max="30"
                          step="0.01"
                          value={interestRate}
                          onChange={(e) => setInterestRate(Number(e.target.value) || 0)}
                          className="pl-9"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Rate subject to credit approval. OAC.
                      </p>
                    </div>

                    {/* Loan Term */}
                    <div>
                      <Label className="mb-3 block">Loan Term (Months)</Label>
                      <div className="flex flex-wrap gap-2">
                        {LOAN_TERMS.map((term) => (
                          <Button
                            key={term}
                            variant={loanTerm === term ? "default" : "outline"}
                            size="sm"
                            onClick={() => setLoanTerm(term)}
                            className="min-w-[60px]"
                          >
                            {term}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Payment Frequency */}
                    <div>
                      <Label htmlFor="paymentFrequency">Payment Frequency</Label>
                      <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_FREQUENCIES.map((freq) => (
                            <SelectItem key={freq.value} value={freq.value}>
                              {freq.label} ({freq.paymentsPerYear} payments/year)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Amortization Schedule */}
            {agreementType === "finance" && amortizationSchedule.length > 0 && (
              <Card>
                <CardHeader
                  className="cursor-pointer"
                  onClick={() => setShowAmortization(!showAmortization)}
                >
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Amortization Schedule
                    </span>
                    {showAmortization ? (
                      <ChevronUp className="w-5 h-5" />
                    ) : (
                      <ChevronDown className="w-5 h-5" />
                    )}
                  </CardTitle>
                </CardHeader>
                {showAmortization && (
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Year</th>
                            <th className="text-right py-2 font-medium">Principal</th>
                            <th className="text-right py-2 font-medium">Interest</th>
                            <th className="text-right py-2 font-medium">Balance</th>
                          </tr>
                        </thead>
                        <tbody>
                          {amortizationSchedule.map((row) => (
                            <tr key={row.year} className="border-b last:border-0">
                              <td className="py-2">Year {row.year}</td>
                              <td className="text-right py-2">${row.principalPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="text-right py-2">${row.interestPaid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                              <td className="text-right py-2">${row.balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                )}
              </Card>
            )}
          </div>

          {/* Right Column - Payment Summary (Sticky) */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24 space-y-6">
              {/* Payment Card */}
              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-center">
                    {agreementType === "finance" ? "Your Payment" : "Total Price"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  {agreementType === "finance" && financeDetails ? (
                    <>
                      <div className="text-4xl font-bold text-primary mb-1">
                        ${financeDetails.payment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {financeDetails.paymentFrequency} for {loanTerm} months
                      </div>
                    </>
                  ) : (
                    <div className="text-4xl font-bold text-primary mb-1">
                      ${financeDetails?.totalBeforeCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Loan Breakdown */}
              {financeDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Loan Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Vehicle Price</span>
                      <span>${financeDetails.vehiclePrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {agreementType === "finance" && financeDetails.adminFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Finance Docs Fee</span>
                        <span className="text-primary">+${financeDetails.adminFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">OMVIC Fee</span>
                      <span>+${financeDetails.omvicFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Certification Fee</span>
                      <span>+${financeDetails.certificationFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Licensing Fee</span>
                      <span>+${financeDetails.licensingFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {financeDetails.deliveryFee > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Delivery Fee</span>
                        <span>+${financeDetails.deliveryFee.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">HST ({(HST_RATE * 100).toFixed(0)}%)</span>
                      <span>+${financeDetails.hstAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-sm font-semibold">
                      <span>Total Before Credits</span>
                      <span>${financeDetails.totalBeforeCredits.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {financeDetails.totalCredits > 0 && (
                      <>
                        {financeDetails.downPayment > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Down Payment</span>
                            <span>-${financeDetails.downPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                        {financeDetails.tradeInValue > 0 && (
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Trade-in Value</span>
                            <span>-${financeDetails.tradeInValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                          </div>
                        )}
                      </>
                    )}
                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>{agreementType === "finance" ? "Amount to Finance" : "Amount Due"}</span>
                      <span className="text-primary">${financeDetails.amountToFinance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    {agreementType === "finance" && (
                      <>
                        <Separator />
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Total Interest</span>
                          <span>${financeDetails.totalInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                        <div className="flex justify-between text-sm font-semibold">
                          <span>Total Cost of Borrowing</span>
                          <span>${financeDetails.totalCostOfBorrowing.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* CTA Buttons */}
              <div className="space-y-3">
                {agreementType === "finance" ? (
                  <Button className="w-full h-12 text-base" size="lg" asChild>
                    <Link href={`/financing/application?vehicleId=${vehicleId}${urlTradeIn ? `&tradeIn=${urlTradeIn}&quoteId=${urlQuoteId || ''}&tradeInVehicle=${encodeURIComponent(urlTradeInVehicle || '')}` : ''}`}>
                      <CreditCard className="w-5 h-5 mr-2" />
                      Apply for Financing
                    </Link>
                  </Button>
                ) : (
                  <Button className="w-full h-12 text-base" size="lg" asChild>
                    <Link href={`/checkout/${vehicleId}/payment`}>
                      <DollarSign className="w-5 h-5 mr-2" />
                      Reserve for $250 Deposit
                    </Link>
                  </Button>
                )}
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/vehicles/${vehicleId}`}>
                    <FileText className="w-4 h-4 mr-2" />
                    Back to Vehicle Details
                  </Link>
                </Button>
              </div>

              {/* Info Note */}
              <div className="flex gap-2 p-3 bg-muted rounded-lg text-xs text-muted-foreground">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <p>
                  Payment calculations are estimates only. Final terms subject to credit approval. 
                  All prices include applicable taxes. OAC (On Approved Credit).
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
