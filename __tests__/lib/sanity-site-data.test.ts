import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const getSiteSettingsMock = vi.fn()
const getNavigationMock = vi.fn()

vi.mock("@/lib/sanity/fetch", () => ({
  getSiteSettings: (...args: unknown[]) => getSiteSettingsMock(...args),
  getNavigation: (...args: unknown[]) => getNavigationMock(...args),
}))

beforeEach(() => {
  vi.clearAllMocks()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("DEFAULT_SITE_SETTINGS / DEFAULT_NAVIGATION", () => {
  it("expose Planet Motors fallback metadata", async () => {
    const mod = await import("@/lib/sanity/site-data")
    expect(mod.DEFAULT_SITE_SETTINGS.dealerName).toBe("Planet Motors")
    expect(mod.DEFAULT_SITE_SETTINGS.businessHours).toHaveLength(3)
    expect(mod.DEFAULT_SITE_SETTINGS.businessHours[2]).toEqual({ day: "Sunday", hours: "Closed" })
    expect(mod.DEFAULT_NAVIGATION.mainNavigation.length).toBeGreaterThan(0)
    expect(mod.DEFAULT_NAVIGATION.mainNavigation[0]).toEqual({ label: "Home", href: "/" })
  })
})

describe("getSiteData", () => {
  it("returns Sanity-fetched values when both succeed", async () => {
    getSiteSettingsMock.mockResolvedValue({ dealerName: "Custom" })
    getNavigationMock.mockResolvedValue({ mainNavigation: [{ label: "X", href: "/x" }] })
    const { getSiteData } = await import("@/lib/sanity/site-data")
    const data = await getSiteData()
    expect(data.settings.dealerName).toBe("Custom")
    expect(data.navigation.mainNavigation[0].label).toBe("X")
  })

  it("falls back to defaults when Sanity returns null", async () => {
    getSiteSettingsMock.mockResolvedValue(null)
    getNavigationMock.mockResolvedValue(null)
    const { getSiteData, DEFAULT_SITE_SETTINGS, DEFAULT_NAVIGATION } = await import("@/lib/sanity/site-data")
    const data = await getSiteData()
    expect(data.settings).toBe(DEFAULT_SITE_SETTINGS)
    expect(data.navigation).toBe(DEFAULT_NAVIGATION)
  })

  it("falls back to defaults when fetch throws", async () => {
    getSiteSettingsMock.mockRejectedValue(new Error("sanity down"))
    getNavigationMock.mockResolvedValue(null)
    vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { getSiteData, DEFAULT_SITE_SETTINGS, DEFAULT_NAVIGATION } = await import("@/lib/sanity/site-data")
    const data = await getSiteData()
    expect(data.settings).toBe(DEFAULT_SITE_SETTINGS)
    expect(data.navigation).toBe(DEFAULT_NAVIGATION)
  })
})
