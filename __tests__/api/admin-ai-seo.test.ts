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

const mockGenerateText = vi.fn()
vi.mock("ai", () => ({ generateText: (...args: unknown[]) => mockGenerateText(...args) }))
vi.mock("@ai-sdk/gateway", () => ({ gateway: vi.fn(() => "mock-model") }))

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/ai-seo", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const SEO_JSON = JSON.stringify({
  metaTitle: "2023 Tesla Model 3 | Planet Motors",
  metaDescription: "Shop certified pre-owned 2023 Tesla Model 3 with Aviloo battery certification.",
  ogTitle: "2023 Tesla Model 3 for Sale",
  ogDescription: "🔋 Certified pre-owned Tesla Model 3 — 96% battery health",
  keywords: ["tesla model 3", "electric vehicle", "planet motors"],
  structuredDataSnippet: "Certified 2023 Tesla Model 3 Long Range available at Planet Motors.",
})

const SAMPLE_VEHICLE = { id: "v1", year: 2023, make: "Tesla", model: "Model 3", trim: "LR", is_ev: true }

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthError = null
})

describe("POST /api/v1/admin/ai-seo", () => {
  it("returns 401 when not authenticated", async () => {
    const { NextResponse } = await import("next/server")
    mockAuthError = NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when vehicle is missing (single mode)", async () => {
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns parsed SEO data on success (single mode)", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: SEO_JSON })
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.seo.metaTitle).toContain("Tesla Model 3")
    expect(body.vehicle).toBe("2023 Tesla Model 3")
  })

  it("handles unparseable AI response gracefully", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "NOT VALID JSON {{{" })
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.seo).toBeNull()
    expect(body.error).toContain("Failed to parse")
  })

  it("strips markdown code fences from AI response", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "```json\n" + SEO_JSON + "\n```" })
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    const body = await res.json()
    expect(body.seo).not.toBeNull()
    expect(body.seo.metaTitle).toBeDefined()
  })

  it("supports batch mode", async () => {
    mockGenerateText
      .mockResolvedValueOnce({ text: SEO_JSON })
      .mockResolvedValueOnce({ text: SEO_JSON })
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({
      mode: "batch",
      vehicles: [SAMPLE_VEHICLE, { ...SAMPLE_VEHICLE, id: "v2", make: "BMW", model: "i4" }],
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toHaveLength(2)
    expect(body.processed).toBe(2)
  })

  it("returns 500 on thrown error", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("quota"))
    vi.resetModules()
    const { POST } = await import("@/app/api/v1/admin/ai-seo/route")
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(500)
  })
})
