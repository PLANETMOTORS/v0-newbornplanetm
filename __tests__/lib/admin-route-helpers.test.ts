import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"

vi.mock("next/headers", () => ({
  headers: vi.fn(),
  cookies: vi.fn(() => ({ getAll: () => [] })),
}))

let currentUserEmail: string | null = "toni@planetmotors.ca"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    auth: {
      getUser: async () => ({
        data: { user: currentUserEmail ? { email: currentUserEmail } : null },
      }),
    },
  })),
}))

vi.mock("@/lib/admin", () => ({
  ADMIN_EMAILS: ["toni@planetmotors.ca", "ops@planetmotors.ca"],
}))

const { requireAdmin, parseJsonBody } = await import(
  "@/lib/security/admin-route-helpers"
)

function makeJsonRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  })
}

beforeEach(() => {
  currentUserEmail = "toni@planetmotors.ca"
})

describe("requireAdmin", () => {
  it("returns ok with email when user is in ADMIN_EMAILS", async () => {
    const result = await requireAdmin()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.email).toBe("toni@planetmotors.ca")
  })

  it("works for any allowed admin", async () => {
    currentUserEmail = "ops@planetmotors.ca"
    const result = await requireAdmin()
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.email).toBe("ops@planetmotors.ca")
  })

  it("returns 401 when no user", async () => {
    currentUserEmail = null
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
      const body = await result.response.json()
      expect(body.error).toBe("Unauthorized")
    }
  })

  it("returns 401 when user is not in ADMIN_EMAILS", async () => {
    currentUserEmail = "stranger@example.com"
    const result = await requireAdmin()
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })
})

describe("parseJsonBody", () => {
  const validator = (raw: unknown) => {
    if (!raw || typeof raw !== "object") {
      return { ok: false as const, error: "Body must be an object" }
    }
    const r = raw as Record<string, unknown>
    if (typeof r.name !== "string") {
      return { ok: false as const, error: "name is required" }
    }
    return { ok: true as const, body: { name: r.name } }
  }

  it("parses + validates a well-formed body", async () => {
    const req = makeJsonRequest({ name: "José" })
    const result = await parseJsonBody(req, validator)
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.body.name).toBe("José")
  })

  it("returns 400 on malformed JSON", async () => {
    const req = makeJsonRequest("not-json{")
    const result = await parseJsonBody(req, validator)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.error).toMatch(/JSON/)
    }
  })

  it("returns 400 with validator's error message on validation failure", async () => {
    const req = makeJsonRequest({ wrongShape: true })
    const result = await parseJsonBody(req, validator)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(400)
      const body = await result.response.json()
      expect(body.error).toBe("name is required")
    }
  })

  it("supports async validators", async () => {
    const asyncValidator = async (raw: unknown) => {
      await Promise.resolve()
      if (!raw || typeof raw !== "object") {
        return { ok: false as const, error: "obj required" }
      }
      return { ok: true as const, body: raw }
    }
    const req = makeJsonRequest({ a: 1 })
    const result = await parseJsonBody(req, asyncValidator)
    expect(result.ok).toBe(true)
  })

  it("propagates validator failure for non-object JSON body (e.g. number)", async () => {
    // 42 is valid JSON but our example validator requires an object.
    const req = makeJsonRequest(42)
    const result = await parseJsonBody(req, validator)
    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(body.error).toBe("Body must be an object")
    }
  })
})
