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

const mockGenerateText = vi.fn()
vi.mock("ai", () => ({ generateText: (...args: unknown[]) => mockGenerateText(...args) }))
vi.mock("@ai-sdk/gateway", () => ({ gateway: vi.fn(() => "mock-model") }))

const { POST } = await import("@/app/api/v1/admin/ai-seo/route")

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
  mockAuthResult = { error: null, user: { email: "admin@planetmotors.ca" } }
})

describe("POST /api/v1/admin/ai-seo", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthResult = { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when vehicle is missing (single mode)", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it("returns 400 when batch mode has empty vehicles array", async () => {
    const res = await POST(makeRequest({ mode: "batch", vehicles: [] }))
    expect(res.status).toBe(400)
  })

  it("returns parsed SEO data on success (single mode)", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: SEO_JSON })
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.seo.metaTitle).toContain("Tesla Model 3")
    expect(body.vehicle).toBe("2023 Tesla Model 3")
  })

  it("includes vehicle details in prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: SEO_JSON })
    const detailedVehicle = {
      ...SAMPLE_VEHICLE, body_style: "Sedan", mileage: 25000, price: 39900,
      fuel_type: "Electric", exterior_color: "White", drivetrain: "AWD",
      ev_battery_health_percent: 96,
    }
    await POST(makeRequest({ vehicle: detailedVehicle }))
    const callArgs = mockGenerateText.mock.calls[0][0]
    expect(callArgs.prompt).toContain("Body: Sedan")
    expect(callArgs.prompt).toContain("25,000 km")
    expect(callArgs.prompt).toContain("Electric Vehicle")
  })

  it("handles unparseable AI response gracefully", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "NOT VALID JSON {{{" })
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.seo).toBeNull()
    expect(body.error).toContain("Failed to parse")
  })

  it("strips markdown code fences from AI response", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "```json\n" + SEO_JSON + "\n```" })
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    const body = await res.json()
    expect(body.seo).not.toBeNull()
    expect(body.seo.metaTitle).toBeDefined()
  })

  it("supports batch mode with multiple vehicles", async () => {
    mockGenerateText
      .mockResolvedValueOnce({ text: SEO_JSON })
      .mockResolvedValueOnce({ text: SEO_JSON })
    const res = await POST(makeRequest({
      mode: "batch",
      vehicles: [SAMPLE_VEHICLE, { ...SAMPLE_VEHICLE, id: "v2", make: "BMW", model: "i4" }],
    }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toHaveLength(2)
    expect(body.processed).toBe(2)
  })

  it("caps batch at 20 vehicles", async () => {
    const vehicles = Array.from({ length: 25 }, (_, i) => ({ ...SAMPLE_VEHICLE, id: `v${i}` }))
    for (let i = 0; i < 20; i++) mockGenerateText.mockResolvedValueOnce({ text: SEO_JSON })
    const res = await POST(makeRequest({ mode: "batch", vehicles }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.results).toHaveLength(20)
    expect(mockGenerateText).toHaveBeenCalledTimes(20)
  })

  it("returns 500 on thrown error", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("quota"))
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(500)
  })
})
