/**
 * Form Validation Utilities for Planet Motors
 * Enforces strict Canadian format validation for all forms
 */

// Canadian Postal Code Validation (A1A 1A1 format)
// Valid format: Letter-Number-Letter Space Number-Letter-Number
// First letter cannot be D, F, I, O, Q, U, W, Z
// Letters in positions 3 and 6 cannot be D, F, I, O, Q, U
export function isValidCanadianPostalCode(postalCode: string): boolean {
  if (!postalCode) return false
  
  // Remove spaces and convert to uppercase
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase()
  
  // Must be exactly 6 characters after removing spaces
  if (cleaned.length !== 6) return false
  
  // Canadian postal code regex
  // First character: A-C, E, G-H, J-N, P, R-T, V-Y
  // Second character: 0-9
  // Third character: A-C, E, G-H, J-N, P, R-T, V-Z
  // Fourth character: 0-9
  // Fifth character: A-C, E, G-H, J-N, P, R-T, V-Z
  // Sixth character: 0-9
  const postalCodeRegex = /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]\d[ABCEGHJKLMNPRSTVWXYZ]\d$/
  
  return postalCodeRegex.test(cleaned)
}

// Format postal code to standard format (A1A 1A1)
export function formatCanadianPostalCode(postalCode: string): string {
  const cleaned = postalCode.replace(/\s/g, '').toUpperCase()
  if (cleaned.length >= 3) {
    return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)}`
  }
  return cleaned
}

// Canadian Phone Number Validation
// Accepts: (416) 555-1234, 416-555-1234, 4165551234, +1 416 555 1234
// Must be 10 digits (area code + 7 digit number)
// Area code cannot start with 0 or 1
export function isValidCanadianPhoneNumber(phone: string): boolean {
  if (!phone) return false
  
  // Remove all non-digits except leading +
  const cleaned = phone.replace(/[^\d+]/g, '')
  
  // Remove +1 country code if present
  const digits = cleaned.replace(/^\+?1/, '')
  
  // Must be exactly 10 digits
  if (digits.length !== 10) return false
  
  // Area code (first 3 digits) cannot start with 0 or 1
  const areaCode = digits.substring(0, 3)
  if (areaCode[0] === '0' || areaCode[0] === '1') return false
  
  // Exchange code (digits 4-6) cannot start with 0 or 1
  const exchangeCode = digits.substring(3, 6)
  if (exchangeCode[0] === '0' || exchangeCode[0] === '1') return false
  
  // Common fake number patterns to reject
  const fakePatterns = [
    '0000000000',
    '1111111111',
    '2222222222',
    '3333333333',
    '4444444444',
    '5555555555',
    '6666666666',
    '7777777777',
    '8888888888',
    '9999999999',
    '1234567890',
    '0987654321',
    '1234567891',
    '5555551234',
  ]
  
  if (fakePatterns.includes(digits)) return false
  
  return true
}

// Format phone number to standard format (416) 555-1234
export function formatCanadianPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^\d]/g, '')
  const digits = cleaned.replace(/^1/, '') // Remove leading 1 if present
  
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return phone
}

// Email Validation
// Stricter validation that rejects common fake patterns
export function isValidEmail(email: string): boolean {
  if (!email) return false
  
  // Basic email format check
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) return false
  
  // Reject common fake email patterns
  const localPart = email.split('@')[0].toLowerCase()
  const domain = email.split('@')[1]?.toLowerCase()
  
  // Reject if local part is all x's or repeating characters
  if (/^x+$/i.test(localPart)) return false
  if (/^(.)\1+$/.test(localPart)) return false // All same character
  if (/^(test|fake|asdf|qwerty|sample|example|none|noemail|nope|na|n\/a)$/i.test(localPart)) return false
  
  // Reject common fake domains
  const fakeDomains = [
    'xxxxx',
    'xxxxx.xxx',
    'xxxxx.com',
    'fake.com',
    'fakeemail.com',
    'test.com',
    'test.test',
    'noemail.com',
    'none.com',
    'example.com', // RFC 2606 reserved
    'example.net',
    'example.org',
    'invalid.com',
    'asdf.com',
    'qwerty.com',
  ]
  
  if (!domain || fakeDomains.includes(domain)) return false
  
  // Domain must have at least one dot and valid TLD
  if (!domain.includes('.')) return false
  
  const tld = domain.split('.').pop()
  if (!tld || tld.length < 2) return false
  
  // Reject if domain part before TLD is all x's or same character
  const domainPart = domain.split('.')[0]
  if (/^x+$/i.test(domainPart)) return false
  if (/^(.)\1+$/.test(domainPart)) return false
  
  return true
}

// Name Validation
// Must be at least 2 characters, only letters, spaces, hyphens, apostrophes
export function isValidName(name: string): boolean {
  if (!name || name.trim().length < 2) return false
  
  // Only allow letters, spaces, hyphens, apostrophes
  const nameRegex = /^[a-zA-ZÀ-ÿ\s'-]+$/
  if (!nameRegex.test(name)) return false
  
  // Reject common fake names
  const fakeNames = ['test', 'asdf', 'qwerty', 'xxx', 'aaa', 'fake', 'none', 'na', 'n/a']
  if (fakeNames.includes(name.toLowerCase().trim())) return false
  
  return true
}

// VIN Validation (Vehicle Identification Number)
// 17 characters, no I, O, Q
export function isValidVIN(vin: string): boolean {
  if (!vin) return true // VIN is often optional
  
  const cleaned = vin.toUpperCase().replace(/[^A-HJ-NPR-Z0-9]/g, '')
  
  if (cleaned.length !== 17) return false
  
  // VIN cannot contain I, O, or Q
  if (/[IOQ]/.test(cleaned)) return false
  
  return true
}

// Mileage Validation
// Must be a positive number, reasonable range (0 - 1,000,000 km)
export function isValidMileage(mileage: string | number): boolean {
  const num = typeof mileage === 'string' ? parseInt(mileage.replace(/,/g, ''), 10) : mileage
  
  if (isNaN(num)) return false
  if (num < 0 || num > 1000000) return false
  
  return true
}

// Format mileage with commas
export function formatMileage(mileage: string | number): string {
  const num = typeof mileage === 'string' ? parseInt(mileage.replace(/,/g, ''), 10) : mileage
  if (isNaN(num)) return '0'
  return num.toLocaleString()
}

// Aliases for backward compatibility (used by contact-form and schedule-test-drive)
export const isValidCanadianPhone = isValidCanadianPhoneNumber
export const formatCanadianPhone = formatCanadianPhoneNumber

// Generic form validation utilities
export interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: string) => boolean
  message?: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

export function validateForm(
  data: Record<string, string>,
  rules: Record<string, ValidationRule>
): ValidationResult {
  const errors: Record<string, string> = {}

  for (const [field, rule] of Object.entries(rules)) {
    const value = data[field] || ''

    if (rule.required && !value.trim()) {
      errors[field] = rule.message || `${field} is required`
      continue
    }

    if (value && rule.minLength && value.length < rule.minLength) {
      errors[field] = rule.message || `${field} must be at least ${rule.minLength} characters`
      continue
    }

    if (value && rule.maxLength && value.length > rule.maxLength) {
      errors[field] = rule.message || `${field} must be at most ${rule.maxLength} characters`
      continue
    }

    if (value && rule.pattern && !rule.pattern.test(value)) {
      errors[field] = rule.message || `${field} is invalid`
      continue
    }

    if (value && rule.custom && !rule.custom(value)) {
      errors[field] = rule.message || `${field} is invalid`
      continue
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  }
}

// Common validation rules
export const VALIDATION_RULES = {
  email: {
    required: true,
    custom: isValidEmail,
    message: 'Please enter a valid email address'
  },
  phone: {
    required: true,
    custom: isValidCanadianPhone,
    message: 'Please enter a valid 10-digit phone number'
  },
  postalCode: {
    required: true,
    custom: isValidCanadianPostalCode,
    message: 'Please enter a valid Canadian postal code (e.g., M5V 3L9)'
  },
  name: {
    required: true,
    minLength: 2,
    message: 'Please enter your full name'
  }
}

// Validation error messages
export const ValidationMessages = {
  postalCode: 'Please enter a valid Canadian postal code (e.g., M5V 3A1)',
  phone: 'Please enter a valid Canadian phone number (e.g., (416) 555-1234)',
  email: 'Please enter a valid email address',
  name: 'Please enter a valid name (minimum 2 characters)',
  vin: 'Please enter a valid 17-character VIN',
  mileage: 'Please enter a valid mileage (0 - 1,000,000 km)',
  required: 'This field is required',
}

// Combined validation for trade-in form
export interface TradeInFormData {
  firstName?: string
  lastName?: string
  name?: string
  email: string
  phone: string
  postalCode: string
}

export function validateTradeInForm(data: TradeInFormData): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {}
  
  // Name validation (either combined name or first/last)
  if (data.name !== undefined) {
    if (!isValidName(data.name)) {
      errors.name = ValidationMessages.name
    }
  } else {
    if (data.firstName !== undefined && !isValidName(data.firstName)) {
      errors.firstName = ValidationMessages.name
    }
    if (data.lastName !== undefined && !isValidName(data.lastName)) {
      errors.lastName = ValidationMessages.name
    }
  }
  
  // Email validation
  if (!isValidEmail(data.email)) {
    errors.email = ValidationMessages.email
  }
  
  // Phone validation
  if (!isValidCanadianPhoneNumber(data.phone)) {
    errors.phone = ValidationMessages.phone
  }
  
  // Postal code validation
  if (!isValidCanadianPostalCode(data.postalCode)) {
    errors.postalCode = ValidationMessages.postalCode
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  }
}
