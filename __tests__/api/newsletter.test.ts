import { describe, it, expect, vi, beforeEach } from "vitest"

/* ---------- Mocks ---------- */

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: vi.fn(),
}))
vi.mock("resend", () => {
  const ResendMock = vi.fn()
  ResendMock.prototype.emails = {
    send: vi.fn().mockReturnValue(Promise.resolve({ id: "test" })),
  }
  return { Resend: ResendMock }
})
vi.mock("@/lib/validation/email", () => ({
  isEmailLike: vi.fn((email: string) => email.includes("@")),
}))
vi.mock("@/lib/redis", () => ({
  rateLimit: vi.fn().mockResolvedValue({ success: true }),
}))
vi.mock("@/lib/csrf", () => ({
  validateOrigin: vi.fn().mockReturnValue(true),
}))
vi.mock("@/lib/email", () => ({
  escapeHtml: vi.fn((s: string) => s),
}))
vi.mock("@/lib/adf/forwarder", () => ({
  forwardLeadToAutoRaptor: vi.fn().mockResolvedValue(undefined),
}))
vi.mock("@/lib/constants/dealership", () => ({
  PHONE_LOCAL: "905-555-1234",
  PHONE_TOLL_FREE: "1-800-555-1234",
}))

import { POST } from "@/app/api/v1/newsletter/route"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateOrigin } from "@/lib/csrf"
import { rateLimit } from "@/lib/redis"
import { forwardLeadToAutoRaptor } from "@/lib/adf/forwarder"
import { NextRequest } from "next/server"

function makeRequest(body: object) {
  const url = "https://planetmotors.ca/api/v1/newsletter"
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  })
}

const limitMock = vi.fn().mockResolvedValue([])
const insertMock = vi.fn().mockResolvedValue({ error: null })

function makeChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.limit = limitMock
  return chain
}

function makeAdminClient() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "leads") {
        return {
          ...makeChain(),
          insert: insertMock,
        }
      }
      return makeChain()
    }),
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  limitMock.mockResolvedValue({ data: [], error: null })
  insertMock.mockResolvedValue({ error: null })
  vi.mocked(createAdminClient).mockReturnValue(makeAdminClient() as never)
  vi.mocked(validateOrigin).mockReturnValue(true)
  vi.mocked(rateLimit).mockResolvedValue({ success: true, remaining: 9 } as never)
  process.env.API_KEY_RESEND = "re_test_key"
})

describe("POST /api/v1/newsletter", () => {
  it("returns 403 if origin is invalid", async () => {
    vi.mocked(validateOrigin).mockReturnValueOnce(false)
    const res = await POST(makeRequest({ email: "a@b.com" }))
    expect(res.status).toBe(403)
  })

  it("returns 429 on rate limit", async () => {
    vi.mocked(rateLimit).mockResolvedValueOnce({ success: false, remaining: 0 } as never)
    const res = await POST(makeRequest({ email: "a@b.com" }))
    expect(res.status).toBe(429)
  })

  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({ email: "" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ email: "nope" }))
    expect(res.status).toBe(400)
  })

  it("returns 400 for non-string email", async () => {
    const res = await POST(makeRequest({ email: 12345 }))
    expect(res.status).toBe(400)
  })

  it("returns success for already-subscribed", async () => {
    limitMock.mockResolvedValueOnce({ data: [{ id: 1 }], error: null })
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe("Already subscribed")
  })

  it("inserts new newsletter signup successfully", async () => {
    const res = await POST(makeRequest({ email: "new@test.com" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "newsletter",
        customer_email: "new@test.com",
        status: "new",
        priority: "low",
      }),
    )
  })

  it("returns 500 on insert error", async () => {
    insertMock.mockResolvedValueOnce({ error: { message: "DB error" } })
    const res = await POST(makeRequest({ email: "err@test.com" }))
    expect(res.status).toBe(500)
  })

  it("sends ADF to AutoRaptor on successful signup", async () => {
    await POST(makeRequest({ email: "user@test.com" }))
    expect(forwardLeadToAutoRaptor).toHaveBeenCalledWith(
      expect.objectContaining({
        source: "Newsletter Signup",
        customer: { email: "user@test.com" },
      }),
    )
  })

  it("handles case when Resend key is not set", async () => {
    delete process.env.API_KEY_RESEND
    delete process.env.RESEND_API_KEY
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(200)
  })

  it("lowercases and trims email", async () => {
    const res = await POST(makeRequest({ email: "  USER@Test.COM  " }))
    expect(res.status).toBe(200)
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer_email: "user@test.com" }),
    )
  })

  it("catches unexpected errors and returns 500", async () => {
    vi.mocked(createAdminClient).mockImplementationOnce(() => {
      throw new Error("unexpected")
    })
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(500)
  })

  it("derives customer_name from email local part", async () => {
    await POST(makeRequest({ email: "john.doe@example.com" }))
    expect(insertMock).toHaveBeenCalledWith(
      expect.objectContaining({ customer_name: "john.doe" }),
    )
  })
})
