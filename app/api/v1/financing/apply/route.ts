import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { sendNotificationEmail } from '@/lib/email'

function asNumber(value: unknown, fallback = 0): number {
  const parsed = typeof value === 'string' ? Number.parseFloat(value) : Number(value)
  if (!Number.isFinite(parsed)) {
    return fallback
  }
  return parsed
}

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

function generateApplicationNumber(): string {
  const ts = Date.now().toString(36).toUpperCase()
  const rand = Math.floor(Math.random() * 36 ** 4).toString(36).toUpperCase().padStart(4, '0')
  return `PM-FA-${ts}-${rand}`
}

// POST /api/v1/financing/apply - Full application submission (review pipeline)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

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
      monthlyPayment,
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

    const requiredFields = ['firstName', 'lastName', 'email', 'phone', 'annualIncome', 'requestedAmount']
    const missingFields = requiredFields.filter((field) => !body[field])

    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'MISSING_FIELDS',
            message: `Missing required fields: ${missingFields.join(', ')}`,
          },
        },
        { status: 400 }
      )
    }

    if (!validateEmail(String(email))) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_EMAIL',
            message: 'Invalid email format',
          },
        },
        { status: 400 }
      )
    }

    const requestedAmountValue = asNumber(requestedAmount)
    const annualIncomeValue = asNumber(annualIncome)
    const downPaymentValue = Math.max(0, asNumber(downPayment))
    const requestedTermValue = Math.max(24, Math.min(96, Math.round(asNumber(requestedTerm, 72))))

    if (requestedAmountValue <= 0 || annualIncomeValue <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_FINANCIAL_INPUT',
            message: 'requestedAmount and annualIncome must be greater than 0',
          },
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

    if (vehicleId) {
      const { data: vehicle, error: vehicleError } = await supabase
        .from('vehicles')
        .select('id, status')
        .eq('id', vehicleId)
        .maybeSingle()

      if (vehicleError) {
        return NextResponse.json(
          { success: false, error: { code: 'DB_ERROR', message: vehicleError.message } },
          { status: 500 }
        )
      }

      if (!vehicle) {
        return NextResponse.json(
          { success: false, error: { code: 'NOT_FOUND', message: 'Vehicle not found' } },
          { status: 404 }
        )
      }
    }

    const applicationNumber = generateApplicationNumber()
    const submittedAt = new Date().toISOString()
    const estimatedMonthlyPayment = requestedAmountValue > 0
      ? Math.round((requestedAmountValue / requestedTermValue) * 100) / 100
      : 0

    const { data: application, error: appError } = await supabase
      .from('finance_applications_v2')
      .insert({
        application_number: applicationNumber,
        user_id: user?.id || null,
        customer_id: customerId || null,
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
        changed_by: user?.id || null,
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