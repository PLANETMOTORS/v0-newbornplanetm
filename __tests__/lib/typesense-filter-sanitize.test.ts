import { describe, it, expect } from 'vitest'
import { sanitizeTypesenseFilterValue } from '@/lib/typesense'

// ---------------------------------------------------------------------------
// sanitizeTypesenseFilterValue — quoting & escaping
// ---------------------------------------------------------------------------

/** Helper: assert that a value is wrapped in backticks unchanged. */
function expectWrapped(input: string, expected: string = `\`${input}\``) {
  expect(sanitizeTypesenseFilterValue(input)).toBe(expected)
}

describe('sanitizeTypesenseFilterValue', () => {
  it('wraps a simple single-word value in backticks', () => {
    expectWrapped('Toyota')
  })

  it('wraps multi-word values like "Land Rover" in backticks', () => {
    expectWrapped('Land Rover')
  })

  it('wraps "Alfa Romeo" (multi-word make) in backticks', () => {
    expectWrapped('Alfa Romeo')
  })

  it('wraps multi-word model names in backticks', () => {
    expectWrapped('Model Y Long Range')
  })

  it('escapes embedded backticks in values', () => {
    expect(sanitizeTypesenseFilterValue('some`value')).toBe('`some\\`value`')
  })

  it('escapes multiple embedded backticks', () => {
    expect(sanitizeTypesenseFilterValue('a`b`c')).toBe('`a\\`b\\`c`')
  })

  // ── Rejection of dangerous tokens ──────────────────────────────────────

  it('rejects values containing "]"', () => {
    expect(() =>
      sanitizeTypesenseFilterValue('Toyota] && status:=sold')
    ).toThrow('Invalid filter value: contains forbidden token "]"')
  })

  it('rejects values containing "&&"', () => {
    expect(() =>
      sanitizeTypesenseFilterValue('Toyota && status:=sold')
    ).toThrow('Invalid filter value: contains forbidden token "&&"')
  })

  it('rejects values containing "||"', () => {
    expect(() =>
      sanitizeTypesenseFilterValue('Toyota || make:=Honda')
    ).toThrow('Invalid filter value: contains forbidden token "||"')
  })

  it('rejects complex injection payloads', () => {
    expect(() =>
      sanitizeTypesenseFilterValue('BMW] && price:<=0 && make:=[BMW')
    ).toThrow('Invalid filter value')
  })

  // ── Edge cases ─────────────────────────────────────────────────────────

  it('handles empty string', () => {
    expect(sanitizeTypesenseFilterValue('')).toBe('``')
  })

  it('handles values with only spaces', () => {
    expectWrapped('   ')
  })

  it('handles hyphens (e.g. body style "Mid-Size")', () => {
    expectWrapped('Mid-Size SUV')
  })

  it('handles ampersand that is NOT part of "&&"', () => {
    // Single & is fine — only && is dangerous
    expectWrapped('AT&T')
  })

  it('handles pipe that is NOT part of "||"', () => {
    // Single | is fine — only || is dangerous
    expectWrapped('A|B')
  })

  // ── Backslash escaping (Devin Review fix) ──────────────────────────────

  it('escapes backslashes before backticks to prevent quoting breakout', () => {
    // Input: Toyota\  → must produce `Toyota\\` not `Toyota\`
    // Without backslash escaping, `Toyota\` would make Typesense interpret
    // \` as escaped backtick, leaving the string unclosed.
    expect(sanitizeTypesenseFilterValue('Toyota\\')).toBe('`Toyota\\\\`')
  })

  it('escapes backslash-backtick sequences correctly', () => {
    // Input: some\`value → backslash escapes first: some\\`value
    // then backtick escapes: some\\\`value → wrapped: `some\\\`value`
    expect(sanitizeTypesenseFilterValue('some\\`value')).toBe('`some\\\\\\`value`')
  })

  it('escapes multiple backslashes', () => {
    // Input: a\\b (2 backslashes) → each escaped → a\\\\b (4 backslashes), wrapped in backticks
    expect(sanitizeTypesenseFilterValue(String.raw`a\\b`)).toBe('`' + String.raw`a\\\\b` + '`')
  })

  it('handles backslash in the middle of a multi-word value', () => {
    // Input: Land\Rover (1 backslash) → escaped → Land\\Rover (2 backslashes), wrapped in backticks
    expect(sanitizeTypesenseFilterValue(String.raw`Land\Rover`)).toBe('`' + String.raw`Land\\Rover` + '`')
  })
})
