import { describe, it, expect } from 'vitest'
import {
  isVehicleSold,
  isVehicleUnavailable,
  statusBadgeStyles,
  statusLabels,
} from '@/components/vehicle-status-badge'

describe('isVehicleSold', () => {
  it('returns true for sold', () => {
    expect(isVehicleSold('sold')).toBe(true)
  })
  it('returns false for available', () => {
    expect(isVehicleSold('available')).toBe(false)
  })
  it('returns false for reserved', () => {
    expect(isVehicleSold('reserved')).toBe(false)
  })
})

describe('isVehicleUnavailable', () => {
  it('returns true for sold', () => {
    expect(isVehicleUnavailable('sold')).toBe(true)
  })
  it('returns true for pending', () => {
    expect(isVehicleUnavailable('pending')).toBe(true)
  })
  it('returns true for reserved', () => {
    expect(isVehicleUnavailable('reserved')).toBe(true)
  })
  it('returns false for available', () => {
    expect(isVehicleUnavailable('available')).toBe(false)
  })
  it('returns false for unknown status', () => {
    expect(isVehicleUnavailable('in-transit')).toBe(false)
  })
})

describe('statusBadgeStyles', () => {
  it('has empty style for available (no badge shown)', () => {
    expect(statusBadgeStyles['available']).toBe('')
  })
  it('has yellow style for reserved', () => {
    expect(statusBadgeStyles['reserved']).toContain('yellow')
  })
  it('has red style for sold', () => {
    expect(statusBadgeStyles['sold']).toContain('red')
  })
})

describe('statusLabels', () => {
  it('maps reserved to Reserved', () => {
    expect(statusLabels['reserved']).toBe('Reserved')
  })
  it('maps sold to Sold', () => {
    expect(statusLabels['sold']).toBe('Sold')
  })
  it('maps available to Available', () => {
    expect(statusLabels['available']).toBe('Available')
  })
})
