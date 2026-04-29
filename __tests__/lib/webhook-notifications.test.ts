import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const createAutoRaptorLeadMock = vi.fn(async () => ({ success: true, leadId: "AR-1" }))
vi.mock("@/lib/autoraptor", () => ({
  createAutoRaptorLead: (args: unknown) => createAutoRaptorLeadMock(args),
}))

const sendMock = vi.fn(async () => ({ data: { id: "email-1" }, error: null }))
const ResendCtorMock = vi.fn(() => ({ emails: { send: sendMock } }))
vi.mock("resend", () => ({
  Resend: function (apiKey: string) {
    return ResendCtorMock(apiKey)
  },
}))

const ENV_KEYS = [
  "FROM_EMAIL",
  "ADMIN_EMAIL",
  "RESEND_API_KEY",
  "API_KEY_RESEND",
  "NEXT_PUBLIC_BASE_URL",
] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  createAutoRaptorLeadMock.mockClear()
  sendMock.mockClear()
  ResendCtorMock.mockClear()
  // Reset default success behaviour
  createAutoRaptorLeadMock.mockResolvedValue({ success: true, leadId: "AR-1" })
  sendMock.mockResolvedValue({ data: { id: "email-1" }, error: null })
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
  vi.restoreAllMocks()
})

const minimalSession = {
  id: "cs_test_123",
  metadata: {},
  customer_details: { email: "jane@example.com", name: "Jane Doe", phone: "555-0001" },
  amount_total: 25000,
  currency: "cad",
  customer_email: null,
}

const baseData = {
  customerEmail: "jane@example.com",
  customerName: "Jane Doe",
  customerPhone: "555-0001",
  vehicleId: "v1",
  vehicleName: "2024 Tesla Model 3",
  vehicleYear: 2024,
  vehicleMake: "Tesla",
  vehicleModel: "Model 3",
  amountCents: 25000,
  currency: "cad",
  stripeSessionId: "cs_test_123",
  isDeposit: true,
}

describe("extractNotificationData", () => {
  it("returns null when no email is present", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    expect(
      extractNotificationData({
        ...minimalSession,
        customer_details: { email: null, name: null, phone: null },
        customer_email: null,
      } as never),
    ).toBeNull()
  })

  it("extracts data from a vehicle-reservation session", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      metadata: {
        type: "vehicle-reservation",
        vehicleId: "v1",
        vehicleName: "Tesla M3",
        vehicleYear: "2024",
        vehicleMake: "Tesla",
        vehicleModel: "Model 3",
      },
    } as never)
    expect(data).not.toBeNull()
    expect(data?.isDeposit).toBe(true)
    expect(data?.vehicleName).toBe("Tesla M3")
    expect(data?.vehicleYear).toBe(2024)
    expect(data?.customerEmail).toBe("jane@example.com")
  })

  it("uses customer_email when customer_details.email is absent", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      customer_details: { email: null, name: null, phone: null },
      customer_email: "fallback@example.com",
    } as never)
    expect(data?.customerEmail).toBe("fallback@example.com")
    expect(data?.customerName).toBe("fallback")
  })

  it("derives customerName from email when no name available", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      customer_details: { email: "abc@x.com", name: null, phone: null },
      metadata: {},
    } as never)
    expect(data?.customerName).toBe("abc")
  })

  it("uses 'Customer' fallback when no name and no email-prefix derivable", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      customer_details: { email: "@x.com", name: null, phone: null },
      metadata: {},
    } as never)
    expect(data?.customerName).toBe("Customer")
  })

  it("treats depositOnly metadata as deposit", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      metadata: { depositOnly: "true" },
    } as never)
    expect(data?.isDeposit).toBe(true)
  })

  it("non-reservation, non-depositOnly is full payment", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      metadata: { type: "checkout" },
    } as never)
    expect(data?.isDeposit).toBe(false)
  })

  it("falls back to 'Vehicle <stockNumber>' name when metadata.vehicleName is absent", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      metadata: { stockNumber: "S42" },
    } as never)
    expect(data?.vehicleName).toBe("Vehicle S42")
  })

  it("falls back to 'Vehicle <vehicleId>' when no stockNumber but vehicleId present", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      metadata: { vehicleId: "v99" },
    } as never)
    expect(data?.vehicleName).toBe("Vehicle v99")
  })

  it("uses 'N/A' when neither stockNumber nor vehicleId present", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      metadata: {},
    } as never)
    expect(data?.vehicleName).toBe("Vehicle N/A")
  })

  it("treats null amount_total as 0", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      amount_total: null,
    } as never)
    expect(data?.amountCents).toBe(0)
  })

  it("defaults currency to 'cad' when null", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      currency: null,
    } as never)
    expect(data?.currency).toBe("cad")
  })

  it("uses metadata.customerName when customer_details.name is null", async () => {
    const { extractNotificationData } = await import("@/lib/webhook-notifications")
    const data = extractNotificationData({
      ...minimalSession,
      customer_details: { email: "x@x.com", name: null, phone: null },
      metadata: { customerName: "Meta Name" },
    } as never)
    expect(data?.customerName).toBe("Meta Name")
  })
})

