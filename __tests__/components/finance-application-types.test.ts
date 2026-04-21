import { describe, it, expect } from 'vitest'
import { emptyApplicant } from '@/components/finance-application/types'
import * as typesModule from '@/components/finance-application/types'

describe('emptyApplicant', () => {
  it('has empty string defaults for all string fields', () => {
    const stringFields: Array<keyof typeof emptyApplicant> = [
      'salutation', 'firstName', 'middleName', 'lastName', 'suffix',
      'gender', 'maritalStatus', 'phone', 'mobilePhone', 'email',
      'creditRating',
      'postalCode', 'addressType', 'suiteNumber', 'streetNumber',
      'streetName', 'streetType', 'streetDirection', 'city',
      'durationYears', 'durationMonths',
      'homeStatus', 'marketValue', 'mortgageAmount', 'mortgageHolder',
      'monthlyPayment', 'outstandingMortgage',
      'employmentCategory', 'employmentStatus', 'employerName', 'occupation',
      'jobTitle', 'employerStreet', 'employerCity', 'employerProvince',
      'employerPostalCode', 'employerPhone', 'employerPhoneExt',
      'employmentYears', 'employmentMonths',
      'grossIncome', 'incomeFrequency', 'otherIncomeType',
      'otherIncomeAmount', 'otherIncomeFrequency', 'otherIncomeDescription',
      'annualTotal',
    ]

    for (const field of stringFields) {
      expect(emptyApplicant[field], `field "${field}" should default to ""`).toBe('')
    }
  })

  it('defaults languagePreference to "en"', () => {
    expect(emptyApplicant.languagePreference).toBe('en')
  })

  it('defaults province to "Ontario"', () => {
    expect(emptyApplicant.province).toBe('Ontario')
  })

  it('defaults noEmail to false', () => {
    expect(emptyApplicant.noEmail).toBe(false)
  })

  it('defaults dateOfBirth to an object with empty day/month/year', () => {
    expect(emptyApplicant.dateOfBirth).toEqual({ day: '', month: '', year: '' })
  })

  it('has all required ApplicantData fields', () => {
    const requiredFields = [
      'salutation', 'firstName', 'middleName', 'lastName', 'suffix',
      'dateOfBirth', 'gender', 'maritalStatus', 'phone', 'mobilePhone',
      'email', 'noEmail', 'languagePreference', 'creditRating',
      'postalCode', 'addressType', 'suiteNumber', 'streetNumber',
      'streetName', 'streetType', 'streetDirection', 'city', 'province',
      'durationYears', 'durationMonths', 'homeStatus', 'marketValue',
      'mortgageAmount', 'mortgageHolder', 'monthlyPayment', 'outstandingMortgage',
      'employmentCategory', 'employmentStatus', 'employerName', 'occupation',
      'jobTitle', 'employerStreet', 'employerCity', 'employerProvince',
      'employerPostalCode', 'employerPhone', 'employerPhoneExt',
      'employmentYears', 'employmentMonths', 'grossIncome', 'incomeFrequency',
      'otherIncomeType', 'otherIncomeAmount', 'otherIncomeFrequency',
      'otherIncomeDescription', 'annualTotal',
    ]

    for (const field of requiredFields) {
      expect(emptyApplicant).toHaveProperty(field)
    }
  })
})

describe('removed type guards — isApplicantData, isVehicleInfo, isTradeInInfo, isFinancingTerms', () => {
  it('isApplicantData is not exported from the types module', () => {
    expect((typesModule as Record<string, unknown>)['isApplicantData']).toBeUndefined()
  })

  it('isVehicleInfo is not exported from the types module', () => {
    expect((typesModule as Record<string, unknown>)['isVehicleInfo']).toBeUndefined()
  })

  it('isTradeInInfo is not exported from the types module', () => {
    expect((typesModule as Record<string, unknown>)['isTradeInInfo']).toBeUndefined()
  })

  it('isFinancingTerms is not exported from the types module', () => {
    expect((typesModule as Record<string, unknown>)['isFinancingTerms']).toBeUndefined()
  })
})

describe('types module exports', () => {
  it('exports emptyApplicant', () => {
    expect(typesModule.emptyApplicant).toBeDefined()
  })

  it('emptyApplicant is a plain object (not a class instance)', () => {
    expect(typeof emptyApplicant).toBe('object')
    expect(Array.isArray(emptyApplicant)).toBe(false)
    expect(Object.getPrototypeOf(emptyApplicant)).toBe(Object.prototype)
  })

  it('emptyApplicant is safe to spread / copy', () => {
    const copy = { ...emptyApplicant }
    expect(copy).toEqual(emptyApplicant)
    // Mutating the copy does not affect the original
    copy.firstName = 'Test'
    expect(emptyApplicant.firstName).toBe('')
  })
})