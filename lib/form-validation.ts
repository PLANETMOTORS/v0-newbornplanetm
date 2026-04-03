// Form validation utilities for Canadian forms

// Email validation
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

// Canadian phone number validation (10 digits)
export function isValidCanadianPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '')
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'))
}

// Format phone number as (XXX) XXX-XXXX
export function formatCanadianPhone(input: string): string {
  const digits = input.replace(/\D/g, '').slice(0, 10)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`
}

// Canadian postal code validation
export function isValidCanadianPostalCode(postalCode: string): boolean {
  return /^[A-Za-z]\d[A-Za-z][\s-]?\d[A-Za-z]\d$/i.test(postalCode)
}

// Format postal code as A1A 1A1
export function formatCanadianPostalCode(input: string): string {
  const cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
  if (cleaned.length <= 3) return cleaned
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`
}

// Validate required fields
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
