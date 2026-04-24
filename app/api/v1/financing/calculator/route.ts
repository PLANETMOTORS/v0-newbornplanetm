import { NextRequest, NextResponse } from 'next/server'
import { PROVINCE_TAX_RATES as taxRates } from '@/lib/tax/canada'
import { rateLimit } from '@/lib/redis'

type CalcInputs = {
  numericVehiclePrice: number
  numericTermMonths: number
  numericInterestRate: number
  numericTradeInValue: number
  numericDownPayment: number
  numericWarrantyPrice: number
  numericProtectionPrice: number
}

function validateCalculatorInputs(inputs: CalcInputs): string | null {
  if (!Number.isFinite(inputs.numericVehiclePrice) || inputs.numericVehiclePrice <= 0) {
    return 'Valid vehicle price is required'
  }
  if (!Number.isFinite(inputs.numericTermMonths) || inputs.numericTermMonths < 12 || inputs.numericTermMonths > 96) {
    return 'termMonths must be between 12 and 96'
  }
  if (!Number.isFinite(inputs.numericInterestRate) || inputs.numericInterestRate < 0 || inputs.numericInterestRate > 29.99) {
    return 'interestRate must be between 0 and 29.99'
  }
  if (
    inputs.numericTradeInValue < 0 ||
    inputs.numericDownPayment < 0 ||
    inputs.numericWarrantyPrice < 0 ||
    inputs.numericProtectionPrice < 0
  ) {
    return 'Price and credit inputs cannot be negative'
  }
  return null
}

function computeMonthlyPayment(amountToFinance: number, monthlyRate: number, termMonths: number): number {
  if (monthlyRate === 0) return amountToFinance / termMonths
  const factor = Math.pow(1 + monthlyRate, termMonths)
  return (amountToFinance * monthlyRate * factor) / (factor - 1)
}

function mapValidationErrorCode(message: string): string {
  if (message.includes('vehicle price')) return 'INVALID_PRICE'
  if (message.includes('termMonths')) return 'INVALID_TERM'
  if (message.includes('interestRate')) return 'INVALID_RATE'
  return 'INVALID_INPUT'
}

function buildAmortizationPreview(
  amountToFinance: number,
  monthlyRate: number,
  monthlyPayment: number,
  termMonths: number
): Array<{ month: number; payment: number; principal: number; interest: number; balance: number }> {
  const preview = []
  let balance = amountToFinance
  for (let month = 1; month <= Math.min(6, termMonths); month++) {
    const interestPayment = balance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    balance -= principalPayment
    preview.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, balance) * 100) / 100,
    })
  }
  return preview
}

function buildTermComparison(amountToFinance: number, monthlyRate: number) {
  return [48, 60, 72, 84].map((term) => {
    const payment = computeMonthlyPayment(amountToFinance, monthlyRate, term)
    const total = payment * term
    const interest = total - amountToFinance
    return {
      termMonths: term,
      monthlyPayment: Math.round(payment * 100) / 100,
      totalInterest: Math.round(interest * 100) / 100,
      totalCost: Math.round(total * 100) / 100,
    }
  })
}

function buildPaymentTips(
  downPayment: number,
  vehiclePrice: number,
  termMonths: number,
  totalInterest: number,
  tradeInValue: number
): (string | null)[] {
  return [
    downPayment < vehiclePrice * 0.1
      ? `Increase your down payment to $${Math.round(vehiclePrice * 0.1)} to reduce monthly payments by ~$${Math.round((vehiclePrice * 0.1 - downPayment) / termMonths)}`
      : null,
    termMonths > 60
      ? `Choosing a 60-month term instead saves $${Math.round(totalInterest * (termMonths - 60) / termMonths)} in interest`
      : null,
    tradeInValue === 0
      ? 'Trading in your current vehicle could significantly reduce your financing amount'
      : null,
  ]
}

