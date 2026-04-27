import { describe, it, expect, vi, beforeEach } from 'vitest'

const sessionStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((k: string) => store[k] ?? null),
    setItem: vi.fn((k: string, v: string) => { store[k] = v }),
    removeItem: vi.fn((k: string) => { delete store[k] }),
    clear: vi.fn(() => { store = {} }),
  }
})()

vi.stubGlobal('sessionStorage', sessionStorageMock)

const { getUTMParams, clearUTMParams } = await import('@/lib/hooks/use-utm-params')

describe('use-utm-params helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorageMock.clear()
    vi.stubGlobal('window', {})
  })

  describe('getUTMParams', () => {
    it('returns null when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(getUTMParams()).toBeNull()
    })

    it('returns null when no UTMs stored', () => {
      expect(getUTMParams()).toBeNull()
    })

    it('returns stored UTM params', () => {
      const params = { utm_source: 'google', utm_medium: 'cpc', captured_at: '2026-01-01T00:00:00.000Z' }
      sessionStorageMock.getItem.mockReturnValueOnce(JSON.stringify(params))
      expect(getUTMParams()).toEqual(params)
    })

    it('returns null on JSON parse error', () => {
      sessionStorageMock.getItem.mockReturnValueOnce('invalid-json{')
      expect(getUTMParams()).toBeNull()
    })
  })

  describe('clearUTMParams', () => {
    it('does nothing when window is undefined', () => {
      vi.stubGlobal('window', undefined)
      expect(() => clearUTMParams()).not.toThrow()
    })

    it('removes storage key', () => {
      clearUTMParams()
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('pm_utm_params')
    })
  })
})
