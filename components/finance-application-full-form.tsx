"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { 
  User, MapPin, Home, Briefcase, DollarSign, Car, FileText, Upload,
  ArrowRight, ArrowLeft, CheckCircle, Loader2, Shield, AlertCircle, X
} from "lucide-react"
import { cn } from "@/lib/utils"
import { PROVINCE_TAX_RATES } from "@/lib/tax/canada"

// =====================================================
// TYPES
// =====================================================
interface ApplicantData {
  // Personal Info
  salutation: string
  firstName: string
  middleName: string
  lastName: string
  suffix: string
  dateOfBirth: { day: string; month: string; year: string }
  gender: string
  maritalStatus: string
  phone: string
  mobilePhone: string
  email: string
  noEmail: boolean
  languagePreference: string
  creditRating: string
  
  // Address
  postalCode: string
  addressType: string
  suiteNumber: string
  streetNumber: string
  streetName: string
  streetType: string
  streetDirection: string
  city: string
  province: string
  durationYears: string
  durationMonths: string
  
  // Housing
  homeStatus: string
  marketValue: string
  mortgageAmount: string
  mortgageHolder: string
  monthlyPayment: string
  outstandingMortgage: string
  
  // Employment
  employmentCategory: string
  employmentStatus: string
  employerName: string
  occupation: string
  jobTitle: string
  employerStreet: string
  employerCity: string
  employerProvince: string
  employerPostalCode: string
  employerPhone: string
  employerPhoneExt: string
  employmentYears: string
  employmentMonths: string
  
  // Income
  grossIncome: string
  incomeFrequency: string
  otherIncomeType: string
  otherIncomeAmount: string
  otherIncomeFrequency: string
  otherIncomeDescription: string
  annualTotal: string
}

interface VehicleInfo {
  vin: string
  year: string
  make: string
  model: string
  trim: string
  color: string
  mileage: string
  totalPrice: string
  downPayment: string
  maxDownPayment: string
}

interface TradeInInfo {
  hasTradeIn: boolean
  vin: string
  year: string
  make: string
  model: string
  trim: string
  color: string
  mileage: string
  condition: string
  estimatedValue: string
  hasLien: boolean
  lienHolder: string
  lienAmount: string
}

interface FinancingTerms {
  agreementType: "finance" | "cash"
  salesTaxRate: string
  interestRate: string
  adminFee: string
  omvicFee: string
  certificationFee: string
  licensingFee: string
  deliveryFee: string
  deliveryPostalCode: string
  loanTermMonths: number
  paymentFrequency: "weekly" | "bi-weekly" | "semi-monthly" | "monthly"
  }

interface DocumentUpload {
  type: string
  name: string
  file: File | null
  url?: string
}

// Initial state
const emptyApplicant: ApplicantData = {
  salutation: "", firstName: "", middleName: "", lastName: "", suffix: "",
  dateOfBirth: { day: "", month: "", year: "" },
  gender: "", maritalStatus: "", phone: "", mobilePhone: "", email: "",
  noEmail: false, languagePreference: "en", creditRating: "",
  postalCode: "", addressType: "", suiteNumber: "", streetNumber: "",
  streetName: "", streetType: "", streetDirection: "", city: "", province: "Ontario",
  durationYears: "", durationMonths: "",
  homeStatus: "", marketValue: "", mortgageAmount: "", mortgageHolder: "",
  monthlyPayment: "", outstandingMortgage: "",
  employmentCategory: "", employmentStatus: "", employerName: "", occupation: "",
  jobTitle: "", employerStreet: "", employerCity: "", employerProvince: "",
  employerPostalCode: "", employerPhone: "", employerPhoneExt: "",
  employmentYears: "", employmentMonths: "",
  grossIncome: "", incomeFrequency: "", otherIncomeType: "",
  otherIncomeAmount: "", otherIncomeFrequency: "", otherIncomeDescription: "",
  annualTotal: ""
}

