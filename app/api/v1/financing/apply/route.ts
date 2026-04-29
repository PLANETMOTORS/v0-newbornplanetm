import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from "node:crypto"
import { createClient } from '@/lib/supabase/server'
import { sendNotificationEmail } from '@/lib/email'
import { validateOrigin } from '@/lib/csrf'

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return parsed
}

function validateEmail(email: string): boolean {
  // Linear-time email check: anchored, no nested quantifiers, no backtracking risk.
  // Accepts the vast majority of valid RFC 5321 addresses without catastrophic backtracking.
  if (!/^[^\s@]{1,64}@[^\s@]{1,253}$/.test(email)) {
    return false
  }

  const atIndex = email.lastIndexOf('@')
  const domain = email.slice(atIndex + 1)
  // Domain must contain a dot AND the dot must not be the first or last character
  const dotIndex = domain.indexOf(".")
  return dotIndex > 0 && dotIndex < domain.length - 1
}

function generateApplicationNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = randomBytes(3).toString("hex").toUpperCase()
  return `PM-FA-${ts}-${rand}`
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json({ success: false, error: { code, message } }, { status })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function validateApplyPayload(body: any) {
  const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'annualIncome', 'requestedAmount']
  const missingFields = requiredFields.filter((field) => !body[field])
  if (missingFields.length > 0) {
    return jsonError('MISSING_FIELDS', `Missing required fields: ${missingFields.join(', ')}`, 400)
  }
  if (!validateEmail(String(body.email))) {
    return jsonError('INVALID_EMAIL', 'Invalid email format', 400)
  }
  return null
}

async function validateVehicleIfPresent(
  supabase: Awaited<ReturnType<typeof createClient>>,
  vehicleId: string | undefined,
) {
  if (!vehicleId) return null
  const { data: vehicle, error: vehicleError } = await supabase
    .from('vehicles')
    .select('id, status')
    .eq('id', vehicleId)
    .maybeSingle()
  if (vehicleError) return jsonError('DB_ERROR', vehicleError.message, 500)
  if (!vehicle) return jsonError('NOT_FOUND', 'Vehicle not found', 404)
  return null
}

// POST /api/v1/financing/apply - Full application submission (review pipeline)
export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, error: { code: 'FORBIDDEN', message: 'Forbidden' } },
        { status: 403 }
      )
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      customerId,
      vehicleId,
      selectedLenderIds,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      sin,
      streetAddress,
      city,
      province,
      postalCode,
      residenceStatus,
      monthlyPayment: _monthlyPayment,
      yearsAtAddress,
      employmentStatus,
      employerName,
      jobTitle,
      employmentYears,
      annualIncome,
      requestedAmount,
      requestedTerm,
      downPayment,
      tradeInId,
    } = body

    const validationError = validateApplyPayload(body)
    if (validationError) return validationError

    const requestedAmountValue = asNumber(requestedAmount)
    const annualIncomeValue = asNumber(annualIncome)
    const downPaymentValue = Math.max(0, asNumber(downPayment))
    const requestedTermValue = Math.max(24, Math.min(96, Math.round(asNumber(requestedTerm, 72))))
    if (requestedAmountValue <= 0 || annualIncomeValue <= 0) {
      return jsonError('INVALID_FINANCIAL_INPUT', 'requestedAmount and annualIncome must be greater than 0', 400)
    }
    if (customerId && customerId !== user.id) {
      return jsonError('FORBIDDEN', 'customerId must match authenticated user', 403)
    }
    const effectiveCustomerId = customerId || user.id

    const vehicleCheckError = await validateVehicleIfPresent(supabase, vehicleId)
    if (vehicleCheckError) return vehicleCheckError

    const applicationNumber = generateApplicationNumber()
    const submittedAt = new Date().toISOString()
    const estimatedMonthlyPayment = requestedAmountValue > 0
      ? Math.round((requestedAmountValue / requestedTermValue) * 100) / 100
      : 0

    const { data: application, error: appError } = await supabase
      .from('finance_applications_v2')
      .insert({
        application_number: applicationNumber,
        user_id: user.id,
        customer_id: effectiveCustomerId,
        vehicle_id: vehicleId || null,
        status: 'submitted',
        agreement_type: 'finance',
        requested_amount: requestedAmountValue,
        down_payment: downPaymentValue,
        loan_term_months: requestedTermValue,
        payment_frequency: 'monthly',
        has_trade_in: Boolean(tradeInId),
        trade_in_vehicle_id: tradeInId || null,
        estimated_payment: estimatedMonthlyPayment,
        additional_notes: [
          `Applicant: ${firstName} ${lastName}`,
          `Email: ${email}`,
          `Phone: ${phone}`,
          `DOB: ${dateOfBirth || 'not provided'}`,
          `Address: ${streetAddress || ''} ${city || ''} ${province || ''} ${postalCode || ''}`.trim(),
          `Residence: ${residenceStatus || 'not provided'} (${yearsAtAddress || '0'} years)`,
          `Employment: ${employmentStatus || 'not provided'} / ${employerName || 'not provided'} / ${jobTitle || 'not provided'} (${employmentYears || '0'} years)`,
          `Annual Income: ${annualIncomeValue}`,
          `Selected lenders: ${(selectedLenderIds || []).join(', ') || 'none'}`,
          `SIN provided: ${sin ? 'yes' : 'no'}`,
          'Note: credit bureau and lender decisions must occur in secured lender integration workflow.',
        ].join('\n'),
        submitted_at: submittedAt,
      })
      .select('id, application_number, status, submitted_at, requested_amount, down_payment, loan_term_months, estimated_payment')
      .single()

    if (appError || !application) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DB_ERROR',
            message: appError?.message || 'Failed to create application',
          },
        },
        { status: 500 }
      )
    }

    await supabase
      .from('finance_application_history')
      .insert({
        application_id: application.id,
        from_status: null,
        to_status: 'submitted',
        changed_by: user.id,
        notes: 'Application submitted for manual/compliance review',
      })

    // Fire-and-forget notification pattern.
    try {
      await sendNotificationEmail({
        type: 'finance_application',
        customerName: `${firstName} ${lastName}`,
        customerEmail: email,
        customerPhone: phone,
        vehicleInfo: vehicleId,
        applicationId: application.application_number,
        additionalData: {
          annualIncome: annualIncomeValue,
          requestedAmount: requestedAmountValue,
          complianceReviewRequired: true,
        },
      })
    } catch (notifyError) {
      console.error('Finance application notification failed:', notifyError)
    }

    return NextResponse.json({
      success: true,
      data: {
        application: {
          id: application.id,
          applicationNumber: application.application_number,
          status: application.status,
          requestedAmount: application.requested_amount,
          downPayment: application.down_payment,
          requestedTerm: application.loan_term_months,
          submittedAt: application.submitted_at,
          review: {
            stage: 'manual_review',
            decision: 'pending',
          },
          offers: [],
        },
        message: `Your application ${application.application_number} has been submitted for review.`,
        nextSteps: [
          'Our finance team will review your application',
          'You may be contacted for additional documents',
          'You will be notified when lender responses are available',
        ],
      },
    })
  } catch (error) {
    console.error('Finance application error:', error)
    return NextResponse.json(
      { error: 'Failed to process application' },
      { status: 500 }
    )
  }
}