// Finance Application Types — extracted from finance-application-full-form.tsx

export interface ApplicantData {
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

export interface VehicleInfo {
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

export interface TradeInInfo {
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

export interface FinancingTerms {
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

export interface DocumentUpload {
  type: string
  name: string
  file: File | null
  url?: string
}

export interface FinancingResult {
  price: number
  downPayment: number
  netTrade: number
  adminFee: number
  omvicFee: number
  certificationFee: number
  licensingFee: number
  deliveryFee: number
  totalFees: number
  tax: number
  amountFinanced: number
  payment: number
  totalToRepay: number
  totalInterest: number
  totalPayments: number
}

// Runtime shape guards — validate draft objects before restoring into state
function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v)
}

export function isApplicantData(v: unknown): v is ApplicantData {
  if (!isRecord(v)) return false
  return typeof v.firstName === "string" && typeof v.lastName === "string" &&
    typeof v.email === "string" && typeof v.phone === "string" &&
    isRecord(v.dateOfBirth) && typeof v.dateOfBirth.day === "string"
}

export function isVehicleInfo(v: unknown): v is VehicleInfo {
  if (!isRecord(v)) return false
  return typeof v.year === "string" && typeof v.make === "string" &&
    typeof v.model === "string" && typeof v.totalPrice === "string" &&
    typeof v.downPayment === "string"
}

export function isTradeInInfo(v: unknown): v is TradeInInfo {
  if (!isRecord(v)) return false
  return typeof v.hasTradeIn === "boolean" && typeof v.make === "string" &&
    typeof v.model === "string" && typeof v.estimatedValue === "string" &&
    typeof v.hasLien === "boolean"
}

export function isFinancingTerms(v: unknown): v is FinancingTerms {
  if (!isRecord(v)) return false
  return (v.agreementType === "finance" || v.agreementType === "cash") &&
    typeof v.loanTermMonths === "number" &&
    typeof v.salesTaxRate === "string" && typeof v.adminFee === "string" &&
    (v.paymentFrequency === "weekly" || v.paymentFrequency === "bi-weekly" ||
     v.paymentFrequency === "semi-monthly" || v.paymentFrequency === "monthly")
}

// Initial state for a blank applicant
export const emptyApplicant: ApplicantData = {
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

// Type guard functions

/**
 * Type guard for ApplicantData
 * Validates required fields: firstName, lastName, email, phone, and dateOfBirth (with day, month, year)
 */
export function isApplicantData(value: unknown): value is ApplicantData {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const obj = value as Record<string, unknown>
  
  // Check required string fields
  if (typeof obj.firstName !== 'string') return false
  if (typeof obj.lastName !== 'string') return false
  if (typeof obj.email !== 'string') return false
  if (typeof obj.phone !== 'string') return false
  
  // Check dateOfBirth object
  if (obj.dateOfBirth === null || typeof obj.dateOfBirth !== 'object' || Array.isArray(obj.dateOfBirth)) {
    return false
  }
  const dob = obj.dateOfBirth as Record<string, unknown>
  if (typeof dob.day !== 'string') return false
  if (typeof dob.month !== 'string') return false
  if (typeof dob.year !== 'string') return false
  
  return true
}

/**
 * Type guard for VehicleInfo
 * Validates required fields: year, make, model, totalPrice, downPayment
 */
export function isVehicleInfo(value: unknown): value is VehicleInfo {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const obj = value as Record<string, unknown>
  
  if (typeof obj.year !== 'string') return false
  if (typeof obj.make !== 'string') return false
  if (typeof obj.model !== 'string') return false
  if (typeof obj.totalPrice !== 'string') return false
  if (typeof obj.downPayment !== 'string') return false
  
  return true
}

/**
 * Type guard for TradeInInfo
 * Validates required fields: hasTradeIn, make, model, estimatedValue, hasLien
 */
export function isTradeInInfo(value: unknown): value is TradeInInfo {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const obj = value as Record<string, unknown>
  
  if (typeof obj.hasTradeIn !== 'boolean') return false
  if (typeof obj.make !== 'string') return false
  if (typeof obj.model !== 'string') return false
  if (typeof obj.estimatedValue !== 'string') return false
  if (typeof obj.hasLien !== 'boolean') return false
  
  return true
}

/**
 * Type guard for FinancingTerms
 * Validates required fields: agreementType, salesTaxRate, adminFee, loanTermMonths, paymentFrequency
 */
export function isFinancingTerms(value: unknown): value is FinancingTerms {
  if (value === null || value === undefined || typeof value !== 'object' || Array.isArray(value)) {
    return false
  }
  const obj = value as Record<string, unknown>
  
  // Check agreementType is valid
  if (obj.agreementType !== 'finance' && obj.agreementType !== 'cash') {
    return false
  }
  
  if (typeof obj.salesTaxRate !== 'string') return false
  if (typeof obj.adminFee !== 'string') return false
  if (typeof obj.loanTermMonths !== 'number') return false
  
  // Check paymentFrequency is valid
  const validFrequencies = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly']
  if (!validFrequencies.includes(obj.paymentFrequency as string)) {
    return false
  }
  
  return true
}
