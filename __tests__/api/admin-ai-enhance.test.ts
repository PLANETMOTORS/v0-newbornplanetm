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

const mockBlobPut = vi.fn(async () => ({ url: "https://blob.vercel-storage.com/enhanced.jpg" }))
vi.mock("@vercel/blob", () => ({
  put: (...args: unknown[]) => mockBlobPut(...args),
}))

const mockSelectSingle = vi.fn(async () => ({ data: { image_urls: ["old.jpg"] }, error: null }))
const mockUpdateEq = vi.fn(async () => ({ error: null }))
vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({ eq: vi.fn(() => ({ single: mockSelectSingle })) })),
      update: vi.fn(() => ({ eq: mockUpdateEq })),
    })),
  })),
}))

// Mock global fetch for downloading enhanced images
const mockFetchFn = vi.fn()

const { POST } = await import("@/app/api/v1/admin/ai-enhance/route")

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/ai-enhance", {
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

describe("POST /api/v1/admin/ai-enhance", () => {
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
    const body = await res.json()
    expect(body.error).toContain("imageUrl is required")
  })

  it("returns enhanced URL on success (no save)", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/enhanced.jpg")
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg", scale: 4 }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.enhancedUrl).toBe("https://replicate.delivery/enhanced.jpg")
    expect(body.originalUrl).toBe("https://img.com/photo.jpg")
    expect(body.scale).toBe(4)
    expect(body.saved).toBe(false)
  })

  it("saves to blob and updates vehicle when saveToVehicle=true", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/enhanced.jpg")
    mockSelectSingle.mockResolvedValueOnce({ data: { image_urls: ["https://img.com/photo.jpg", "other.jpg"] }, error: null })
    const res = await POST(makeRequest({
      imageUrl: "https://img.com/photo.jpg", vehicleId: "v-123", saveToVehicle: true,
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.enhancedUrl).toBe("https://blob.vercel-storage.com/enhanced.jpg")
    expect(body.saved).toBe(true)
    expect(mockBlobPut).toHaveBeenCalled()
    expect(mockUpdateEq).toHaveBeenCalled()
  })

  it("handles non-string Replicate output", async () => {
    mockReplicateRun.mockResolvedValueOnce({ url: "https://replicate.delivery/out.jpg" })
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.enhancedUrl).toBeDefined()
  })

  it("returns 500 when Replicate throws", async () => {
    mockReplicateRun.mockRejectedValueOnce(new Error("GPU unavailable"))
    const res = await POST(makeRequest({ imageUrl: "https://img.com/photo.jpg" }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("GPU unavailable")
  })

  it("returns 500 when enhanced image download fails during save", async () => {
    mockReplicateRun.mockResolvedValueOnce("https://replicate.delivery/enhanced.jpg")
    mockFetchFn.mockResolvedValueOnce({ ok: false, status: 404 })
    const res = await POST(makeRequest({
      imageUrl: "https://img.com/photo.jpg", vehicleId: "v-123", saveToVehicle: true,
    }))
    expect(res.status).toBe(500)
    expect((await res.json()).error).toContain("download")
  })
})
