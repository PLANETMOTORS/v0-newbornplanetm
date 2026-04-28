import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const fetchMock = vi.fn(async (_q: string, _params?: unknown, _opts?: unknown) => undefined as unknown)

vi.mock("@/lib/sanity/client", () => ({
  sanityClient: {
    fetch: (q: string, params?: unknown, opts?: unknown) => fetchMock(q, params, opts),
  },
}))

vi.mock("@/lib/rates", () => ({
  RATE_FLOOR: 5.99,
}))

beforeEach(() => {
  fetchMock.mockReset()
  fetchMock.mockResolvedValue(undefined)
  vi.spyOn(console, "error").mockImplementation(() => undefined)
  vi.resetModules()
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("lib/sanity/fetch — singular fetch helpers (return null on error)", () => {
  it("getSiteSettings returns the fetched value on success", async () => {
    fetchMock.mockResolvedValueOnce({ siteName: "Planet Motors" })
    const { getSiteSettings } = await import("@/lib/sanity/fetch")
    expect(await getSiteSettings()).toEqual({ siteName: "Planet Motors" })
  })

  it("getSiteSettings returns null when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("network"))
    const { getSiteSettings } = await import("@/lib/sanity/fetch")
    expect(await getSiteSettings()).toBeNull()
  })

  it("getHomepageData returns null on error / value on success", async () => {
    const { getHomepageData } = await import("@/lib/sanity/fetch")
    fetchMock.mockResolvedValueOnce({ hero: "x" })
    expect(await getHomepageData()).toEqual({ hero: "x" })
    fetchMock.mockRejectedValueOnce(new Error("x"))
    expect(await getHomepageData()).toBeNull()
  })

  it("getNavigation, getSellYourCarPage, getFinancingPage, getInventorySettings — null on error", async () => {
    const m = await import("@/lib/sanity/fetch")
    for (const fn of [m.getNavigation, m.getSellYourCarPage, m.getFinancingPage, m.getInventorySettings]) {
      fetchMock.mockRejectedValueOnce(new Error("x"))
      expect(await fn()).toBeNull()
      fetchMock.mockResolvedValueOnce({ ok: true })
      expect(await fn()).toEqual({ ok: true })
    }
  })

  it("getBlogPost / getVehicleBySlug — null on error / value on success", async () => {
    const { getBlogPost, getVehicleBySlug } = await import("@/lib/sanity/fetch")
    fetchMock.mockResolvedValueOnce({ slug: "post" })
    expect(await getBlogPost("post")).toEqual({ slug: "post" })
    fetchMock.mockRejectedValueOnce(new Error("x"))
    expect(await getBlogPost("p")).toBeNull()

    fetchMock.mockResolvedValueOnce({ make: "Tesla" })
    expect(await getVehicleBySlug("model-3")).toEqual({ make: "Tesla" })
    fetchMock.mockRejectedValueOnce(new Error("x"))
    expect(await getVehicleBySlug("x")).toBeNull()
  })
})

describe("lib/sanity/fetch — list helpers (return [] on error)", () => {
  it("getFaqs / getActivePromos / getTestimonials / getProtectionPlans / getFeaturedTestimonials / getLenders return [] on error", async () => {
    const m = await import("@/lib/sanity/fetch")
    for (const fn of [
      m.getFaqs,
      m.getActivePromos,
      m.getTestimonials,
      m.getProtectionPlans,
      m.getFeaturedTestimonials,
      m.getLenders,
    ]) {
      fetchMock.mockRejectedValueOnce(new Error("x"))
      expect(await fn()).toEqual([])
    }
  })

  it("list helpers coalesce a null/undefined response to []", async () => {
    const m = await import("@/lib/sanity/fetch")
    for (const fn of [
      m.getFaqs,
      m.getActivePromos,
      m.getTestimonials,
      m.getProtectionPlans,
      m.getFeaturedTestimonials,
      m.getLenders,
      m.getVehicles,
      m.getFeaturedVehicles,
    ]) {
      fetchMock.mockResolvedValueOnce(null)
      expect(await fn()).toEqual([])
    }
  })

  it("getVehicles / getFeaturedVehicles / getVehiclesByStockNumbers — [] on error", async () => {
    const m = await import("@/lib/sanity/fetch")
    fetchMock.mockRejectedValueOnce(new Error("x"))
    expect(await m.getVehicles()).toEqual([])

    fetchMock.mockRejectedValueOnce(new Error("x"))
    expect(await m.getFeaturedVehicles()).toEqual([])

    fetchMock.mockRejectedValueOnce(new Error("x"))
    expect(await m.getVehiclesByStockNumbers(["S1"])).toEqual([])
  })

  it("getVehiclesByStockNumbers passes the stockNumbers array as a parameter", async () => {
    fetchMock.mockResolvedValueOnce([{ id: 1 }])
    const { getVehiclesByStockNumbers } = await import("@/lib/sanity/fetch")
    const out = await getVehiclesByStockNumbers(["A1", "B2"])
    expect(out).toEqual([{ id: 1 }])
    expect(fetchMock).toHaveBeenCalledWith(expect.any(String), { stockNumbers: ["A1", "B2"] }, expect.any(Object))
  })
})

describe("lib/sanity/fetch getBlogPosts — paged response", () => {
  it("returns posts + total when both queries succeed", async () => {
    fetchMock.mockResolvedValueOnce([{ slug: "a" }])
    fetchMock.mockResolvedValueOnce(42)
    const { getBlogPosts } = await import("@/lib/sanity/fetch")
    const out = await getBlogPosts(2, 10)
    expect(out.posts).toEqual([{ slug: "a" }])
    expect(out.total).toBe(42)
  })

  it("falls back to defaults when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("x"))
    const { getBlogPosts } = await import("@/lib/sanity/fetch")
    const out = await getBlogPosts()
    expect(out).toEqual({ posts: [], total: 0 })
  })

  it("coalesces null/undefined responses to safe defaults", async () => {
    fetchMock.mockResolvedValueOnce(null)
    fetchMock.mockResolvedValueOnce(null)
    const { getBlogPosts } = await import("@/lib/sanity/fetch")
    const out = await getBlogPosts(1, 5)
    expect(out).toEqual({ posts: [], total: 0 })
  })
})

