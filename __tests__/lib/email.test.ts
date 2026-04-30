import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// Capture every email send for assertion
type SentEmail = { from: string; to: string; subject: string; html: string }
const sentEmails: SentEmail[] = []
let emailsSendImpl: (args: Omit<SentEmail, never>) => Promise<{ data?: unknown; error?: unknown }> = async (args) => {
  sentEmails.push(args)
  return { data: { id: "mock-id" }, error: null }
}

vi.mock("resend", () => {
  class ResendMock {
    emails = {
      send: vi.fn(async (args: SentEmail) => emailsSendImpl(args)),
    }
    constructor(_key: string) {
      void _key
    }
  }
  return { Resend: ResendMock }
})

const ENV_KEYS = [
  "API_KEY_RESEND",
  "RESEND_API_KEY",
  "ADMIN_EMAIL",
  "FROM_EMAIL",
  "NEXT_PUBLIC_BASE_URL",
] as const
const original: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>> = {}

beforeEach(() => {
  for (const k of ENV_KEYS) original[k] = process.env[k]
  for (const k of ENV_KEYS) delete process.env[k]
  sentEmails.length = 0
  emailsSendImpl = async (args) => {
    sentEmails.push(args)
    return { data: { id: "mock-id" }, error: null }
  }
  vi.resetModules()
})

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (original[k] === undefined) delete process.env[k]
    else process.env[k] = original[k]
  }
})

describe("lib/email escapeHtml", () => {
  it("escapes the standard HTML metacharacters", async () => {
    const { escapeHtml } = await import("@/lib/email")
    expect(escapeHtml(`<a href="x" onclick='alert(1)'>&</a>`)).toBe(
      "&lt;a href=&quot;x&quot; onclick=&#39;alert(1)&#39;&gt;&amp;&lt;/a&gt;",
    )
  })

  it("returns the original string when there are no metacharacters", async () => {
    const { escapeHtml } = await import("@/lib/email")
    expect(escapeHtml("Hello world")).toBe("Hello world")
  })
})

describe("lib/email sendNotificationEmail — credential gate", () => {
  it("returns success=false with explanatory error when no API key is set", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    const out = await sendNotificationEmail({
      type: "finance_application",
      customerName: "X",
      customerEmail: "x@example.com",
    })
    expect(out.success).toBe(false)
    expect(out.error).toMatch(/missing RESEND_API_KEY/)
    expect(sentEmails).toHaveLength(0)
  })

  it("accepts API_KEY_RESEND as the canonical env var", async () => {
    process.env.API_KEY_RESEND = "key-A"
    const { sendNotificationEmail } = await import("@/lib/email")
    const out = await sendNotificationEmail({
      type: "finance_application",
      customerName: "Alice",
      customerEmail: "alice@example.com",
    })
    expect(out.success).toBe(true)
    expect(sentEmails).toHaveLength(1)
  })

  it("falls back to RESEND_API_KEY when API_KEY_RESEND is unset", async () => {
    process.env.RESEND_API_KEY = "key-B"
    const { sendNotificationEmail } = await import("@/lib/email")
    const out = await sendNotificationEmail({
      type: "trade_in_quote",
      customerName: "B",
      customerEmail: "b@example.com",
    })
    expect(out.success).toBe(true)
  })
})

