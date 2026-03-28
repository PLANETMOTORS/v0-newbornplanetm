import { NextRequest, NextResponse } from 'next/server'

// Canadian tax rates by province
const taxRates: Record<string, { gst: number; pst: number; hst: number; total: number }> = {
  ON: { gst: 0, pst: 0, hst: 0.13, total: 0.13 },
  BC: { gst: 0.05, pst: 0.07, hst: 0, total: 0.12 },
  AB: { gst: 0.05, pst: 0, hst: 0, total: 0.05 },
  QC: { gst: 0.05, pst: 0.09975, hst: 0, total: 0.14975 },
  NS: { gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  NB: { gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  PE: { gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  MB: { gst: 0.05, pst: 0.07, hst: 0, total: 0.12 },
  SK: { gst: 0.05, pst: 0.06, hst: 0, total: 0.11 },
  NL: { gst: 0, pst: 0, hst: 0.15, total: 0.15 },
  NT: { gst: 0.05, pst: 0, hst: 0, total: 0.05 },
  YT: { gst: 0.05, pst: 0, hst: 0, total: 0.05 },
  NU: { gst: 0.05, pst: 0, hst: 0, total: 0.05 },
}

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

  // Validate
  if (!vehiclePrice || vehiclePrice <= 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_PRICE', message: 'Valid vehicle price is required' } },
      { status: 400 }
    )
  }

  const tax = taxRates[province] || taxRates.ON
  
  // Calculate fees
  const documentationFee = 499
  const omvicFee = 10
  const totalFees = documentationFee + omvicFee
  
  // Calculate subtotal
  let subtotal = vehiclePrice + totalFees
  if (includeWarranty) subtotal += warrantyPrice
  if (includeProtection) subtotal += protectionPrice
  
  // Calculate taxes
  const taxableAmount = subtotal
  const taxAmount = taxableAmount * tax.total
  
  // Calculate total before credits
  const totalBeforeCredits = subtotal + taxAmount
  
  // Apply credits
  const totalCredits = tradeInValue + downPayment
  const amountToFinance = Math.max(0, totalBeforeCredits - totalCredits)
  
  // Calculate monthly payment
  const monthlyRate = interestRate / 100 / 12
  let monthlyPayment: number
  
  if (monthlyRate === 0) {
    monthlyPayment = amountToFinance / termMonths
  } else {
    monthlyPayment = (amountToFinance * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / 
                     (Math.pow(1 + monthlyRate, termMonths) - 1)
  }
  
  // Calculate totals
  const totalPayments = monthlyPayment * termMonths
  const totalInterest = totalPayments - amountToFinance
  const totalCost = totalPayments + totalCredits
  
  // Calculate bi-weekly payment
  const biWeeklyPayment = (monthlyPayment * 12) / 26
  
  // Generate amortization schedule (first 6 months)
  const amortizationPreview = []
  let balance = amountToFinance
  
  for (let month = 1; month <= Math.min(6, termMonths); month++) {
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
        vehiclePrice,
        
        // Fees
        documentationFee,
        omvicFee,
        totalFees,
        
        // Add-ons
        warrantyPrice: includeWarranty ? warrantyPrice : 0,
        protectionPrice: includeProtection ? protectionPrice : 0,
        
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
        tradeInValue,
        downPayment,
        totalCredits,
        
        // Financing
        amountToFinance: Math.round(amountToFinance * 100) / 100,
        interestRate,
        termMonths,
        
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
        const payment = (amountToFinance * rate * Math.pow(1 + rate, term)) / 
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
        downPayment < vehiclePrice * 0.1 
          ? `Increase your down payment to $${Math.round(vehiclePrice * 0.1)} to reduce monthly payments by ~$${Math.round((vehiclePrice * 0.1 - downPayment) / termMonths)}`
          : null,
        termMonths > 60
          ? `Choosing a 60-month term instead saves $${Math.round(totalInterest * (termMonths - 60) / termMonths)} in interest`
          : null,
        tradeInValue === 0
          ? 'Trading in your current vehicle could significantly reduce your financing amount'
          : null,
      ].filter(Boolean),
    },
  })
}
