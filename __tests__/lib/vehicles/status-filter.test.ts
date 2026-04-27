import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  PUBLIC_STATUSES,
  buildPublicStatusFilter,
  applyStatusFilter,
} from '@/lib/vehicles/status-filter'

describe('PUBLIC_STATUSES', () => {
  it('contains available, reserved, and sold', () => {
    expect(PUBLIC_STATUSES).toEqual(['available', 'reserved', 'sold'])
  })
})

describe('buildPublicStatusFilter', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-06-15T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns a PostgREST .or() filter string', () => {
    const filter = buildPublicStatusFilter()
    expect(filter).toContain('status.eq.available')
    expect(filter).toContain('status.eq.reserved')
    expect(filter).toContain('status.eq.sold')
    expect(filter).toContain('sold_at.gte.')
  })

  it('computes 7-day window from current time', () => {
    const filter = buildPublicStatusFilter()
    // 7 days before 2025-06-15T12:00:00Z = 2025-06-08T12:00:00Z
    expect(filter).toContain('sold_at.gte.2025-06-08T12:00:00.000Z')
  })

  it('wraps sold filter in and() for correct PostgREST precedence', () => {
    const filter = buildPublicStatusFilter()
    expect(filter).toMatch(/and\(status\.eq\.sold,sold_at\.gte\./)
  })
})

describe('applyStatusFilter', () => {
  const mockQuery = {
    or: vi.fn(),
    eq: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockQuery.or.mockReturnValue(mockQuery)
    mockQuery.eq.mockReturnValue(mockQuery)
  })

  it('calls .or() when status is "public"', () => {
    applyStatusFilter(mockQuery, 'public')
    expect(mockQuery.or).toHaveBeenCalledTimes(1)
    expect(mockQuery.eq).not.toHaveBeenCalled()
  })

  it('passes the public status filter to .or()', () => {
    applyStatusFilter(mockQuery, 'public')
    const filterArg = mockQuery.or.mock.calls[0][0] as string
    expect(filterArg).toContain('status.eq.available')
    expect(filterArg).toContain('status.eq.reserved')
    expect(filterArg).toContain('status.eq.sold')
  })

  it('calls .eq() for specific status values', () => {
    applyStatusFilter(mockQuery, 'available')
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'available')
    expect(mockQuery.or).not.toHaveBeenCalled()
  })

  it('calls .eq() for "sold" status', () => {
    applyStatusFilter(mockQuery, 'sold')
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'sold')
  })

  it('calls .eq() for "reserved" status', () => {
    applyStatusFilter(mockQuery, 'reserved')
    expect(mockQuery.eq).toHaveBeenCalledWith('status', 'reserved')
  })

  it('returns the query for chaining', () => {
    const result = applyStatusFilter(mockQuery, 'public')
    expect(result).toBe(mockQuery)
  })
})
