import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest, NextResponse } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockAuthResult: { error: unknown; user: unknown }
vi.mock("@/lib/api/auth-helpers", () => ({
  getAuthenticatedAdmin: vi.fn(async () => mockAuthResult),
}))

const mockReplicateRun = vi.fn()
vi.mock("replicate", () => ({
  default: class MockReplicate {
    run = (...args: unknown[]) => mockReplicateRun(...args)
  },
  __esModule: true,
}))

const mockBlobPut = vi.fn(async () => ({ url: "https://blob.vercel-storage.com/video.mp4" }))
vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockBlobPut(...args),
}))

const mockFetchFn = vi.fn()

const { POST } = await import("@/app/api/v1/admin/ai-video/route")

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/ai-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthResult = { error: null, user: { email: "admin@planetmotors.ca" } }
  process.env.REPLICATE_API_TOKEN = "test-token"
  globalThis.fetch = mockFetchFn as unknown as typeof fetch
  mockFetchFn.mockResolvedValue({ ok: true, arrayBuffer: async () => new ArrayBuffer(100) })
})

describe("POST /api/v1/admin/ai-video", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthResult = { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(401)
  })

  it("returns 503 when REPLICATE_API_TOKEN is not set", async () => {
    delete process.env.REPLICATE_API_TOKEN
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(503)
  })

  it("returns 400 when imageUrl is missing", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("generates video and stores to blob on success", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/video.mp4")
    const res = await POST(makeRequest({
      imageUrl: "https://img.com/photo.jpg",
      vehicleId: "v-1",
      vehicleName: "2023 Tesla Model 3",
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.videoUrl).toBe("https://blob.vercel-storage.com/video.mp4")
    expect(body.duration).toBe(5)
    expect(body.vehicle).toBe("2023 Tesla Model 3")
    expect(mockBlobPut).toHaveBeenCalled()
  })

  it("uses default prompt when none provided", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/video.mp4")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.prompt).toContain("cinematic")
  })

  it("uses custom prompt when provided", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/video.mp4")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg", prompt: "Drone flyover" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.prompt).toBe("Drone flyover")
  })

  it("handles Replicate output as object with url property", async () => {
    mockReplicateRun.mockResolvedValueOnce({ url: "https://replicate.delivery/video.mp4" })
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(200)
  })

  it("returns 500 when video download fails", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/video.mp4")
    mockFetchFn.mockResolvedValueOnce({ ok: false, status: 404 })
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(500)
  })

  it("returns 500 when Replicate throws", async () => {
    mockReplicateRun.mockRejectedValueOnce(new Error("GPU error"))
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("GPU error")
  })
})