describe("lib/email sendNotificationEmail — routing & all template branches", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key"
  })

  it("routes verification_code emails to the customer (NOT admin)", async () => {
    process.env.ADMIN_EMAIL = "admin@x.com"
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "verification_code",
      customerName: "Alice",
      customerEmail: "alice@example.com",
      additionalData: { code: "123456", purpose: "log in", expiresIn: "5 minutes" },
    })
    expect(sentEmails[0].to).toBe("alice@example.com")
    expect(sentEmails[0].html).toContain("123456")
    expect(sentEmails[0].html).toContain("log in")
    expect(sentEmails[0].html).toContain("5 minutes")
  })

  it("routes all other notification types to ADMIN_EMAIL", async () => {
    process.env.ADMIN_EMAIL = "admin@example.com"
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "finance_application",
      customerName: "Bob",
      customerEmail: "bob@example.com",
    })
    expect(sentEmails[0].to).toBe("admin@example.com")
  })

  it("falls back to the default admin email when ADMIN_EMAIL is unset", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "finance_application",
      customerName: "X",
      customerEmail: "x@example.com",
    })
    expect(sentEmails[0].to).toBe("toni@planetmotors.ca")
  })

  it("uses the custom FROM_EMAIL when provided", async () => {
    process.env.FROM_EMAIL = "Custom <c@example.com>"
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "finance_application",
      customerName: "X",
      customerEmail: "x@example.com",
    })
    expect(sentEmails[0].from).toBe("Custom <c@example.com>")
  })

  it("renders trade_in_quote with all customer fields", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "trade_in_quote",
      customerName: "Trade-In <Joe>",
      customerEmail: "joe@example.com",
      customerPhone: "555-0100",
      vehicleInfo: "2020 Tesla Model 3",
      quoteId: "Q-123",
    })
    const html = sentEmails[0].html
    expect(html).toContain("Trade-In &lt;Joe&gt;") // escaped
    expect(html).toContain("555-0100")
    expect(html).toContain("2020 Tesla Model 3")
    expect(html).toContain("Q-123")
    expect(sentEmails[0].subject).toContain("Trade-In Quote")
  })

  it("renders ico_accepted with formatted offer amount", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "ico_accepted",
      customerName: "Owner",
      customerEmail: "owner@example.com",
      tradeInValue: 12345,
    })
    expect(sentEmails[0].subject).toContain("$12,345")
    expect(sentEmails[0].html).toContain("$12,345")
  })

  it("renders vehicle_inquiry with optional message", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "vehicle_inquiry",
      customerName: "Q",
      customerEmail: "q@example.com",
      vehicleInfo: "2024 Tesla",
      additionalData: { message: "Is it certified?" },
    })
    expect(sentEmails[0].html).toContain("Is it certified?")
  })

  it("renders vehicle_inquiry with phone and vehicleInfo provided (truthy branches)", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "vehicle_inquiry",
      customerName: "Full",
      customerEmail: "full@example.com",
      customerPhone: "416-555-0100",
      vehicleInfo: "2024 Tesla Model Y",
      additionalData: { message: "Is this certified?" },
    })
    const html = sentEmails[0].html
    expect(html).toContain("416-555-0100")
    expect(html).toContain("2024 Tesla Model Y")
    expect(html).toContain("Is this certified?")
  })

  it("renders vehicle_inquiry WITHOUT a message row when additionalData.message is missing", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "vehicle_inquiry",
      customerName: "Q",
      customerEmail: "q@example.com",
      vehicleInfo: "2024 Tesla",
    })
    expect(sentEmails[0].html).not.toContain("<strong>Message:</strong>")
  })

  it("renders test_drive_request with optional preferredDate", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "test_drive_request",
      customerName: "T",
      customerEmail: "t@example.com",
      vehicleInfo: "Civic",
      additionalData: { preferredDate: "2026-05-01 14:00" },
    })
    expect(sentEmails[0].html).toContain("2026-05-01 14:00")
  })

  it("renders test_drive_request with phone and vehicleInfo provided (truthy branches)", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "test_drive_request",
      customerName: "Full",
      customerEmail: "full@example.com",
      customerPhone: "647-555-0200",
      vehicleInfo: "2024 Tesla Model 3",
      additionalData: { preferredDate: "2026-06-01 10:00" },
    })
    const html = sentEmails[0].html
    expect(html).toContain("647-555-0200")
    expect(html).toContain("2024 Tesla Model 3")
    expect(html).toContain("2026-06-01 10:00")
  })

  it("renders test_drive_request WITHOUT preferredDate row when missing", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "test_drive_request",
      customerName: "T",
      customerEmail: "t@example.com",
      vehicleInfo: "Civic",
    })
    expect(sentEmails[0].html).not.toContain("Preferred Date")
  })

  it("renders document_uploaded with documentCount fallback to 1", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "document_uploaded",
      customerName: "D",
      customerEmail: "d@example.com",
      applicationId: "APP-1",
    })
    expect(sentEmails[0].html).toContain("1 file(s)")

    sentEmails.length = 0
    await sendNotificationEmail({
      type: "document_uploaded",
      customerName: "D",
      customerEmail: "d@example.com",
      applicationId: "APP-1",
      additionalData: { documentCount: 5 },
    })
    expect(sentEmails[0].html).toContain("5 file(s)")
  })

  it("renders application_status_changed with optional notes", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "application_status_changed",
      customerName: "S",
      customerEmail: "s@example.com",
      applicationId: "APP-9",
      additionalData: { newStatus: "approved", notes: "Stips OK" },
    })
    const html = sentEmails[0].html
    expect(html).toContain("approved")
    expect(html).toContain("Stips OK")
  })

  it("renders application_status_changed with applicationId provided (truthy branch)", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "application_status_changed",
      customerName: "S",
      customerEmail: "s@example.com",
      applicationId: "APP-42",
      additionalData: { newStatus: "pending_review", notes: "Doc check" },
    })
    const html = sentEmails[0].html
    expect(html).toContain("APP-42")
    expect(html).toContain("pending_review")
    expect(html).toContain("Doc check")
  })

  it("renders application_status_changed WITHOUT notes row when missing", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "application_status_changed",
      customerName: "S",
      customerEmail: "s@example.com",
      applicationId: "APP-9",
      additionalData: { newStatus: "approved" },
    })
    expect(sentEmails[0].html).not.toContain("<strong>Notes:</strong>")
  })

  it("renders verification_code with default expiresIn fallback (10 minutes)", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "verification_code",
      customerName: "V",
      customerEmail: "v@example.com",
      additionalData: { code: "987654" },
    })
    expect(sentEmails[0].html).toContain("10 minutes")
  })

  it("falls back to N/A for missing optional fields", async () => {
    const { sendNotificationEmail } = await import("@/lib/email")
    await sendNotificationEmail({
      type: "finance_application",
      customerName: "Bare",
      customerEmail: "bare@example.com",
    })
    const html = sentEmails[0].html
    expect(html).toContain("N/A")
  })
})

