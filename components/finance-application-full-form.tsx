"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import dynamic from "next/dynamic"
import { useAuth } from "@/contexts/auth-context"
import { startVehicleCheckout } from "@/app/actions/stripe"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"

import {
  User, Car, FileText, Upload,
  ArrowRight, ArrowLeft, CheckCircle, Loader2, Shield, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

const EmbeddedCheckoutProvider = dynamic(
  () => import('@stripe/react-stripe-js').then(m => ({ default: m.EmbeddedCheckoutProvider })),
  { ssr: false }
)
const EmbeddedCheckout = dynamic(
  () => import('@stripe/react-stripe-js').then(m => ({ default: m.EmbeddedCheckout })),
  { ssr: false }
)

const stripeKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
let stripePromise: ReturnType<typeof import('@stripe/stripe-js').loadStripe> | null = null
function getStripePromise() {
  if (!stripePromise && stripeKey) {
    stripePromise = import('@stripe/stripe-js').then(m => m.loadStripe(stripeKey))
  }
  return stripePromise
}
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"
import {
  type ApplicantData, type VehicleInfo, type TradeInInfo,
  type FinancingTerms, type DocumentUpload,
  emptyApplicant,
  isApplicantData, isVehicleInfo, isTradeInInfo, isFinancingTerms,
} from "@/components/finance-application"
import { ApplicantForm } from "@/components/finance-application/applicant-form"
import { VehicleFinancingForm } from "@/components/finance-application/vehicle-financing-form"
import { ReviewStep } from "@/components/finance-application/review-step"
import { DocumentsStep } from "@/components/finance-application/documents-step"

// Types, sub-components, and emptyApplicant imported from @/components/finance-application/

// =====================================================
// MAIN COMPONENT — orchestrator only (sub-forms extracted)
// =====================================================
interface FinanceApplicationFullFormProps {
  vehicleId?: string
  vehicleData?: {
    id: string
    year: number
    make: string
    model: string
    trim: string
    price: number
    vin?: string
    mileage?: number
    color?: string
  }
  tradeInData?: {
    value: number
    vehicle?: string
    quoteId?: string
  }
}

export function FinanceApplicationFullForm({ vehicleId, vehicleData, tradeInData }: FinanceApplicationFullFormProps) {
  const router = useRouter()
  const { user, isLoading: isAuthLoading } = useAuth()
  const draftLoadedRef = useRef(false)
  const serverSyncTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftKey = useMemo(() => `pm:finance-draft:${vehicleId || "general"}`, [vehicleId])
  // Capture UTM params from URL on mount (persisted to submission payload)
  const utmParams = useRef<Record<string, string>>({})
  useEffect(() => {
    if (typeof window === "undefined") return
    const sp = new URLSearchParams(window.location.search)
    const utm: Record<string, string> = {}
    for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"]) {
      const val = sp.get(key)
      if (val) utm[key] = val
    }
    // Also check sessionStorage for previously captured UTMs
    try {
      const stored = sessionStorage.getItem("pm:utm")
      if (stored) Object.assign(utm, JSON.parse(stored))
      if (Object.keys(utm).length > 0) sessionStorage.setItem("pm:utm", JSON.stringify(utm))
    } catch { /* noop */ }
    utmParams.current = utm
  }, [])

  // GA4 form_start — fires once on first user interaction
  const formStartFired = useRef(false)
  const fireFormStart = useCallback(() => {
    if (formStartFired.current) return
    formStartFired.current = true
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "form_start", {
        event_category: "finance_application",
        vehicle_id: vehicleId || "general",
      })
    }
  }, [vehicleId])
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  // Idempotency key — generated once per form mount, prevents duplicate submissions
  const idempotencyKey = useRef<string>(crypto.randomUUID())
  
  // Form state
  const [primaryApplicant, setPrimaryApplicant] = useState<ApplicantData>(emptyApplicant)
  const [includeCoApplicant, setIncludeCoApplicant] = useState(false)
  const [coApplicant, setCoApplicant] = useState<ApplicantData>(emptyApplicant)
  const [coApplicantRelation, setCoApplicantRelation] = useState("")
  
  const [vehicleInfo, setVehicleInfo] = useState<VehicleInfo>({
    vin: "",
    year: "",
    make: "",
    model: "",
    trim: "",
    color: "",
    mileage: "",
    totalPrice: "",
    downPayment: "0",
    maxDownPayment: ""
  })
  
  // Auto-fill vehicle info when vehicleData is provided from inventory
  useEffect(() => {
    if (vehicleData) {
      setVehicleInfo(prev => ({
        ...prev,
        vin: vehicleData.vin || "",
        year: vehicleData.year?.toString() || "",
        make: vehicleData.make || "",
        model: vehicleData.model || "",
        trim: vehicleData.trim || "",
        color: vehicleData.color || "",
        mileage: vehicleData.mileage?.toString() || "",
        totalPrice: vehicleData.price?.toString() || "",
      }))
    }
  }, [vehicleData])
  
  // Auto-calculate annual income when gross income or frequency changes
  useEffect(() => {
    const grossAmount = Number.parseFloat(primaryApplicant.grossIncome) || 0
    const frequency = primaryApplicant.incomeFrequency
    const otherAmount = Number.parseFloat(primaryApplicant.otherIncomeAmount) || 0
    const otherFreq = primaryApplicant.otherIncomeFrequency
    
    // Calculate annual gross income based on frequency
    let annualGross = 0
    if (grossAmount > 0 && frequency) {
      switch (frequency) {
        case 'weekly': annualGross = grossAmount * 52; break
        case 'bi-weekly': annualGross = grossAmount * 26; break
        case 'semi-monthly': annualGross = grossAmount * 24; break
        case 'monthly': annualGross = grossAmount * 12; break
        case 'annually': annualGross = grossAmount; break
        default: annualGross = grossAmount * 12 // Default to monthly
      }
    }
    
    // Calculate annual other income based on frequency
    let annualOther = 0
    if (otherAmount > 0 && otherFreq) {
      switch (otherFreq) {
        case 'weekly': annualOther = otherAmount * 52; break
        case 'bi-weekly': annualOther = otherAmount * 26; break
        case 'semi-monthly': annualOther = otherAmount * 24; break
        case 'monthly': annualOther = otherAmount * 12; break
        case 'annually': annualOther = otherAmount; break
        default: annualOther = otherAmount
      }
    }
    
    const totalAnnual = annualGross + annualOther
    // Always update annualTotal (even if 0)
    setPrimaryApplicant(prev => ({ ...prev, annualTotal: totalAnnual.toFixed(2) }))
  }, [primaryApplicant.grossIncome, primaryApplicant.incomeFrequency, primaryApplicant.otherIncomeAmount, primaryApplicant.otherIncomeFrequency])
  
  const [tradeIn, setTradeIn] = useState<TradeInInfo>(() => {
    if (tradeInData && tradeInData.value > 0) {
      const vehicleParts = tradeInData.vehicle?.split(' ') || []
      return {
        hasTradeIn: true, 
        vin: "", 
        year: vehicleParts[0] || "", 
        make: vehicleParts[1] || "", 
        model: vehicleParts.slice(2).join(' ') || "", 
        trim: "",
        color: "", 
        mileage: "", 
        condition: "good", 
        estimatedValue: tradeInData.value.toString(),
        hasLien: false, 
        lienHolder: "", 
        lienAmount: ""
      }
    }
    return {
      hasTradeIn: false, vin: "", year: "", make: "", model: "", trim: "",
      color: "", mileage: "", condition: "", estimatedValue: "",
      hasLien: false, lienHolder: "", lienAmount: ""
    }
  })
  
