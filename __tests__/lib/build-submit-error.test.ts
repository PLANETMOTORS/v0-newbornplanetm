import { describe, it, expect } from 'vitest'
import { buildSubmitError } from '@/lib/finance/build-submit-error'

describe('buildSubmitError', () => {
  it('returns 403 message for 403 status', () => {
    const msg = buildSubmitError(403, { error: 'forbidden' })
    expect(msg).toContain('permission')
  })

  it('returns 401 message for 401 status', () => {
    const msg = buildSubmitError(401, {})
    expect(msg).toContain('session has expired')
  })

  it('returns nested error.message when present', () => {
    const msg = buildSubmitError(400, { error: { message: 'Validation failed' } })
    expect(msg).toBe('Validation failed')
  })

  it('returns string error directly', () => {
    const msg = buildSubmitError(400, { error: 'bad input' })
    expect(msg).toBe('bad input')
  })

  it('returns result.message when error not present', () => {
    const msg = buildSubmitError(500, { message: 'Server crashed' })
    expect(msg).toBe('Server crashed')
  })

  it('returns JSON stringify for unknown error shape', () => {
    const msg = buildSubmitError(422, { code: 42 })
    expect(msg).toContain('42')
  })

  it('returns fallback message for empty result', () => {
    const msg = buildSubmitError(500, {})
    expect(msg).toBe('Failed to submit application')
  })
})
