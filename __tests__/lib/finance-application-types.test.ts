import { describe, it, expect } from 'vitest'
import {
  isApplicantData,
  isVehicleInfo,
  isTradeInInfo,
  isFinancingTerms,
} from '@/components/finance-application/types'

// ────────────────────────────────────────────────────────────────────────────
// Helpers — minimal valid shapes used across tests
// ────────────────────────────────────────────────────────────────────────────

function validApplicant(): Record<string, unknown> {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    phone: '416-555-0100',
    dateOfBirth: { day: '01', month: '01', year: '1990' },
    // Additional fields that are present in ApplicantData but not required by the guard
    salutation: '',
    middleName: '',
    suffix: '',
    gender: '',
    maritalStatus: '',
    mobilePhone: '',
    noEmail: false,
    languagePreference: 'en',
    creditRating: '',
    postalCode: '',
    addressType: '',
    suiteNumber: '',
    streetNumber: '',
    streetName: '',
    streetType: '',
    streetDirection: '',
    city: '',
    province: 'Ontario',
    durationYears: '',
    durationMonths: '',
    homeStatus: '',
    marketValue: '',
    mortgageAmount: '',
    mortgageHolder: '',
    monthlyPayment: '',
    outstandingMortgage: '',
    employmentCategory: '',
    employmentStatus: '',
    employerName: '',
    occupation: '',
    jobTitle: '',
    employerStreet: '',
    employerCity: '',
    employerProvince: '',
    employerPostalCode: '',
    employerPhone: '',
    employerPhoneExt: '',
    employmentYears: '',
    employmentMonths: '',
    grossIncome: '',
    incomeFrequency: '',
    otherIncomeType: '',
    otherIncomeAmount: '',
    otherIncomeFrequency: '',
    otherIncomeDescription: '',
    annualTotal: '',
  }
}

function validVehicle(): Record<string, unknown> {
  return {
    vin: '1HGBH41JXMN109186',
    year: '2022',
    make: 'Honda',
    model: 'Civic',
    trim: 'EX',
    color: 'Blue',
    mileage: '15000',
    totalPrice: '25000',
    downPayment: '5000',
    maxDownPayment: '20000',
  }
}

function validTradeIn(): Record<string, unknown> {
  return {
    hasTradeIn: true,
    vin: '2T1BURHE0JC011111',
    year: '2018',
    make: 'Toyota',
    model: 'Corolla',
    trim: 'LE',
    color: 'Silver',
    mileage: '60000',
    condition: 'good',
    estimatedValue: '12000',
    hasLien: false,
    lienHolder: '',
    lienAmount: '',
  }
}

function validFinancingTerms(): Record<string, unknown> {
  return {
    agreementType: 'finance',
    salesTaxRate: '0.13',
    interestRate: '6.99',
    adminFee: '499',
    omvicFee: '10',
    certificationFee: '595',
    licensingFee: '120',
    deliveryFee: '0',
    deliveryPostalCode: 'M5V 3A8',
    loanTermMonths: 60,
    paymentFrequency: 'monthly',
  }
}

