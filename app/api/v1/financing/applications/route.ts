import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendNotificationEmail } from "@/lib/email"
import { validateOrigin } from "@/lib/csrf"

// POST /api/v1/financing/applications - Create new finance application
export async function POST(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    const body = await request.json()
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
    const price = parseFloat(vehicleInfo.totalPrice) || 0
    const downPayment = parseFloat(vehicleInfo.downPayment) || 0
    const tradeValue = tradeIn ? (parseFloat(tradeIn.estimatedValue) || 0) : 0
    const lienAmount = tradeIn?.hasLien ? (parseFloat(tradeIn.lienAmount) || 0) : 0
    const netTrade = tradeValue - lienAmount
    const adminFee = parseFloat(financingTerms.adminFee) || 895
    const taxRate = parseFloat(financingTerms.salesTaxRate) / 100 || 0.13
    
    const subtotal = price + adminFee - downPayment - netTrade
    const tax = subtotal * taxRate
    const amountFinanced = subtotal + tax
    
    // Calculate payment
    const rate = (parseFloat(financingTerms.interestRate) || 8.99) / 100
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
        max_down_payment: parseFloat(vehicleInfo.maxDownPayment) || null,
        loan_term_months: financingTerms.loanTermMonths,
        payment_frequency: financingTerms.paymentFrequency,
        interest_rate: parseFloat(financingTerms.interestRate) || null,
        admin_fee: adminFee,
        sales_tax_rate: parseFloat(financingTerms.salesTaxRate) || null,
        has_trade_in: tradeIn?.hasTradeIn || false,
        trade_in_value: tradeIn?.hasTradeIn ? tradeValue : null,
        trade_in_lien_amount: tradeIn?.hasLien ? lienAmount : null,
        total_amount_financed: amountFinanced,
        estimated_payment: isNaN(payment) ? null : payment,
        total_interest: isNaN(totalInterest) ? null : totalInterest,
        total_to_repay: isNaN(totalToRepay) ? null : totalToRepay,
        additional_notes: additionalNotes,
        submitted_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (appError) {
      console.error("Application insert error:", appError)
      return NextResponse.json({ error: "Failed to create application", details: appError.message }, { status: 500 })
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
        duration_years: parseInt(primaryApplicant.durationYears) || 0,
        duration_months: parseInt(primaryApplicant.durationMonths) || 0
      })
      
      // Create housing info
      await supabase.from("applicant_housing").insert({
        applicant_id: primaryApp.id,
        home_status: primaryApplicant.homeStatus || null,
        market_value: parseFloat(primaryApplicant.marketValue) || null,
        mortgage_amount: parseFloat(primaryApplicant.mortgageAmount) || null,
        mortgage_holder: primaryApplicant.mortgageHolder || null,
        monthly_payment: parseFloat(primaryApplicant.monthlyPayment) || null,
        outstanding_mortgage: parseFloat(primaryApplicant.outstandingMortgage) || null
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
        duration_years: parseInt(primaryApplicant.employmentYears) || 0,
        duration_months: parseInt(primaryApplicant.employmentMonths) || 0
      })
      
      // Create income info
      await supabase.from("applicant_income").insert({
        applicant_id: primaryApp.id,
        gross_income: parseFloat(primaryApplicant.grossIncome) || 0,
        income_frequency: primaryApplicant.incomeFrequency || "annually",
        other_income_type: primaryApplicant.otherIncomeType || null,
        other_income_amount: parseFloat(primaryApplicant.otherIncomeAmount) || null,
        other_income_frequency: primaryApplicant.otherIncomeFrequency || null,
        other_income_description: primaryApplicant.otherIncomeDescription || null,
        annual_total: parseFloat(primaryApplicant.annualTotal) || null
      })
    }
    
    // Create co-applicant if provided
    if (coApplicant && coApplicant.firstName) {
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
          duration_years: parseInt(coApplicant.durationYears) || 0,
          duration_months: parseInt(coApplicant.durationMonths) || 0
        })
        
        await supabase.from("applicant_housing").insert({
          applicant_id: coApp.id,
          home_status: coApplicant.homeStatus || null,
          monthly_payment: parseFloat(coApplicant.monthlyPayment) || null
        })
        
        await supabase.from("applicant_employment").insert({
          applicant_id: coApp.id,
          employment_type: "current",
          employment_category: coApplicant.employmentCategory || null,
          employer_name: coApplicant.employerName || null,
          occupation: coApplicant.occupation || null,
          employer_phone: coApplicant.employerPhone || null,
          duration_years: parseInt(coApplicant.employmentYears) || 0,
          duration_months: parseInt(coApplicant.employmentMonths) || 0
        })
        
        await supabase.from("applicant_income").insert({
          applicant_id: coApp.id,
          gross_income: parseFloat(coApplicant.grossIncome) || 0,
          income_frequency: coApplicant.incomeFrequency || "annually",
          annual_total: parseFloat(coApplicant.annualTotal) || null
        })
      }
    }
    
    // Create trade-in if provided
    if (tradeIn?.hasTradeIn) {
      await supabase.from("finance_trade_ins").insert({
        application_id: application.id,
        vin: tradeIn.vin || null,
        year: parseInt(tradeIn.year) || null,
        make: tradeIn.make || null,
        model: tradeIn.model || null,
        trim: tradeIn.trim || null,
        color: tradeIn.color || null,
        mileage: parseInt(tradeIn.mileage) || null,
        condition: tradeIn.condition || null,
        estimated_value: parseFloat(tradeIn.estimatedValue) || null,
        has_lien: tradeIn.hasLien || false,
        lien_holder: tradeIn.lienHolder || null,
        lien_amount: parseFloat(tradeIn.lienAmount) || null,
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
    
    return NextResponse.json({
      success: true,
      data: {
        applicationId: application.id,
        applicationNumber: application.application_number,
        status: application.status
      }
    })
    
  } catch (error) {
    console.error("Finance application error:", error)
    return NextResponse.json(
      { error: "Failed to process application" },
      { status: 500 }
    )
  }
}

// GET /api/v1/financing/applications - Get user's applications
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
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
      return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
    }
    
    return NextResponse.json({ success: true, data: applications })
    
  } catch (error) {
    console.error("Get applications error:", error)
    return NextResponse.json({ error: "Failed to fetch applications" }, { status: 500 })
  }
}
