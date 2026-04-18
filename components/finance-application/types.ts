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