// ────────────────────────────────────────────────────────────────────────────
// isApplicantData
// ────────────────────────────────────────────────────────────────────────────
describe('isApplicantData', () => {
  it('returns true for a minimal valid applicant object', () => {
    expect(isApplicantData(validApplicant())).toBe(true)
  })

  it('returns false for null', () => {
    expect(isApplicantData(null)).toBe(false)
  })

  it('returns false for a plain string', () => {
    expect(isApplicantData('applicant')).toBe(false)
  })

  it('returns false for an array', () => {
    expect(isApplicantData([{ firstName: 'Jane' }])).toBe(false)
  })

  it('returns false when firstName is missing', () => {
    const { firstName: _f, ...rest } = validApplicant()
    expect(isApplicantData(rest)).toBe(false)
  })

  it('returns false when lastName is not a string', () => {
    expect(isApplicantData({ ...validApplicant(), lastName: 42 })).toBe(false)
  })

  it('returns false when email is missing', () => {
    const { email: _e, ...rest } = validApplicant()
    expect(isApplicantData(rest)).toBe(false)
  })

  it('returns false when phone is missing', () => {
    const { phone: _p, ...rest } = validApplicant()
    expect(isApplicantData(rest)).toBe(false)
  })

  it('returns false when dateOfBirth is not an object', () => {
    expect(isApplicantData({ ...validApplicant(), dateOfBirth: '1990-01-01' })).toBe(false)
  })

  it('returns false when dateOfBirth.day is not a string', () => {
    expect(isApplicantData({ ...validApplicant(), dateOfBirth: { day: 1, month: '01', year: '1990' } })).toBe(false)
  })

  it('returns false when dateOfBirth is null', () => {
    expect(isApplicantData({ ...validApplicant(), dateOfBirth: null })).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isApplicantData({})).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isApplicantData(undefined)).toBe(false)
  })

  // Extra fields do not invalidate the guard
  it('returns true when extra unknown fields are present', () => {
    expect(isApplicantData({ ...validApplicant(), unknownField: 'value' })).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// isVehicleInfo
// ────────────────────────────────────────────────────────────────────────────
describe('isVehicleInfo', () => {
  it('returns true for a valid vehicle info object', () => {
    expect(isVehicleInfo(validVehicle())).toBe(true)
  })

  it('returns false for null', () => {
    expect(isVehicleInfo(null)).toBe(false)
  })

  it('returns false when year is missing', () => {
    const { year: _y, ...rest } = validVehicle()
    expect(isVehicleInfo(rest)).toBe(false)
  })

  it('returns false when year is a number instead of string', () => {
    expect(isVehicleInfo({ ...validVehicle(), year: 2022 })).toBe(false)
  })

  it('returns false when make is missing', () => {
    const { make: _m, ...rest } = validVehicle()
    expect(isVehicleInfo(rest)).toBe(false)
  })

  it('returns false when model is missing', () => {
    const { model: _m, ...rest } = validVehicle()
    expect(isVehicleInfo(rest)).toBe(false)
  })

  it('returns false when totalPrice is missing', () => {
    const { totalPrice: _t, ...rest } = validVehicle()
    expect(isVehicleInfo(rest)).toBe(false)
  })

  it('returns false when downPayment is missing', () => {
    const { downPayment: _d, ...rest } = validVehicle()
    expect(isVehicleInfo(rest)).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isVehicleInfo({})).toBe(false)
  })

  it('returns false for an array', () => {
    expect(isVehicleInfo([])).toBe(false)
  })

  // Numeric-string totalPrice is fine
  it('returns true for a minimal object with empty-string optional fields', () => {
    expect(isVehicleInfo({
      vin: '', year: '2020', make: 'Ford', model: 'F-150',
      trim: '', color: '', mileage: '',
      totalPrice: '30000', downPayment: '0', maxDownPayment: '0',
    })).toBe(true)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// isTradeInInfo
// ────────────────────────────────────────────────────────────────────────────
describe('isTradeInInfo', () => {
  it('returns true for a valid trade-in object', () => {
    expect(isTradeInInfo(validTradeIn())).toBe(true)
  })

  it('returns true when hasTradeIn is false', () => {
    expect(isTradeInInfo({ ...validTradeIn(), hasTradeIn: false })).toBe(true)
  })

  it('returns false for null', () => {
    expect(isTradeInInfo(null)).toBe(false)
  })

  it('returns false when hasTradeIn is missing', () => {
    const { hasTradeIn: _h, ...rest } = validTradeIn()
    expect(isTradeInInfo(rest)).toBe(false)
  })

  it('returns false when hasTradeIn is a string', () => {
    expect(isTradeInInfo({ ...validTradeIn(), hasTradeIn: 'true' })).toBe(false)
  })

  it('returns false when make is missing', () => {
    const { make: _m, ...rest } = validTradeIn()
    expect(isTradeInInfo(rest)).toBe(false)
  })

  it('returns false when model is missing', () => {
    const { model: _m, ...rest } = validTradeIn()
    expect(isTradeInInfo(rest)).toBe(false)
  })

  it('returns false when estimatedValue is not a string', () => {
    expect(isTradeInInfo({ ...validTradeIn(), estimatedValue: 12000 })).toBe(false)
  })

  it('returns false when hasLien is not a boolean', () => {
    expect(isTradeInInfo({ ...validTradeIn(), hasLien: 'no' })).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isTradeInInfo({})).toBe(false)
  })
})

// ────────────────────────────────────────────────────────────────────────────
// isFinancingTerms
// ────────────────────────────────────────────────────────────────────────────
describe('isFinancingTerms', () => {
  it('returns true for a valid financing-terms object with agreementType=finance', () => {
    expect(isFinancingTerms(validFinancingTerms())).toBe(true)
  })

  it('returns true for a valid financing-terms object with agreementType=cash', () => {
    expect(isFinancingTerms({ ...validFinancingTerms(), agreementType: 'cash' })).toBe(true)
  })

  it('returns true for each valid paymentFrequency value', () => {
    const freqs = ['weekly', 'bi-weekly', 'semi-monthly', 'monthly'] as const
    for (const freq of freqs) {
      expect(isFinancingTerms({ ...validFinancingTerms(), paymentFrequency: freq })).toBe(true)
    }
  })

  it('returns false for null', () => {
    expect(isFinancingTerms(null)).toBe(false)
  })

  it('returns false when agreementType is invalid', () => {
    expect(isFinancingTerms({ ...validFinancingTerms(), agreementType: 'lease' })).toBe(false)
  })

  it('returns false when agreementType is missing', () => {
    const { agreementType: _a, ...rest } = validFinancingTerms()
    expect(isFinancingTerms(rest)).toBe(false)
  })

  it('returns false when loanTermMonths is not a number', () => {
    expect(isFinancingTerms({ ...validFinancingTerms(), loanTermMonths: '60' })).toBe(false)
  })

  it('returns false when loanTermMonths is missing', () => {
    const { loanTermMonths: _l, ...rest } = validFinancingTerms()
    expect(isFinancingTerms(rest)).toBe(false)
  })

  it('returns false when salesTaxRate is not a string', () => {
    expect(isFinancingTerms({ ...validFinancingTerms(), salesTaxRate: 0.13 })).toBe(false)
  })

  it('returns false when adminFee is missing', () => {
    const { adminFee: _a, ...rest } = validFinancingTerms()
    expect(isFinancingTerms(rest)).toBe(false)
  })

  it('returns false when paymentFrequency is invalid', () => {
    expect(isFinancingTerms({ ...validFinancingTerms(), paymentFrequency: 'annual' })).toBe(false)
  })

  it('returns false when paymentFrequency is missing', () => {
    const { paymentFrequency: _p, ...rest } = validFinancingTerms()
    expect(isFinancingTerms(rest)).toBe(false)
  })

  it('returns false for an empty object', () => {
    expect(isFinancingTerms({})).toBe(false)
  })

  it('returns false for an array', () => {
    expect(isFinancingTerms([])).toBe(false)
  })
})