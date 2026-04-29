// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { act, renderHook } from "@testing-library/react"
import { useCookieConsent } from "@/lib/hooks/use-cookie-consent"

const STORAGE_KEY = "pm_cookie_consent"

beforeEach(() => {
  localStorage.clear()
  // @ts-expect-error gtag mock
  globalThis.window.gtag = vi.fn()
})

afterEach(() => {
  localStorage.clear()
  // @ts-expect-error gtag cleanup
  delete globalThis.window.gtag
})

describe("useCookieConsent", () => {
  it("starts with un-decided default state, mounts, then shows banner", () => {
    const { result } = renderHook(() => useCookieConsent())
    expect(result.current.consent.decided).toBe(false)
    expect(result.current.consent.categories.essential).toBe(true)
    expect(result.current.mounted).toBe(true)
    expect(result.current.showBanner).toBe(true)
  })

  it("hides banner once user has previously decided", () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        decided: true,
        updatedAt: "2025-01-01T00:00:00Z",
        categories: { essential: true, analytics: true, marketing: false },
      }),
    )
    const { result } = renderHook(() => useCookieConsent())
    expect(result.current.showBanner).toBe(false)
    expect(result.current.hasAnalyticsConsent).toBe(true)
    expect(result.current.hasMarketingConsent).toBe(false)
  })

  it("acceptAll grants analytics + marketing and persists", () => {
    const { result } = renderHook(() => useCookieConsent())
    act(() => result.current.acceptAll())
    expect(result.current.consent.decided).toBe(true)
    expect(result.current.consent.categories.analytics).toBe(true)
    expect(result.current.consent.categories.marketing).toBe(true)
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")
    expect(stored.categories.analytics).toBe(true)
    // @ts-expect-error gtag is mocked
    expect(globalThis.window.gtag).toHaveBeenCalledWith(
      "consent",
      "update",
      expect.objectContaining({ analytics_storage: "granted", ad_storage: "granted" }),
    )
  })

  it("rejectAll denies analytics + marketing", () => {
    const { result } = renderHook(() => useCookieConsent())
    act(() => result.current.rejectAll())
    expect(result.current.consent.decided).toBe(true)
    expect(result.current.consent.categories.analytics).toBe(false)
    expect(result.current.consent.categories.marketing).toBe(false)
    expect(result.current.showBanner).toBe(false)
  })

  it("savePreferences merges with essential=true", () => {
    const { result } = renderHook(() => useCookieConsent())
    act(() => result.current.savePreferences({ analytics: true, marketing: false }))
    expect(result.current.consent.categories.analytics).toBe(true)
    expect(result.current.consent.categories.marketing).toBe(false)
    expect(result.current.consent.categories.essential).toBe(true)
  })

  it("resetConsent clears persisted state", () => {
    const { result } = renderHook(() => useCookieConsent())
    act(() => result.current.acceptAll())
    act(() => result.current.resetConsent())
    expect(result.current.consent.decided).toBe(false)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it("recovers from corrupted storage", () => {
    localStorage.setItem(STORAGE_KEY, "{not-json")
    const { result } = renderHook(() => useCookieConsent())
    expect(result.current.consent.decided).toBe(false)
  })
})
