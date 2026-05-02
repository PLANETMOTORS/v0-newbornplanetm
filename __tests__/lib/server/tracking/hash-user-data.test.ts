import { describe, it, expect } from 'vitest'
import {
  normalizeEmail,
  normalizePhoneToE164,
  normalizeText,
  normalizePostalCode,
  sha256Hex,
  buildHashedUserData,
} from '@/lib/server/tracking/hash-user-data'

describe('normalizeEmail', () => {
  it('lowercases and trims email', () => {
    expect(normalizeEmail('  Test@Example.COM  ')).toBe('test@example.com')
  })

  it('returns null for empty input', () => {
    expect(normalizeEmail('')).toBeNull()
    expect(normalizeEmail(null as unknown as string)).toBeNull()
    expect(normalizeEmail(undefined as unknown as string)).toBeNull()
  })

  it('handles email with extra spaces at edges', () => {
    expect(normalizeEmail('  USER@test.com  ')).toBe('user@test.com')
  })
})

describe('normalizePhoneToE164', () => {
  it('normalizes 10-digit North American phone to E.164', () => {
    expect(normalizePhoneToE164('(416) 555-0100')).toBe('+14165550100')
  })

  it('normalizes 11-digit phone starting with 1', () => {
    expect(normalizePhoneToE164('1-416-555-0100')).toBe('+14165550100')
  })

  it('preserves already E.164 formatted number', () => {
    expect(normalizePhoneToE164('+14165550100')).toBe('+14165550100')
  })

  it('returns null for empty input', () => {
    expect(normalizePhoneToE164('')).toBeNull()
    expect(normalizePhoneToE164(null as unknown as string)).toBeNull()
  })

  it('handles phone with spaces and dashes', () => {
    expect(normalizePhoneToE164('416 555 0100')).toBe('+14165550100')
  })

  it('handles phone with dots', () => {
    expect(normalizePhoneToE164('416.555.0100')).toBe('+14165550100')
  })
})

describe('normalizeText', () => {
  it('lowercases and trims text', () => {
    expect(normalizeText('  John  ')).toBe('john')
  })

  it('returns null for empty input', () => {
    expect(normalizeText('')).toBeNull()
    expect(normalizeText(null as unknown as string)).toBeNull()
  })
})

describe('sha256Hex', () => {
  it('produces consistent SHA-256 hash', async () => {
    const hash = sha256Hex('test@example.com')
    expect(hash).toMatch(/^[0-9a-f]{64}$/)
    expect(hash).toBe(sha256Hex('test@example.com'))
  })

  it('produces different hashes for different inputs', () => {
    expect(sha256Hex('a')).not.toBe(sha256Hex('b'))
  })
})

describe('buildHashedUserData', () => {
  it('hashes all provided fields', () => {
    const result = buildHashedUserData({
      email: 'test@example.com',
      phone: '(416) 555-0100',
      firstName: 'John',
      lastName: 'Doe',
      postalCode: 'M5V 2T6',
    })
    expect(result.email_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(result.phone_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(result.first_name_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(result.last_name_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(result.postal_code_sha256).toMatch(/^[0-9a-f]{64}$/)
  })

  it('returns null hashes for missing fields', () => {
    const result = buildHashedUserData({ email: 'a@b.com' })
    expect(result.email_sha256).toMatch(/^[0-9a-f]{64}$/)
    expect(result.phone_sha256).toBeNull()
    expect(result.first_name_sha256).toBeNull()
    expect(result.last_name_sha256).toBeNull()
    expect(result.postal_code_sha256).toBeNull()
  })

  it('returns all-null hashes when no fields provided', () => {
    const result = buildHashedUserData({})
    expect(result.email_sha256).toBeNull()
    expect(result.phone_sha256).toBeNull()
  })

  it('normalizes email before hashing', () => {
    const result1 = buildHashedUserData({ email: '  TEST@Example.COM  ' })
    const result2 = buildHashedUserData({ email: 'test@example.com' })
    expect(result1.email_sha256).toBe(result2.email_sha256)
  })

  it('normalizes phone before hashing', () => {
    const result1 = buildHashedUserData({ phone: '(416) 555-0100' })
    const result2 = buildHashedUserData({ phone: '+14165550100' })
    expect(result1.phone_sha256).toBe(result2.phone_sha256)
  })

  it('strips internal spaces from postal code before hashing', () => {
    const result1 = buildHashedUserData({ postalCode: 'M5V 2T6' })
    const result2 = buildHashedUserData({ postalCode: 'm5v2t6' })
    expect(result1.postal_code_sha256).toBe(result2.postal_code_sha256)
  })
})

describe('normalizePostalCode', () => {
  it('strips spaces and lowercases Canadian postal code', () => {
    expect(normalizePostalCode('M5V 2T6')).toBe('m5v2t6')
  })

  it('strips tabs and newlines', () => {
    expect(normalizePostalCode('M5V\t2T6')).toBe('m5v2t6')
  })

  it('trims and lowercases US zip code', () => {
    expect(normalizePostalCode('  90210  ')).toBe('90210')
  })

  it('returns null for empty input', () => {
    expect(normalizePostalCode('')).toBeNull()
    expect(normalizePostalCode(null)).toBeNull()
  })
})
