import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST /api/v1/financing/apply - Full application (hard pull)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  
  const {
    customerId,
    vehicleId,
    prequalificationId,
    selectedLenderIds,
    
    // Personal Info
    firstName,
    lastName,
    email,
    phone,
    dateOfBirth,
    sin, // Social Insurance Number (encrypted in production)
    
    // Address
    streetAddress,
    city,
    province,
    postalCode,
    residenceStatus, // own, rent, other
    monthlyPayment,
    yearsAtAddress,
    
    // Employment
    employmentStatus, // employed, self-employed, retired, other
    employerName,
    jobTitle,
    employmentYears,
    annualIncome,
    
    // Loan Details
    requestedAmount,
    requestedTerm,
    downPayment,
    tradeInId,
  } = body

  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'annualIncome', 'requestedAmount']
  const missingFields = requiredFields.filter((field) => !body[field])
  
  if (missingFields.length > 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: { 
          code: 'MISSING_FIELDS', 
          message: `Missing required fields: ${missingFields.join(', ')}` 
        } 
      },
      { status: 400 }
    )
  }

  if (customerId) {
    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required when customerId is provided' } },
        { status: 401 }
      )
    }

    if (customerId !== user.id) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'customerId must match authenticated user' } },
        { status: 403 }
      )
    }
  }

  // Hard credit pull - estimate based on income and employment
  const creditScore = annualIncome >= 100000 ? 780 : annualIncome >= 70000 ? 730 : annualIncome >= 50000 ? 700 : 670
  const creditReport = {
    score: creditScore,
    bureau: 'Equifax',
    pullType: 'hard',
    pullDate: new Date().toISOString(),
    accounts: 6,
    inquiries: 1,
    derogatory: 0,
    utilizationRate: 22,
  }

  // Create application
  const applicationNumber = `PM-${Date.now().toString(36).toUpperCase()}`
  
  // Simulate submitting to selected lenders and getting offers
  const offers = (selectedLenderIds || ['td', 'rbc', 'scotia']).map((lenderId: string) => {
    const lenderConfig: Record<string, any> = {
      td: { name: 'TD Auto Finance', baseRate: 5.99, maxTerm: 84 },
      rbc: { name: 'RBC', baseRate: 6.29, maxTerm: 84 },
      scotia: { name: 'Scotiabank', baseRate: 5.79, maxTerm: 84 },
      bmo: { name: 'BMO', baseRate: 6.49, maxTerm: 72 },
      cibc: { name: 'CIBC', baseRate: 6.29, maxTerm: 84 },
      desjardins: { name: 'Desjardins', baseRate: 5.49, maxTerm: 96 },
    }
    
    const lender = lenderConfig[lenderId] || lenderConfig.td
    
    // Calculate rate based on credit score
    let rate = lender.baseRate
    if (creditScore >= 750) rate -= 0.75
    else if (creditScore >= 700) rate -= 0.5
    else if (creditScore >= 650) rate -= 0.25
    else if (creditScore < 620) rate += 1.0
    
    const term = Math.min(requestedTerm || 72, lender.maxTerm)
    const amount = requestedAmount - (downPayment || 0)
    const monthlyRate = rate / 100 / 12
    const monthlyPayment = (amount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                           (Math.pow(1 + monthlyRate, term) - 1)
    const totalInterest = (monthlyPayment * term) - amount
    const totalCost = monthlyPayment * term

    return {
      id: `offer-${lenderId}-${Date.now()}`,
      lenderId,
      lenderName: lender.name,
      status: creditScore >= 650 ? 'approved' : 'pending',
      approvedAmount: amount,
      interestRate: Math.round(rate * 100) / 100,
      termMonths: term,
      monthlyPayment: Math.round(monthlyPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      downPaymentRequired: downPayment || 0,
      conditions: creditScore < 650 ? ['Proof of income required', 'Additional references needed'] : [],
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      receivedAt: new Date().toISOString(),
    }
  }).sort((a: any, b: any) => a.interestRate - b.interestRate)

  const application = {
    id: `app-${Date.now()}`,
    applicationNumber,
    customerId: user?.id || null,
    vehicleId,
    status: 'submitted',
    applicationType: 'full',
    
    // Credit
    creditScore: creditReport.score,
    creditBureau: creditReport.bureau,
    creditPullType: creditReport.pullType,
    creditPullDate: creditReport.pullDate,
    
    // Employment
    employmentStatus,
    employerName,
    jobTitle,
    employmentYears,
    annualIncome,
    
    // Residence
    residenceStatus,
    monthlyRent: monthlyPayment,
    residenceYears: yearsAtAddress,
    
    // Loan
    requestedAmount,
    requestedTerm,
    downPayment: downPayment || 0,
    tradeInId,
    
    // Offers
    offers,
    bestOffer: offers[0],
    
    // Timestamps
    submittedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  return NextResponse.json({
    success: true,
    data: {
      application,
      message: `Your application ${applicationNumber} has been submitted to ${offers.length} lender(s).`,
      nextSteps: [
        'Review your offers below',
        'Select the best offer for you',
        'Complete e-signature documents',
        'Schedule your delivery',
      ],
    },
  })
}
