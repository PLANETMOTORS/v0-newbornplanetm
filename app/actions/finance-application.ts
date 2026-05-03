'use server'

/**
 * Server Action: submit a full finance application.
 *
 * Replaces the client-side fetch('/api/v1/financing/applications') call.
 * Uses z.flatten().fieldErrors to return precise, input-mapped validation
 * errors so the UI can highlight the exact field that failed.
 *
 * Next.js Server Actions have built-in CSRF protection (same-origin).
 */

import { headers } from 'next/headers'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { sendNotificationEmail } from '@/lib/email'
import { rateLimit } from '@/lib/redis'
import { logger } from '@/lib/logger'
import { isValidCanadianPhoneNumber } from '@/lib/validation'
import { PROVINCE_TAX_RATES } from '@/lib/tax/canada'

// ── Types ───────────────────────────────────────────────────────────────

export type FinanceFieldErrors = Record<string, string[] | undefined>

export type FinanceFormState =
  | { status: 'idle' }
  | { status: 'success'; applicationId: string; applicationNumber: string }
  | {
      status: 'error'
      message: string
      /** Keyed by section → field → error messages via z.flatten().fieldErrors */
      fieldErrors?: {
        primaryApplicant?: FinanceFieldErrors
        coApplicant?: FinanceFieldErrors
        vehicleInfo?: FinanceFieldErrors
        financingTerms?: FinanceFieldErrors
        root?: FinanceFieldErrors
      }
    }

export const initialState: FinanceFormState = { status: 'idle' }

// ── Zod Schemas ─────────────────────────────────────────────────────────

const applicantSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(100),
  lastName: z.string().trim().min(1, 'Last name is required').max(100),
  dateOfBirth: z.object({
    day: z.string().min(1, 'Day is required'),
    month: z.string().min(1, 'Month is required'),
    year: z.string().min(1, 'Year is required'),
  }),
  gender: z.string().min(1, 'Gender is required'),
  maritalStatus: z.string().min(1, 'Marital status is required'),
  phone: z.string().min(1, 'Phone number is required')
    .refine(isValidCanadianPhoneNumber, 'Please enter a valid 10-digit phone number'),
  email: z.string().trim().min(1, 'Email is required').email('Please enter a valid email'),
  creditRating: z.string().min(1, 'Credit rating is required'),
  postalCode: z.string().trim().min(6, 'Valid postal code required (e.g., A1A 1A1)'),
  addressType: z.string().min(1, 'Address type is required'),
  streetNumber: z.string().trim().min(1, 'Street number is required'),
  streetName: z.string().trim().min(1, 'Street name is required'),
  city: z.string().trim().min(1, 'City is required'),
  province: z.string().min(1, 'Province is required'),
  homeStatus: z.string().min(1, 'Home status is required'),
  monthlyPayment: z.string().min(1, 'Monthly payment is required'),
  employmentCategory: z.string().min(1, 'Employment type is required'),
  employmentStatus: z.string().min(1, 'Employment status is required'),
  employerName: z.string().trim().min(1, 'Employer name is required'),
  occupation: z.string().trim().min(1, 'Occupation is required'),
  employerPhone: z.string().min(1, 'Employer phone is required')
    .refine(isValidCanadianPhoneNumber, 'Employer phone must be a valid 10-digit number'),
  employerPostalCode: z.string().trim().min(6, 'Employer postal code required'),
  grossIncome: z.string().min(1, 'Gross income is required'),
  incomeFrequency: z.string().min(1, 'Income frequency is required'),
}).passthrough()

const vehicleInfoSchema = z.object({
  totalPrice: z.string().min(1, 'Vehicle price is required')
    .refine((v) => Number.parseFloat(v) > 0, 'Vehicle price must be greater than 0'),
  downPayment: z.string().max(20),
}).passthrough()

const financingTermsSchema = z.object({
  agreementType: z.enum(['finance', 'cash'], {
    errorMap: () => ({ message: 'Agreement type must be finance or cash' }),
  }),
  loanTermMonths: z.number().int().min(12, 'Min 12 months').max(96, 'Max 96 months'),
  paymentFrequency: z.enum(['weekly', 'bi-weekly', 'semi-monthly', 'monthly'], {
    errorMap: () => ({ message: 'Invalid payment frequency' }),
  }),
}).passthrough()

