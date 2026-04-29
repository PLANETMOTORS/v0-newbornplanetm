import { describe, expect, it } from "vitest"
import * as queries from "@/lib/sanity/queries"

describe("sanity/queries — exported GROQ strings", () => {
  it("exports all expected query strings", () => {
    const expectedKeys = [
      "VEHICLES_QUERY",
      "VEHICLE_BY_SLUG_QUERY",
      "FEATURED_VEHICLES_QUERY",
      "VEHICLE_COUNT_QUERY",
      "VEHICLES_BY_STOCK_NUMBERS_QUERY",
      "SITE_SETTINGS_QUERY",
      "NAVIGATION_QUERY",
      "HOMEPAGE_QUERY",
      "SELL_YOUR_CAR_PAGE_QUERY",
      "FINANCING_PAGE_QUERY",
      "INVENTORY_SETTINGS_QUERY",
      "VEHICLES_WITH_PAYMENT_CALC_QUERY",
      "VEHICLE_WITH_PAYMENT_CONTEXT_QUERY",
      "BLOG_LIST_QUERY",
      "BLOG_COUNT_QUERY",
      "BLOG_POST_QUERY",
      "BLOG_SLUGS_QUERY",
      "FAQ_QUERY",
      "ACTIVE_PROMOS_QUERY",
      "TESTIMONIALS_QUERY",
      "FEATURED_TESTIMONIALS_QUERY",
      "PROTECTION_PLANS_QUERY",
      "LENDERS_QUERY",
      "LOWEST_RATE_QUERY",
      "VEHICLES_BY_PAYMENT_QUERY",
      "VEHICLES_WITH_DYNAMIC_PAYMENTS_QUERY",
      "VEHICLE_DETAIL_WITH_FINANCE_QUERY",
      "BANNERS_QUERY",
    ]
    for (const k of expectedKeys) {
      expect(queries[k as keyof typeof queries]).toBeDefined()
      expect(typeof queries[k as keyof typeof queries]).toBe("string")
    }
  })

  it("vehicle queries reference the 'vehicle' GROQ type", () => {
    expect(queries.VEHICLES_QUERY).toMatch(/_type == "vehicle"/)
    expect(queries.VEHICLE_BY_SLUG_QUERY).toMatch(/_type == "vehicle"/)
    expect(queries.FEATURED_VEHICLES_QUERY).toMatch(/featured == true/)
  })

  it("blog queries reference the 'blogPost' GROQ type", () => {
    expect(queries.BLOG_LIST_QUERY).toMatch(/_type == "blogPost"/)
    expect(queries.BLOG_POST_QUERY).toMatch(/slug\.current == \$slug/)
    expect(queries.BLOG_COUNT_QUERY).toMatch(/^count\(/)
  })

  it("queries with parameters reference $slug or $stockNumbers", () => {
    expect(queries.VEHICLE_BY_SLUG_QUERY).toMatch(/\$slug/)
    expect(queries.VEHICLE_WITH_PAYMENT_CONTEXT_QUERY).toMatch(/\$slug/)
    expect(queries.VEHICLE_DETAIL_WITH_FINANCE_QUERY).toMatch(/\$slug/)
    expect(queries.VEHICLES_BY_STOCK_NUMBERS_QUERY).toMatch(/\$stockNumbers/)
    expect(queries.BLOG_LIST_QUERY).toMatch(/\$start\.\.\.\$end/)
  })

  it("site settings queries pick the most-recently-updated entry", () => {
    expect(queries.SITE_SETTINGS_QUERY).toMatch(/order\(_updatedAt desc\)\[0\]/)
    expect(queries.NAVIGATION_QUERY).toMatch(/order\(_updatedAt desc\)\[0\]/)
    expect(queries.HOMEPAGE_QUERY).toMatch(/order\(_updatedAt desc\)\[0\]/)
  })

  it("payment-calc queries embed both finance settings and vehicles", () => {
    expect(queries.VEHICLES_WITH_DYNAMIC_PAYMENTS_QUERY).toMatch(/"finance":/)
    expect(queries.VEHICLES_WITH_DYNAMIC_PAYMENTS_QUERY).toMatch(/"vehicles":/)
    expect(queries.VEHICLE_DETAIL_WITH_FINANCE_QUERY).toMatch(/"vehicle":/)
    expect(queries.VEHICLE_DETAIL_WITH_FINANCE_QUERY).toMatch(/"lowestLenderRate":/)
  })

  it("active-promos query uses now() for date filtering", () => {
    expect(queries.ACTIVE_PROMOS_QUERY).toMatch(/active == true/)
    expect(queries.ACTIVE_PROMOS_QUERY).toMatch(/startDate <= now\(\)/)
    expect(queries.ACTIVE_PROMOS_QUERY).toMatch(/endDate >= now\(\)/)
  })

  it("featured testimonials are bounded to 6", () => {
    expect(queries.FEATURED_TESTIMONIALS_QUERY).toMatch(/\[0\.\.\.6\]/)
  })

  it("featured vehicles are bounded to 8", () => {
    expect(queries.FEATURED_VEHICLES_QUERY).toMatch(/\[0\.\.\.8\]/)
  })
})
