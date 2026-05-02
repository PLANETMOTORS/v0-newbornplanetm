import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type Stripe from "stripe"

const sendMock = vi.fn()
const createAutoRaptorLeadMock = vi.fn()

class MockResend {
  emails = { send: sendMock }
}

vi.mock("resend", () => ({ Resend: MockResend }))

vi.mock("@/lib/autoraptor", () => ({
  createAutoRaptorLead: (...args: unknown[]) => createAutoRaptorLeadMock(...args),
}))

const ENV_KEYS = ["RESEND_API_KEY", "API_KEY_RESEND", "FROM_EMAIL", "ADMIN_EMAIL", "NEXT_PUBLIC_BASE_URL"] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  vi.clearAllMocks()
  vi.resetModules()
  sendMock.mockResolvedValue({ data: { id: "msg-1" }, error: null })
  createAutoRaptorLeadMock.mockResolvedValue({ success: true, leadId: "ar-1" })
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

function makeSession(overrides: Partial<Stripe.Checkout.Session> = {}): Stripe.Checkout.Session {
  return {
    id: "cs_test_1",
    customer_email: "buyer@example.com",
    customer_details: { email: "buyer@example.com", name: "Buyer Name", phone: "555-0001" },
    metadata: {
      vehicleId: "veh-1",
      vehicleName: "2024 RAV4",
      vehicleYear: "2024",
      vehicleMake: "Toyota",
      vehicleModel: "RAV4",
      depositOnly: "true",
      type: "vehicle-reservation",
      stockNumber: "AB123",
    },
    amount_total: 25000,
    currency: "cad",
    ...overrides,
  } as unknown as Stripe.Checkout.Session
}

describe("extractNotificationData", () => {
  it("extracts a complete record from a populated session", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData(makeSession())
    expect(data).toMatchObject({
      customerEmail: "buyer@example.com",
      customerName: "Buyer Name",
      customerPhone: "555-0001",
      vehicleName: "2024 RAV4",
      vehicleYear: 2024,
      vehicleMake: "Toyota",
      vehicleModel: "RAV4",
      amountCents: 25000,
      currency: "cad",
      isDeposit: true,
      stripeSessionId: "cs_test_1",
    })
  })

  it("returns null when there is no email", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData(makeSession({
      customer_email: null,
      customer_details: null,
    } as unknown as Partial<Stripe.Checkout.Session>))
    expect(data).toBeNull()
  })

  it("falls back to email-derived name when no customer name set", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData(makeSession({
      customer_details: { email: "anon@example.com" },
      metadata: {},
    } as unknown as Partial<Stripe.Checkout.Session>))
    expect(data?.customerName).toBe("anon")
  })

  it("derives vehicleName from stockNumber when missing", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData(makeSession({
      metadata: { stockNumber: "X-9", vehicleId: "veh-9" },
    } as unknown as Partial<Stripe.Checkout.Session>))
    expect(data?.vehicleName).toBe("Vehicle X-9")
  })

  it("flags non-deposit when no metadata flags set", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData(makeSession({
      metadata: { vehicleName: "Final Buy" },
    } as unknown as Partial<Stripe.Checkout.Session>))
    expect(data?.isDeposit).toBe(false)
  })
})

describe("sendPaymentNotifications", () => {
  it("sends customer + admin email and AutoRaptor lead when env configured", async () => {
    process.env.RESEND_API_KEY = "rk_test"
    process.env.ADMIN_EMAIL = "ops@planetmotors.ca"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({
      customerEmail: "x@y.com",
      customerName: "Jane",
      customerPhone: "555-1234",
      vehicleName: "2024 RAV4",
      amountCents: 25000,
      currency: "cad",
      stripeSessionId: "cs_1",
      isDeposit: true,
    })
    expect(createAutoRaptorLeadMock).toHaveBeenCalled()
    expect(sendMock).toHaveBeenCalledTimes(2)
    const customerCall = sendMock.mock.calls.find(([arg]) => arg.to === "x@y.com")
    expect(customerCall?.[0].subject).toContain("Refundable Deposit")
    expect(customerCall?.[0].html).toContain("Jane")
  })

  it("skips email send when Resend not configured", async () => {
    delete process.env.RESEND_API_KEY
    delete process.env.API_KEY_RESEND
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({
      customerEmail: "x@y.com",
      customerName: "Jane",
      vehicleName: "2024 RAV4",
      amountCents: 25000,
      currency: "cad",
      stripeSessionId: "cs_1",
      isDeposit: false,
    })
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("logs but does not throw when individual notifications fail", async () => {
    process.env.RESEND_API_KEY = "rk_test"
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "send fail" } })
    sendMock.mockResolvedValueOnce({ data: null, error: { message: "send fail" } })
    createAutoRaptorLeadMock.mockResolvedValueOnce({ success: false, error: "no api" })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await expect(
      sendPaymentNotifications({
        customerEmail: "x@y.com",
        customerName: "Jane",
        vehicleName: "v",
        amountCents: 100,
        currency: "cad",
        stripeSessionId: "cs_1",
        isDeposit: false,
      }),
    ).resolves.toBeUndefined()
    expect(warnSpy).toHaveBeenCalled()
    errSpy.mockRestore()
  })

  it("logs rejected promise results from allSettled", async () => {
    process.env.RESEND_API_KEY = "rk_test"
    createAutoRaptorLeadMock.mockRejectedValueOnce(new Error("CRM network down"))
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({
      customerEmail: "x@y.com",
      customerName: "Jane",
      vehicleName: "v",
      amountCents: 100,
      currency: "cad",
      stripeSessionId: "cs_reject",
      isDeposit: false,
    })
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("[webhook-notify] AutoRaptor CRM failed:"),
      expect.any(Error),
    )
    errSpy.mockRestore()
  })

  it("uses non-deposit verbiage when isDeposit=false", async () => {
    process.env.RESEND_API_KEY = "rk_test"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({
      customerEmail: "x@y.com",
      customerName: "Jane",
      vehicleName: "v",
      amountCents: 50000,
      currency: "cad",
      stripeSessionId: "cs_1",
      isDeposit: false,
    })
    const customerCall = sendMock.mock.calls.find(([arg]) => arg.to === "x@y.com")
    expect(customerCall?.[0].subject).toContain("Payment Confirmation")
    expect(customerCall?.[0].html).toContain("arrange delivery")
  })
})
