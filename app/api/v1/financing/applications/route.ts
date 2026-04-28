import { NextRequest } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import { sendNotificationEmail } from "@/lib/email"
import { validateOrigin } from "@/lib/csrf"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"

// Zod envelope validation — checks required top-level shape without breaking
// existing downstream code that uses the fields directly (passthrough preserves all fields)
const financeApplicationSchema = z.object({
  primaryApplicant: z.object({
    firstName: z.string().min(1).max(100),
    lastName: z.string().min(1).max(100),
  }).passthrough(),
  vehicleInfo: z.object({
    totalPrice: z.string().max(20),
    downPayment: z.string().max(20),
  }).passthrough(),
  financingTerms: z.object({
    agreementType: z.enum(["finance", "cash"]),
    loanTermMonths: z.number().int().min(12).max(96),
    paymentFrequency: z.enum(["weekly", "bi-weekly", "semi-monthly", "monthly"]),
  }).passthrough(),
  additionalNotes: z.string().max(2000).optional().or(z.literal("")),
  vehicleId: z.string().max(100).nullable().optional(),
  utm: z.record(z.string().max(200)).optional(),
}).passthrough()

type SupaClient = Awaited<ReturnType<typeof createClient>>

type FinancingMath = {
  amountFinanced: number
  payment: number
  totalInterest: number
  totalToRepay: number
  netTrade: number
  adminFee: number
  taxRate: number
  downPayment: number
  tradeValue: number
  lienAmount: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function computeFinancingMath(vehicleInfo: any, financingTerms: any, tradeIn: any): FinancingMath {
  const price = Number.parseFloat(vehicleInfo.totalPrice) || 0
  const downPayment = Number.parseFloat(vehicleInfo.downPayment) || 0
  const tradeValue = tradeIn ? (Number.parseFloat(tradeIn.estimatedValue) || 0) : 0
  const lienAmount = tradeIn?.hasLien ? (Number.parseFloat(tradeIn.lienAmount) || 0) : 0
  const netTrade = tradeValue - lienAmount
  const adminFee = Number.parseFloat(financingTerms.adminFee) || 895
  const taxRate = Number.parseFloat(financingTerms.salesTaxRate) / 100 || PROVINCE_TAX_RATES.ON.total

  const subtotal = price + adminFee - downPayment - netTrade
  const tax = subtotal * taxRate
  const amountFinanced = subtotal + tax

  const rate = (Number.parseFloat(financingTerms.interestRate) || 8.99) / 100
  const paymentsPerYear = (() => {
    if (financingTerms.paymentFrequency === "weekly") return 52
    if (financingTerms.paymentFrequency === "bi-weekly") return 26
    if (financingTerms.paymentFrequency === "semi-monthly") return 24
    return 12
  })()
  const periodicRate = rate / paymentsPerYear
  const totalPayments = (financingTerms.loanTermMonths / 12) * paymentsPerYear
  const payment = amountFinanced * (periodicRate * Math.pow(1 + periodicRate, totalPayments)) /
    (Math.pow(1 + periodicRate, totalPayments) - 1)
  const totalToRepay = payment * totalPayments
  const totalInterest = totalToRepay - amountFinanced
  return { amountFinanced, payment, totalInterest, totalToRepay, netTrade, adminFee, taxRate, downPayment, tradeValue, lienAmount }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ifPrimary<T>(opts: { primary: boolean }, value: T): T | undefined {
  return opts.primary ? value : undefined
}

function insertApplicantAddress(supabase: SupaClient, applicantId: string, src: any, opts: { primary: boolean }) {
  return supabase.from("applicant_addresses").insert({
    applicant_id: applicantId,
    address_type: "current",
    address_category: src.addressType || null,
    suite_number: ifPrimary(opts, src.suiteNumber || null),
    street_number: src.streetNumber || null,
    street_name: src.streetName || null,
    street_type: ifPrimary(opts, src.streetType || null),
    street_direction: ifPrimary(opts, src.streetDirection || null),
    city: src.city || null,
    province: src.province || "Ontario",
    postal_code: src.postalCode || null,
    duration_years: Number.parseInt(src.durationYears) || 0,
    duration_months: Number.parseInt(src.durationMonths) || 0,
  })
}

function insertApplicantHousing(supabase: SupaClient, applicantId: string, src: any, opts: { primary: boolean }) {
  return supabase.from("applicant_housing").insert({
    applicant_id: applicantId,
    home_status: src.homeStatus || null,
    market_value: ifPrimary(opts, Number.parseFloat(src.marketValue) || null),
    mortgage_amount: ifPrimary(opts, Number.parseFloat(src.mortgageAmount) || null),
    mortgage_holder: ifPrimary(opts, src.mortgageHolder || null),
    monthly_payment: Number.parseFloat(src.monthlyPayment) || null,
    outstanding_mortgage: ifPrimary(opts, Number.parseFloat(src.outstandingMortgage) || null),
  })
}

function insertApplicantEmployment(supabase: SupaClient, applicantId: string, src: any, opts: { primary: boolean }) {
  return supabase.from("applicant_employment").insert({
    applicant_id: applicantId,
    employment_type: "current",
    employment_category: src.employmentCategory || null,
    employment_status: ifPrimary(opts, src.employmentStatus || null),
    employer_name: src.employerName || null,
    occupation: src.occupation || null,
    job_title: ifPrimary(opts, src.jobTitle || null),
    employer_street_name: ifPrimary(opts, src.employerStreet || null),
    employer_city: ifPrimary(opts, src.employerCity || null),
    employer_province: ifPrimary(opts, src.employerProvince || null),
    employer_postal_code: ifPrimary(opts, src.employerPostalCode || null),
    employer_phone: src.employerPhone || null,
    employer_phone_ext: ifPrimary(opts, src.employerPhoneExt || null),
    duration_years: Number.parseInt(src.employmentYears) || 0,
    duration_months: Number.parseInt(src.employmentMonths) || 0,
  })
}

function insertApplicantIncome(supabase: SupaClient, applicantId: string, src: any, opts: { primary: boolean }) {
  return supabase.from("applicant_income").insert({
    applicant_id: applicantId,
    gross_income: Number.parseFloat(src.grossIncome) || 0,
    income_frequency: src.incomeFrequency || "annually",
    other_income_type: ifPrimary(opts, src.otherIncomeType || null),
    other_income_amount: ifPrimary(opts, Number.parseFloat(src.otherIncomeAmount) || null),
    other_income_frequency: ifPrimary(opts, src.otherIncomeFrequency || null),
    other_income_description: ifPrimary(opts, src.otherIncomeDescription || null),
    annual_total: Number.parseFloat(src.annualTotal) || null,
  })
}

async function insertApplicantSubrows(supabase: SupaClient, applicantId: string, src: any, opts: { primary: boolean }) {
  await insertApplicantAddress(supabase, applicantId, src, opts)
  await insertApplicantHousing(supabase, applicantId, src, opts)
  await insertApplicantEmployment(supabase, applicantId, src, opts)
  await insertApplicantIncome(supabase, applicantId, src, opts)
}
/* eslint-enable @typescript-eslint/no-explicit-any */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function buildDateOfBirth(dob: any): string | null {
  if (!dob?.year) return null
  return `${dob.year}-${String(dob.month).padStart(2, "0")}-${String(dob.day).padStart(2, "0")}`
}

async function insertPrimaryApplicant(
  supabase: SupaClient,
  applicationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  primaryApplicant: any,
) {
  const { data: primaryApp, error: primaryError } = await supabase
    .from("finance_applicants")
    .insert({
      application_id: applicationId,
      applicant_type: "primary",
      is_active: true,
      salutation: primaryApplicant.salutation || null,
      first_name: primaryApplicant.firstName,
      middle_name: primaryApplicant.middleName || null,
      last_name: primaryApplicant.lastName,
      suffix: primaryApplicant.suffix || null,
      date_of_birth: buildDateOfBirth(primaryApplicant.dateOfBirth),
      gender: primaryApplicant.gender || null,
      marital_status: primaryApplicant.maritalStatus || null,
      phone: primaryApplicant.phone,
      mobile_phone: primaryApplicant.mobilePhone || null,
      email: primaryApplicant.email,
      no_email: primaryApplicant.noEmail,
      language_preference: primaryApplicant.languagePreference,
      credit_rating: primaryApplicant.creditRating || null,
    })
    .select()
    .single()
  if (primaryError) console.error("Primary applicant insert error:", primaryError)
  if (primaryApp) {
    await insertApplicantSubrows(supabase, primaryApp.id, primaryApplicant, { primary: true })
  }
}

async function insertCoApplicantIfPresent(
  supabase: SupaClient,
  applicationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coApplicant: any,
  coApplicantRelation: string | null,
) {
  if (!coApplicant?.firstName) return
  const { data: coApp, error: coError } = await supabase
    .from("finance_applicants")
    .insert({
      application_id: applicationId,
      applicant_type: "co-applicant",
      is_active: true,
      relation_to_primary: coApplicantRelation || null,
      salutation: coApplicant.salutation || null,
      first_name: coApplicant.firstName,
      middle_name: coApplicant.middleName || null,
      last_name: coApplicant.lastName,
      suffix: coApplicant.suffix || null,
      date_of_birth: buildDateOfBirth(coApplicant.dateOfBirth),
      gender: coApplicant.gender || null,
      marital_status: coApplicant.maritalStatus || null,
      phone: coApplicant.phone,
      mobile_phone: coApplicant.mobilePhone || null,
      email: coApplicant.email,
      no_email: coApplicant.noEmail,
      language_preference: coApplicant.languagePreference,
      credit_rating: coApplicant.creditRating || null,
    })
    .select()
    .single()
  if (coApp && !coError) {
    await insertApplicantSubrows(supabase, coApp.id, coApplicant, { primary: false })
  }
}

async function insertTradeInIfPresent(
  supabase: SupaClient,
  applicationId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tradeIn: any,
  netTrade: number,
) {
  if (!tradeIn?.hasTradeIn) return
  await supabase.from("finance_trade_ins").insert({
    application_id: applicationId,
    vin: tradeIn.vin || null,
    year: Number.parseInt(tradeIn.year) || null,
    make: tradeIn.make || null,
    model: tradeIn.model || null,
    trim: tradeIn.trim || null,
    color: tradeIn.color || null,
    mileage: Number.parseInt(tradeIn.mileage) || null,
    condition: tradeIn.condition || null,
    estimated_value: Number.parseFloat(tradeIn.estimatedValue) || null,
    has_lien: tradeIn.hasLien || false,
    lien_holder: tradeIn.lienHolder || null,
    lien_amount: Number.parseFloat(tradeIn.lienAmount) || null,
    net_trade_value: netTrade,
  })
}

// POST /api/v1/financing/applications - Create new finance application
export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return apiError(ErrorCode.FORBIDDEN, "Forbidden", 403)
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const rawBody = await request.json()
    const parseResult = financeApplicationSchema.safeParse(rawBody)
    if (!parseResult.success) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Invalid application data", 400)
    }
    // S4325: `request.json()` already returns `any`, so the cast is a no-op.
    const body = rawBody
    const {
      primaryApplicant,
      coApplicant,
      coApplicantRelation,
      vehicleInfo,
      tradeIn,
      financingTerms,
      additionalNotes,
      vehicleId
    } = body
    
    const math = computeFinancingMath(vehicleInfo, financingTerms, tradeIn)
    const { amountFinanced, payment, totalInterest, totalToRepay, netTrade, adminFee, downPayment } = math
    
    // Create main application
    const { data: application, error: appError } = await supabase
      .from("finance_applications_v2")
      .insert({
        user_id: user?.id || null,
        vehicle_id: vehicleId || null,
        status: "submitted",
        agreement_type: financingTerms.agreementType,
        requested_amount: amountFinanced,
        down_payment: downPayment,
        max_down_payment: Number.parseFloat(vehicleInfo.maxDownPayment) || null,
        loan_term_months: financingTerms.loanTermMonths,
        payment_frequency: financingTerms.paymentFrequency,
        interest_rate: Number.parseFloat(financingTerms.interestRate) || null,
        admin_fee: adminFee,
        sales_tax_rate: Number.parseFloat(financingTerms.salesTaxRate) || null,
        has_trade_in: tradeIn?.hasTradeIn || false,
        trade_in_value: tradeIn?.hasTradeIn ? math.tradeValue : null,
        trade_in_lien_amount: tradeIn?.hasLien ? math.lienAmount : null,
        total_amount_financed: amountFinanced,
        estimated_payment: Number.isNaN(payment) ? null : payment,
        total_interest: Number.isNaN(totalInterest) ? null : totalInterest,
        total_to_repay: Number.isNaN(totalToRepay) ? null : totalToRepay,
        additional_notes: additionalNotes,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (appError) {
      console.error("Application insert error:", appError)
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to create application", 500, appError.message)
    }
    
    await insertPrimaryApplicant(supabase, application.id, primaryApplicant)
    await insertCoApplicantIfPresent(supabase, application.id, coApplicant, coApplicantRelation || null)
    await insertTradeInIfPresent(supabase, application.id, tradeIn, netTrade)
    
    // Create status history entry
    await supabase.from("finance_application_history").insert({
      application_id: application.id,
      from_status: null,
      to_status: "submitted",
      changed_by: user?.id || null,
      notes: "Application submitted"
    })
    
    // Send notification email to admin
    await sendNotificationEmail({
      type: 'finance_application',
      customerName: `${primaryApplicant.firstName} ${primaryApplicant.lastName}`,
      customerEmail: primaryApplicant.email,
      customerPhone: primaryApplicant.phone,
      vehicleInfo: vehicleId || 'Not specified',
      applicationId: application.application_number,
      additionalData: {
        requestedAmount: amountFinanced,
        downPayment,
        loanTermMonths: financingTerms.loanTermMonths,
        estimatedPayment: payment,
      },
    })
    
    return apiSuccess({
      applicationId: application.id,
      applicationNumber: application.application_number,
      status: application.status
    })
    
  } catch (error) {
    console.error("Finance application error:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to process application")
  }
}

// GET /api/v1/financing/applications - Get user's applications
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }
    
    const { data: applications, error } = await supabase
      .from("finance_applications_v2")
      .select(`
        *,
        finance_applicants (
          id,
          applicant_type,
          first_name,
          last_name,
          email,
          phone
        ),
        finance_trade_ins (
          id,
          year,
          make,
          model,
          estimated_value
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
    
    if (error) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to fetch applications")
    }

    return apiSuccess(applications)
    
  } catch (error) {
    console.error("Get applications error:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to fetch applications")
  }
}
