import { describe, it, expect, vi, beforeEach } from "vitest"

const mockGet = vi.fn()
const mockSet = vi.fn()
const mockDel = vi.fn()
const mockRpc = vi.fn()

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    get = mockGet
    set = mockSet
    del = mockDel
  },
}))

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({ rpc: mockRpc }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { error: vi.fn(), warn: vi.fn(), info: vi.fn() },
}))

describe("search/data", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    process.env.KV_REST_API_URL = "https://redis.example.com"
    process.env.KV_REST_API_TOKEN = "test-token"
  })

  it("returns cached results from Redis", async () => {
    const cached = [{ label: "SUVs", type: "body_style", count: 5, href: "/", score: 0.8 }]
    mockGet.mockResolvedValue(JSON.stringify(cached))

    const { getPopularSearches } = await import("@/lib/search/data")
    const results = await getPopularSearches()

    expect(results).toEqual(cached)
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it("falls through to Supabase when Redis misses", async () => {
    const rpcData = [{ label: "Electric", type: "fuel", count: 3, href: "/", score: 0.6 }]
    mockGet.mockResolvedValue(null)
    mockRpc.mockResolvedValue({ data: rpcData, error: null })

    const { getPopularSearches } = await import("@/lib/search/data")
    const results = await getPopularSearches()

    expect(results).toEqual(rpcData)
    expect(mockSet).toHaveBeenCalledWith(
      "planet:popular_searches",
      JSON.stringify(rpcData),
      { ex: 900 },
    )
  })

  it("returns empty array on Supabase RPC error", async () => {
    mockGet.mockResolvedValue(null)
    mockRpc.mockResolvedValue({ data: null, error: { message: "RPC failed" } })

    const { getPopularSearches } = await import("@/lib/search/data")
    const results = await getPopularSearches()

    expect(results).toEqual([])
  })

  it("gracefully degrades when Redis is unavailable", async () => {
    delete process.env.KV_REST_API_URL
    const rpcData = [{ label: "Tesla", type: "make", count: 4, href: "/", score: 0.7 }]
    mockRpc.mockResolvedValue({ data: rpcData, error: null })

    const { getPopularSearches } = await import("@/lib/search/data")
    const results = await getPopularSearches()

    expect(results).toEqual(rpcData)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it("returns empty array on unexpected error", async () => {
    mockGet.mockRejectedValue(new Error("connection lost"))

    const { getPopularSearches } = await import("@/lib/search/data")
    const results = await getPopularSearches()

    expect(results).toEqual([])
  })

  it("invalidatePopularSearchCache deletes the key", async () => {
    mockDel.mockResolvedValue(1)

    const { invalidatePopularSearchCache } = await import("@/lib/search/data")
    await invalidatePopularSearchCache()

    expect(mockDel).toHaveBeenCalledWith("planet:popular_searches")
  })

  it("invalidatePopularSearchCache handles errors gracefully", async () => {
    mockDel.mockRejectedValue(new Error("redis down"))

    const { invalidatePopularSearchCache } = await import("@/lib/search/data")
    await expect(invalidatePopularSearchCache()).resolves.toBeUndefined()
  })
})
