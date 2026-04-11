import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { cacheIdempotentResponse, getCachedIdempotentResponse, rateLimit } from '@/lib/redis'

// Partner lenders configuration
const lenders = [
  { id: 'lender_a', name: 'Partner Lender A', code: 'PLA', type: 'bank', minScore: 600, maxTerm: 84, baseRate: 6.29 },
  { id: 'lender_b', name: 'Partner Lender B', code: 'PLB', type: 'bank', minScore: 620, maxTerm: 84, baseRate: 6.49 },
  { id: 'lender_c', name: 'Partner Lender C', code: 'PLC', type: 'bank', minScore: 600, maxTerm: 84, baseRate: 6.79 },
  { id: 'lender_d', name: 'Partner Lender D', code: 'PLD', type: 'bank', minScore: 640, maxTerm: 72, baseRate: 6.99 },
  { id: 'lender_e', name: 'Partner Lender E', code: 'PLE', type: 'bank', minScore: 620, maxTerm: 84, baseRate: 7.29 },
  { id: 'lender_f', name: 'Partner Lender F', code: 'PLF', type: 'credit_union', minScore: 580, maxTerm: 96, baseRate: 7.49 },
]

// POST /api/v1/financing/prequalify - Soft credit pull (no score impact)
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const body = await request.json()
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  const idempotencyKey = request.headers.get('idempotency-key') || request.headers.get('x-idempotency-key')
  
  const {
    customerId,
    vehicleId,
    employmentStatus,
    annualIncome,
    monthlyRent,
    requestedAmount,
    requestedTerm,
    email,
  } = body

  const limiterIdentity = typeof email === 'string' && email.trim().length > 0
    ? `financing-prequal:${ip}:${email.trim().toLowerCase()}`
    : `financing-prequal:${ip}`
  const limiter = await rateLimit(limiterIdentity, 12, 3600)
  if (!limiter.success) {
    return NextResponse.json(
      { success: false, error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
      { status: 429 }
    )
  }

  // Validate required fields
  if (!annualIncome || !requestedAmount) {
    return NextResponse.json(
      { success: false, error: { code: 'MISSING_FIELDS', message: 'Annual income and requested amount are required' } },
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

  const normalizedTerm = Math.max(12, Math.min(Number(requestedTerm || 72), 96))
  const normalizedRequestedAmount = Number(requestedAmount || 0)
  const normalizedIncome = Number(annualIncome || 0)

  if (!Number.isFinite(normalizedRequestedAmount) || normalizedRequestedAmount <= 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_AMOUNT', message: 'Requested amount must be a positive number' } },
      { status: 400 }
    )
  }

  if (!Number.isFinite(normalizedIncome) || normalizedIncome <= 0) {
    return NextResponse.json(
      { success: false, error: { code: 'INVALID_INCOME', message: 'Annual income must be a positive number' } },
      { status: 400 }
    )
  }

  const replayCacheKey = idempotencyKey
    ? `financing-prequal:${idempotencyKey}:${normalizedRequestedAmount}:${normalizedIncome}:${normalizedTerm}`
    : null

  if (replayCacheKey) {
    const cached = await getCachedIdempotentResponse<Record<string, unknown>>(replayCacheKey)
    if (cached) {
      return NextResponse.json(
        {
          ...cached,
          idempotency: { key: idempotencyKey, replay: true },
        },
        { headers: { 'x-idempotent-replay': 'true' } }
      )
    }
  }

  // Heuristic income-based prequalification estimate. No bureau pull is performed here.
  const creditScore = normalizedIncome >= 80000 ? 750 : normalizedIncome >= 50000 ? 700 : 680
  const creditBureau = null

  // Calculate debt-to-income ratio
  const monthlyIncome = normalizedIncome / 12
  const estimatedPayment = normalizedRequestedAmount / normalizedTerm
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

      const term = Math.min(normalizedTerm, lender.maxTerm)
      const monthlyRate = rate / 100 / 12
      const monthlyPayment = (normalizedRequestedAmount * monthlyRate * Math.pow(1 + monthlyRate, term)) / 
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
        source: 'heuristic_prequalification_model',
      }
    })
    .sort((a, b) => a.estimatedRate - b.estimatedRate)

  // Create prequalification record
  const prequalification = {
    id: `preq-${Date.now()}`,
    customerId: user?.id || null,
    vehicleId,
    status: eligibleLenders.length > 0 ? 'prequalified' : 'declined',
    creditScore,
    creditBureau,
    creditPullType: 'none',
    qualificationSource: 'heuristic_prequalification_model',
    creditPullDate: new Date().toISOString(),
    dti: Math.round(dti * 100) / 100,
    eligibleLenders,
    bestOffer: eligibleLenders[0] || null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
    createdAt: new Date().toISOString(),
  }

  const payload = {
    success: true,
    data: {
      prequalification,
      message: eligibleLenders.length > 0 
        ? `Congratulations! You're pre-qualified with ${eligibleLenders.length} lender(s).`
        : 'We were unable to pre-qualify you at this time.',
      nextSteps: eligibleLenders.length > 0
        ? ['Review your offers', 'Select a lender', 'Complete full application']
        : ['Improve credit score', 'Add co-applicant', 'Increase down payment'],
      disclaimer: 'Prequalification is an estimate only and does not represent a lender credit decision.',
    },
  }

  if (replayCacheKey) {
    await cacheIdempotentResponse(replayCacheKey, payload, 600)
  }

  return NextResponse.json(payload)
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
        features: l.type === 'credit_union'
          ? ['Community lending', 'Flexible terms', 'Relationship banking']
          : ['Competitive rates', 'Fast review', 'Digital servicing'],
        source: 'internal_partner_program_catalog',
      })),
    },
  })
}
