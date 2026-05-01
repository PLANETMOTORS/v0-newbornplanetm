import { describe, it, expect, vi, beforeEach } from "vitest"

/* ---------- Mocks ---------- */

const mockGetPopularSearches = vi.fn()

vi.mock("@/lib/search/data", () => ({
  getPopularSearches: (...args: unknown[]) => mockGetPopularSearches(...args),
}))

import { GET } from "@/app/api/search/popular/route"

/* ---------- Tests ---------- */

beforeEach(() => {
  vi.resetAllMocks()
})

describe("GET /api/search/popular", () => {
  it("returns popular searches with cache headers", async () => {
    const data = [
      { label: "SUVs", type: "body_style", count: 18, href: "/inventory?bodyStyle=SUV", score: 0.85 },
      { label: "Tesla", type: "make", count: 6, href: "/inventory/used/tesla", score: 0.75 },
    ]
    mockGetPopularSearches.mockResolvedValueOnce(data)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(data)
    expect(res.headers.get("Cache-Control")).toBe(
      "public, s-maxage=900, stale-while-revalidate=60",
    )
  })

  it("returns empty array on error", async () => {
    mockGetPopularSearches.mockRejectedValueOnce(new Error("DB down"))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toEqual([])
  })

  it("returns empty array when no popular searches exist", async () => {
    mockGetPopularSearches.mockResolvedValueOnce([])

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual([])
  })
})