const financeApplicationSchema = z.object({
  primaryApplicant: applicantSchema,
  coApplicant: applicantSchema.partial().nullable().optional(),
  coApplicantRelation: z.string().nullable().optional(),
  vehicleInfo: vehicleInfoSchema,
  tradeIn: z.object({
    hasTradeIn: z.boolean().optional(),
    estimatedValue: z.string().max(20).optional(),
    hasLien: z.boolean().optional(),
    lienAmount: z.string().max(20).optional(),
    year: z.string().max(4).optional(),
    make: z.string().max(100).optional(),
    model: z.string().max(100).optional(),
    mileage: z.string().max(20).optional(),
    condition: z.string().max(50).optional(),
  }).passthrough().nullable().optional(),
  financingTerms: financingTermsSchema,
  additionalNotes: z.string().max(2000).optional().or(z.literal('')),
  vehicleId: z.string().max(100).nullable().optional(),
  utm: z.record(z.string().max(200)).optional(),
  idempotencyKey: z.string().optional(),
})

// ── Helpers ─────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string> {
  const h = await headers()
  return h.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '0.0.0.0'
}

interface VehicleInfoInput { totalPrice: string; downPayment: string }
interface FinancingTermsInput { adminFee?: string; salesTaxRate?: string; interestRate?: string; paymentFrequency: string; loanTermMonths: number }
interface TradeInInput { estimatedValue?: string; hasLien?: boolean; lienAmount?: string }

function computeFinancingMath(vi: VehicleInfoInput, ft: FinancingTermsInput, ti: TradeInInput | null | undefined) {
  const price = Number.parseFloat(vi.totalPrice) || 0
  const dp = Number.parseFloat(vi.downPayment) || 0
  const tv = Number.parseFloat(ti?.estimatedValue ?? '0') || 0
  const la = ti?.hasLien ? (Number.parseFloat(ti.lienAmount ?? '0') || 0) : 0
  const netTrade = tv - la
  const adminFee = Number.parseFloat(ft.adminFee ?? '895') || 895
  const taxRate = Number.parseFloat(ft.salesTaxRate ?? '0') / 100 || PROVINCE_TAX_RATES.ON.total
  const subtotal = price + adminFee - dp - netTrade
  const amountFinanced = subtotal + subtotal * taxRate
  const rate = (Number.parseFloat(ft.interestRate ?? '8.99') || 8.99) / 100
  const ppy = ft.paymentFrequency === 'weekly' ? 52
    : ft.paymentFrequency === 'bi-weekly' ? 26
    : ft.paymentFrequency === 'semi-monthly' ? 24 : 12
  const pr = rate / ppy
  const tp = (ft.loanTermMonths / 12) * ppy
  const pmt = amountFinanced * (pr * Math.pow(1 + pr, tp)) / (Math.pow(1 + pr, tp) - 1)
  const totalToRepay = pmt * tp
  return { amountFinanced, payment: pmt, totalInterest: totalToRepay - amountFinanced, totalToRepay, netTrade, adminFee, taxRate, downPayment: dp, tradeValue: tv, lienAmount: la }
}

function buildDob(dob: { day: string; month: string; year: string }): string | null {
  if (!dob.year) return null
  return `${dob.year}-${String(dob.month).padStart(2, '0')}-${String(dob.day).padStart(2, '0')}`
}

// ── Main action ─────────────────────────────────────────────────────────

