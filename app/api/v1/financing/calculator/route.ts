import { NextRequest, NextResponse } from 'next/server'
import { PROVINCE_TAX_RATES as taxRates } from '@/lib/tax/canada'
import { rateLimit } from '@/lib/redis'

type ValidatedInputs = {
  vehiclePrice: number
  tradeInValue: number
  downPayment: number
  interestRate: number
  termMonths: number
  warrantyPrice: number
  protectionPrice: number
  includeWarranty: boolean
  includeProtection: boolean
  province: string
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateCalculatorInputs(body: any): { ok: true; v: ValidatedInputs } | { ok: false; res: NextResponse } {
  const v: ValidatedInputs = {
    vehiclePrice: Number(body.vehiclePrice),
    tradeInValue: Number(body.tradeInValue ?? 0),
    downPayment: Number(body.downPayment ?? 0),
    interestRate: Number(body.interestRate ?? 5.99),
    termMonths: Number(body.termMonths ?? 72),
    warrantyPrice: Number(body.warrantyPrice ?? 0),
    protectionPrice: Number(body.protectionPrice ?? 0),
    includeWarranty: !!body.includeWarranty,
    includeProtection: !!body.includeProtection,
    province: body.province ?? 'ON',
  }
  if (!Number.isFinite(v.vehiclePrice) || v.vehiclePrice <= 0) {
    return { ok: false, res: jsonError('INVALID_PRICE', 'Valid vehicle price is required', 400) }
  }
  if (!Number.isFinite(v.termMonths) || v.termMonths < 12 || v.termMonths > 96) {
    return { ok: false, res: jsonError('INVALID_TERM', 'termMonths must be between 12 and 96', 400) }
  }
  if (!Number.isFinite(v.interestRate) || v.interestRate < 0 || v.interestRate > 29.99) {
    return { ok: false, res: jsonError('INVALID_RATE', 'interestRate must be between 0 and 29.99', 400) }
  }
  if (v.tradeInValue < 0 || v.downPayment < 0 || v.warrantyPrice < 0 || v.protectionPrice < 0) {
    return { ok: false, res: jsonError('INVALID_INPUT', 'Price and credit inputs cannot be negative', 400) }
  }
  return { ok: true, v }
}

// POST /api/v1/financing/calculator - Calculate payments
export async function POST(request: NextRequest) {
  const forwarded = request.headers.get("x-forwarded-for") || ""
  const ip = forwarded.split(",")[0]?.trim() || "unknown"
  const limiter = await rateLimit(`calc:${ip}`, 30, 3600)
  if (!limiter.success) {
    return jsonError('RATE_LIMITED', 'Too many requests. Please try again later.', 429)
  }

  const body = await request.json()
  const validation = validateCalculatorInputs(body)
  if (!validation.ok) return validation.res
  const { v } = validation
  const {
    vehiclePrice: numericVehiclePrice,
    tradeInValue: numericTradeInValue,
    downPayment: numericDownPayment,
    interestRate: numericInterestRate,
    termMonths: numericTermMonths,
    warrantyPrice: numericWarrantyPrice,
    protectionPrice: numericProtectionPrice,
    includeWarranty,
    includeProtection,
    province,
  } = v

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
  let monthlyPayment: number
  
  if (monthlyRate === 0) {
    monthlyPayment = amountToFinance / numericTermMonths
  } else {
    monthlyPayment = (amountToFinance * monthlyRate * Math.pow(1 + monthlyRate, numericTermMonths)) /
                     (Math.pow(1 + monthlyRate, numericTermMonths) - 1)
  }
  
  // Calculate totals
  const totalPayments = monthlyPayment * numericTermMonths
  const totalInterest = totalPayments - amountToFinance
  const totalCost = totalPayments + totalCredits
  
  // Calculate bi-weekly payment
  const biWeeklyPayment = (monthlyPayment * 12) / 26
  
  // Generate amortization schedule (first 6 months)
  const amortizationPreview = []
  let balance = amountToFinance
  
  for (let month = 1; month <= Math.min(6, numericTermMonths); month++) {
    const interestPayment = balance * monthlyRate
    const principalPayment = monthlyPayment - interestPayment
    balance -= principalPayment
    
    amortizationPreview.push({
      month,
      payment: Math.round(monthlyPayment * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, balance) * 100) / 100,
    })
  }

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
      
      // Comparison at different terms
      termComparison: [48, 60, 72, 84].map((term) => {
        const rate = monthlyRate
        const payment = rate === 0
          ? amountToFinance / term
          : (amountToFinance * rate * Math.pow(1 + rate, term)) /
            (Math.pow(1 + rate, term) - 1)
        const total = payment * term
        const interest = total - amountToFinance
        
        return {
          termMonths: term,
          monthlyPayment: Math.round(payment * 100) / 100,
          totalInterest: Math.round(interest * 100) / 100,
          totalCost: Math.round(total * 100) / 100,
        }
      }),
      
      // Savings tips
      tips: [
        numericDownPayment < numericVehiclePrice * 0.1
          ? `Increase your down payment to $${Math.round(numericVehiclePrice * 0.1)} to reduce monthly payments by ~$${Math.round((numericVehiclePrice * 0.1 - numericDownPayment) / numericTermMonths)}`
          : null,
        numericTermMonths > 60
          ? `Choosing a 60-month term instead saves $${Math.round(totalInterest * (numericTermMonths - 60) / numericTermMonths)} in interest`
          : null,
        numericTradeInValue === 0
          ? 'Trading in your current vehicle could significantly reduce your financing amount'
          : null,
      ].filter(Boolean),
    },
  })
}
