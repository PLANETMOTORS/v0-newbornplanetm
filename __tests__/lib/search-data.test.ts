import { describe, it, expect, vi, beforeEach } from "vitest"

/* ---------- Mocks ---------- */

const mockRedisGet = vi.fn()
const mockRedisSet = vi.fn()
const mockRedisDel = vi.fn()

vi.mock("@upstash/redis", () => ({
  Redis: class MockRedis {
    get = mockRedisGet
    set = mockRedisSet
    del = mockRedisDel
  },
}))

const mockRpc = vi.fn()

vi.mock("@/lib/supabase/server", () => ({
  createAdminClient: () => ({ rpc: mockRpc }),
}))

vi.mock("@/lib/logger", () => ({
  logger: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

/* ---------- Setup ---------- */

beforeEach(() => {
  vi.clearAllMocks()
  process.env.KV_REST_API_URL = "https://test-redis.upstash.io"
  process.env.KV_REST_API_TOKEN = "test-token"
})

/* ---------- Tests ---------- */

describe("lib/search/data", () => {
  describe("getPopularSearches", () => {
    it("returns cached data from Redis on cache hit (string)", async () => {
      const cached = [
        { label: "SUVs", type: "body_style", count: 18, href: "/inventory?bodyStyle=SUV", score: 0.85 },
      ]
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(cached))

      vi.resetModules()
      const { getPopularSearches } = await import("@/lib/search/data")
      const result = await getPopularSearches()

      expect(result).toEqual(cached)
      expect(mockRpc).not.toHaveBeenCalled()
    })

    it("returns cached data from Redis when already parsed (object)", async () => {
      const cached = [
        { label: "Sedans", type: "body_style", count: 8, href: "/inventory?bodyStyle=Sedan", score: 0.6 },
      ]
      mockRedisGet.mockResolvedValueOnce(cached)

      vi.resetModules()
      const { getPopularSearches } = await import("@/lib/search/data")
      const result = await getPopularSearches()

      expect(result).toEqual(cached)
    })

    it("falls back to Supabase RPC on Redis cache miss", async () => {
      const rpcData = [
        { label: "Tesla", type: "make", count: 6, href: "/inventory/used/tesla", score: 0.75 },
      ]
      mockRedisGet.mockResolvedValueOnce(null)
      mockRpc.mockResolvedValueOnce({ data: rpcData, error: null })

      vi.resetModules()
      const { getPopularSearches } = await import("@/lib/search/data")
      const result = await getPopularSearches()

      expect(result).toEqual(rpcData)
      expect(mockRpc).toHaveBeenCalledWith("get_popular_searches")
      expect(mockRedisSet).toHaveBeenCalledWith(
        "planet:popular_searches",
        JSON.stringify(rpcData),
        { ex: 900 },
      )
    })

    it("returns empty array on Supabase RPC error", async () => {
      mockRedisGet.mockResolvedValueOnce(null)
      mockRpc.mockResolvedValueOnce({
        data: null,
        error: { message: "RPC not found" },
      })

      vi.resetModules()
      const { getPopularSearches } = await import("@/lib/search/data")
      const result = await getPopularSearches()

      expect(result).toEqual([])
    })

    it("works when Redis is unavailable (env vars missing)", async () => {
      delete process.env.KV_REST_API_URL
      delete process.env.KV_REST_API_TOKEN

      const rpcData = [
        { label: "EVs", type: "fuel", count: 9, href: "/inventory?fuel=Electric", score: 0.9 },
      ]
      mockRpc.mockResolvedValueOnce({ data: rpcData, error: null })

      vi.resetModules()
      const { getPopularSearches } = await import("@/lib/search/data")
      const result = await getPopularSearches()

      expect(result).toEqual(rpcData)
      expect(mockRedisSet).not.toHaveBeenCalled()
    })
  })

  describe("invalidatePopularSearchCache", () => {
    it("deletes the Redis key", async () => {
      mockRedisDel.mockResolvedValueOnce(1)

      vi.resetModules()
      const { invalidatePopularSearchCache } = await import("@/lib/search/data")
      await invalidatePopularSearchCache()

      expect(mockRedisDel).toHaveBeenCalledWith("planet:popular_searches")
    })

    it("does not throw when Redis is unavailable", async () => {
      delete process.env.KV_REST_API_URL
      delete process.env.KV_REST_API_TOKEN

      vi.resetModules()
      const { invalidatePopularSearchCache } = await import("@/lib/search/data")
      await expect(invalidatePopularSearchCache()).resolves.toBeUndefined()
    })
  })
})
