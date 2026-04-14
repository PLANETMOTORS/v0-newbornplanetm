import { describe, it, expect } from 'vitest'
import {
  isValidCanadianPostalCode,
  formatCanadianPostalCode,
  isValidCanadianPhoneNumber,
  formatCanadianPhoneNumber,
  isValidEmail,
  isValidName,
  isValidVIN,
  isValidMileage,
  formatMileage,
} from '@/lib/validation'

describe('isValidCanadianPostalCode', () => {
  it('accepts valid postal codes', () => {
    expect(isValidCanadianPostalCode('M5V 3A1')).toBe(true)
    expect(isValidCanadianPostalCode('K1A 0B1')).toBe(true)
    expect(isValidCanadianPostalCode('V6B 1A1')).toBe(true)
  })

  it('accepts valid postal codes without spaces', () => {
    expect(isValidCanadianPostalCode('M5V3A1')).toBe(true)
  })

  it('accepts lowercase input', () => {
    expect(isValidCanadianPostalCode('m5v 3a1')).toBe(true)
  })

  it('rejects empty/null input', () => {
    expect(isValidCanadianPostalCode('')).toBe(false)
  })

  it('rejects invalid first characters (D, F, I, O, Q, U, W, Z)', () => {
    expect(isValidCanadianPostalCode('D5V 3A1')).toBe(false)
    expect(isValidCanadianPostalCode('F5V 3A1')).toBe(false)
    expect(isValidCanadianPostalCode('I5V 3A1')).toBe(false)
    expect(isValidCanadianPostalCode('Z5V 3A1')).toBe(false)
  })

  it('rejects wrong length', () => {
    expect(isValidCanadianPostalCode('M5V')).toBe(false)
    expect(isValidCanadianPostalCode('M5V 3A12')).toBe(false)
  })

  it('rejects US zip codes', () => {
    expect(isValidCanadianPostalCode('90210')).toBe(false)
    expect(isValidCanadianPostalCode('10001')).toBe(false)
  })
})

describe('formatCanadianPostalCode', () => {
  it('formats with space in middle', () => {
    expect(formatCanadianPostalCode('m5v3a1')).toBe('M5V 3A1')
  })

  it('handles already-formatted input', () => {
    expect(formatCanadianPostalCode('M5V 3A1')).toBe('M5V 3A1')
  })

  it('handles short input', () => {
    expect(formatCanadianPostalCode('M5')).toBe('M5')
  })
})

describe('isValidCanadianPhoneNumber', () => {
  it('accepts valid phone numbers', () => {
    expect(isValidCanadianPhoneNumber('(416) 555-1234')).toBe(true)
    expect(isValidCanadianPhoneNumber('416-555-1234')).toBe(true)
    expect(isValidCanadianPhoneNumber('4165551234')).toBe(true)
    expect(isValidCanadianPhoneNumber('+1 416 555 1234')).toBe(true)
  })

  it('rejects empty input', () => {
    expect(isValidCanadianPhoneNumber('')).toBe(false)
  })

  it('rejects area codes starting with 0 or 1', () => {
    expect(isValidCanadianPhoneNumber('016-555-1234')).toBe(false)
    expect(isValidCanadianPhoneNumber('116-555-1234')).toBe(false)
  })

  it('rejects exchange codes starting with 0 or 1', () => {
    expect(isValidCanadianPhoneNumber('416-055-1234')).toBe(false)
    expect(isValidCanadianPhoneNumber('416-155-1234')).toBe(false)
  })

  it('rejects fake number patterns', () => {
    expect(isValidCanadianPhoneNumber('5555555555')).toBe(false)
    expect(isValidCanadianPhoneNumber('1234567890')).toBe(false)
  })

  it('rejects wrong digit count', () => {
    expect(isValidCanadianPhoneNumber('416-555')).toBe(false)
    expect(isValidCanadianPhoneNumber('416-555-12345')).toBe(false)
  })
})

describe('isValidEmail', () => {
  it('accepts valid emails', () => {
    expect(isValidEmail('user@gmail.com')).toBe(true)
    expect(isValidEmail('john.doe@company.ca')).toBe(true)
  })

  it('rejects empty input', () => {
    expect(isValidEmail('')).toBe(false)
  })

  it('rejects invalid format', () => {
    expect(isValidEmail('not-an-email')).toBe(false)
    expect(isValidEmail('@domain.com')).toBe(false)
    expect(isValidEmail('user@')).toBe(false)
  })

  it('rejects fake local parts', () => {
    expect(isValidEmail('test@gmail.com')).toBe(false)
    expect(isValidEmail('fake@gmail.com')).toBe(false)
    expect(isValidEmail('asdf@gmail.com')).toBe(false)
    expect(isValidEmail('xxxx@gmail.com')).toBe(false)
  })

  it('rejects fake domains', () => {
    expect(isValidEmail('user@fake.com')).toBe(false)
    expect(isValidEmail('user@example.com')).toBe(false)
    expect(isValidEmail('user@test.com')).toBe(false)
  })

  it('rejects all-same-character local parts', () => {
    expect(isValidEmail('aaa@gmail.com')).toBe(false)
  })
})

describe('isValidName', () => {
  it('accepts valid names', () => {
    expect(isValidName('John')).toBe(true)
    expect(isValidName("Mary-Jane O'Brien")).toBe(true)
    expect(isValidName('André')).toBe(true)
  })

  it('rejects empty or short names', () => {
    expect(isValidName('')).toBe(false)
    expect(isValidName('A')).toBe(false)
  })

  it('rejects fake names', () => {
    expect(isValidName('test')).toBe(false)
    expect(isValidName('asdf')).toBe(false)
  })

  it('rejects names with numbers', () => {
    expect(isValidName('John123')).toBe(false)
  })
})

describe('isValidVIN', () => {
  it('returns true for empty (optional field)', () => {
    expect(isValidVIN('')).toBe(true)
  })

  it('accepts valid 17-char VIN', () => {
    expect(isValidVIN('1HGCM82633A004352')).toBe(true)
  })

  it('rejects wrong length', () => {
    expect(isValidVIN('1HGCM826')).toBe(false)
  })

  it('rejects VINs with I, O, Q', () => {
    expect(isValidVIN('1HGCM82633I004352')).toBe(false)
    expect(isValidVIN('1HGCM82633O004352')).toBe(false)
    expect(isValidVIN('1HGCM82633Q004352')).toBe(false)
  })
})
