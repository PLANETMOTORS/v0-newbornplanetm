import { NextRequest, NextResponse } from 'next/server'
import { PROVINCE_TAX_RATES as taxRates } from '@/lib/tax/canada'

// POST /api/v1/financing/calculator - Calculate payments
export async function POST(request: NextRequest) {
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

  // Validate
  if (!Number.isFinite(numericVehiclePrice) || numericVehiclePrice <= 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PRICE', message: 'Valid vehicle price is required' } },
      { status: 400 }
    )
  }

  if (!Number.isFinite(numericTermMonths) || numericTermMonths < 12 || numericTermMonths > 96) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_TERM', message: 'termMonths must be between 12 and 96' } },
      { status: 400 }
    )
  }

  if (!Number.isFinite(numericInterestRate) || numericInterestRate < 0 || numericInterestRate > 29.99) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_RATE', message: 'interestRate must be between 0 and 29.99' } },
      { status: 400 }
    )
  }

  if (numericTradeInValue < 0 || numericDownPayment < 0 || numericWarrantyPrice < 0 || numericProtectionPrice < 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INPUT', message: 'Price and credit inputs cannot be negative' } },
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