describe("lib/sanity/fetch getBlogSlugs", () => {
  it("filters out non-string slugs and returns valid entries", async () => {
    fetchMock.mockResolvedValueOnce([{ slug: "good" }, { slug: null }, { slug: "also-good" }])
    const { getBlogSlugs } = await import("@/lib/sanity/fetch")
    expect(await getBlogSlugs()).toEqual([{ slug: "good" }, { slug: "also-good" }])
  })

  it("returns [] when fetch returns null/undefined", async () => {
    fetchMock.mockResolvedValueOnce(null)
    const { getBlogSlugs } = await import("@/lib/sanity/fetch")
    expect(await getBlogSlugs()).toEqual([])
  })

  it("returns [] when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("x"))
    const { getBlogSlugs } = await import("@/lib/sanity/fetch")
    expect(await getBlogSlugs()).toEqual([])
  })
})

describe("lib/sanity/fetch getVehiclesWithFinancing", () => {
  it("returns vehicles + lenders unwrapped", async () => {
    fetchMock.mockResolvedValueOnce({ vehicles: [{ _id: "v1" }], lenders: [{ _id: "L1" }] })
    const { getVehiclesWithFinancing } = await import("@/lib/sanity/fetch")
    const out = await getVehiclesWithFinancing()
    expect(out.vehicles).toEqual([{ _id: "v1" }])
    expect(out.lenders).toEqual([{ _id: "L1" }])
  })

  it("falls back to empty arrays when fetch returns null", async () => {
    fetchMock.mockResolvedValueOnce(null)
    const { getVehiclesWithFinancing } = await import("@/lib/sanity/fetch")
    expect(await getVehiclesWithFinancing()).toEqual({ vehicles: [], lenders: [] })
  })

  it("falls back to empty arrays when fetch throws", async () => {
    fetchMock.mockRejectedValueOnce(new Error("x"))
    const { getVehiclesWithFinancing } = await import("@/lib/sanity/fetch")
    expect(await getVehiclesWithFinancing()).toEqual({ vehicles: [], lenders: [] })
  })

  it("coalesces partial responses (lenders missing → [])", async () => {
    fetchMock.mockResolvedValueOnce({ vehicles: [{ _id: "v1" }] })
    const { getVehiclesWithFinancing } = await import("@/lib/sanity/fetch")
    const out = await getVehiclesWithFinancing()
    expect(out.vehicles).toEqual([{ _id: "v1" }])
    expect(out.lenders).toEqual([])
  })
})

