import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGetPopularSearches = vi.fn()

vi.mock("@/lib/search/data", () => ({
  getPopularSearches: (...args: unknown[]) => mockGetPopularSearches(...args),
}))

describe("GET /api/search/popular", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("returns 200 with popular searches", async () => {
    const data = [{ label: "SUVs", type: "body_style", count: 5, href: "/", score: 0.8 }]
    mockGetPopularSearches.mockResolvedValue(data)

    const { GET } = await import("@/app/api/search/popular/route")
    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual(data)
    expect(response.headers.get("Cache-Control")).toBe(
      "public, s-maxage=900, stale-while-revalidate=3600",
    )
  })

  it("returns 500 with empty array on error", async () => {
    mockGetPopularSearches.mockRejectedValue(new Error("boom"))

    const { GET } = await import("@/app/api/search/popular/route")
    const response = await GET()

    expect(response.status).toBe(500)
    const body = await response.json()
    expect(body).toEqual([])
  })

  it("returns 200 with empty array when no popular searches", async () => {
    mockGetPopularSearches.mockResolvedValue([])

    const { GET } = await import("@/app/api/search/popular/route")
    const response = await GET()

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual([])
  })
})