// POST /api/v1/financing/calculator - Calculate payments
export async function POST(request: NextRequest) {
  // Rate limit: 30 calculations per hour per IP
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`calc:${ip}`, 30, 3600)
  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      { status: 429 }
    )
  }

  const body = await request.json()
  
  const {
    vehiclePrice,
    tradeInValue = 0,
    downPayment = 0,
    interestRate = 5.99,
    termMonths = 72,
    province = 'ON',
    includeWarranty = false,
    warrantyPrice = 0,
    includeProtection = false,
    protectionPrice = 0,
  } = body

  const numericVehiclePrice = Number(vehiclePrice)
  const numericTradeInValue = Number(tradeInValue)
  const numericDownPayment = Number(downPayment)
  const numericInterestRate = Number(interestRate)
  const numericTermMonths = Number(termMonths)
  const numericWarrantyPrice = Number(warrantyPrice)
  const numericProtectionPrice = Number(protectionPrice)

  const inputs: CalcInputs = {
    numericVehiclePrice,
    numericTermMonths,
    numericInterestRate,
    numericTradeInValue,
    numericDownPayment,
    numericWarrantyPrice,
    numericProtectionPrice,
  }

  const validationError = validateCalculatorInputs(inputs)
  if (validationError) {
    return NextResponse.json(
      { success: false, error: { code: mapValidationErrorCode(validationError), message: validationError } },
      { status: 400 }
    )
  }

  const tax = taxRates[province] || taxRates.ON
  
  // Calculate fees
  const documentationFee = 499
  const omvicFee = 10
  const totalFees = documentationFee + omvicFee
  
  // Calculate subtotal
  let subtotal = numericVehiclePrice + totalFees
  if (includeWarranty) subtotal += numericWarrantyPrice
  if (includeProtection) subtotal += numericProtectionPrice
  
  // Calculate taxes
  const taxableAmount = subtotal
  const taxAmount = taxableAmount * tax.total
  
  // Calculate total before credits
  const totalBeforeCredits = subtotal + taxAmount
  
  // Apply credits
  const totalCredits = numericTradeInValue + numericDownPayment
  const amountToFinance = Math.max(0, totalBeforeCredits - totalCredits)
  
  // Calculate monthly payment
  const monthlyRate = numericInterestRate / 100 / 12
  const monthlyPayment = computeMonthlyPayment(amountToFinance, monthlyRate, numericTermMonths)
  
  // Calculate totals
  const totalPayments = monthlyPayment * numericTermMonths
  const totalInterest = totalPayments - amountToFinance
  const totalCost = totalPayments + totalCredits
  
  // Calculate bi-weekly payment
  const biWeeklyPayment = (monthlyPayment * 12) / 26
  
  // Generate amortization schedule (first 6 months)
  const amortizationPreview = buildAmortizationPreview(amountToFinance, monthlyRate, monthlyPayment, numericTermMonths)

  return NextResponse.json({
    success: true,
    data: {
      calculation: {
        // Vehicle
        vehiclePrice: numericVehiclePrice,
        
        // Fees
        documentationFee,
        omvicFee,
        totalFees,
        
        // Add-ons
        warrantyPrice: includeWarranty ? numericWarrantyPrice : 0,
        protectionPrice: includeProtection ? numericProtectionPrice : 0,
        
        // Subtotal
        subtotal,
        
        // Taxes
        province,
        taxRate: tax.total,
        taxBreakdown: {
          gst: tax.gst > 0 ? Math.round(taxableAmount * tax.gst * 100) / 100 : 0,
          pst: tax.pst > 0 ? Math.round(taxableAmount * tax.pst * 100) / 100 : 0,
          hst: tax.hst > 0 ? Math.round(taxableAmount * tax.hst * 100) / 100 : 0,
        },
        taxAmount: Math.round(taxAmount * 100) / 100,
        
        // Total
        totalBeforeCredits: Math.round(totalBeforeCredits * 100) / 100,
        
        // Credits
        tradeInValue: numericTradeInValue,
        downPayment: numericDownPayment,
        totalCredits,
        
        // Financing
        amountToFinance: Math.round(amountToFinance * 100) / 100,
        interestRate: numericInterestRate,
        termMonths: numericTermMonths,
        
        // Payments
        monthlyPayment: Math.round(monthlyPayment * 100) / 100,
        biWeeklyPayment: Math.round(biWeeklyPayment * 100) / 100,
        
        // Totals
        totalInterest: Math.round(totalInterest * 100) / 100,
        totalPayments: Math.round(totalPayments * 100) / 100,
        totalCost: Math.round(totalCost * 100) / 100,
      },
      
      amortizationPreview,
      termComparison: buildTermComparison(amountToFinance, monthlyRate),
      tips: buildPaymentTips(numericDownPayment, numericVehiclePrice, numericTermMonths, totalInterest, numericTradeInValue).filter(Boolean),
    },
  })
}