describe("lib/sanity/fetch calculateMonthlyPayment", () => {
  it("returns principal/term when annualRate is 0", async () => {
    const { calculateMonthlyPayment } = await import("@/lib/sanity/fetch")
    expect(calculateMonthlyPayment(60_000, 0, 60)).toBe(1_000)
  })

  it("computes a positive monthly payment for non-zero rate", async () => {
    const { calculateMonthlyPayment } = await import("@/lib/sanity/fetch")
    const pay = calculateMonthlyPayment(30_000, 6, 60)
    // ~$580 for $30K @ 6% over 60 months
    expect(pay).toBeGreaterThan(550)
    expect(pay).toBeLessThan(620)
  })

  it("uses default term=60 when not specified", async () => {
    const { calculateMonthlyPayment } = await import("@/lib/sanity/fetch")
    const a = calculateMonthlyPayment(12_000, 0)
    expect(a).toBeCloseTo(200, 5)
  })
})

describe("lib/sanity/fetch getEffectivePrice", () => {
  it("prefers specialPrice when set", async () => {
    const { getEffectivePrice } = await import("@/lib/sanity/fetch")
    expect(getEffectivePrice({ specialPrice: 100, price: 200 } as never)).toBe(100)
  })

  it("falls back to price when specialPrice is missing", async () => {
    const { getEffectivePrice } = await import("@/lib/sanity/fetch")
    expect(getEffectivePrice({ price: 250 } as never)).toBe(250)
  })

  it("returns 0 when both fields are missing", async () => {
    const { getEffectivePrice } = await import("@/lib/sanity/fetch")
    expect(getEffectivePrice({} as never)).toBe(0)
  })
})

describe("lib/sanity/fetch getAISettings", () => {
  it("returns the fetched payload on success", async () => {
    fetchMock.mockResolvedValueOnce({ annaAssistant: { displayName: "Anna" } })
    const { getAISettings } = await import("@/lib/sanity/fetch")
    expect(await getAISettings()).toEqual({ annaAssistant: { displayName: "Anna" } })
  })

  it("returns hard-coded defaults when fetch throws (CMS outage fallback)", async () => {
    fetchMock.mockRejectedValueOnce(new Error("cms down"))
    const { getAISettings } = await import("@/lib/sanity/fetch")
    const out = await getAISettings()
    expect(out.annaAssistant?.displayName).toBe("Anna")
    expect(out.fees?.omvic).toBe(22)
    expect(out.financing?.lowestRate).toBe(5.99) // from mocked RATE_FLOOR
  })
})

describe("lib/sanity/fetch CACHE_TAGS", () => {
  it("exposes the canonical revalidation-tag constants", async () => {
    const { CACHE_TAGS } = await import("@/lib/sanity/fetch")
    expect(CACHE_TAGS.settings).toBe("sanity-settings")
    expect(CACHE_TAGS.homepage).toBe("sanity-homepage")
    expect(CACHE_TAGS.blog).toBe("sanity-blog")
    expect(CACHE_TAGS.faq).toBe("sanity-faq")
    expect(CACHE_TAGS.testimonials).toBe("sanity-testimonials")
    expect(CACHE_TAGS.promos).toBe("sanity-promos")
    expect(CACHE_TAGS.protection).toBe("sanity-protection")
  })
})