const [financingTerms, setFinancingTerms] = useState<FinancingTerms>({
  agreementType: "finance",
  salesTaxRate: "13",
  interestRate: "",
  adminFee: "895",
  omvicFee: "22",
  certificationFee: "595",
  licensingFee: "59",
  deliveryFee: "0",
  deliveryPostalCode: "",
  loanTermMonths: 72,
  paymentFrequency: "bi-weekly"
  })
  
  const [documents, setDocuments] = useState<DocumentUpload[]>([])
  const [additionalNotes, setAdditionalNotes] = useState("")

  // Stripe checkout client secret fetcher – memoized to avoid re-initializing the
  // EmbeddedCheckoutProvider on auth-triggered re-renders.
  const fetchClientSecret = useCallback(() => {
    // When no vehicle is selected (user started from generic /financing page),
    // use the simpler product-based checkout that doesn't require vehicle locking.
    if (!vehicleId) {
      return import("@/app/actions/stripe").then(({ startCheckoutSession }) =>
        startCheckoutSession("deposit")
      ).then((secret) => {
        if (!secret) throw new Error("Missing checkout client secret")
        return secret
      })
    }

    const vehicleName = vehicleData
      ? `${vehicleData.year} ${vehicleData.make} ${vehicleData.model}`.trim()
      : "Vehicle Deposit"
    return startVehicleCheckout({
      vehicleId,
      vehicleName,
      depositOnly: true,
      customerEmail: primaryApplicant.email || undefined,
    }).then((secret) => {
      if (!secret) throw new Error("Missing checkout client secret")
      return secret
    })
  }, [vehicleId, vehicleData, primaryApplicant.email])

  // Helper: restore form state from a draft object
  const restoreFromDraft = useCallback((draft: Record<string, unknown>) => {
    if (typeof draft.currentStep === "number") setCurrentStep(draft.currentStep)
    if (isApplicantData(draft.primaryApplicant)) setPrimaryApplicant(draft.primaryApplicant)
    if (typeof draft.includeCoApplicant === "boolean") setIncludeCoApplicant(draft.includeCoApplicant)
    if (isApplicantData(draft.coApplicant)) setCoApplicant(draft.coApplicant)
    if (typeof draft.coApplicantRelation === "string") setCoApplicantRelation(draft.coApplicantRelation)
    if (isVehicleInfo(draft.vehicleInfo)) setVehicleInfo(draft.vehicleInfo)
    if (isTradeInInfo(draft.tradeIn)) setTradeIn(draft.tradeIn)
    if (isFinancingTerms(draft.financingTerms)) setFinancingTerms(draft.financingTerms)
    if (typeof draft.additionalNotes === "string") setAdditionalNotes(draft.additionalNotes)
  }, [])

  // Recover in-progress form data: try server first (if logged in), fall back to localStorage.
  // Wait for auth to settle so we don't skip the server fetch when user is still loading.
  useEffect(() => {
    if (draftLoadedRef.current || isAuthLoading) return

    async function loadDraft() {
      let serverDraft: Record<string, unknown> | null = null
      let localDraft: Record<string, unknown> | null = null

      // Try server draft (persists across devices)
      if (user) {
        try {
          const res = await fetch("/api/v1/financing/drafts")
          if (res.ok) {
            const data = await res.json()
            const drafts = data.data || []
            const match = drafts.find(
              (d: { vehicle_id: string | null }) =>
                (vehicleId && d.vehicle_id === vehicleId) || (!vehicleId && !d.vehicle_id)
            )
            if (match?.form_data && Object.keys(match.form_data).length > 0) {
              serverDraft = match.form_data as Record<string, unknown>
            }
          }
        } catch {
          // Fall through to localStorage
        }
      }

      // Try sessionStorage (non-PII subset, written after 250ms for unauthenticated users)
      try {
        const raw = window.sessionStorage.getItem(draftKey) || window.localStorage.getItem(draftKey)
        if (raw) {
          localDraft = JSON.parse(raw) as Record<string, unknown>
          // Clean up any legacy localStorage draft (PII migration)
          window.localStorage.removeItem(draftKey)
        }
      } catch (error) {
        console.error("Failed to restore finance draft:", error)
      }

      const getSavedAt = (draft: Record<string, unknown> | null) => {
        if (!draft || typeof draft.savedAt !== "string") return 0
        const parsed = Date.parse(draft.savedAt)
        return Number.isFinite(parsed) ? parsed : 0
      }

      const freshestDraft =
        getSavedAt(localDraft) > getSavedAt(serverDraft) ? localDraft : serverDraft

      if (freshestDraft) {
        restoreFromDraft(freshestDraft)
      }

      draftLoadedRef.current = true
    }

    loadDraft()
  }, [draftKey, user, isAuthLoading, vehicleId, restoreFromDraft])

  // Persist in-progress form data.
  // Authenticated users → server only (full payload, no PII on client).
  // Unauthenticated fallback → sessionStorage with minimal, non-PII subset.
  useEffect(() => {
    if (!draftLoadedRef.current || isSubmitted) return

    const now = new Date().toISOString()

    // Full payload — only sent to server, never stored client-side
    const fullPayload = {
      currentStep,
      primaryApplicant,
      includeCoApplicant,
      coApplicant,
      coApplicantRelation,
      vehicleInfo,
      tradeIn,
      financingTerms,
      additionalNotes,
      savedAt: now,
    }

    // Minimal non-PII subset for client-side fallback
    const localPayload = {
      currentStep,
      includeCoApplicant,
      vehicleInfo: {
        vin: vehicleInfo.vin,
        year: vehicleInfo.year,
        make: vehicleInfo.make,
        model: vehicleInfo.model,
        trim: vehicleInfo.trim,
        color: vehicleInfo.color,
        mileage: vehicleInfo.mileage,
        totalPrice: vehicleInfo.totalPrice,
        downPayment: vehicleInfo.downPayment,
        maxDownPayment: vehicleInfo.maxDownPayment,
      },
      tradeIn: {
        hasTradeIn: tradeIn.hasTradeIn,
        vin: tradeIn.vin,
        year: tradeIn.year,
        make: tradeIn.make,
        model: tradeIn.model,
        trim: tradeIn.trim,
        color: tradeIn.color,
        mileage: tradeIn.mileage,
        condition: tradeIn.condition,
        estimatedValue: tradeIn.estimatedValue,
        hasLien: tradeIn.hasLien,
        lienHolder: tradeIn.lienHolder,
        lienAmount: tradeIn.lienAmount,
      },
      financingTerms,
      additionalNotes,
      savedAt: now,
    }

    if (user) {
      // Authenticated: save full payload to server only, clear any client remnant
      if (serverSyncTimer.current) clearTimeout(serverSyncTimer.current)
      serverSyncTimer.current = setTimeout(() => {
        fetch("/api/v1/financing/drafts", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vehicleId: vehicleId || null, formData: fullPayload }),
        }).catch((error) => {
          console.error("Failed to save finance draft to server:", error)
        })
      }, 2000)

      // Remove any stale localStorage/sessionStorage PII from before login
      try { window.localStorage.removeItem(draftKey) } catch { /* noop */ }
      try { window.sessionStorage.removeItem(draftKey) } catch { /* noop */ }
    } else {
      // Unauthenticated: save minimal non-PII subset to sessionStorage (tab-scoped)
      const localTimeout = window.setTimeout(() => {
        try {
          window.sessionStorage.setItem(draftKey, JSON.stringify(localPayload))
        } catch (error) {
          console.error("Failed to save finance draft to sessionStorage:", error)
        }
      }, 250)

      return () => {
        window.clearTimeout(localTimeout)
      }
    }

    return () => {
      if (serverSyncTimer.current) clearTimeout(serverSyncTimer.current)
    }
  }, [
    draftKey,
    isSubmitted,
    currentStep,
    primaryApplicant,
    includeCoApplicant,
    coApplicant,
    coApplicantRelation,
    vehicleInfo,
    tradeIn,
    financingTerms,
    additionalNotes,
    user,
    vehicleId,
  ])
  
  const steps = [
    { number: 1, title: "Applicant", icon: User },
    { number: 2, title: "Co-Applicant", icon: User },
    { number: 3, title: "Vehicle & Financing", icon: Car },
    { number: 4, title: "Review & Submit", icon: FileText },
    { number: 5, title: "Documents", icon: Upload },
    { number: 6, title: "ID Verification", icon: Shield },
  ]
  
  // Calculate financing details
  const calculateFinancing = () => {
    const price = Number.parseFloat(vehicleInfo.totalPrice) || 0
    const downPayment = Number.parseFloat(vehicleInfo.downPayment) || 0
    const tradeValue = tradeIn.hasTradeIn ? (Number.parseFloat(tradeIn.estimatedValue) || 0) : 0
    const lienAmount = tradeIn.hasLien ? (Number.parseFloat(tradeIn.lienAmount) || 0) : 0
    const netTrade = tradeValue - lienAmount
    const adminFee = financingTerms.agreementType === "finance" ? (Number.parseFloat(financingTerms.adminFee) || 895) : 0
    const omvicFee = Number.parseFloat(financingTerms.omvicFee) || 22
    const certificationFee = Number.parseFloat(financingTerms.certificationFee) || 595
    const licensingFee = Number.parseFloat(financingTerms.licensingFee) || 59
    const deliveryFee = Number.parseFloat(financingTerms.deliveryFee) || 0
    const taxRate = Number.parseFloat(financingTerms.salesTaxRate) / 100 || PROVINCE_TAX_RATES.ON.total
    
    // All fees: Admin Fee (finance only) + OMVIC + Certification + Licensing + Delivery
    const totalFees = adminFee + omvicFee + certificationFee + licensingFee + deliveryFee
    
    // For Finance: Price + All Fees + Tax - Down Payment - Trade
    // For Cash: Price + fees (no admin fee) + Tax - Down Payment - Trade

    const tax = (price + totalFees) * taxRate // Tax on price + fees before credits
    const amountFinanced = price + totalFees + tax - downPayment - netTrade
    
    // Calculate payment
    const rate = (Number.parseFloat(financingTerms.interestRate) || 8.99) / 100

    const term = financingTerms.loanTermMonths
    
    let paymentsPerYear = 12
    if (financingTerms.paymentFrequency === "weekly") paymentsPerYear = 52
    else if (financingTerms.paymentFrequency === "bi-weekly") paymentsPerYear = 26
    else if (financingTerms.paymentFrequency === "semi-monthly") paymentsPerYear = 24
    
    const periodicRate = rate / paymentsPerYear
    const totalPayments = (term / 12) * paymentsPerYear
    
    const payment = amountFinanced * (periodicRate * Math.pow(1 + periodicRate, totalPayments)) / 
      (Math.pow(1 + periodicRate, totalPayments) - 1)
    
    const totalToRepay = payment * totalPayments
    const totalInterest = totalToRepay - amountFinanced
    
    return {
      price,
      downPayment,
      netTrade,
      adminFee,
      omvicFee,
      certificationFee,
      licensingFee,
      deliveryFee,
      totalFees,
      tax,
      amountFinanced,
      payment: Number.isNaN(payment) ? 0 : payment,
      totalToRepay: Number.isNaN(totalToRepay) ? 0 : totalToRepay,
      totalInterest: Number.isNaN(totalInterest) ? 0 : totalInterest,
      totalPayments
    }
  }
  
  const financing = calculateFinancing()
  
  // Validation state
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  
  // Helper to check if a field has an error and return the error class

  
  // Phone number validation - strict rules for real Canadian phone numbers
  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    const digitsOnly = phone.replace(/\D/g, '')
    
    // Must be exactly 10 digits
    if (digitsOnly.length !== 10) {
      return { valid: false, error: "Phone must be exactly 10 digits" }
    }
    
    const areaCode = digitsOnly.slice(0, 3)
    const exchange = digitsOnly.slice(3, 6)
    const lineNumber = digitsOnly.slice(6, 10)
    
    // Area code cannot start with 0 or 1 (North American numbering rules)
    if (areaCode[0] === '0' || areaCode[0] === '1') {
      return { valid: false, error: "Invalid area code - cannot start with 0 or 1" }
    }
    
    // Exchange (first 3 digits of local number) cannot start with 0 or 1
    if (exchange[0] === '0' || exchange[0] === '1') {
      return { valid: false, error: "Invalid phone number format" }
    }
    
    // Block obvious fake/test numbers
    const fakePatterns = [
      '0000000', '1111111', '2222222', '3333333', '4444444',
      '5555555', '6666666', '7777777', '8888888', '9999999',
      '1234567', '2345678', '3456789', '7654321', '9876543',
      '1231234', '1112222', '1234321', '0001234', '9990000'
    ]
    const localNumber = digitsOnly.slice(3) // Last 7 digits
    if (fakePatterns.includes(localNumber)) {
      return { valid: false, error: "Please enter a valid phone number" }
    }
    
    // Block 555-01XX to 555-09XX (reserved for fictional use)
    if (exchange === '555' && lineNumber >= '0100' && lineNumber <= '0199') {
      return { valid: false, error: "Please enter a valid phone number" }
    }
    
    // Block numbers with all same digits
    if (/^(\d)\1{9}$/.test(digitsOnly)) {
      return { valid: false, error: "Please enter a valid phone number" }
    }
    
    // Block sequential ascending/descending patterns
    const isSequential = (str: string): boolean => {
      let ascending = true, descending = true
      for (let i = 1; i < str.length; i++) {
        if (Number.parseInt(str[i]) !== Number.parseInt(str[i-1]) + 1) ascending = false
        if (Number.parseInt(str[i]) !== Number.parseInt(str[i-1]) - 1) descending = false
      }
      return (ascending || descending) && str.length >= 7
    }
    if (isSequential(localNumber)) {
      return { valid: false, error: "Please enter a valid phone number" }
    }
    
    return { valid: true }
  }
  

  
  // Validate Step 1 - Primary Applicant
  const validateStep1 = (): string[] => {
    const errors: string[] = []
    if (!primaryApplicant.firstName.trim()) errors.push("First Name is required")
    if (!primaryApplicant.lastName.trim()) errors.push("Last Name is required")
    if (!primaryApplicant.dateOfBirth.day || !primaryApplicant.dateOfBirth.month || !primaryApplicant.dateOfBirth.year) {
      errors.push("Date of Birth is required")
    }
    if (!primaryApplicant.gender) errors.push("Gender is required")
    if (!primaryApplicant.maritalStatus) errors.push("Marital Status is required")
    const phoneValidation = validatePhone(primaryApplicant.phone)
    if (!primaryApplicant.phone || !phoneValidation.valid) {
      errors.push(phoneValidation.error || "Phone number is required")
    }
    if (!primaryApplicant.email.trim() && !primaryApplicant.noEmail) errors.push("Email is required")
    if (!primaryApplicant.creditRating) errors.push("Credit Rating is required")
    if (!primaryApplicant.postalCode.trim() || primaryApplicant.postalCode.replace(/\s/g, '').length < 6) {
      errors.push("Valid Postal Code is required (format: A1A 1A1)")
    }
    if (!primaryApplicant.addressType) errors.push("Address Type is required")
    if (!primaryApplicant.streetNumber.trim()) errors.push("Street Number is required")
    if (!primaryApplicant.streetName.trim()) errors.push("Street Name is required")
    if (!primaryApplicant.city.trim()) errors.push("City is required")
    if (!primaryApplicant.province) errors.push("Province is required")
    if (!primaryApplicant.homeStatus) errors.push("Home Status is required")
    if (!primaryApplicant.monthlyPayment) errors.push("Monthly Payment is required")
    if (!primaryApplicant.employmentCategory) errors.push("Employment Type is required")
    if (!primaryApplicant.employmentStatus) errors.push("Employment Status is required")
    if (!primaryApplicant.employerName.trim()) errors.push("Employer Name is required")
    if (!primaryApplicant.occupation.trim()) errors.push("Occupation is required")
    if (!primaryApplicant.employerPostalCode.trim() || primaryApplicant.employerPostalCode.replace(/\s/g, '').length < 6) {
      errors.push("Employer Postal Code is required (format: A1A 1A1)")
    }
    const employerPhoneValidation = validatePhone(primaryApplicant.employerPhone)
    if (!primaryApplicant.employerPhone || !employerPhoneValidation.valid) {
      errors.push("Employer " + (employerPhoneValidation.error || "Phone is required"))
    }
    if (!primaryApplicant.grossIncome) errors.push("Gross Income is required")
    if (!primaryApplicant.incomeFrequency) errors.push("Income Frequency is required")
    return errors
  }
  
  // Validate Step 2 - Co-Applicant (only if included)
  const validateStep2 = (): string[] => {
    if (!includeCoApplicant) return []
    const errors: string[] = []
    if (!coApplicantRelation) errors.push("Relation to Primary Applicant is required")
    if (!coApplicant.firstName.trim()) errors.push("Co-Applicant First Name is required")
    if (!coApplicant.lastName.trim()) errors.push("Co-Applicant Last Name is required")
    const coPhoneValidation = validatePhone(coApplicant.phone)
    if (!coApplicant.phone || !coPhoneValidation.valid) {
      errors.push("Co-Applicant " + (coPhoneValidation.error || "Phone is required"))
    }
    if (!coApplicant.email.trim() && !coApplicant.noEmail) errors.push("Co-Applicant Email is required")
    return errors
  }
  
  // Validate Step 3 - Vehicle & Financing
  const validateStep3 = (): string[] => {
    const errors: string[] = []
    // Vehicle must be selected from inventory
    const isVehicleSelected = Boolean(vehicleInfo.year && vehicleInfo.make && vehicleInfo.totalPrice && Number.parseFloat(vehicleInfo.totalPrice) > 0)
    if (!isVehicleSelected) {
      errors.push("Please select a vehicle from inventory")
    }
    // Down payment validation: must be >= 0 and <= vehicle price
    const dp = Number.parseFloat(vehicleInfo.downPayment) || 0
    const price = Number.parseFloat(vehicleInfo.totalPrice) || 0
    if (dp < 0) {
      errors.push("Down payment cannot be negative")
    }
    if (price > 0 && dp > price) {
      errors.push("Down payment cannot exceed the vehicle price")
    }
    return errors
  }
  