export async function submitFinanceApplication(
  payload: Record<string, unknown>,
): Promise<FinanceFormState> {
  // 1. Rate-limit by IP
  const ip = await getClientIp()
  const limiter = await rateLimit(`finance-app:${ip}`, 3, 60 * 60)
  if (!limiter.success) {
    return { status: 'error', message: 'Too many applications. Please try again later.' }
  }

  // 2. Validate with Zod — z.flatten().fieldErrors for precise error mapping
  const parsed = financeApplicationSchema.safeParse(payload)

  if (!parsed.success) {
    const fieldErrors: NonNullable<Extract<FinanceFormState, { status: 'error' }>['fieldErrors']> = {}

    for (const issue of parsed.error.issues) {
      const [section, ...rest] = issue.path
      const sectionKey = typeof section === 'string' ? section : 'root'
      const fieldKey = rest.length > 0 ? rest.join('.') : sectionKey

      if (sectionKey === 'primaryApplicant' || sectionKey === 'coApplicant' ||
          sectionKey === 'vehicleInfo' || sectionKey === 'financingTerms') {
        const se = (fieldErrors[sectionKey] ??= {})
        const existing = se[fieldKey]
        se[fieldKey] = existing ? [...existing, issue.message] : [issue.message]
      } else {
        const re = (fieldErrors.root ??= {})
        const existing = re[fieldKey]
        re[fieldKey] = existing ? [...existing, issue.message] : [issue.message]
      }
    }

    return { status: 'error', message: 'Please fix the errors below.', fieldErrors }
  }

  // 3. Persist to database
  const data = parsed.data
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  try {
    const math = computeFinancingMath(data.vehicleInfo, data.financingTerms, data.tradeIn)

    const { data: application, error: appError } = await supabase
      .from('finance_applications_v2')
      .insert({
        user_id: user?.id || null,
        vehicle_id: data.vehicleId || null,
        status: 'submitted',
        agreement_type: data.financingTerms.agreementType,
        requested_amount: math.amountFinanced,
        down_payment: math.downPayment,
        loan_term_months: data.financingTerms.loanTermMonths,
        payment_frequency: data.financingTerms.paymentFrequency,
        interest_rate: Number.parseFloat(data.financingTerms.interestRate as string) || null,
        admin_fee: math.adminFee,
        sales_tax_rate: Number.parseFloat(data.financingTerms.salesTaxRate as string) || null,
        has_trade_in: data.tradeIn?.hasTradeIn || false,
        trade_in_value: data.tradeIn?.hasTradeIn ? math.tradeValue : null,
        trade_in_lien_amount: data.tradeIn?.hasLien ? math.lienAmount : null,
        total_amount_financed: math.amountFinanced,
        estimated_payment: Number.isNaN(math.payment) ? null : math.payment,
        total_interest: Number.isNaN(math.totalInterest) ? null : math.totalInterest,
        total_to_repay: Number.isNaN(math.totalToRepay) ? null : math.totalToRepay,
        additional_notes: data.additionalNotes,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (appError) {
      logger.error('[finance-action] insert error', { error: appError })
      return { status: 'error', message: 'Failed to create application. Please try again.' }
    }

    // Insert primary applicant + sub-rows
    const pa = data.primaryApplicant
    const { data: primaryApp } = await supabase
      .from('finance_applicants')
      .insert({
        application_id: application.id, applicant_type: 'primary', is_active: true,
        salutation: pa.salutation || null, first_name: pa.firstName,
        middle_name: pa.middleName || null, last_name: pa.lastName,
        suffix: pa.suffix || null, date_of_birth: buildDob(pa.dateOfBirth),
        gender: pa.gender || null, marital_status: pa.maritalStatus || null,
        phone: pa.phone, mobile_phone: pa.mobilePhone || null,
        email: pa.email, no_email: pa.noEmail ?? false,
        language_preference: pa.languagePreference ?? 'en',
        credit_rating: pa.creditRating || null,
      })
      .select().single()

    if (primaryApp) {
      await Promise.all([
        supabase.from('applicant_addresses').insert({
          applicant_id: primaryApp.id, address_type: 'current',
          address_category: pa.addressType || null,
          street_number: pa.streetNumber || null, street_name: pa.streetName || null,
          city: pa.city || null, province: pa.province || 'Ontario',
          postal_code: pa.postalCode || null,
          duration_years: Number.parseInt(pa.durationYears as string) || 0,
          duration_months: Number.parseInt(pa.durationMonths as string) || 0,
        }),
        supabase.from('applicant_housing').insert({
          applicant_id: primaryApp.id, home_status: pa.homeStatus || null,
          monthly_payment: Number.parseFloat(pa.monthlyPayment) || null,
        }),
        supabase.from('applicant_employment').insert({
          applicant_id: primaryApp.id, employment_type: 'current',
          employment_category: pa.employmentCategory || null,
          employment_status: pa.employmentStatus || null,
          employer_name: pa.employerName || null, occupation: pa.occupation || null,
          employer_phone: pa.employerPhone || null,
          employer_postal_code: pa.employerPostalCode || null,
          duration_years: Number.parseInt(pa.employmentYears as string) || 0,
          duration_months: Number.parseInt(pa.employmentMonths as string) || 0,
        }),
        supabase.from('applicant_income').insert({
          applicant_id: primaryApp.id,
          gross_income: Number.parseFloat(pa.grossIncome) || 0,
          income_frequency: pa.incomeFrequency || 'annually',
          annual_total: Number.parseFloat(pa.annualTotal as string) || null,
        }),
      ])
    }

    // Status history
    await supabase.from('finance_application_history').insert({
      application_id: application.id, from_status: null,
      to_status: 'submitted', changed_by: user?.id || null,
      notes: 'Application submitted',
    })

    // Notification email (fire-and-forget)
    sendNotificationEmail({
      type: 'finance_application',
      customerName: `${pa.firstName} ${pa.lastName}`,
      customerEmail: pa.email,
      customerPhone: pa.phone,
      vehicleInfo: data.vehicleId || 'Not specified',
      applicationId: application.application_number,
      additionalData: {
        requestedAmount: math.amountFinanced,
        downPayment: math.downPayment,
        loanTermMonths: data.financingTerms.loanTermMonths,
        estimatedPayment: math.payment,
      },
    }).catch((cause) => logger.error('[finance-action] email failed', { cause }))

    return {
      status: 'success',
      applicationId: application.id,
      applicationNumber: application.application_number,
    }
  } catch (error) {
    logger.error('[finance-action] unexpected error', { error })
    return { status: 'error', message: 'Failed to process application. Please try again.' }
  }
}
