/**
 * Verifies that POST /api/v1/reservations forwards every successful
 * reservation to AutoRaptor (ADF/XML) so the dealer's CRM has parity
 * with the customer-facing flow.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

const createReservationMock = vi.fn()
vi.mock("@/app/actions/reservation", () => ({
  createReservation: (...args: unknown[]) => createReservationMock(...args),
}))

vi.mock("@/lib/meta-capi-helpers", () => ({
  trackInitiateCheckout: vi.fn(),
}))

const forwardLeadToAutoRaptorMock = vi.fn()
vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: (...args: unknown[]) =>
    forwardLeadToAutoRaptorMock(...args),
}))

const VALID_BODY = {
  vehicleId: "vehicle-uuid-1",
  stockNumber: "P12345",
  customerEmail: "buyer@example.com",
  customerPhone: "+14165557777",
  customerName: "Sara Lee",
}

beforeEach(() => {
  vi.clearAllMocks()
  createReservationMock.mockResolvedValue({
    reservationId: "res-789",
    sessionId: "sess-abc",
  })
  forwardLeadToAutoRaptorMock.mockResolvedValue({
    ok: true,
    status: "sent",
    messageId: "msg-1",
  })
})

function makeReq(body: unknown = VALID_BODY) {
  return new Request("http://localhost/api/v1/reservations", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as import("next/server").NextRequest
}

describe("POST /api/v1/reservations — AutoRaptor ADF forwarding", () => {
  it("forwards a successful reservation to AutoRaptor with deposit context", async () => {
    const { POST } = await import("@/app/api/v1/reservations/route")
    const res = await POST(makeReq())
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 10))
    expect(forwardLeadToAutoRaptorMock).toHaveBeenCalledTimes(1)
    const prospect = forwardLeadToAutoRaptorMock.mock.calls[0][0]
    expect(prospect.id).toBe("res-789")
    expect(prospect.customer.email).toBe("buyer@example.com")
    expect(prospect.customer.firstName).toBe("Sara")
    expect(prospect.customer.lastName).toBe("Lee")
    expect(prospect.source).toBe("Reservation Deposit")
    expect(prospect.comments).toContain("$250")
  })

  it("falls back to synthetic id when reservation has no id", async () => {
    createReservationMock.mockResolvedValueOnce({ reservationId: undefined })
    const { POST } = await import("@/app/api/v1/reservations/route")
    await POST(makeReq())
    await new Promise((r) => setTimeout(r, 10))
    const prospect = forwardLeadToAutoRaptorMock.mock.calls[0][0]
    expect(prospect.id).toMatch(/^res-/)
  })

  it("does not forward on conflict errors (vehicle already reserved)", async () => {
    createReservationMock.mockResolvedValueOnce({
      error: "Vehicle already has an active reservation",
    })
    const { POST } = await import("@/app/api/v1/reservations/route")
    const res = await POST(makeReq())
    expect(res.status).toBe(409)
    await new Promise((r) => setTimeout(r, 10))
    expect(forwardLeadToAutoRaptorMock).not.toHaveBeenCalled()
  })

  it("does not forward on 400 validation failures", async () => {
    const { POST } = await import("@/app/api/v1/reservations/route")
    const res = await POST(makeReq({ vehicleId: "v", stockNumber: "" }))
    expect(res.status).toBe(400)
    await new Promise((r) => setTimeout(r, 10))
    expect(forwardLeadToAutoRaptorMock).not.toHaveBeenCalled()
  })

  it("does not crash the response if forwarder rejects asynchronously", async () => {
    forwardLeadToAutoRaptorMock.mockRejectedValueOnce(new Error("autoraptor 500"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { POST } = await import("@/app/api/v1/reservations/route")
    const res = await POST(makeReq())
    expect(res.status).toBe(200)
    await new Promise((r) => setTimeout(r, 10))
    expect(errSpy).toHaveBeenCalledWith(
      "[reservations] ADF forward failed:",
      expect.any(Error),
    )
    errSpy.mockRestore()
  })
})
