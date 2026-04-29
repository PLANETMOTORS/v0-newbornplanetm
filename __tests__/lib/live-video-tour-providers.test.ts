import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { LiveVideoTourBooking } from "@/types/liveVideoTour"

const ENV_KEYS = [
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "ZOOM_CLIENT_ID",
  "ZOOM_CLIENT_SECRET",
  "LIVE_VIDEO_TOUR_PROVIDER",
] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

const baseBooking: LiveVideoTourBooking = {
  id: "VT-1",
  vehicleId: "v-1",
  vehicleName: "2024 RAV4",
  customerName: "Jane Doe",
  customerEmail: "jane@example.com",
  customerPhone: "+1 (416) 555-0001",
  preferredTime: new Date("2099-01-01T15:00:00Z").toISOString(),
  timezone: "America/Toronto",
  provider: "google_meet",
  status: "requested",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}

describe("googleMeetProvider", () => {
  it("returns a confirmed mock meet link", async () => {
    const { googleMeetProvider } = await import("@/lib/liveVideoTour/providers/googleMeet")
    const result = await googleMeetProvider.createMeeting(baseBooking)
    expect(result.provider).toBe("google_meet")
    expect(result.status).toBe("confirmed")
    expect(result.joinUrl).toMatch(/^https:\/\/meet\.google\.com\/[a-z]{3}-[a-z]{4}-[a-z]{3}$/)
  })

  it("falls through to mock when Google credentials configured (placeholder mode)", async () => {
    process.env.GOOGLE_CLIENT_ID = "id"
    process.env.GOOGLE_CLIENT_SECRET = "secret"
    const { googleMeetProvider } = await import("@/lib/liveVideoTour/providers/googleMeet")
    const result = await googleMeetProvider.createMeeting(baseBooking)
    expect(result.status).toBe("confirmed")
    expect(result.joinUrl).toContain("meet.google.com/")
  })

  it("cancelMeeting resolves true", async () => {
    const { googleMeetProvider } = await import("@/lib/liveVideoTour/providers/googleMeet")
    const result = await googleMeetProvider.cancelMeeting?.("test-id")
    expect(result).toBe(true)
  })
})

describe("zoomProvider", () => {
  it("returns pending_link when credentials missing", async () => {
    const { zoomProvider } = await import("@/lib/liveVideoTour/providers/zoom")
    const r = await zoomProvider.createMeeting(baseBooking)
    expect(r.provider).toBe("zoom")
    expect(r.status).toBe("pending_link")
    expect(r.error).toMatch(/credentials/)
  })

  it("returns pending_link with Zoom credentials present (placeholder mode)", async () => {
    process.env.ZOOM_CLIENT_ID = "x"
    process.env.ZOOM_CLIENT_SECRET = "y"
    const { zoomProvider } = await import("@/lib/liveVideoTour/providers/zoom")
    const r = await zoomProvider.createMeeting(baseBooking)
    expect(r.status).toBe("pending_link")
  })
})

describe("whatsappProvider", () => {
  it("creates a wa.me deep link from the customer's phone digits", async () => {
    const { whatsappProvider } = await import("@/lib/liveVideoTour/providers/whatsapp")
    const r = await whatsappProvider.createMeeting(baseBooking)
    expect(r.provider).toBe("whatsapp")
    expect(r.status).toBe("confirmed")
    expect(r.joinUrl).toBe("https://wa.me/14165550001")
  })
})

describe("createMeetingForBooking router", () => {
  it("dispatches to google_meet by default", async () => {
    const { createMeetingForBooking } = await import("@/lib/liveVideoTour/providers")
    const r = await createMeetingForBooking({ ...baseBooking, provider: "google_meet" })
    expect(r.provider).toBe("google_meet")
    expect(r.status).toBe("confirmed")
  })

  it("dispatches to zoom when requested", async () => {
    const { createMeetingForBooking } = await import("@/lib/liveVideoTour/providers")
    const r = await createMeetingForBooking({ ...baseBooking, provider: "zoom" })
    expect(r.provider).toBe("zoom")
  })

  it("dispatches to whatsapp when requested", async () => {
    const { createMeetingForBooking } = await import("@/lib/liveVideoTour/providers")
    const r = await createMeetingForBooking({ ...baseBooking, provider: "whatsapp" })
    expect(r.provider).toBe("whatsapp")
    expect(r.joinUrl).toContain("wa.me")
  })

  it("returns failed status for unknown provider", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { createMeetingForBooking } = await import("@/lib/liveVideoTour/providers")
    const r = await createMeetingForBooking({ ...baseBooking, provider: "unknown" as never })
    expect(r.status).toBe("failed")
    expect(r.error).toContain("Unsupported")
    expect(errSpy).toHaveBeenCalled()
  })

  it("falls back to env-configured provider when booking.provider is undefined", async () => {
    process.env.LIVE_VIDEO_TOUR_PROVIDER = "zoom"
    const { createMeetingForBooking } = await import("@/lib/liveVideoTour/providers")
    const r = await createMeetingForBooking({ ...baseBooking, provider: undefined as never })
    expect(r.provider).toBe("zoom")
  })
})
