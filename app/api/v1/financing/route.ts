import { NextRequest, NextResponse } from 'next/server'

// Canadian lenders configuration
const lenders = [
  { id: 'td', name: 'TD Auto Finance', code: 'TD', type: 'bank', minScore: 600, maxTerm: 84, baseRate: 5.99 },
  { id: 'rbc', name: 'RBC', code: 'RBC', type: 'bank', minScore: 620, maxTerm: 84, baseRate: 6.29 },
  { id: 'scotia', name: 'Scotiabank', code: 'SCOTIA', type: 'bank', minScore: 600, maxTerm: 84, baseRate: 5.79 },
  { id: 'bmo', name: 'BMO', code: 'BMO', type: 'bank', minScore: 640, maxTerm: 72, baseRate: 6.49 },
  { id: 'cibc', name: 'CIBC', code: 'CIBC', type: 'bank', minScore: 620, maxTerm: 84, baseRate: 6.29 },
  { id: 'desjardins', name: 'Desjardins', code: 'DESJ', type: 'credit_union', minScore: 580, maxTerm: 96, baseRate: 5.49 },
]

// POST /api/v1/financing/prequalify - Soft credit pull (no score impact)
export async function POST(request: NextRequest) {
  const body = await request.json()
  
  const {
    customerId,
    vehicleId,
    employmentStatus,
    annualIncome,
    monthlyRent,
    requestedAmount,
    requestedTerm,
  } = body

  // Validate required fields
  if (!annualIncome || !requestedAmount) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_FIELDS', message: 'Annual income and requested amount are required' } },
      { status: 400 }
    )
  }

  // Simulate soft credit pull (would call Equifax/TransUnion in production)
  const creditScore = Math.floor(Math.random() * 200) + 650 // 650-850 range
  const creditBureau = Math.random() > 0.5 ? 'Equifax' : 'TransUnion'

  // Calculate debt-to-income ratio
  const monthlyIncome = annualIncome / 12
  const estimatedPayment = requestedAmount / (requestedTerm || 72)
  const dti = ((monthlyRent || 0) + estimatedPayment) / monthlyIncome

  // Determine eligibility for each lender
  const eligibleLenders = lenders
    .filter((lender) => creditScore >= lender.minScore)
    .map((lender) => {
      // Calculate rate based on credit score
      let rate = lender.baseRate
      if (creditScore >= 750) rate -= 0.5
      else if (creditScore >= 700) rate -= 0.25
      else if (creditScore < 650) rate += 0.5

      const term = Math.min(requestedTerm || 72, lender.maxTerm)
      const monthlyRate = rate / 100 / 12
      const monthlyPayment = (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
                             (Math.pow(1 + monthlyRate, term) - 1)

      return {
        lenderId: lender.id,
        lenderName: lender.name,
        lenderCode: lender.code,
        estimatedRate: rate,
        estimatedTerm: term,
        estimatedMonthlyPayment: Math.round(monthlyPayment * 100) / 100,
        prequalified: true,
        confidence: creditScore >= 700 ? 'high' : creditScore >= 650 ? 'medium' : 'low',
      }
    })
    .sort((a, b) => a.estimatedRate - b.estimatedRate)

  // Create prequalification record
  const prequalification = {
    id: `preq-${Date.now()}`,
    customerId,
    vehicleId,
    status: eligibleLenders.length > 0 ? 'prequalified' : 'declined',
    creditScore,
    creditBureau,
    creditPullType: 'soft',
    creditPullDate: new Date().toISOString(),
    dti: Math.round(dti * 100) / 100,
    eligibleLenders,
    bestOffer: eligibleLenders[0] || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({
    success: true,
    data: {
      prequalification,
      message: eligibleLenders.length > 0 
        ? `Congratulations! You're pre-qualified with ${eligibleLenders.length} lender(s).`
        : 'We were unable to pre-qualify you at this time.',
      nextSteps: eligibleLenders.length > 0
        ? ['Review your offers', 'Select a lender', 'Complete full application']
        : ['Improve credit score', 'Add co-applicant', 'Increase down payment'],
    },
  })
}

// GET /api/v1/financing/lenders - List available lenders
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      lenders: lenders.map((l) => ({
        id: l.id,
        name: l.name,
        code: l.code,
        type: l.type,
        minCreditScore: l.minScore,
        maxTermMonths: l.maxTerm,
        rateFrom: l.baseRate - 0.5,
        rateTo: l.baseRate + 1.5,
        features: l.code === 'TD' 
          ? ['Lowest rates', 'No prepayment penalty', 'Flexible terms']
          : l.code === 'DESJ'
          ? ['Longest terms available', 'Credit union rates', 'Quebec specialty']
          : ['Competitive rates', 'Fast approval', 'Online management'],
      })),
    },
  })
}
