import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let mockAuthError: unknown = null
vi.mock("@/lib/api/auth-helpers", () => ({
  getAuthenticatedAdmin: vi.fn(async () => {
    if (mockAuthError) return { error: mockAuthError, user: null }
    return { error: null, user: { email: "admin@planetmotors.ca" } }
  }),
}))

const mockReplicateRun = vi.fn()
vi.mock("replicate", () => {
  const ReplicateClass = vi.fn().mockImplementation(() => ({ run: mockReplicateRun }))
  return { default: ReplicateClass, __esModule: true }
})

// Mock global fetch for video download
const originalFetch = globalThis.fetch
const mockFetchFn = vi.fn()

vi.mock("@vercel/blob", () => ({
  put: vi.fn(async () => ({ url: "https://blob.vercel-storage.com/video.mp4" })),
}))

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/ai-video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthError = null
  process.env.REPLICATE_API_TOKEN = "test-token"
  // Mock global fetch for downloading the video from Replicate URL
  globalThis.fetch = mockFetchFn as unknown as typeof fetch
  mockFetchFn.mockResolvedValue({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(100),
  })
})

afterAll(() => {
  globalThis.fetch = originalFetch
})

import { afterAll } from "vitest"

describe("POST /api/v1/admin/ai-video", () => {
  it("returns 401 when not authenticated", async () => {
    const { NextResponse } = await import("next/server")
    mockAuthError = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-video/route")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(401)
  })

  it("returns 503 when REPLICATE_API_TOKEN is not set", async () => {
    delete process.env.REPLICATE_API_TOKEN
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-video/route")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(503)
  })

  it("returns 400 when imageUrl is missing", async () => {
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-video/route")
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns 500 when Replicate succeeds but video download fails", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/video.mp4")
    mockFetchFn.mockResolvedValueOnce({ ok: false, status: 404 })
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-video/route")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(500)
  })

  it("returns 500 when Replicate throws", async () => {
    mockReplicateRun.mockRejectedValueOnce(new Error("GPU error"))
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-video/route")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(500)
  })
})