// =====================================================
// MAIN COMPONENT
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
  const draftLoadedRef = useRef(false)
  const draftKey = useMemo(() => `pm:finance-draft:${vehicleId || "general"}`, [vehicleId])
  const [currentStep, setCurrentStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  
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
    const grossAmount = parseFloat(primaryApplicant.grossIncome) || 0
    const frequency = primaryApplicant.incomeFrequency
    const otherAmount = parseFloat(primaryApplicant.otherIncomeAmount) || 0
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

  // Recover in-progress form data if user was interrupted or page refreshed.
  useEffect(() => {
    if (draftLoadedRef.current) return
    try {
      const raw = window.localStorage.getItem(draftKey)
      if (!raw) {
        draftLoadedRef.current = true
        return
      }
      const draft = JSON.parse(raw) as Record<string, unknown>
      if (typeof draft.currentStep === "number") setCurrentStep(draft.currentStep)
      if (draft.primaryApplicant) setPrimaryApplicant(draft.primaryApplicant as ApplicantData)
      if (typeof draft.includeCoApplicant === "boolean") setIncludeCoApplicant(draft.includeCoApplicant)
      if (draft.coApplicant) setCoApplicant(draft.coApplicant as ApplicantData)
      if (typeof draft.coApplicantRelation === "string") setCoApplicantRelation(draft.coApplicantRelation)
      if (draft.vehicleInfo) setVehicleInfo(draft.vehicleInfo as VehicleInfo)
      if (draft.tradeIn) setTradeIn(draft.tradeIn as TradeInInfo)
      if (draft.financingTerms) setFinancingTerms(draft.financingTerms as FinancingTerms)
      if (typeof draft.additionalNotes === "string") setAdditionalNotes(draft.additionalNotes)
    } catch (error) {
      console.error("Failed to restore finance draft:", error)
    } finally {
      draftLoadedRef.current = true
    }
  }, [draftKey])

  // Persist in-progress form data to protect users from accidental session drops.
  useEffect(() => {
    if (!draftLoadedRef.current || isSubmitted) return

    const timeout = window.setTimeout(() => {
      try {
        const payload = {
          currentStep,
          primaryApplicant,
          includeCoApplicant,
          coApplicant,
          coApplicantRelation,
          vehicleInfo,
          tradeIn,
          financingTerms,
          additionalNotes,
          savedAt: new Date().toISOString(),
        }
        window.localStorage.setItem(draftKey, JSON.stringify(payload))
      } catch (error) {
        console.error("Failed to save finance draft:", error)
      }
    }, 250)

    return () => window.clearTimeout(timeout)
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
    const price = parseFloat(vehicleInfo.totalPrice) || 0
    const downPayment = parseFloat(vehicleInfo.downPayment) || 0
    const tradeValue = tradeIn.hasTradeIn ? (parseFloat(tradeIn.estimatedValue) || 0) : 0
    const lienAmount = tradeIn.hasLien ? (parseFloat(tradeIn.lienAmount) || 0) : 0
    const netTrade = tradeValue - lienAmount
    const adminFee = financingTerms.agreementType === "finance" ? (parseFloat(financingTerms.adminFee) || 895) : 0
    const omvicFee = parseFloat(financingTerms.omvicFee) || 22
    const certificationFee = parseFloat(financingTerms.certificationFee) || 595
    const licensingFee = parseFloat(financingTerms.licensingFee) || 59
    const deliveryFee = parseFloat(financingTerms.deliveryFee) || 0
    const taxRate = parseFloat(financingTerms.salesTaxRate) / 100 || PROVINCE_TAX_RATES.ON.total
    
    // All fees: Admin Fee (finance only) + OMVIC + Certification + Licensing + Delivery
    const totalFees = adminFee + omvicFee + certificationFee + licensingFee + deliveryFee
    
    // For Finance: Price + All Fees + Tax - Down Payment - Trade
    // For Cash: Price + fees (no admin fee) + Tax - Down Payment - Trade

    const tax = (price + totalFees) * taxRate // Tax on price + fees before credits
    const amountFinanced = price + totalFees + tax - downPayment - netTrade
    
    // Calculate payment
    const rate = (parseFloat(financingTerms.interestRate) || 8.99) / 100

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
      payment: isNaN(payment) ? 0 : payment,
      totalToRepay: isNaN(totalToRepay) ? 0 : totalToRepay,
      totalInterest: isNaN(totalInterest) ? 0 : totalInterest,
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
        if (parseInt(str[i]) !== parseInt(str[i-1]) + 1) ascending = false
        if (parseInt(str[i]) !== parseInt(str[i-1]) - 1) descending = false
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
    const isVehicleSelected = Boolean(vehicleInfo.year && vehicleInfo.make && vehicleInfo.totalPrice && parseFloat(vehicleInfo.totalPrice) > 0)
    if (!isVehicleSelected) {
      errors.push("Please select a vehicle from inventory")
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
    setCurrentStep(prev => prev + 1)
  }
  
  const handleSubmit = async () => {
    setIsSubmitting(true)
    setSubmitError(null)
    try {
      const response = await fetch("/api/v1/financing/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          primaryApplicant,
          coApplicant: includeCoApplicant ? coApplicant : null,
          coApplicantRelation: includeCoApplicant ? coApplicantRelation : null,
          vehicleInfo,
          tradeIn: tradeIn.hasTradeIn ? tradeIn : null,
          financingTerms,
          additionalNotes,
          vehicleId
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
  
      try {
        window.localStorage.removeItem(draftKey)
      } catch {
        // Ignore localStorage failures.
      }
      setIsSubmitted(true)
  } catch (error) {
      console.error("Submit error:", error)
      setSubmitError(error instanceof Error ? error.message : "Unable to submit application right now.")
  } finally {
    setIsSubmitting(false)
  }
  }
  
  // Render success state - redirect to ID verification
  if (isSubmitted) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Shield className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Application Received!</h2>
        <p className="text-muted-foreground mb-6">
          Your finance application has been saved. Complete identity verification to finalize your application.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={() => router.push(`/financing/verification?vehicleId=${vehicleId || ""}`)}>
            <Shield className="w-4 h-4 mr-2" />
            Continue to ID Verification
          </Button>
          <Button variant="outline" onClick={() => router.push("/inventory")}>
            Complete Later
          </Button>
        </div>
        <p className="text-xs text-muted-foreground mt-4">
          ID verification is required to complete your application
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Progress Steps */}
      <div className="mb-8">
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
                  "ml-2 text-sm font-medium hidden sm:block",
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
            <div className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
              {submitError}
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
                <Label htmlFor="includeCoApplicant" className="text-base font-medium cursor-pointer">
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
              <p className="font-medium text-destructive">Please fix the following errors:</p>
              <ul className="list-disc list-inside mt-2 text-sm text-destructive">
                {validationErrors.map((error, i) => (
                  <li key={i}>{error}</li>
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
          <Button onClick={handleNextStep}>
            Continue
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={isSubmitting}>
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

// =====================================================
// APPLICANT FORM COMPONENT
// =====================================================
interface ApplicantFormProps {
  title: string
  description: string
  data: ApplicantData
  onChange: (data: ApplicantData) => void
  isPrimary: boolean
  validationErrors?: string[]
  }

// =====================================================
// POSTAL CODE INPUT WITH ADDRESS LOOKUP
// =====================================================
interface AddressSuggestion {
  streetName: string
  streetType: string
  direction?: string
  city: string
  province: string
  postalCode: string
  fullAddress: string
}

interface PostalCodeInputProps {
  value: string
  onChange: (postalCode: string, addressData?: { city?: string; province?: string; streetName?: string; streetType?: string; direction?: string }) => void
  label?: string
}

function PostalCodeInput({ value, onChange, label = "Postal Code *" }: PostalCodeInputProps) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [cityProvince, setCityProvince] = useState<{ city: string; province: string }>({ city: '', province: '' })
  
  const formatPostalCode = (val: string): string => {
    let formatted = val.toUpperCase().replace(/[^A-Z0-9]/g, '')
    if (formatted.length > 3) {
      formatted = formatted.slice(0, 3) + ' ' + formatted.slice(3, 6)
    }
    return formatted.slice(0, 7)
  }
  
  const fetchAddressSuggestions = async (postalCode: string) => {
    const cleanPostal = postalCode.replace(/\s/g, '')
    if (cleanPostal.length < 3) {
      setSuggestions([])
      setCityProvince({ city: '', province: '' })
      return
    }
    
    setIsLoading(true)
    try {
      const res = await fetch(`/api/address-lookup?postalCode=${cleanPostal}`)
      const data = await res.json()
      setSuggestions(data.suggestions || [])
      setCityProvince({ city: data.city || '', province: data.province || '' })
      
      // Auto-fill city and province immediately
      if (data.city || data.province) {
        onChange(postalCode, { city: data.city, province: data.province })
      }
      
      if (data.suggestions?.length > 0) {
        setShowSuggestions(true)
      }
    } catch (error) {
      console.error("Error fetching address:", error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    onChange(value, {
      city: suggestion.city,
      province: suggestion.province,
      streetName: suggestion.streetName,
      streetType: suggestion.streetType,
      direction: suggestion.direction,
    })
    setShowSuggestions(false)
  }
  
  return (
    <div className="relative">
      <Label>{label} <span className="text-xs text-primary font-medium">(Auto-fills address)</span></Label>
      <div className="relative">
        <Input 
          value={value} 
          onChange={(e) => {
            const formatted = formatPostalCode(e.target.value)
            onChange(formatted)
            fetchAddressSuggestions(formatted)
          }}
onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
  onBlur={() => setTimeout(() => setShowSuggestions(false), 500)}
  placeholder="L4B 0G2"
  className="font-mono uppercase pr-8 border-primary/50 focus:border-primary"
        />
        {isLoading && (
          <Loader2 className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-primary" />
        )}
      </div>
      
      {/* City/Province indicator */}
      {cityProvince.city && (
        <p className="text-xs text-green-600 mt-1 font-medium flex items-center gap-1">
          <CheckCircle className="w-3 h-3" />
          {cityProvince.city}, {cityProvince.province}
        </p>
      )}
      
      {/* Street suggestions dropdown - MANDATORY SELECTION */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-[9999] left-0 top-full w-[350px] mt-1 bg-background border-2 border-primary rounded-lg shadow-xl max-h-64 overflow-y-auto">
          <div className="px-3 py-2 bg-primary/10 border-b border-primary/20 sticky top-0">
            <p className="text-xs font-semibold text-primary">
              Select your street to auto-fill address:
            </p>
          </div>
          {suggestions.map((suggestion, idx) => (
            <button
              key={idx}
              type="button"
              className="w-full px-3 py-3 text-left text-sm hover:bg-primary/10 flex items-center gap-3 border-b last:border-b-0 transition-colors"
              onClick={() => handleSelectSuggestion(suggestion)}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div>
                <span className="font-semibold text-foreground">{suggestion.streetName} {suggestion.streetType}</span>
                {suggestion.direction && <span className="text-primary font-medium"> {suggestion.direction}</span>}
                <span className="text-muted-foreground text-xs block">{suggestion.city}, {suggestion.province}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function ApplicantForm({ title, description, data, onChange, isPrimary: _isPrimary, validationErrors = [] }: ApplicantFormProps) {
  const updateField = (field: keyof ApplicantData, value: string | boolean | { day: string; month: string; year: string }) => {
    onChange({ ...data, [field]: value })
  }
  
  // Helper to check if a field has an error
  const hasFieldError = (fieldName: string): boolean => {
    return validationErrors.some(err => 
      err.toLowerCase().includes(fieldName.toLowerCase())
    )
  }
  
  // Get error class for inputs
  const getInputErrorClass = (fieldName: string): string => {
    return hasFieldError(fieldName) ? "border-destructive ring-1 ring-destructive bg-destructive/5" : ""
  }
  
  // Get error class for labels
  const getLabelClass = (fieldName: string): string => {
    return hasFieldError(fieldName) ? "text-destructive font-medium" : ""
  }
  
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      
      {/* Personal Information */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <User className="w-4 h-4" />
          Personal Information
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Salutation</Label>
            <Select value={data.salutation} onValueChange={(v) => updateField("salutation", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Mr.">Mr.</SelectItem>
                <SelectItem value="Mrs.">Mrs.</SelectItem>
                <SelectItem value="Ms.">Ms.</SelectItem>
                <SelectItem value="Miss">Miss</SelectItem>
                <SelectItem value="Dr.">Dr.</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("First Name")}>First Name *</Label>
            <Input value={data.firstName} onChange={(e) => updateField("firstName", e.target.value)} required className={getInputErrorClass("First Name")} />
          </div>
          <div>
            <Label>Middle Name</Label>
            <Input value={data.middleName} onChange={(e) => updateField("middleName", e.target.value)} />
          </div>
          <div>
            <Label className={getLabelClass("Last Name")}>Last Name *</Label>
            <Input value={data.lastName} onChange={(e) => updateField("lastName", e.target.value)} required className={getInputErrorClass("Last Name")} />
          </div>
          <div>
            <Label>Suffix</Label>
            <Select value={data.suffix} onValueChange={(v) => updateField("suffix", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Jr.">Jr.</SelectItem>
                <SelectItem value="Sr.">Sr.</SelectItem>
                <SelectItem value="II">II</SelectItem>
                <SelectItem value="III">III</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("Date of Birth")}>Date of Birth *</Label>
            <div className="grid grid-cols-3 gap-2">
              <Select value={data.dateOfBirth.day} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, day: v })}>
                <SelectTrigger className={getInputErrorClass("Date of Birth")}><SelectValue placeholder="Day" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 31 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>{i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={data.dateOfBirth.month} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, month: v })}>
                <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, i) => (
                    <SelectItem key={m} value={String(i + 1)}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={data.dateOfBirth.year} onValueChange={(v) => updateField("dateOfBirth", { ...data.dateOfBirth, year: v })}>
                <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 80 }, (_, i) => {
                    const year = new Date().getFullYear() - 18 - i
                    return <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className={getLabelClass("Gender")}>Gender *</Label>
            <Select value={data.gender} onValueChange={(v) => updateField("gender", v)}>
              <SelectTrigger className={getInputErrorClass("Gender")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
                <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("Marital Status")}>Marital Status *</Label>
            <Select value={data.maritalStatus} onValueChange={(v) => updateField("maritalStatus", v)}>
              <SelectTrigger className={getInputErrorClass("Marital Status")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="single">Single</SelectItem>
                <SelectItem value="married">Married</SelectItem>
                <SelectItem value="common_law">Common-Law</SelectItem>
                <SelectItem value="divorced">Divorced</SelectItem>
                <SelectItem value="separated">Separated</SelectItem>
                <SelectItem value="widowed">Widowed</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("Phone")}>Phone * <span className="text-xs text-primary font-medium">(3-digit area + 7-digit number)</span></Label>
            <Input 
              type="tel" 
              value={data.phone} 
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                const formatted = digits.length <= 3 ? digits :
                  digits.length <= 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` :
                  `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
                updateField("phone", formatted)
              }} 
              placeholder="(XXX) XXX-XXXX" 
              className={getInputErrorClass("Phone")}
            />
          </div>
          <div>
            <Label>Mobile Phone</Label>
            <Input 
              type="tel" 
              value={data.mobilePhone} 
              onChange={(e) => {
                const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
                const formatted = digits.length <= 3 ? digits :
                  digits.length <= 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` :
                  `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
                updateField("mobilePhone", formatted)
              }} 
              placeholder="(XXX) XXX-XXXX" 
            />
          </div>
          <div>
            <Label className={getLabelClass("Email")}>Email *</Label>
            <Input type="email" value={data.email} onChange={(e) => updateField("email", e.target.value)} className={getInputErrorClass("Email")} />
          </div>
          <div>
            <Label className={getLabelClass("Credit Rating")}>Credit Rating *</Label>
            <Select value={data.creditRating} onValueChange={(v) => updateField("creditRating", v)}>
              <SelectTrigger className={getInputErrorClass("Credit Rating")}><SelectValue placeholder="Select rating" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="excellent">Excellent [750+]</SelectItem>
                <SelectItem value="good">Good [700+]</SelectItem>
                <SelectItem value="average">Average [600+]</SelectItem>
                <SelectItem value="poor">Poor [500+]</SelectItem>
                <SelectItem value="unknown">Unknown</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Address */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Current Address
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <PostalCodeInput
            value={data.postalCode}
            onChange={(postalCode, addressData) => {
              const newData = {
                ...data,
                postalCode,
                ...(addressData?.city && { city: addressData.city }),
                ...(addressData?.province && { province: addressData.province }),
                ...(addressData?.streetName && { streetName: addressData.streetName }),
                ...(addressData?.streetType && { streetType: addressData.streetType }),
                ...(addressData?.direction && { direction: addressData.direction }),
              }
              onChange(newData)
            }}
          />
<div>
  <Label className={getLabelClass("Address Type")}>Address Type *</Label>
  <Select value={data.addressType} onValueChange={(v) => updateField("addressType", v)}>
  <SelectTrigger className={getInputErrorClass("Address Type")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="house">House</SelectItem>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="condo">Condo</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Suite/Unit No.</Label>
            <Input value={data.suiteNumber} onChange={(e) => updateField("suiteNumber", e.target.value)} />
          </div>
<div>
  <Label className={getLabelClass("Street Number")}>Street Number *</Label>
  <Input value={data.streetNumber} onChange={(e) => updateField("streetNumber", e.target.value)} className={getInputErrorClass("Street Number")} />
  </div>
          <div className="md:col-span-2">
            <Label>Street Name *</Label>
            <Input value={data.streetName} onChange={(e) => updateField("streetName", e.target.value)} />
          </div>
          <div>
            <Label>Street Type</Label>
            <Select value={data.streetType} onValueChange={(v) => updateField("streetType", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Street">Street</SelectItem>
                <SelectItem value="Avenue">Avenue</SelectItem>
                <SelectItem value="Road">Road</SelectItem>
                <SelectItem value="Drive">Drive</SelectItem>
                <SelectItem value="Boulevard">Boulevard</SelectItem>
                <SelectItem value="Crescent">Crescent</SelectItem>
                <SelectItem value="Court">Court</SelectItem>
                <SelectItem value="Way">Way</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Direction</Label>
            <Select value={data.streetDirection} onValueChange={(v) => updateField("streetDirection", v)}>
              <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="N">North</SelectItem>
                <SelectItem value="S">South</SelectItem>
                <SelectItem value="E">East</SelectItem>
                <SelectItem value="W">West</SelectItem>
                <SelectItem value="NE">Northeast</SelectItem>
                <SelectItem value="NW">Northwest</SelectItem>
                <SelectItem value="SE">Southeast</SelectItem>
                <SelectItem value="SW">Southwest</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>City * <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.city} 
              onChange={(e) => updateField("city", e.target.value)}
              readOnly={Boolean(data.city && data.postalCode.length >= 6)}
              className={data.city && data.postalCode.length >= 6 ? "bg-muted" : ""}
            />
          </div>
          <div>
            <Label>Province * <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.province} 
              readOnly={Boolean(data.province && data.postalCode.length >= 6)}
              className={data.province && data.postalCode.length >= 6 ? "bg-muted" : ""}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Years at Address</Label>
              <Input type="number" value={data.durationYears} onChange={(e) => updateField("durationYears", e.target.value)} min="0" />
            </div>
            <div className="flex-1">
              <Label>Months</Label>
              <Input type="number" value={data.durationMonths} onChange={(e) => updateField("durationMonths", e.target.value)} min="0" max="11" />
            </div>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Home/Mortgage Details */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Home className="w-4 h-4" />
          Home/Mortgage Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={getLabelClass("Home Status")}>Home Status *</Label>
            <Select value={data.homeStatus} onValueChange={(v) => updateField("homeStatus", v)}>
              <SelectTrigger className={getInputErrorClass("Home Status")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="own">Own</SelectItem>
                <SelectItem value="rent">Rent</SelectItem>
                <SelectItem value="live_with_parents">Live with Parents</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.homeStatus === "own" && (
            <>
              <div>
                <Label>Market Value</Label>
                <Input type="number" value={data.marketValue} onChange={(e) => updateField("marketValue", e.target.value)} placeholder="$0.00" />
              </div>
              <div>
                <Label>Mortgage Amount</Label>
                <Input type="number" value={data.mortgageAmount} onChange={(e) => updateField("mortgageAmount", e.target.value)} placeholder="$0.00" />
              </div>
              <div>
                <Label>Mortgage Holder</Label>
                <Input value={data.mortgageHolder} onChange={(e) => updateField("mortgageHolder", e.target.value)} />
              </div>
            </>
          )}
          <div>
            <Label className={getLabelClass("Monthly Payment")}>Monthly Payment *</Label>
            <Input type="number" value={data.monthlyPayment} onChange={(e) => updateField("monthlyPayment", e.target.value)} placeholder="$0.00" className={getInputErrorClass("Monthly Payment")} />
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Employment */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <Briefcase className="w-4 h-4" />
          Current Employment
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={getLabelClass("Employment Type")}>Employment Type *</Label>
            <Select value={data.employmentCategory} onValueChange={(v) => updateField("employmentCategory", v)}>
              <SelectTrigger className={getInputErrorClass("Employment Type")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="full_time">Full-Time</SelectItem>
                <SelectItem value="part_time">Part-Time</SelectItem>
                <SelectItem value="self_employed">Self-Employed</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="unemployed">Unemployed</SelectItem>
                <SelectItem value="disability">Disability</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("Employment Status")}>Status *</Label>
            <Select value={data.employmentStatus} onValueChange={(v) => updateField("employmentStatus", v)}>
              <SelectTrigger className={getInputErrorClass("Employment Status")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="employed">Employed</SelectItem>
                <SelectItem value="probation">On Probation</SelectItem>
                <SelectItem value="contract">Contract</SelectItem>
                <SelectItem value="seasonal">Seasonal</SelectItem>
                <SelectItem value="temporary">Temporary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className={getLabelClass("Employer Name")}>Employer Name *</Label>
            <Input value={data.employerName} onChange={(e) => updateField("employerName", e.target.value)} className={getInputErrorClass("Employer Name")} />
          </div>
          <div>
            <Label className={getLabelClass("Occupation")}>Occupation *</Label>
            <Input value={data.occupation} onChange={(e) => updateField("occupation", e.target.value)} className={getInputErrorClass("Occupation")} />
          </div>
          <div>
            <Label>Job Title</Label>
            <Input value={data.jobTitle} onChange={(e) => updateField("jobTitle", e.target.value)} />
          </div>
<div>
  <Label>Employer Phone * <span className="text-xs text-primary font-medium">(3-digit area + 7-digit number)</span></Label>
  <div className="flex gap-2">
  <Input 
    type="tel" 
    value={data.employerPhone} 
    onChange={(e) => {
      const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
      const formatted = digits.length <= 3 ? digits :
        digits.length <= 6 ? `(${digits.slice(0, 3)}) ${digits.slice(3)}` :
        `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
      updateField("employerPhone", formatted)
    }} 
    placeholder="(XXX) XXX-XXXX"
    className="flex-1" 
  />
              <Input value={data.employerPhoneExt} onChange={(e) => updateField("employerPhoneExt", e.target.value)} placeholder="Ext." className="w-20" />
            </div>
          </div>
          <PostalCodeInput
            value={data.employerPostalCode}
            label="Employer Postal Code *"
            onChange={(postalCode, addressData) => {
              onChange({
                ...data,
                employerPostalCode: postalCode,
                ...(addressData?.city && { employerCity: addressData.city }),
                ...(addressData?.province && { employerProvince: addressData.province }),
              })
            }}
          />
          <div className="md:col-span-2">
            <Label>Employer Address</Label>
            <Input value={data.employerStreet} onChange={(e) => updateField("employerStreet", e.target.value)} placeholder="Street address" />
          </div>
          <div>
            <Label>City <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.employerCity} 
              onChange={(e) => updateField("employerCity", e.target.value)}
              readOnly={Boolean(data.employerCity && data.employerPostalCode.length >= 6)}
              className={data.employerCity && data.employerPostalCode.length >= 6 ? "bg-muted" : ""}
            />
          </div>
          <div>
            <Label>Province <span className="text-xs text-muted-foreground">(from postal code)</span></Label>
            <Input 
              value={data.employerProvince} 
              readOnly={Boolean(data.employerProvince && data.employerPostalCode.length >= 6)}
              className={data.employerProvince && data.employerPostalCode.length >= 6 ? "bg-muted" : ""}
            />
          </div>
          <div className="flex gap-2">
            <div className="flex-1">
              <Label>Years Employed</Label>
              <Input type="number" value={data.employmentYears} onChange={(e) => updateField("employmentYears", e.target.value)} min="0" />
            </div>
            <div className="flex-1">
              <Label>Months</Label>
              <Input type="number" value={data.employmentMonths} onChange={(e) => updateField("employmentMonths", e.target.value)} min="0" max="11" />
            </div>
          </div>
        </div>
      </section>
      
      <Separator />
      
      {/* Income */}
      <section>
        <h4 className="font-medium mb-4 flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Income Details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className={getLabelClass("Gross Income")}>Gross Income *</Label>
            <Input type="number" value={data.grossIncome} onChange={(e) => updateField("grossIncome", e.target.value)} placeholder="$0.00" className={getInputErrorClass("Gross Income")} />
          </div>
          <div>
            <Label className={getLabelClass("Income Frequency")}>Income Frequency *</Label>
            <Select value={data.incomeFrequency} onValueChange={(v) => updateField("incomeFrequency", v)}>
              <SelectTrigger className={getInputErrorClass("Income Frequency")}><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="bi-weekly">Bi-Weekly</SelectItem>
                <SelectItem value="semi-monthly">Semi-Monthly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="annually">Annually</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Other Income Type</Label>
            <Select value={data.otherIncomeType} onValueChange={(v) => updateField("otherIncomeType", v)}>
              <SelectTrigger><SelectValue placeholder="Select if applicable" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pension">Pension</SelectItem>
                <SelectItem value="rental">Rental Income</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="child_support">Child Support</SelectItem>
                <SelectItem value="government">Government Benefits</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {data.otherIncomeType && (
            <>
              <div>
                <Label>Other Income Amount</Label>
                <Input type="number" value={data.otherIncomeAmount} onChange={(e) => updateField("otherIncomeAmount", e.target.value)} placeholder="$0.00" />
              </div>
              <div>
                <Label>Frequency</Label>
                <Select value={data.otherIncomeFrequency} onValueChange={(v) => updateField("otherIncomeFrequency", v)}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {data.otherIncomeType === "other" && (
                <div>
                  <Label>Description</Label>
                  <Input value={data.otherIncomeDescription} onChange={(e) => updateField("otherIncomeDescription", e.target.value)} />
                </div>
              )}
            </>
          )}
          <div>
            <Label>Annual Total * <span className="text-xs text-muted-foreground">(Auto-calculated)</span></Label>
            <Input 
              type="text" 
              value={data.annualTotal ? `$${parseFloat(data.annualTotal).toLocaleString('en-CA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "$0.00"} 
              readOnly 
              className="bg-amber-50 font-semibold" 
            />
          </div>
        </div>
      </section>
    </div>
  )
}

// =====================================================
// VEHICLE & FINANCING FORM
// =====================================================
interface VehicleFinancingFormProps {
  vehicleInfo: VehicleInfo
  setVehicleInfo: (v: VehicleInfo) => void
  tradeIn: TradeInInfo
  setTradeIn: (t: TradeInInfo) => void
  financingTerms: FinancingTerms
  setFinancingTerms: (f: FinancingTerms) => void
  financing: FinancingResult
  additionalNotes: string
  setAdditionalNotes: (n: string) => void
}

interface FinancingResult {
  price: number; downPayment: number; netTrade: number; adminFee: number; omvicFee: number; certificationFee: number; licensingFee: number; deliveryFee: number; totalFees: number; tax: number; amountFinanced: number; payment: number; totalToRepay: number; totalInterest: number; totalPayments: number
}

function VehicleFinancingForm({ vehicleInfo, setVehicleInfo, tradeIn, setTradeIn, financingTerms, setFinancingTerms, financing, additionalNotes, setAdditionalNotes }: VehicleFinancingFormProps) {
  // Check if vehicle data was pre-filled (has year and make)
  const isVehicleSelected = Boolean(vehicleInfo.year && vehicleInfo.make && vehicleInfo.totalPrice)
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  interface InventoryVehicle {
    id: string
    year: number
    make: string
    model: string
    trim?: string
    price: number
    vin?: string
    mileage?: number
    exterior_color?: string
    primary_image_url?: string
    stock_number?: string
  }
  const [inventoryVehicles, setInventoryVehicles] = useState<InventoryVehicle[]>([])
  const [isLoadingInventory, setIsLoadingInventory] = useState(false)
  const [inventorySearch, setInventorySearch] = useState("")
  
  // Fetch vehicles from inventory when modal opens
  useEffect(() => {
    if (showInventoryModal && inventoryVehicles.length === 0) {
      fetchInventory()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showInventoryModal])
  
  const fetchInventory = async () => {
    setIsLoadingInventory(true)
    try {
      const { createClient } = await import("@/lib/supabase/client")
      const supabase = createClient()
      const { data } = await supabase
        .from("vehicles")
        .select("id, year, make, model, trim, price, vin, mileage, exterior_color, primary_image_url, stock_number")
        .eq("status", "available")
        .order("created_at", { ascending: false })
        .limit(50)
      
      if (data) {
        setInventoryVehicles(data)
      }
    } catch (error) {
      console.error("Error fetching inventory:", error)
    } finally {
      setIsLoadingInventory(false)
    }
  }
  
  const handleSelectVehicle = (vehicle: InventoryVehicle) => {
    setVehicleInfo({
      ...vehicleInfo,
      vin: vehicle.vin || "",
      year: vehicle.year?.toString() || "",
      make: vehicle.make || "",
      model: vehicle.model || "",
      trim: vehicle.trim || "",
      color: vehicle.exterior_color || "",
      mileage: vehicle.mileage?.toString() || "",
      totalPrice: (vehicle.price / 100).toString(), // Convert from cents
    })
    setShowInventoryModal(false)
  }
  
  const filteredVehicles = inventoryVehicles.filter(v => {
    if (!inventorySearch) return true
    const searchLower = inventorySearch.toLowerCase()
    return (
      v.make?.toLowerCase().includes(searchLower) ||
      v.model?.toLowerCase().includes(searchLower) ||
      v.year?.toString().includes(searchLower) ||
      v.vin?.toLowerCase().includes(searchLower)
    )
  })
  
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Inventory Selection Modal */}
      {showInventoryModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-background rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-lg">Select Vehicle from Inventory</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowInventoryModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 border-b">
              <Input
                placeholder="Search by make, model, year, or VIN..."
                value={inventorySearch}
                onChange={(e) => setInventorySearch(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingInventory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : filteredVehicles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No vehicles found in inventory
                </div>
              ) : (
                <div className="grid gap-3">
                  {filteredVehicles.map((vehicle) => (
                    <div
                      key={vehicle.id}
                      className="flex items-center gap-4 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 cursor-pointer transition-colors"
                      onClick={() => handleSelectVehicle(vehicle)}
                    >
                      <div className="w-24 h-16 bg-muted rounded overflow-hidden flex-shrink-0">
                        {vehicle.primary_image_url ? (
                          /* eslint-disable-next-line @next/next/no-img-element -- External CDN URL in modal */
                          <img
                            src={vehicle.primary_image_url}
                            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Car className="w-8 h-8 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {vehicle.year} {vehicle.make} {vehicle.model} {vehicle.trim}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {vehicle.mileage?.toLocaleString()} km | Stock #{vehicle.stock_number}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{vehicle.vin}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary">
                          ${(vehicle.price / 100).toLocaleString()}
                        </p>
                        <Button size="sm" className="mt-1">Select</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Left Column - Vehicle Info */}
      <div className="space-y-6">
        <section>
          <h4 className="font-medium mb-4 flex items-center gap-2">
            <Car className="w-4 h-4" />
            Vehicle Information
            {isVehicleSelected && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">Selected from inventory</span>
            )}
          </h4>
          
          {!isVehicleSelected ? (
            // No vehicle selected - show browse button
            <div className="border-2 border-dashed border-primary/30 bg-primary/5 rounded-xl p-8 text-center">
              <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Car className="w-8 h-8 text-primary" />
              </div>
              <h5 className="font-semibold text-lg mb-2">Select Your Vehicle</h5>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Choose a vehicle from our inventory to proceed with your financing application. Vehicle information will be filled automatically.
              </p>
              <Button size="lg" onClick={() => setShowInventoryModal(true)}>
                <Car className="w-5 h-5 mr-2" />
                Browse Available Inventory
              </Button>
              <p className="text-xs text-muted-foreground mt-4">
                Vehicle selection is required to continue
              </p>
            </div>
          ) : (
            // Vehicle selected - show read-only details
            <>
              <p className="text-sm text-muted-foreground mb-4">
                Vehicle details have been automatically filled from your selected vehicle.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>VIN</Label>
                  <Input 
                    value={vehicleInfo.vin} 
                    readOnly
                    className="bg-muted font-mono text-sm"
                  />
                </div>
                <div>
                  <Label>Year</Label>
                  <Input 
                    value={vehicleInfo.year} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Make</Label>
                  <Input 
                    value={vehicleInfo.make} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Model/Trim</Label>
                  <Input 
                    value={`${vehicleInfo.model}${vehicleInfo.trim ? ` ${vehicleInfo.trim}` : ''}`} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Color</Label>
                  <Input 
                    value={vehicleInfo.color} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Current KMs</Label>
                  <Input 
                    value={vehicleInfo.mileage ? parseInt(vehicleInfo.mileage).toLocaleString() : ""} 
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label>Total Price Before Tax</Label>
                  <Input 
                    value={vehicleInfo.totalPrice ? `$${parseFloat(vehicleInfo.totalPrice).toLocaleString()}` : ""} 
                    readOnly
                    className="bg-muted font-semibold"
                  />
                </div>
                <div>
                  <Label>Down Payment</Label>
                  <Input type="number" value={vehicleInfo.downPayment} onChange={(e) => setVehicleInfo({ ...vehicleInfo, downPayment: e.target.value })} className="bg-green-50" />
                </div>
                <div>
                  <Label>Max Down Payment If Needed</Label>
                  <Input type="number" value={vehicleInfo.maxDownPayment} onChange={(e) => setVehicleInfo({ ...vehicleInfo, maxDownPayment: e.target.value })} />
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={() => setShowInventoryModal(true)}
              >
                <Car className="w-4 h-4 mr-2" />
                Change Vehicle
              </Button>
            </>
          )}
        </section>
        
        <Separator />
        
        {/* Trade-In */}
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Checkbox
              id="hasTradeIn"
              checked={tradeIn.hasTradeIn}
              onCheckedChange={(checked) => setTradeIn({ ...tradeIn, hasTradeIn: checked as boolean })}
            />
            <Label htmlFor="hasTradeIn" className="font-medium cursor-pointer">Include Trade-in</Label>
          </div>
          
          {tradeIn.hasTradeIn && (
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div className="col-span-2">
                <Label>VIN</Label>
                <Input value={tradeIn.vin} onChange={(e) => setTradeIn({ ...tradeIn, vin: e.target.value })} />
              </div>
              <div>
                <Label>Year</Label>
                <Input value={tradeIn.year} onChange={(e) => setTradeIn({ ...tradeIn, year: e.target.value })} />
              </div>
              <div>
                <Label>Make</Label>
                <Input value={tradeIn.make} onChange={(e) => setTradeIn({ ...tradeIn, make: e.target.value })} />
              </div>
              <div>
                <Label>Model</Label>
                <Input value={tradeIn.model} onChange={(e) => setTradeIn({ ...tradeIn, model: e.target.value })} />
              </div>
              <div>
                <Label>Mileage (km)</Label>
                <Input type="text" inputMode="numeric" pattern="[0-9]*" value={tradeIn.mileage} onChange={(e) => setTradeIn({ ...tradeIn, mileage: e.target.value.replace(/[^0-9]/g, '') })} autoComplete="off" />
              </div>
              <div>
                <Label>Condition</Label>
                <Select value={tradeIn.condition} onValueChange={(v) => setTradeIn({ ...tradeIn, condition: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excellent">Excellent</SelectItem>
                    <SelectItem value="good">Good</SelectItem>
                    <SelectItem value="fair">Fair</SelectItem>
                    <SelectItem value="poor">Poor</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Estimated Value</Label>
                <Input type="number" value={tradeIn.estimatedValue} onChange={(e) => setTradeIn({ ...tradeIn, estimatedValue: e.target.value })} />
              </div>
              <div className="col-span-2 flex items-center gap-3 mt-2">
                <Checkbox
                  id="hasLien"
                  checked={tradeIn.hasLien}
                  onCheckedChange={(checked) => setTradeIn({ ...tradeIn, hasLien: checked as boolean })}
                />
                <Label htmlFor="hasLien" className="cursor-pointer">Vehicle has existing lien</Label>
              </div>
              {tradeIn.hasLien && (
                <>
                  <div>
                    <Label>Lien Holder</Label>
                    <Input value={tradeIn.lienHolder} onChange={(e) => setTradeIn({ ...tradeIn, lienHolder: e.target.value })} />
                  </div>
                  <div>
                    <Label>Lien Amount</Label>
                    <Input type="number" value={tradeIn.lienAmount} onChange={(e) => setTradeIn({ ...tradeIn, lienAmount: e.target.value })} />
                  </div>
                </>
              )}
            </div>
          )}
        </section>
        
        <Separator />
        
        {/* Additional Notes */}
        <section>
          <Label>Additional Notes</Label>
          <Textarea
            value={additionalNotes}
            onChange={(e) => setAdditionalNotes(e.target.value)}
            placeholder="Any additional information for your application..."
            rows={3}
          />
        </section>
      </div>
      
      {/* Right Column - Financing */}
      <div className="space-y-6">
        <section className="bg-muted/30 rounded-xl p-6">
          <h4 className="font-semibold mb-4">Financing</h4>
          
          {/* Agreement Type */}
          <div className="mb-4">
            <Label className="text-xs uppercase text-muted-foreground">Agreement Type</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant={financingTerms.agreementType === "finance" ? "default" : "outline"}
                onClick={() => setFinancingTerms({ ...financingTerms, agreementType: "finance" })}
                className="flex-1"
              >
                Finance
              </Button>
              <Button
                type="button"
                variant={financingTerms.agreementType === "cash" ? "default" : "outline"}
                onClick={() => setFinancingTerms({ ...financingTerms, agreementType: "cash" })}
                className="flex-1"
              >
                Cash (Out-the-Door)
              </Button>
            </div>
          </div>
          
          {financingTerms.agreementType === "finance" && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Sales Tax %</Label>
                  <Input value={financingTerms.salesTaxRate} onChange={(e) => setFinancingTerms({ ...financingTerms, salesTaxRate: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs">Interest Rate %</Label>
                  <Input value={financingTerms.interestRate} onChange={(e) => setFinancingTerms({ ...financingTerms, interestRate: e.target.value })} placeholder="8.99" />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label className="text-xs">Finance Docs Fee $ <span className="text-primary font-medium">($895)</span></Label>
                  <Input value={financingTerms.adminFee} onChange={(e) => setFinancingTerms({ ...financingTerms, adminFee: e.target.value })} readOnly className="bg-muted" />
                </div>
                <div>
                  <Label className="text-xs">Delivery Fee $ <span className="text-muted-foreground">(Enter postal code)</span></Label>
                  <div className="flex gap-2">
                    <Input 
                      value={financingTerms.deliveryPostalCode} 
                      onChange={(e) => setFinancingTerms({ ...financingTerms, deliveryPostalCode: e.target.value.toUpperCase() })}
                      placeholder="L4C 1G7"
                      className="flex-1 font-mono uppercase"
                    />
                    <Button 
                      type="button" 
                      size="sm" 
                      variant="outline"
                      onClick={async () => {
                        if (financingTerms.deliveryPostalCode.length >= 3) {
                          try {
                            const res = await fetch(`/api/v1/deliveries/quote?postalCode=${financingTerms.deliveryPostalCode}`)
                            const data = await res.json()
                            if (data.deliveryCost !== undefined) {
                              setFinancingTerms({ ...financingTerms, deliveryFee: data.deliveryCost.toString() })
                            }
                          } catch {
                            setFinancingTerms({ ...financingTerms, deliveryFee: "0" })
                          }
                        }
                      }}
                    >
                      Check
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {parseFloat(financingTerms.deliveryFee) > 0 
                      ? `Delivery: $${parseFloat(financingTerms.deliveryFee).toFixed(0)}` 
                      : "Free within 300km of Richmond Hill"}
                  </p>
                </div>
              </div>
              
              {/* Loan Term */}
              <div className="mb-4">
                <Label className="text-xs uppercase text-muted-foreground">Loan Term (Months)</Label>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mt-2">
                  {[24, 36, 48, 60, 72, 84, 96].map((term) => (
                    <Button
                      key={term}
                      type="button"
                      size="sm"
                      variant={financingTerms.loanTermMonths === term ? "default" : "outline"}
                      onClick={() => setFinancingTerms({ ...financingTerms, loanTermMonths: term })}
                    >
                      {term}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Payment Frequency */}
              <div className="mb-6">
                <Label className="text-xs uppercase text-muted-foreground">Payment Frequency</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                  {([
                    { value: "weekly" as const, label: "Weekly" },
                    { value: "bi-weekly" as const, label: "Bi-Weekly" },
                    { value: "semi-monthly" as const, label: "Semi-Mo" },
                    { value: "monthly" as const, label: "Monthly" },
                  ]).map((freq) => (
                    <Button
                      key={freq.value}
                      type="button"
                      size="sm"
                      variant={financingTerms.paymentFrequency === freq.value ? "default" : "outline"}
                      onClick={() => setFinancingTerms({ ...financingTerms, paymentFrequency: freq.value })}
                    >
                      {freq.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              {/* Loan Breakdown */}
              <Separator className="my-4" />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle Price:</span>
                  <span>${financing.price.toLocaleString()}</span>
                </div>
                {financing.adminFee > 0 && (
                  <div className="flex justify-between text-primary">
                    <span className="font-medium">Finance Docs Fee:</span>
                    <span className="font-medium">+${financing.adminFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">OMVIC Fee:</span>
                  <span>+${financing.omvicFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Certification Fee:</span>
                  <span>+${financing.certificationFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Licensing Fee:</span>
                  <span>+${financing.licensingFee.toLocaleString()}</span>
                </div>
                {financing.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery Fee:</span>
                    <span>+${financing.deliveryFee.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sales Tax ({financingTerms.salesTaxRate}%):</span>
                  <span>+${financing.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Down Payment:</span>
                  <span>-${financing.downPayment.toLocaleString()}</span>
                </div>
                {financing.netTrade > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Net Trade Value:</span>
                    <span>-${financing.netTrade.toLocaleString()}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Amount Financed:</span>
                  <span>${financing.amountFinanced.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Total Cost */}
              <div className="mt-4 p-4 bg-background rounded-lg border">
                <div className="text-xs text-muted-foreground mb-1">TOTAL COST</div>
                <div className="flex justify-between text-sm">
                  <span>{financing.totalPayments.toFixed(0)} payments x ${financing.payment.toFixed(2)}:</span>
                  <span>${financing.totalToRepay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total to Repay:</span>
                  <span>${financing.totalToRepay.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Interest:</span>
                  <span>${financing.totalInterest.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Payment Display */}
              <div className="mt-4 p-6 bg-primary/10 rounded-xl text-center">
                <div className="text-sm text-muted-foreground mb-1">
                  {financingTerms.paymentFrequency === "bi-weekly" ? "Bi-Weekly" : 
                   financingTerms.paymentFrequency === "weekly" ? "Weekly" :
                   financingTerms.paymentFrequency === "semi-monthly" ? "Semi-Monthly" : "Monthly"} Payment
                </div>
                <div className="text-4xl font-bold text-primary">
                  ${financing.payment.toFixed(2)}
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  {financingTerms.loanTermMonths} months @ {financingTerms.interestRate || "0"}% APR
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  )
}

// =====================================================
// REVIEW STEP
// =====================================================
interface ReviewStepProps {
  primaryApplicant: ApplicantData
  coApplicant: ApplicantData | null
  vehicleInfo: VehicleInfo
  tradeIn: TradeInInfo
  financingTerms: FinancingTerms
  financing: {
    price: number
    adminFee: number
    omvicFee: number
    certificationFee: number
    licensingFee: number
    deliveryFee: number
    tax: number
    downPayment: number
    netTrade: number
    amountFinanced: number
    totalPayments: number
    payment: number
    totalToRepay: number
    totalInterest: number
  }
}

function ReviewStep({ primaryApplicant, coApplicant, vehicleInfo, tradeIn, financingTerms, financing }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <AlertCircle className="w-5 h-5 text-amber-600" />
        <p className="text-sm text-amber-800">Please review all information carefully before submitting.</p>
      </div>
      
      {/* Primary Applicant Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Primary Applicant</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{primaryApplicant.firstName} {primaryApplicant.lastName}</span></div>
          <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{primaryApplicant.phone}</span></div>
          <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{primaryApplicant.email}</span></div>
          <div><span className="text-muted-foreground">Address:</span> <span className="font-medium">{primaryApplicant.streetNumber} {primaryApplicant.streetName}, {primaryApplicant.city}</span></div>
          <div><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{primaryApplicant.employerName}</span></div>
          <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-medium">${primaryApplicant.annualTotal}</span></div>
          <div><span className="text-muted-foreground">Credit Rating:</span> <span className="font-medium capitalize">{primaryApplicant.creditRating}</span></div>
        </CardContent>
      </Card>
      
      {/* Co-Applicant Summary */}
      {coApplicant && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Co-Applicant</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{coApplicant.firstName} {coApplicant.lastName}</span></div>
            <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{coApplicant.phone}</span></div>
            <div><span className="text-muted-foreground">Employer:</span> <span className="font-medium">{coApplicant.employerName}</span></div>
            <div><span className="text-muted-foreground">Annual Income:</span> <span className="font-medium">${coApplicant.annualTotal}</span></div>
          </CardContent>
        </Card>
      )}
      
      {/* Vehicle Summary */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Vehicle & Financing</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{vehicleInfo.year} {vehicleInfo.make} {vehicleInfo.model}</span></div>
          <div><span className="text-muted-foreground">Price:</span> <span className="font-medium">${parseFloat(vehicleInfo.totalPrice).toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Down Payment:</span> <span className="font-medium">${parseFloat(vehicleInfo.downPayment).toLocaleString()}</span></div>
          <div><span className="text-muted-foreground">Term:</span> <span className="font-medium">{financingTerms.loanTermMonths} months</span></div>
          <div><span className="text-muted-foreground">Payment:</span> <span className="font-medium">${financing.payment.toFixed(2)}/{financingTerms.paymentFrequency}</span></div>
          <div><span className="text-muted-foreground">Amount Financed:</span> <span className="font-medium">${financing.amountFinanced.toLocaleString()}</span></div>
        </CardContent>
      </Card>
      
      {/* Trade-In Summary */}
      {tradeIn.hasTradeIn && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Trade-In Vehicle</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div><span className="text-muted-foreground">Vehicle:</span> <span className="font-medium">{tradeIn.year} {tradeIn.make} {tradeIn.model}</span></div>
            <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">${(parseFloat(tradeIn.estimatedValue) || 0).toLocaleString()}</span></div>
            {tradeIn.hasLien && (
              <div><span className="text-muted-foreground">Lien:</span> <span className="font-medium">${parseFloat(tradeIn.lienAmount).toLocaleString()}</span></div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// =====================================================
// DOCUMENTS STEP
// =====================================================
interface DocumentsStepProps {
  documents: DocumentUpload[]
  setDocuments: (d: DocumentUpload[]) => void
  onSubmit: () => void
  isSubmitting: boolean
}

function DocumentsStep({ documents, setDocuments, onSubmit: _onSubmit, isSubmitting: _isSubmitting }: DocumentsStepProps) {
  const documentTypes = [
    { value: "drivers_license", label: "Driver's License", required: true },
    { value: "proof_of_income", label: "Proof of Income (Pay Stub/T4)", required: true },
    { value: "proof_of_address", label: "Proof of Address (Utility Bill)", required: false },
    { value: "void_cheque", label: "Void Cheque", required: false },
  ]
  
  const handleFileChange = (type: string, file: File | null) => {
    const existing = documents.find(d => d.type === type)
    if (existing) {
      setDocuments(documents.map(d => d.type === type ? { ...d, file } : d))
    } else {
      setDocuments([...documents, { type, name: file?.name || "", file }])
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Upload Verification Documents</h3>
        <p className="text-sm text-muted-foreground">
          Please upload the following documents to verify your identity and income.
        </p>
      </div>
      
      <div className="grid gap-4">
        {documentTypes.map((docType) => {
          const uploaded = documents.find(d => d.type === docType.value)
          return (
            <div key={docType.value} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center",
                  uploaded?.file ? "bg-green-100" : "bg-muted"
                )}>
                  {uploaded?.file ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <FileText className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{docType.label}</p>
                  {uploaded?.file && (
                    <p className="text-sm text-muted-foreground">{uploaded.file.name}</p>
                  )}
                </div>
              </div>
              <div>
                <input
                  type="file"
                  id={docType.value}
                  className="hidden"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileChange(docType.value, e.target.files?.[0] || null)}
                />
                <Button
                  type="button"
                  variant={uploaded?.file ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => document.getElementById(docType.value)?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploaded?.file ? "Replace" : "Upload"}
                </Button>
              </div>
            </div>
          )
        })}
      </div>
      
      <div className="p-4 bg-muted/50 rounded-lg flex items-start gap-3">
        <Shield className="w-5 h-5 text-primary mt-0.5" />
        <div className="text-sm">
          <p className="font-medium">Your documents are secure</p>
          <p className="text-muted-foreground">
            All uploaded documents are encrypted and stored securely. They will only be used for verification purposes.
          </p>
        </div>
      </div>
    </div>
  )
}
