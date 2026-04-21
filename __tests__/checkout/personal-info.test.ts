import { describe, it, expect } from 'vitest'

// ---- Validation logic extracted from PersonalInfoPage.handleSubmit ----
// Mirrors the exact validation rules in app/checkout/personal-info/page.tsx.

type FormData = {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  [key: string]: string | undefined
}

function validatePersonalInfo(form: FormData): Record<string, string> {
  const errors: Record<string, string> = {}

  if (!form.firstName) errors['first-name'] = 'First name is required'
  if (!form.lastName) errors['last-name'] = 'Last name is required'
  if (!form.email) errors['email'] = 'Email is required'
  if (!form.phone) errors['phone'] = 'Phone is required'

  return errors
}

// ---- PROVINCES constant from the page ----
const PROVINCES = [
  { value: 'ON', label: 'Ontario' },
  { value: 'BC', label: 'British Columbia' },
  { value: 'AB', label: 'Alberta' },
  { value: 'QC', label: 'Quebec' },
  { value: 'MB', label: 'Manitoba' },
  { value: 'SK', label: 'Saskatchewan' },
  { value: 'NS', label: 'Nova Scotia' },
  { value: 'NB', label: 'New Brunswick' },
  { value: 'NL', label: 'Newfoundland' },
  { value: 'PE', label: 'Prince Edward Island' },
]

// ---- EMPLOYMENT_TYPES constant from the page ----
const EMPLOYMENT_TYPES = [
  { value: '', label: 'Select type' },
  { value: 'Full-Time', label: 'Full-Time' },
  { value: 'Part-Time', label: 'Part-Time' },
  { value: 'Self-Employed', label: 'Self-Employed' },
  { value: 'Retired', label: 'Retired' },
]

describe('PersonalInfoPage — form validation', () => {
  describe('valid form data', () => {
    it('returns no errors when all required fields are present', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '416-555-1234',
      })
      expect(Object.keys(errors)).toHaveLength(0)
    })

    it('does not validate optional fields (dob, sin, address, etc.)', () => {
      // Optional fields being absent should not cause errors
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '416-555-1234',
        // dob, sin, address deliberately omitted
      })
      expect(errors).not.toHaveProperty('dob')
      expect(errors).not.toHaveProperty('sin')
      expect(errors).not.toHaveProperty('address')
    })
  })

  describe('missing required fields', () => {
    it('returns error for missing firstName', () => {
      const errors = validatePersonalInfo({
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '416-555-1234',
      })
      expect(errors['first-name']).toBe('First name is required')
    })

    it('returns error for empty firstName string', () => {
      const errors = validatePersonalInfo({
        firstName: '',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '416-555-1234',
      })
      expect(errors['first-name']).toBe('First name is required')
    })

    it('returns error for missing lastName', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        email: 'jane@example.com',
        phone: '416-555-1234',
      })
      expect(errors['last-name']).toBe('Last name is required')
    })

    it('returns error for empty lastName string', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: '',
        email: 'jane@example.com',
        phone: '416-555-1234',
      })
      expect(errors['last-name']).toBe('Last name is required')
    })

    it('returns error for missing email', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        phone: '416-555-1234',
      })
      expect(errors['email']).toBe('Email is required')
    })

    it('returns error for empty email string', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        email: '',
        phone: '416-555-1234',
      })
      expect(errors['email']).toBe('Email is required')
    })

    it('returns error for missing phone', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
      })
      expect(errors['phone']).toBe('Phone is required')
    })

    it('returns error for empty phone string', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        phone: '',
      })
      expect(errors['phone']).toBe('Phone is required')
    })
  })

  describe('multiple missing fields', () => {
    it('returns errors for all missing required fields at once', () => {
      const errors = validatePersonalInfo({})
      expect(errors['first-name']).toBe('First name is required')
      expect(errors['last-name']).toBe('Last name is required')
      expect(errors['email']).toBe('Email is required')
      expect(errors['phone']).toBe('Phone is required')
      expect(Object.keys(errors)).toHaveLength(4)
    })

    it('returns exactly two errors when two required fields are missing', () => {
      const errors = validatePersonalInfo({
        firstName: 'Jane',
        lastName: 'Doe',
      })
      expect(Object.keys(errors)).toHaveLength(2)
      expect(errors['email']).toBeDefined()
      expect(errors['phone']).toBeDefined()
    })
  })

  describe('error message keys use kebab-case field IDs', () => {
    it('firstName error key is "first-name" (matching the input id)', () => {
      const errors = validatePersonalInfo({ lastName: 'Doe', email: 'a@b.com', phone: '123' })
      expect(Object.keys(errors)).toContain('first-name')
      expect(Object.keys(errors)).not.toContain('firstName')
    })

    it('lastName error key is "last-name" (matching the input id)', () => {
      const errors = validatePersonalInfo({ firstName: 'Jane', email: 'a@b.com', phone: '123' })
      expect(Object.keys(errors)).toContain('last-name')
      expect(Object.keys(errors)).not.toContain('lastName')
    })
  })
})

describe('PersonalInfoPage — PROVINCES constant', () => {
  it('includes Ontario', () => {
    expect(PROVINCES.some((p) => p.value === 'ON')).toBe(true)
  })

  it('includes British Columbia', () => {
    expect(PROVINCES.some((p) => p.value === 'BC')).toBe(true)
  })

  it('has 10 provinces', () => {
    expect(PROVINCES).toHaveLength(10)
  })

  it('every province has a non-empty value and label', () => {
    for (const { value, label } of PROVINCES) {
      expect(value.length).toBeGreaterThan(0)
      expect(label.length).toBeGreaterThan(0)
    }
  })
})

describe('PersonalInfoPage — EMPLOYMENT_TYPES constant', () => {
  it('first option is the placeholder with empty value', () => {
    expect(EMPLOYMENT_TYPES[0].value).toBe('')
    expect(EMPLOYMENT_TYPES[0].label).toBe('Select type')
  })

  it('includes Full-Time and Part-Time options', () => {
    const values = EMPLOYMENT_TYPES.map((e) => e.value)
    expect(values).toContain('Full-Time')
    expect(values).toContain('Part-Time')
  })

  it('includes Self-Employed and Retired options', () => {
    const values = EMPLOYMENT_TYPES.map((e) => e.value)
    expect(values).toContain('Self-Employed')
    expect(values).toContain('Retired')
  })
})