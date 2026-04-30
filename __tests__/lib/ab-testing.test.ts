import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock dependencies before importing
vi.mock('@/components/analytics/google-tag-manager', () => ({
  pushToDataLayer: vi.fn(),
}))
vi.mock('@/lib/util/random', () => ({
  randomFloat: vi.fn().mockReturnValue(0.1),
}))

const {
  getVisitorId, getVariant, trackExperimentConversion,
  clearAssignments, getAllAssignments,
} = await import('@/lib/ab-testing')

const mockStorage: Record<string, string> = {}
const localStorageMock = {
  getItem: vi.fn((k: string) => mockStorage[k] ?? null),
  setItem: vi.fn((k: string, v: string) => { mockStorage[k] = v }),
  removeItem: vi.fn((k: string) => { delete mockStorage[k] }),
  clear: vi.fn(() => { for (const k in mockStorage) delete mockStorage[k] }),
  length: 0,
  key: vi.fn(),
}

const cryptoMock = {
  randomUUID: vi.fn().mockReturnValue('test-uuid-1234'),
  getRandomValues: vi.fn(),
}

describe('ab-testing', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.clear()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', localStorageMock)
    vi.stubGlobal('crypto', cryptoMock)
  })

  describe('getVisitorId', () => {
    it('returns "ssr" when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(getVisitorId()).toBe('ssr')
    })

    it('creates a new visitor ID when none exists', () => {
      const id = getVisitorId()
      expect(id).toBe('test-uuid-1234')
      expect(localStorageMock.setItem).toHaveBeenCalledWith('pm_visitor_id', 'test-uuid-1234')
    })

    it('returns existing visitor ID from localStorage', () => {
      mockStorage['pm_visitor_id'] = 'existing-id'
      expect(getVisitorId()).toBe('existing-id')
    })
  })

  describe('getVariant', () => {
    const exp = { variants: ['control', 'treatment'] as const, weights: [50, 50] }

    it('returns control on SSR', () => {
      vi.stubGlobal('window', undefined)
      expect(getVariant('test-exp', exp)).toBe('control')
    })

    it('assigns a variant and persists it', () => {
      const variant = getVariant('test-exp', exp)
      expect(['control', 'treatment']).toContain(variant)
      expect(localStorageMock.setItem).toHaveBeenCalled()
    })

    it('returns the same variant on repeat calls (sticky)', () => {
      const v1 = getVariant('sticky-exp', exp)
      const v2 = getVariant('sticky-exp', exp)
      expect(v1).toBe(v2)
    })

    it('falls back to control when random >= total (floating point edge case)', async () => {
      const { randomFloat } = await import('@/lib/util/random')
      // Return 1.0 — rand = 1.0 * total ≥ all cumulative sums → fallback to control
      vi.mocked(randomFloat).mockReturnValueOnce(1.0)
      const variant = getVariant('fallback-test', {
        variants: ['control', 'variant_b'] as const,
        weights: [50, 50],
      })
      expect(variant).toBe('control')
    })

    it('fires GTM impression on first assignment', async () => {
      const { pushToDataLayer } = await import('@/components/analytics/google-tag-manager')
      getVariant('gtm-exp', exp)
      expect(pushToDataLayer).toHaveBeenCalledWith(expect.objectContaining({
        event: 'experiment_impression',
        experiment_id: 'gtm-exp',
      }))
    })
  })

  describe('trackExperimentConversion', () => {
    it('does nothing when not enrolled', async () => {
      const { pushToDataLayer } = await import('@/components/analytics/google-tag-manager')
      trackExperimentConversion('unknown-exp', 'goal')
      expect(pushToDataLayer).not.toHaveBeenCalled()
    })

    it('fires GTM conversion when enrolled', async () => {
      const { pushToDataLayer } = await import('@/components/analytics/google-tag-manager')
      const exp = { variants: ['control', 'treatment'] as const }
      getVariant('conv-exp', exp)
      vi.mocked(pushToDataLayer).mockClear()
      trackExperimentConversion('conv-exp', 'lead_submitted', 25000)
      expect(pushToDataLayer).toHaveBeenCalledWith(expect.objectContaining({
        event: 'experiment_conversion',
        experiment_id: 'conv-exp',
        goal_name: 'lead_submitted',
        conversion_value: 25000,
      }))
    })

    it('omits conversion_value when value is undefined (L186 branch)', async () => {
      const { pushToDataLayer } = await import('@/components/analytics/google-tag-manager')
      const exp = { variants: ['control', 'treatment'] as const }
      getVariant('conv-noval', exp)
      vi.mocked(pushToDataLayer).mockClear()
      trackExperimentConversion('conv-noval', 'page_view')
      expect(pushToDataLayer).toHaveBeenCalledWith(
        expect.objectContaining({ event: 'experiment_conversion', goal_name: 'page_view' }),
      )
      const payload = vi.mocked(pushToDataLayer).mock.calls[0][0] as Record<string, unknown>
      expect(payload).not.toHaveProperty('conversion_value')
    })
  })

  describe('clearAssignments / getAllAssignments', () => {
    it('getAllAssignments returns empty object when none stored', () => {
      expect(getAllAssignments()).toEqual({})
    })

    it('clearAssignments removes storage key', () => {
      getVariant('clear-test', { variants: ['a', 'b'] as const })
      clearAssignments()
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('pm_ab_assignments')
    })

    it('clearAssignments does nothing on SSR', () => {
      vi.stubGlobal('window', undefined)
      expect(() => clearAssignments()).not.toThrow()
    })
  })
})
