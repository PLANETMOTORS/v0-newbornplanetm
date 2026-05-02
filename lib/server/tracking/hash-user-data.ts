import { createHash } from 'node:crypto'

export type UserDataInput = {
  email?: string | null
  phone?: string | null
  firstName?: string | null
  lastName?: string | null
  postalCode?: string | null
}

export type HashedUserData = {
  email_sha256?: string | null
  phone_sha256?: string | null
  first_name_sha256?: string | null
  last_name_sha256?: string | null
  postal_code_sha256?: string | null
}

export function normalizeEmail(email?: string | null): string | null {
  const value = email?.trim().toLowerCase()
  return value || null
}

export function normalizePhoneToE164(phone?: string | null, defaultCountryCode = '1'): string | null {
  if (!phone) return null

  const trimmed = phone.trim()
  if (trimmed.startsWith('+')) {
    return `+${trimmed.replace(/\D/g, '')}`
  }

  const digits = trimmed.replace(/\D/g, '')
  if (!digits) return null
  if (digits.length === 10) return `+${defaultCountryCode}${digits}`
  if (digits.length === 11 && digits.startsWith(defaultCountryCode)) return `+${digits}`

  return `+${digits}`
}

export function normalizeText(value?: string | null): string | null {
  const normalized = value?.trim().toLowerCase()
  return normalized || null
}

export function sha256Hex(value?: string | null): string | null {
  if (!value) return null
  return createHash('sha256').update(value).digest('hex')
}

export function buildHashedUserData(input: UserDataInput): HashedUserData {
  const email = normalizeEmail(input.email)
  const phone = normalizePhoneToE164(input.phone)

  return {
    email_sha256: sha256Hex(email),
    phone_sha256: sha256Hex(phone),
    first_name_sha256: sha256Hex(normalizeText(input.firstName)),
    last_name_sha256: sha256Hex(normalizeText(input.lastName)),
    postal_code_sha256: sha256Hex(normalizeText(input.postalCode)),
  }
}
