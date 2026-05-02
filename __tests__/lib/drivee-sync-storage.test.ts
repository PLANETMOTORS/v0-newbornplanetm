import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import {
  resolveMidFromPirellyByStock,
  countFramesInStorage,
  countFramesOnFirebase,
  migrateFramesToSupabase,
} from "@/lib/drivee-sync"

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})
afterEach(() => {
  vi.restoreAllMocks()
})

/* ---------- resolveMidFromPirellyByStock ---------- */
describe("resolveMidFromPirellyByStock", () => {
  it("returns MID from iframe src", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iframeAttrs: { src: "https://example.com?mid=12345" } }),
    })
    expect(await resolveMidFromPirellyByStock("STK001")).toBe("12345")
  })

  it("returns null when API returns non-ok", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })
    expect(await resolveMidFromPirellyByStock("STK002")).toBeNull()
  })

  it("returns null when src has no mid param", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ iframeAttrs: { src: "https://example.com" } }),
    })
    expect(await resolveMidFromPirellyByStock("STK003")).toBeNull()
  })

  it("returns null on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("timeout"))
    expect(await resolveMidFromPirellyByStock("STK004")).toBeNull()
  })

  it("returns null when iframeAttrs missing", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    })
    expect(await resolveMidFromPirellyByStock("STK005")).toBeNull()
  })
})

/* ---------- countFramesInStorage ---------- */
describe("countFramesInStorage", () => {
  it("counts consecutive HEAD-200 frames", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })
    expect(await countFramesInStorage("99999")).toBe(3)
  })

  it("returns 0 when first frame is missing", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })
    expect(await countFramesInStorage("00000")).toBe(0)
  })

  it("stops on fetch error", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockRejectedValueOnce(new Error("DNS"))
    expect(await countFramesInStorage("11111")).toBe(1)
  })
})

/* ---------- countFramesOnFirebase ---------- */
describe("countFramesOnFirebase", () => {
  it("counts consecutive HEAD-200 frames", async () => {
    fetchMock
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: true })
      .mockResolvedValueOnce({ ok: false })
    expect(await countFramesOnFirebase("88888")).toBe(2)
  })

  it("returns 0 when no frames exist", async () => {
    fetchMock.mockResolvedValueOnce({ ok: false })
    expect(await countFramesOnFirebase("77777")).toBe(0)
  })

  it("stops on network error", async () => {
    fetchMock.mockRejectedValueOnce(new Error("timeout"))
    expect(await countFramesOnFirebase("66666")).toBe(0)
  })
})

/* ---------- migrateFramesToSupabase ---------- */
describe("migrateFramesToSupabase", () => {
  it("migrates frames from Firebase to Supabase in batches of 4", async () => {
    // 5 frames: first batch of 4 + second batch of 1
    fetchMock.mockImplementation(async (url: string, opts?: RequestInit) => {
      if (opts?.method === "POST") {
        return { ok: true }
      }
      // Firebase GET
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }
    })

    const result = await migrateFramesToSupabase("55555", 5, "test-key")
    expect(result).toBe(5)
    // 5 firebase fetches + 5 uploads = 10 calls
    expect(fetchMock).toHaveBeenCalledTimes(10)
  })

  it("skips frames that fail to download", async () => {
    let callCount = 0
    fetchMock.mockImplementation(async (url: string, opts?: RequestInit) => {
      callCount++
      if (opts?.method === "POST") return { ok: true }
      // First firebase GET fails
      if (callCount === 1) return { ok: false }
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }
    })

    const result = await migrateFramesToSupabase("44444", 2, "test-key")
    // Only the second frame succeeds (first download failed)
    expect(result).toBe(1)
  })

  it("handles upload failures gracefully", async () => {
    fetchMock.mockImplementation(async (_url: string, opts?: RequestInit) => {
      if (opts?.method === "POST") return { ok: false }
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(8) }
    })

    const result = await migrateFramesToSupabase("33333", 2, "test-key")
    expect(result).toBe(0)
  })

  it("catches and skips individual frame errors", async () => {
    fetchMock.mockImplementation(async () => {
      throw new Error("network error")
    })

    const result = await migrateFramesToSupabase("22222", 3, "test-key")
    expect(result).toBe(0)
  })

  it("returns 0 for 0 frames", async () => {
    const result = await migrateFramesToSupabase("11111", 0, "test-key")
    expect(result).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