describe("sendPaymentNotifications", () => {
  it("sends nothing through Resend when neither API key is set", async () => {
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(createAutoRaptorLeadMock).toHaveBeenCalled()
    expect(ResendCtorMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it("sends customer + admin emails when RESEND_API_KEY is set", async () => {
    process.env.RESEND_API_KEY = "re_test"
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(createAutoRaptorLeadMock).toHaveBeenCalled()
    // Both customer and admin emails sent => 2 send() calls
    expect(sendMock).toHaveBeenCalledTimes(2)
    const recipients = sendMock.mock.calls.map(c => (c[0] as { to: string }).to)
    expect(recipients).toContain("jane@example.com")
    expect(recipients).toContain("toni@planetmotors.ca")
    infoSpy.mockRestore()
  })

  it("uses API_KEY_RESEND when set (alternate name)", async () => {
    process.env.API_KEY_RESEND = "re_alt"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(ResendCtorMock).toHaveBeenCalled()
    expect(sendMock).toHaveBeenCalledTimes(2)
  })

  it("respects custom FROM_EMAIL and ADMIN_EMAIL", async () => {
    process.env.RESEND_API_KEY = "re_test"
    process.env.FROM_EMAIL = "Custom <c@x.com>"
    process.env.ADMIN_EMAIL = "admin@custom.com"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    const customer = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "jane@example.com")
    const admin = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "admin@custom.com")
    expect(customer).toBeDefined()
    expect(admin).toBeDefined()
    if (!customer) throw new Error("customer email call missing")
    expect((customer[0] as { from: string }).from).toBe("Custom <c@x.com>")
  })

  it("logs successful AutoRaptor and email creation", async () => {
    process.env.RESEND_API_KEY = "re_test"
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/AutoRaptor lead created/))
    expect(infoSpy).toHaveBeenCalledWith(expect.stringMatching(/Order confirmation sent/))
  })

  it("logs warning when AutoRaptor returns failure", async () => {
    createAutoRaptorLeadMock.mockResolvedValueOnce({ success: false, error: "ADF down" })
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/AutoRaptor lead failed: ADF down/))
  })

  it("logs warning when Resend returns error for customer email", async () => {
    process.env.RESEND_API_KEY = "re_test"
    sendMock.mockResolvedValueOnce({ data: null, error: { name: "smtp" } })
    sendMock.mockResolvedValueOnce({ data: { id: "ok" }, error: null })
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/Customer email failed/))
  })

  it("logs warning when admin alert fails", async () => {
    process.env.RESEND_API_KEY = "re_test"
    sendMock.mockResolvedValueOnce({ data: { id: "ok" }, error: null })
    sendMock.mockResolvedValueOnce({ data: null, error: { name: "smtp" } })
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(warnSpy).toHaveBeenCalledWith(expect.stringMatching(/Admin alert failed/))
  })

  it("logs error when sub-task is rejected", async () => {
    process.env.RESEND_API_KEY = "re_test"
    sendMock.mockRejectedValueOnce(new Error("send threw"))
    sendMock.mockResolvedValueOnce({ data: { id: "ok" }, error: null })
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined)
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Customer email failed:/),
      expect.any(Error),
    )
  })

  it("body contains deposit message when isDeposit=true", async () => {
    process.env.RESEND_API_KEY = "re_test"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({ ...baseData, isDeposit: true })
    const customer = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "jane@example.com")
    if (!customer) throw new Error("customer email call missing")
    const html = (customer[0] as { html: string }).html
    expect(html).toMatch(/deposit is fully refundable/)
    expect(html).toMatch(/Refundable Deposit/)
  })

  it("body contains 'arrange delivery' when not deposit", async () => {
    process.env.RESEND_API_KEY = "re_test"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({ ...baseData, isDeposit: false })
    const customer = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "jane@example.com")
    if (!customer) throw new Error("customer email call missing")
    const html = (customer[0] as { html: string }).html
    expect(html).toMatch(/arrange delivery/)
  })

  it("admin alert includes phone block when phone is provided", async () => {
    process.env.RESEND_API_KEY = "re_test"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    const admin = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "toni@planetmotors.ca")
    if (!admin) throw new Error("admin email call missing")
    const html = (admin[0] as { html: string }).html
    expect(html).toMatch(/tel:555-0001/)
  })

  it("admin alert omits phone block when phone is missing", async () => {
    process.env.RESEND_API_KEY = "re_test"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications({ ...baseData, customerPhone: undefined })
    const admin = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "toni@planetmotors.ca")
    if (!admin) throw new Error("admin email call missing")
    const html = (admin[0] as { html: string }).html
    expect(html).not.toMatch(/tel:/)
  })

  it("uses NEXT_PUBLIC_BASE_URL in CTA links when set", async () => {
    process.env.RESEND_API_KEY = "re_test"
    process.env.NEXT_PUBLIC_BASE_URL = "https://staging.example.com"
    const { sendPaymentNotifications } = await import("@/lib/webhook-notifications")
    await sendPaymentNotifications(baseData)
    const customer = sendMock.mock.calls.find(c => (c[0] as { to: string }).to === "jane@example.com")
    if (!customer) throw new Error("customer email call missing")
    const html = (customer[0] as { html: string }).html
    expect(html).toMatch(/staging\.example\.com/)
  })
})