// Handle step navigation with validation
  const handleNextStep = () => {
    setSubmitError(null)
  let errors: string[] = []
  
  if (currentStep === 1) {
      errors = validateStep1()
    } else if (currentStep === 2) {
      errors = validateStep2()
    } else if (currentStep === 3) {
      errors = validateStep3()
    }
    
if (errors.length > 0) {
  setValidationErrors(errors)
  // Scroll to top to show errors
  window.scrollTo({ top: 0, behavior: 'smooth' })
  return
  }
    
    setValidationErrors([])
    // GA4 step complete event
    if (typeof window !== "undefined" && (window as any).gtag) {
      (window as any).gtag("event", "form_step_complete", {
        event_category: "finance_application",
        step_number: currentStep,
        vehicle_id: vehicleId || "general",
      })
    }
    setCurrentStep(prev => prev + 1)
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      // Fire GA4 form_submit event (respects consent mode — gtag handles consent internally)
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "form_submit", {
          event_category: "finance_application",
          vehicle_id: vehicleId || "general",
          has_co_applicant: includeCoApplicant,
          has_trade_in: tradeIn.hasTradeIn,
        })
      }
      const response = await fetch("/api/v1/financing/applications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": idempotencyKey.current,
        },
        body: JSON.stringify({
          primaryApplicant,
          coApplicant: includeCoApplicant ? coApplicant : null,
          coApplicantRelation: includeCoApplicant ? coApplicantRelation : null,
          vehicleInfo,
          tradeIn: tradeIn.hasTradeIn ? tradeIn : null,
          financingTerms,
          additionalNotes,
          vehicleId,
          utm: utmParams.current,
        })
      })
      
      const result = await response.json()

      if (!response.ok) {
        const rawMsg =
          result?.error?.message ||
          result?.error ||
          result?.message ||
          JSON.stringify(result) ||
          "Failed to submit application"
        const friendly =
          response.status === 403
            ? "You don't have permission to submit this application. Please log in and try again."
            : response.status === 401
              ? "Your session has expired. Please log in again and resubmit."
              : rawMsg
        throw new Error(friendly)
      }

      const applicationId =
        result.data?.application?.id ||
        result.data?.applicationId ||
        result.data?.id
  
  // Upload documents to private Blob storage
  if (applicationId && documents.length > 0) {
    for (const doc of documents) {
      if (doc.file) {
        const formData = new FormData()
        formData.append("file", doc.file)
        formData.append("applicationId", applicationId)
        formData.append("documentType", doc.type)
        
        try {
          const uploadRes = await fetch("/api/v1/financing/documents", {
            method: "POST",
            body: formData
          })
          if (!uploadRes.ok) {
            console.error("Document upload failed:", doc.type)
          }
        } catch (uploadErr) {
          console.error("Document upload error:", uploadErr)
        }
      }
    }
  }
  
      // Clean up drafts after successful submission
      try {
        window.localStorage.removeItem(draftKey)
        window.sessionStorage.removeItem(draftKey)
      } catch {
        // Ignore storage failures.
      }
      if (user) {
        const deleteParam = vehicleId ? `vehicleId=${vehicleId}` : "vehicleId="
        fetch(`/api/v1/financing/drafts?${deleteParam}`, { method: "DELETE" }).catch((err) => console.warn("[silent-catch]", err))
      }
      setIsSubmitted(true)
  } catch (error) {
      console.error("Submit error:", error)
      const errMsg = error instanceof Error ? error.message : "Unable to submit application right now."
      setSubmitError(errMsg)
      // Fire GA4 form_error event
      if (typeof window !== "undefined" && (window as any).gtag) {
        (window as any).gtag("event", "form_error", {
          event_category: "finance_application",
          error_message: errMsg,
          vehicle_id: vehicleId || "general",
        })
      }
  } finally {
    setIsSubmitting(false)
  }
  }
  
  // Render success state — mandatory $250 deposit via Stripe Embedded Checkout
  if (isSubmitted) {
    const stripeInstance = getStripePromise()
    const canCheckout = !!stripeInstance

    return (
      <div className="max-w-2xl mx-auto p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
          <p className="text-muted-foreground">
            Your finance application has been submitted successfully.
            {canCheckout
              ? vehicleId
                ? " Complete your $250 refundable deposit below to secure this vehicle."
                : " Complete your $250 refundable deposit below to fast-track your application."
              : " A team member will contact you shortly to finalize your purchase."}
          </p>
        </div>

        {canCheckout ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold">Secure Payment — $250 Refundable Deposit</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-6">
                {vehicleId
                  ? "Your deposit holds this vehicle for 48 hours while we process your application. Fully refundable."
                  : "Your deposit fast-tracks your application review. Fully refundable."}
              </p>
              <div className="min-h-[400px]">
                <EmbeddedCheckoutProvider stripe={stripeInstance} options={{ fetchClientSecret }}>
                  <EmbeddedCheckout />
                </EmbeddedCheckoutProvider>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                <div className="text-sm">
                  <p className="font-semibold text-amber-800">Payment temporarily unavailable</p>
                  <p className="text-amber-700">
                    We&apos;re unable to load the payment form right now. Please try again or call us at{" "}
                    <a href="tel:+16479073334" className="underline font-semibold">(647) 907-3334</a>.
                  </p>
                </div>
              </div>
              <Button
                className="w-full mt-4"
                onClick={() => window.location.reload()}
              >
                Retry Payment
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-muted-foreground mt-6">
          Powered by Stripe. Your payment information is secure and encrypted.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8" data-testid="finance-progress-indicator" role="status" aria-live="polite" aria-label={`Step ${currentStep} of 5`}>
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            // Skip co-applicant step if not needed
            if (step.number === 2 && !includeCoApplicant && currentStep !== 1) {
              return null
            }
            return (
              <div key={step.number} className="flex items-center">
                <div className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                  currentStep >= step.number 
                    ? "bg-primary border-primary text-primary-foreground"
                    : "border-muted-foreground/30 text-muted-foreground"
                )}>
                  {currentStep > step.number ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                <span className={cn(
                  "ml-2 text-sm font-semibold hidden sm:block",
                  currentStep >= step.number ? "text-foreground" : "text-muted-foreground"
                )}>
                  {step.title}
                </span>
                {index < steps.length - 1 && (
                  <div className={cn(
                    "w-12 lg:w-24 h-0.5 mx-2",
                    currentStep > step.number ? "bg-primary" : "bg-muted"
                  )} />
                )}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Step Content */}
      <Card>
        <CardContent className="p-6">
          {submitError ? (
            <div
              data-testid="finance-error-summary"
              role="alert"
              aria-live="assertive"
              tabIndex={-1}
              className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
              <span>{submitError}</span>
            </div>
          ) : null}

          {/* STEP 1: Primary Applicant */}
          {currentStep === 1 && (
<ApplicantForm
  title="Primary Applicant Information"
  description="Enter your personal, address, employment, and income information"
  data={primaryApplicant}
  onChange={setPrimaryApplicant}
  isPrimary
  validationErrors={validationErrors}
  />
          )}
          
          {/* STEP 2: Co-Applicant */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-6">
                <Checkbox
                  id="includeCoApplicant"
                  checked={includeCoApplicant}
                  onCheckedChange={(checked) => setIncludeCoApplicant(checked as boolean)}
                />
                <Label htmlFor="includeCoApplicant" className="text-base font-semibold cursor-pointer">
                  Include Co-Applicant / Co-Signer
                </Label>
              </div>
              
              {includeCoApplicant && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                      <Label>Relation to Primary Applicant *</Label>
                      <Select value={coApplicantRelation} onValueChange={setCoApplicantRelation}>
                        <SelectTrigger><SelectValue placeholder="Select relation" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="spouse">Spouse</SelectItem>
                          <SelectItem value="common_law">Common-Law Partner</SelectItem>
                          <SelectItem value="parent">Parent</SelectItem>
                          <SelectItem value="sibling">Sibling</SelectItem>
                          <SelectItem value="friend">Friend</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
<ApplicantForm
  title="Co-Applicant Information"
  description="Enter co-applicant details"
  data={coApplicant}
  onChange={setCoApplicant}
  isPrimary={false}
  validationErrors={validationErrors}
  />
                </>
              )}
            </div>
          )}
          
          {/* STEP 3: Vehicle & Financing */}
          {currentStep === 3 && (
            <VehicleFinancingForm
              vehicleInfo={vehicleInfo}
              setVehicleInfo={setVehicleInfo}
              tradeIn={tradeIn}
              setTradeIn={setTradeIn}
              financingTerms={financingTerms}
              setFinancingTerms={setFinancingTerms}
              financing={financing}
              additionalNotes={additionalNotes}
              setAdditionalNotes={setAdditionalNotes}
            />
          )}
          
          {/* STEP 4: Review */}
          {currentStep === 4 && (
            <ReviewStep
              primaryApplicant={primaryApplicant}
              coApplicant={includeCoApplicant ? coApplicant : null}
              vehicleInfo={vehicleInfo}
              tradeIn={tradeIn}
              financingTerms={financingTerms}
              financing={financing}
            />
          )}
          
          {/* STEP 5: Documents */}
          {currentStep === 5 && (
            <DocumentsStep
              documents={documents}
              setDocuments={setDocuments}
              onSubmit={handleSubmit}
              isSubmitting={isSubmitting}
            />
          )}
        </CardContent>
      </Card>
      
      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-destructive/10 border border-destructive rounded-lg p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-destructive">Please fix the following errors:</p>
              <ul className="list-disc list-inside mt-2 text-sm text-destructive">
                {validationErrors.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          data-testid="finance-btn-back"
          onClick={() => {
            setValidationErrors([])
            setCurrentStep(prev => Math.max(1, prev - 1))
          }}
          disabled={currentStep === 1}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        
        {currentStep < 5 ? (
          <Button data-testid="finance-btn-continue" onClick={handleNextStep}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button data-testid="finance-btn-submit" aria-busy={isSubmitting} onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Submit Application
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}
