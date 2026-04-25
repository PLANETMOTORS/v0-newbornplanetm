import { describe, it, expect } from 'vitest'
import { sanitizeTypesenseFilterValue } from '@/lib/typesense'

// ---------------------------------------------------------------------------
// sanitizeTypesenseFilterValue — quoting & escaping
// ---------------------------------------------------------------------------
describe('sanitizeTypesenseFilterValue', () => {
  it('wraps a simple single-word value in backticks', () => {
    expect(sanitizeTypesenseFilterValue('Toyota')).toBe('`Toyota`')
  })

  it('wraps multi-word values like "Land Rover" in backticks', () => {
    expect(sanitizeTypesenseFilterValue('Land Rover')).toBe('`Land Rover`')
  })

  it('wraps "Alfa Romeo" (multi-word make) in backticks', () => {
    expect(sanitizeTypesenseFilterValue('Alfa Romeo')).toBe('`Alfa Romeo`')
  })

  it('wraps multi-word model names in backticks', () => {
    expect(sanitizeTypesenseFilterValue('Model Y Long Range')).toBe(
      '`Model Y Long Range`'
    )
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
    expect(sanitizeTypesenseFilterValue('   ')).toBe('`   `')
  })

  it('handles hyphens (e.g. body style "Mid-Size")', () => {
    expect(sanitizeTypesenseFilterValue('Mid-Size SUV')).toBe('`Mid-Size SUV`')
  })

  it('handles ampersand that is NOT part of "&&"', () => {
    // Single & is fine — only && is dangerous
    expect(sanitizeTypesenseFilterValue('AT&T')).toBe('`AT&T`')
  })

  it('handles pipe that is NOT part of "||"', () => {
    // Single | is fine — only || is dangerous
    expect(sanitizeTypesenseFilterValue('A|B')).toBe('`A|B`')
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
