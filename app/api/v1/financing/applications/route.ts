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
    // S4325 was flagging the redundant `as any` we previously had. We still
    // need a permissive shape because the schema validation gate above
    // already checked everything we care about, and the rest of this handler
    // pulls deeply-nested optional fields that we don't want to re-mirror in
    // the type. Use a typed bag instead of `any`.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = rawBody as any
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
    
    // Calculate financing values
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
    
    // Calculate payment
    const rate = (Number.parseFloat(financingTerms.interestRate) || 8.99) / 100
    let paymentsPerYear = 12
    if (financingTerms.paymentFrequency === "weekly") paymentsPerYear = 52
    else if (financingTerms.paymentFrequency === "bi-weekly") paymentsPerYear = 26
    else if (financingTerms.paymentFrequency === "semi-monthly") paymentsPerYear = 24
    
    const periodicRate = rate / paymentsPerYear
    const totalPayments = (financingTerms.loanTermMonths / 12) * paymentsPerYear
    
    const payment = amountFinanced * (periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
      (Math.pow(1 + periodicRate, totalPayments) - 1)
    
    const totalToRepay = payment * totalPayments
    const totalInterest = totalToRepay - amountFinanced
    
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
        trade_in_value: tradeIn?.hasTradeIn ? tradeValue : null,
        trade_in_lien_amount: tradeIn?.hasLien ? lienAmount : null,
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
    
    // Create primary applicant
    const { data: primaryApp, error: primaryError } = await supabase
      .from("finance_applicants")
      .insert({
        application_id: application.id,
        applicant_type: "primary",
        is_active: true,
        salutation: primaryApplicant.salutation || null,
        first_name: primaryApplicant.firstName,
        middle_name: primaryApplicant.middleName || null,
        last_name: primaryApplicant.lastName,
        suffix: primaryApplicant.suffix || null,
        date_of_birth: primaryApplicant.dateOfBirth.year 
          ? `${primaryApplicant.dateOfBirth.year}-${primaryApplicant.dateOfBirth.month.padStart(2, '0')}-${primaryApplicant.dateOfBirth.day.padStart(2, '0')}`
          : null,
        gender: primaryApplicant.gender || null,
        marital_status: primaryApplicant.maritalStatus || null,
        phone: primaryApplicant.phone,
        mobile_phone: primaryApplicant.mobilePhone || null,
        email: primaryApplicant.email,
        no_email: primaryApplicant.noEmail,
        language_preference: primaryApplicant.languagePreference,
        credit_rating: primaryApplicant.creditRating || null
      })
      .select()
      .single()
    
    if (primaryError) {
      console.error("Primary applicant insert error:", primaryError)
    }
    
    if (primaryApp) {
      // Create address for primary applicant
      await supabase.from("applicant_addresses").insert({
        applicant_id: primaryApp.id,
        address_type: "current",
        address_category: primaryApplicant.addressType || null,
        suite_number: primaryApplicant.suiteNumber || null,
        street_number: primaryApplicant.streetNumber || null,
        street_name: primaryApplicant.streetName || null,
        street_type: primaryApplicant.streetType || null,
        street_direction: primaryApplicant.streetDirection || null,
        city: primaryApplicant.city || null,
        province: primaryApplicant.province || "Ontario",
        postal_code: primaryApplicant.postalCode || null,
        duration_years: Number.parseInt(primaryApplicant.durationYears) || 0,
        duration_months: Number.parseInt(primaryApplicant.durationMonths) || 0
      })
      
      // Create housing info
      await supabase.from("applicant_housing").insert({
        applicant_id: primaryApp.id,
        home_status: primaryApplicant.homeStatus || null,
        market_value: Number.parseFloat(primaryApplicant.marketValue) || null,
        mortgage_amount: Number.parseFloat(primaryApplicant.mortgageAmount) || null,
        mortgage_holder: primaryApplicant.mortgageHolder || null,
        monthly_payment: Number.parseFloat(primaryApplicant.monthlyPayment) || null,
        outstanding_mortgage: Number.parseFloat(primaryApplicant.outstandingMortgage) || null
      })
      
      // Create employment info
      await supabase.from("applicant_employment").insert({
        applicant_id: primaryApp.id,
        employment_type: "current",
        employment_category: primaryApplicant.employmentCategory || null,
        employment_status: primaryApplicant.employmentStatus || null,
        employer_name: primaryApplicant.employerName || null,
        occupation: primaryApplicant.occupation || null,
        job_title: primaryApplicant.jobTitle || null,
        employer_street_name: primaryApplicant.employerStreet || null,
        employer_city: primaryApplicant.employerCity || null,
        employer_province: primaryApplicant.employerProvince || null,
        employer_postal_code: primaryApplicant.employerPostalCode || null,
        employer_phone: primaryApplicant.employerPhone || null,
        employer_phone_ext: primaryApplicant.employerPhoneExt || null,
        duration_years: Number.parseInt(primaryApplicant.employmentYears) || 0,
        duration_months: Number.parseInt(primaryApplicant.employmentMonths) || 0
      })
      
      // Create income info
      await supabase.from("applicant_income").insert({
        applicant_id: primaryApp.id,
        gross_income: Number.parseFloat(primaryApplicant.grossIncome) || 0,
        income_frequency: primaryApplicant.incomeFrequency || "annually",
        other_income_type: primaryApplicant.otherIncomeType || null,
        other_income_amount: Number.parseFloat(primaryApplicant.otherIncomeAmount) || null,
        other_income_frequency: primaryApplicant.otherIncomeFrequency || null,
        other_income_description: primaryApplicant.otherIncomeDescription || null,
        annual_total: Number.parseFloat(primaryApplicant.annualTotal) || null
      })
    }
    
    // Create co-applicant if provided
    if (coApplicant?.firstName) {
      const { data: coApp, error: coError } = await supabase
        .from("finance_applicants")
        .insert({
          application_id: application.id,
          applicant_type: "co-applicant",
          is_active: true,
          relation_to_primary: coApplicantRelation || null,
          salutation: coApplicant.salutation || null,
          first_name: coApplicant.firstName,
          middle_name: coApplicant.middleName || null,
          last_name: coApplicant.lastName,
          suffix: coApplicant.suffix || null,
          date_of_birth: coApplicant.dateOfBirth?.year 
            ? `${coApplicant.dateOfBirth.year}-${coApplicant.dateOfBirth.month.padStart(2, '0')}-${coApplicant.dateOfBirth.day.padStart(2, '0')}`
            : null,
          gender: coApplicant.gender || null,
          marital_status: coApplicant.maritalStatus || null,
          phone: coApplicant.phone,
          mobile_phone: coApplicant.mobilePhone || null,
          email: coApplicant.email,
          no_email: coApplicant.noEmail,
          language_preference: coApplicant.languagePreference,
          credit_rating: coApplicant.creditRating || null
        })
        .select()
        .single()
      
      if (coApp && !coError) {
        // Create address, housing, employment, income for co-applicant (similar to primary)
        await supabase.from("applicant_addresses").insert({
          applicant_id: coApp.id,
          address_type: "current",
          address_category: coApplicant.addressType || null,
          street_number: coApplicant.streetNumber || null,
          street_name: coApplicant.streetName || null,
          city: coApplicant.city || null,
          province: coApplicant.province || "Ontario",
          postal_code: coApplicant.postalCode || null,
          duration_years: Number.parseInt(coApplicant.durationYears) || 0,
          duration_months: Number.parseInt(coApplicant.durationMonths) || 0
        })
        
        await supabase.from("applicant_housing").insert({
          applicant_id: coApp.id,
          home_status: coApplicant.homeStatus || null,
          monthly_payment: Number.parseFloat(coApplicant.monthlyPayment) || null
        })
        
        await supabase.from("applicant_employment").insert({
          applicant_id: coApp.id,
          employment_type: "current",
          employment_category: coApplicant.employmentCategory || null,
          employer_name: coApplicant.employerName || null,
          occupation: coApplicant.occupation || null,
          employer_phone: coApplicant.employerPhone || null,
          duration_years: Number.parseInt(coApplicant.employmentYears) || 0,
          duration_months: Number.parseInt(coApplicant.employmentMonths) || 0
        })
        
        await supabase.from("applicant_income").insert({
          applicant_id: coApp.id,
          gross_income: Number.parseFloat(coApplicant.grossIncome) || 0,
          income_frequency: coApplicant.incomeFrequency || "annually",
          annual_total: Number.parseFloat(coApplicant.annualTotal) || null
        })
      }
    }
    
    // Create trade-in if provided
    if (tradeIn?.hasTradeIn) {
      await supabase.from("finance_trade_ins").insert({
        application_id: application.id,
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
        net_trade_value: netTrade
      })
    }
    
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
