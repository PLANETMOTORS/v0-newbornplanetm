import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const getSiteSettingsMock = vi.fn()
const getNavigationMock = vi.fn()

vi.mock("@/lib/sanity/fetch", () => ({
  getSiteSettings: () => getSiteSettingsMock(),
  getNavigation: () => getNavigationMock(),
}))

beforeEach(() => {
  getSiteSettingsMock.mockReset()
  getNavigationMock.mockReset()
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("sanity/site-data — DEFAULT_SITE_SETTINGS / DEFAULT_NAVIGATION", () => {
  it("DEFAULT_SITE_SETTINGS embeds dealership address constants", async () => {
    const { DEFAULT_SITE_SETTINGS } = await import("@/lib/sanity/site-data")
    expect(DEFAULT_SITE_SETTINGS.dealerName).toBe("Planet Motors")
    expect(DEFAULT_SITE_SETTINGS.streetAddress).toMatch(/Major Mackenzie/)
    expect(DEFAULT_SITE_SETTINGS.city).toBe("Richmond Hill")
    expect(DEFAULT_SITE_SETTINGS.businessHours.length).toBe(3)
  })

  it("DEFAULT_NAVIGATION lists main nav items", async () => {
    const { DEFAULT_NAVIGATION } = await import("@/lib/sanity/site-data")
    const labels = DEFAULT_NAVIGATION.mainNavigation.map(n => n.label)
    expect(labels).toContain("Home")
    expect(labels).toContain("Inventory")
    expect(labels).toContain("Financing")
  })
})

describe("getSiteData", () => {
  it("returns Sanity values when both queries succeed", async () => {
    getSiteSettingsMock.mockResolvedValueOnce({ dealerName: "Sanity Dealer" })
    getNavigationMock.mockResolvedValueOnce({ mainNavigation: [{ label: "X", href: "/x" }] })
    const { getSiteData } = await import("@/lib/sanity/site-data")
    const r = await getSiteData()
    expect(r.settings).toEqual({ dealerName: "Sanity Dealer" })
    expect(r.navigation).toEqual({ mainNavigation: [{ label: "X", href: "/x" }] })
  })

  it("falls back to default settings when getSiteSettings returns null", async () => {
    getSiteSettingsMock.mockResolvedValueOnce(null)
    getNavigationMock.mockResolvedValueOnce({ mainNavigation: [{ label: "X", href: "/x" }] })
    const { getSiteData, DEFAULT_SITE_SETTINGS } = await import("@/lib/sanity/site-data")
    const r = await getSiteData()
    expect(r.settings).toBe(DEFAULT_SITE_SETTINGS)
    expect(r.navigation).toEqual({ mainNavigation: [{ label: "X", href: "/x" }] })
  })

  it("falls back to default navigation when getNavigation returns null", async () => {
    getSiteSettingsMock.mockResolvedValueOnce({ dealerName: "Sanity Dealer" })
    getNavigationMock.mockResolvedValueOnce(null)
    const { getSiteData, DEFAULT_NAVIGATION } = await import("@/lib/sanity/site-data")
    const r = await getSiteData()
    expect(r.navigation).toBe(DEFAULT_NAVIGATION)
  })

  it("returns both defaults when either Sanity call throws", async () => {
    getSiteSettingsMock.mockRejectedValueOnce(new Error("Sanity down"))
    getNavigationMock.mockResolvedValueOnce({ mainNavigation: [] })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { getSiteData, DEFAULT_SITE_SETTINGS, DEFAULT_NAVIGATION } = await import("@/lib/sanity/site-data")
    const r = await getSiteData()
    expect(r.settings).toBe(DEFAULT_SITE_SETTINGS)
    expect(r.navigation).toBe(DEFAULT_NAVIGATION)
    expect(errSpy).toHaveBeenCalled()
  })
})