describe("lib/email sendNotificationEmail — error paths", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key"
  })

  it("returns success=false with serialised error when Resend returns an error", async () => {
    emailsSendImpl = async () => ({ error: { code: "rate_limited", message: "slow down" } })
    const { sendNotificationEmail } = await import("@/lib/email")
    const out = await sendNotificationEmail({
      type: "finance_application",
      customerName: "X",
      customerEmail: "x@example.com",
    })
    expect(out.success).toBe(false)
    expect(out.error).toContain("rate_limited")
  })

  it("returns success=false with the thrown Error message", async () => {
    emailsSendImpl = async () => {
      throw new Error("network down")
    }
    const { sendNotificationEmail } = await import("@/lib/email")
    const out = await sendNotificationEmail({
      type: "finance_application",
      customerName: "X",
      customerEmail: "x@example.com",
    })
    expect(out.success).toBe(false)
    expect(out.error).toBe("network down")
  })

  it("returns 'Unknown error' for non-Error throwables", async () => {
    emailsSendImpl = async () => {
      throw "string-thrown" as unknown as Error
    }
    const { sendNotificationEmail } = await import("@/lib/email")
    const out = await sendNotificationEmail({
      type: "finance_application",
      customerName: "X",
      customerEmail: "x@example.com",
    })
    expect(out.success).toBe(false)
    expect(out.error).toBe("Unknown error")
  })
})

describe("lib/email sendCustomerConfirmationEmail", () => {
  beforeEach(() => {
    process.env.RESEND_API_KEY = "test-key"
  })

  it("returns 'Email not configured' when no API key is set", async () => {
    delete process.env.RESEND_API_KEY
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    const out = await sendCustomerConfirmationEmail("c@example.com", "finance_submitted", {
      customerName: "C",
    })
    expect(out.success).toBe(false)
    expect(out.error).toBe("Email not configured")
  })

  it("renders finance_submitted with referenceId + vehicleInfo when provided", async () => {
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    await sendCustomerConfirmationEmail("c@example.com", "finance_submitted", {
      customerName: "Carla",
      referenceId: "REF-1",
      vehicleInfo: "2024 Model Y",
    })
    expect(sentEmails[0].to).toBe("c@example.com")
    expect(sentEmails[0].html).toContain("REF-1")
    expect(sentEmails[0].html).toContain("2024 Model Y")
  })

  it("omits optional rows in finance_submitted when fields are missing", async () => {
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    await sendCustomerConfirmationEmail("c@example.com", "finance_submitted", {
      customerName: "Carla",
    })
    expect(sentEmails[0].html).not.toContain("Reference:")
    expect(sentEmails[0].html).not.toContain("Vehicle:")
  })

  it("renders trade_in_submitted with optional vehicleInfo", async () => {
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    await sendCustomerConfirmationEmail("c@example.com", "trade_in_submitted", {
      customerName: "T",
      vehicleInfo: "2018 Civic",
    })
    expect(sentEmails[0].html).toContain("2018 Civic")
  })

  it("renders trade_in_submitted WITHOUT vehicleInfo row when missing", async () => {
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    await sendCustomerConfirmationEmail("c@example.com", "trade_in_submitted", {
      customerName: "T",
    })
    expect(sentEmails[0].html).not.toContain("Your Vehicle:")
  })

  it("renders ico_confirmed with offer amount when provided", async () => {
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    await sendCustomerConfirmationEmail("c@example.com", "ico_confirmed", {
      customerName: "Owner",
      offerAmount: 17500,
      vehicleInfo: "2019 Mazda 3",
    })
    expect(sentEmails[0].html).toContain("$17,500")
    expect(sentEmails[0].html).toContain("2019 Mazda 3")
  })

  it("renders ico_confirmed with N/A when offerAmount is null/undefined", async () => {
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    await sendCustomerConfirmationEmail("c@example.com", "ico_confirmed", {
      customerName: "Owner",
    })
    expect(sentEmails[0].html).toContain("N/A")
  })

  it("returns success=false with .message when Resend reports an error object", async () => {
    emailsSendImpl = async () => ({ error: { message: "domain not verified" } })
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    const out = await sendCustomerConfirmationEmail("c@example.com", "finance_submitted", {
      customerName: "Carla",
    })
    expect(out.success).toBe(false)
    expect(out.error).toBe("domain not verified")
  })

  it("captures thrown Error messages", async () => {
    emailsSendImpl = async () => {
      throw new Error("smtp boom")
    }
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    const out = await sendCustomerConfirmationEmail("c@example.com", "finance_submitted", {
      customerName: "Carla",
    })
    expect(out.success).toBe(false)
    expect(out.error).toBe("smtp boom")
  })

  it("handles non-Error throwables", async () => {
    emailsSendImpl = async () => {
      throw "weird" as unknown as Error
    }
    const { sendCustomerConfirmationEmail } = await import("@/lib/email")
    const out = await sendCustomerConfirmationEmail("c@example.com", "finance_submitted", {
      customerName: "Carla",
    })
    expect(out.error).toBe("Unknown error")
  })
})
