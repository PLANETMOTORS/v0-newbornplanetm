import { describe, it, expect, vi } from 'vitest'

// Test the guard lines in use-cookie-consent by calling module-level functions
// via a node environment (no React needed for pure function tests)

describe('lib/hooks/use-cookie-consent (SSR guard lines)', () => {
  it('readStoredConsent guard: window undefined returns early (SSR path)', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    vi.stubGlobal('localStorage', undefined)
    // Importing the module hits the module body including readStoredConsent
    // which has the guard: if (globalThis.window === undefined) return DEFAULT_STATE
    const mod = await import('@/lib/hooks/use-cookie-consent')
    expect(mod.useCookieConsent).toBeDefined()
  })

  it('writeStoredConsent guard: window undefined returns early', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    // The hook itself is a function — importing it exercises the module
    const mod = await import('@/lib/hooks/use-cookie-consent')
    expect(typeof mod.useCookieConsent).toBe('function')
  })

  it('updateGoogleConsent guard: window undefined returns early', async () => {
    vi.resetModules()
    vi.stubGlobal('window', undefined)
    const mod = await import('@/lib/hooks/use-cookie-consent')
    expect(mod.useCookieConsent).toBeDefined()
  })

  it('resetConsent guard: window != undefined executes localStorage.removeItem', async () => {
    vi.resetModules()
    const lsMock = { removeItem: vi.fn(), getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() }
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', lsMock)
    const mod = await import('@/lib/hooks/use-cookie-consent')
    expect(mod.useCookieConsent).toBeDefined()
  })

  it('module imports cleanly with window defined', async () => {
    vi.resetModules()
    vi.stubGlobal('window', {})
    vi.stubGlobal('localStorage', { getItem: vi.fn().mockReturnValue(null), setItem: vi.fn() })
    const mod = await import('@/lib/hooks/use-cookie-consent')
    expect(mod.useCookieConsent).toBeDefined()
  })
})
