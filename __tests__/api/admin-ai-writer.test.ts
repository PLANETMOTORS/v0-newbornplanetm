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

const { POST } = await import("@/app/api/v1/admin/ai-writer/route")

function makeRequest(body: Record<string, unknown>): NextRequest {
  return new NextRequest("http://localhost/api/v1/admin/ai-writer", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  })
}

const SAMPLE_VEHICLE = {
  id: "v1", year: 2023, make: "Tesla", model: "Model 3",
  trim: "Long Range", mileage: 15000, is_ev: true,
  battery_capacity_kwh: 75, ev_battery_health_percent: 96,
  exterior_color: "White", body_style: "Sedan",
}

beforeEach(() => {
  vi.clearAllMocks()
  mockAuthResult = { error: null, user: { email: "admin@planetmotors.ca" } }
})

describe("POST /api/v1/admin/ai-writer", () => {
  it("returns 401 when not authenticated", async () => {
    mockAuthResult = { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }), user: null }
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(401)
  })

  it("returns 400 when vehicle data is missing", async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Vehicle data required")
  })

  it("returns 400 for invalid contentType", async () => {
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE, contentType: "poem" }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.error).toContain("Invalid contentType")
  })

  it("generates listing content on success", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "A beautiful Tesla listing." })
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE, contentType: "listing" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.content).toBe("A beautiful Tesla listing.")
    expect(body.contentType).toBe("listing")
    expect(body.vehicle).toBe("2023 Tesla Model 3")
  })

  it("generates social media content", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "🚗 Check out this Tesla!" })
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE, contentType: "social" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contentType).toBe("social")
  })

  it("generates ad copy", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "Best Tesla Deal" })
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE, contentType: "ad" }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.contentType).toBe("ad")
  })

  it("passes custom prompt to the AI model", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "Custom output" })
    await POST(makeRequest({
      vehicle: SAMPLE_VEHICLE, contentType: "social",
      customPrompt: "Make it funny",
    }))
    expect(mockGenerateText).toHaveBeenCalledTimes(1)
    const callArgs = mockGenerateText.mock.calls[0][0]
    expect(callArgs.system).toContain("Make it funny")
  })

  it("returns 500 when AI SDK throws", async () => {
    mockGenerateText.mockRejectedValueOnce(new Error("API quota exceeded"))
    const res = await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.error).toBe("Failed to generate content")
  })

  it("includes EV info in prompt when vehicle is EV", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "EV listing" })
    await POST(makeRequest({ vehicle: SAMPLE_VEHICLE }))
    const callArgs = mockGenerateText.mock.calls[0][0]
    expect(callArgs.prompt).toContain("electric vehicle")
    expect(callArgs.prompt).toContain("Battery: 75 kWh")
  })

  it("includes non-EV vehicle details in prompt", async () => {
    mockGenerateText.mockResolvedValueOnce({ text: "Gas car listing" })
    const gasVehicle = { ...SAMPLE_VEHICLE, is_ev: false, battery_capacity_kwh: null, ev_battery_health_percent: null, engine: "2.0L Turbo", transmission: "Automatic", drivetrain: "AWD", fuel_type: "Gasoline", interior_color: "Black" }
    await POST(makeRequest({ vehicle: gasVehicle }))
    const callArgs = mockGenerateText.mock.calls[0][0]
    expect(callArgs.prompt).toContain("Engine: 2.0L Turbo")
    expect(callArgs.prompt).toContain("AWD")
  })
})
