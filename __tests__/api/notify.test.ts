import { describe, it, expect, vi, beforeEach } from "vitest"

/* ---------- Mocks ---------- */

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
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
vi.mock("@/lib/constants/dealership", () => ({
  PHONE_LOCAL: "905-555-1234",
}))

import { POST } from "@/app/api/v1/notify/route"
import { createClient } from "@/lib/supabase/server"
import { validateOrigin } from "@/lib/csrf"
import { rateLimit } from "@/lib/redis"
import { NextRequest } from "next/server"

function makeRequest(body: object, contentType = "application/json") {
  const url = "https://planetmotors.ca/api/v1/notify"
  return new NextRequest(url, {
    method: "POST",
    headers: { "content-type": contentType },
    body: JSON.stringify(body),
  })
}

const maybeSingleMock = vi.fn().mockResolvedValue({ data: null })
const insertMock = vi.fn().mockResolvedValue({ error: null })

function makeChain() {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {}
  chain.select = vi.fn().mockReturnValue(chain)
  chain.eq = vi.fn().mockReturnValue(chain)
  chain.is = vi.fn().mockReturnValue(chain)
  chain.maybeSingle = maybeSingleMock
  return chain
}

function makeSupabase() {
  return {
    from: vi.fn().mockImplementation((table: string) => {
      if (table === "price_alerts") {
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
  maybeSingleMock.mockResolvedValue({ data: null })
  insertMock.mockResolvedValue({ error: null })
  vi.mocked(createClient).mockResolvedValue(makeSupabase() as never)
  vi.mocked(validateOrigin).mockReturnValue(true)
  vi.mocked(rateLimit).mockResolvedValue({ success: true, remaining: 9 } as never)
  process.env.API_KEY_RESEND = "re_test_key"
})

describe("POST /api/v1/notify", () => {
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

  it("returns success for already-subscribed", async () => {
    maybeSingleMock.mockResolvedValueOnce({ data: { id: 1 } })
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe("Already subscribed")
  })

  it("inserts new signup successfully", async () => {
    const res = await POST(makeRequest({ email: "new@test.com", topic: "/cars/tesla" }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.success).toBe(true)
  })

  it("returns 500 on insert error", async () => {
    insertMock.mockResolvedValueOnce({ error: { message: "DB error" } })
    const res = await POST(makeRequest({ email: "err@test.com" }))
    expect(res.status).toBe(500)
  })

  it("handles topic parsing (make-model)", async () => {
    const res = await POST(makeRequest({ email: "user@test.com", topic: "/cars/bmw-x5" }))
    expect(res.status).toBe(200)
  })

  it("handles null topic gracefully", async () => {
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(200)
  })

  it("sends confirmation email when Resend key is set", async () => {
    const res = await POST(makeRequest({ email: "user@test.com", topic: "/cars/tesla" }))
    expect(res.status).toBe(200)
  })

  it("handles case when Resend key is not set", async () => {
    delete process.env.API_KEY_RESEND
    delete process.env.RESEND_API_KEY
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(200)
  })

  it("catches unexpected errors and returns 500", async () => {
    vi.mocked(createClient).mockRejectedValueOnce(new Error("unexpected"))
    const res = await POST(makeRequest({ email: "user@test.com" }))
    expect(res.status).toBe(500)
  })
})
