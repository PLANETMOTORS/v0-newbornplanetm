import { describe, it, expect } from "vitest"
import {
  redactSentryEvent,
  redactSentryBreadcrumb,
  __testing,
} from "@/lib/security/sentry-redaction"

const { scrubString, scrubValue, REDACTED } = __testing

describe("scrubString", () => {
  it("redacts Stripe secret keys", () => {
    expect(scrubString("Authorization: sk_live_ABCDEFGHIJKLMNOP1234")).toBe(
      `Authorization: ${REDACTED}`
    )
    expect(scrubString("token=sk_test_abcdefghijklmnopqrst")).toBe(
      `token=${REDACTED}`
    )
  })

  it("redacts Stripe restricted + webhook keys", () => {
    expect(scrubString("rk_live_ABCDEFGHIJKLMNOP1234")).toBe(REDACTED)
    expect(scrubString("whsec_ABCDEFGHIJKLMNOP12345")).toBe(REDACTED)
  })

  it("redacts Resend API keys", () => {
    expect(scrubString("re_AbCdEfGhIjKlMnOp1234")).toBe(REDACTED)
  })

  it("redacts JWT-shaped tokens", () => {
    const jwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
    expect(scrubString(`Bearer ${jwt}`)).toContain(REDACTED)
  })

  it("redacts bearer tokens", () => {
    expect(scrubString("Bearer abcdefghijklmnopqrstuvwxyz1234")).toBe(REDACTED)
  })

  it("redacts credit-card-shaped digits", () => {
    expect(scrubString("card 4242 4242 4242 4242 cvv")).toContain(REDACTED)
    expect(scrubString("number 4242-4242-4242-4242")).toContain(REDACTED)
  })

  it("redacts SIN-shaped digits", () => {
    expect(scrubString("sin 123 456 789")).toContain(REDACTED)
    expect(scrubString("sin 123-456-789")).toContain(REDACTED)
  })

  it("redacts emails in free text", () => {
    expect(scrubString("contact john.doe+test@example.co.uk now")).toContain(
      REDACTED
    )
  })

  it("leaves benign strings untouched", () => {
    expect(scrubString("hello world")).toBe("hello world")
    expect(scrubString("pk_live_publishable_is_ok_xxxxxxxxxx")).toBe(
      "pk_live_publishable_is_ok_xxxxxxxxxx"
    )
  })
})

describe("scrubValue", () => {
  it("redacts sensitive keys regardless of value", () => {
    const out = scrubValue({
      email: "x@y.com",
      Authorization: "anything-here",
      apiKey: "abc",
      safe: "ok",
    })
    expect(out.email).toBe(REDACTED)
    expect(out.Authorization).toBe(REDACTED)
    expect(out.apiKey).toBe(REDACTED)
    expect(out.safe).toBe("ok")
  })

  it("recurses through arrays + objects", () => {
    const out = scrubValue({
      data: [{ password: "x" }, { ok: 1 }],
      meta: { dob: "2000-01-01" },
    })
    expect(out.data[0].password).toBe(REDACTED)
    expect(out.data[1].ok).toBe(1)
    expect(out.meta.dob).toBe(REDACTED)
  })

  it("breaks cycles with cycle marker", () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj
    const out = scrubValue(obj)
    expect(out.self).toBe("[REDACTED:cycle]")
  })

  it("caps recursion depth", () => {
    let nested: Record<string, unknown> = { leaf: "x" }
    for (let i = 0; i < 12; i++) {
      nested = { next: nested }
    }
    const out = scrubValue(nested)
    // Should hit the depth marker somewhere down the chain.
    expect(JSON.stringify(out)).toContain("[REDACTED:depth]")
  })

  it("returns null/undefined unchanged", () => {
    expect(scrubValue(null)).toBeNull()
    expect(scrubValue(undefined)).toBeUndefined()
  })

  it("returns numbers/booleans unchanged", () => {
    expect(scrubValue(42)).toBe(42)
    expect(scrubValue(true)).toBe(true)
  })
})

describe("redactSentryEvent / redactSentryBreadcrumb", () => {
  it("redacts an error-shaped event", () => {
    const event = {
      message: "Stripe key sk_live_ABCDEFGHIJKLMNOP1234 leaked",
      user: { email: "x@y.com" },
    }
    const out = redactSentryEvent(event)
    expect(out.message).toContain(REDACTED)
    expect(out.user.email).toBe(REDACTED)
  })

  it("redacts a breadcrumb", () => {
    const crumb = { category: "fetch", data: { Authorization: "Bearer xyz" } }
    const out = redactSentryBreadcrumb(crumb)
    expect(out.data.Authorization).toBe(REDACTED)
  })

  it("never throws — returns input on internal error", () => {
    // Force an error by passing a frozen impossible value (BigInt is fine,
    // but we can simulate by creating a getter that throws).
    const evil: Record<string, unknown> = {}
    Object.defineProperty(evil, "boom", {
      enumerable: true,
      get() {
        throw new Error("nope")
      },
    })
    // Should not throw — falls through the catch and returns input.
    expect(() => redactSentryEvent(evil)).not.toThrow()
  })
})
