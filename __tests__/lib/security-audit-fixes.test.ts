/**
 * Coverage for the senior-security-engineer audit fixes.
 *
 * Each block locks one concrete behaviour from the audit:
 *   - C3a/C3b mass-assignment allow-list (admin reservation + lead PATCH)
 *   - R4    Sentry PII / secret redaction
 *   - R6    Security-headers builder is well-formed and partner-aware
 *   - R8    (covered indirectly via lib/supabase/middleware integration —
 *           Supabase mocks the response cookie store so we exercise the
 *           defaults from a unit-callable seam)
 *
 * No network calls, no Stripe SDK, no Supabase REST hits — every fixture
 * is in-memory.
 */

import { describe, expect, it } from "vitest"
import {
  adminLeadPatchSchema,
  adminReservationPatchSchema,
  parseAdminPatch,
  RESERVATION_STATUSES,
  DEPOSIT_STATUSES,
  LEAD_STATUSES,
} from "@/lib/security/admin-mutation-schemas"
import {
  __testing,
  redactSentryBreadcrumb,
  redactSentryEvent,
} from "@/lib/security/sentry-redaction"
import { applySecurityHeaders } from "@/lib/security/security-headers"

// ── C3a — admin reservation PATCH allow-list ──────────────────────────────

describe("admin reservation PATCH allow-list (C3a — mass-assignment)", () => {
  it("accepts only canonical admin-mutable fields", () => {
    const ok = parseAdminPatch(adminReservationPatchSchema, {
      status: "confirmed",
      deposit_status: "paid",
      internal_notes: "Verified payment, releasing vehicle",
      assigned_to: "11111111-2222-4333-8444-555566667777",
      expires_at: "2026-05-01T12:00:00.000Z",
    })
    expect(ok.ok).toBe(true)
  })

  it("rejects an attempt to overwrite customer_email", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      status: "confirmed",
      customer_email: "attacker@example.com",
    })
    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.issues.join("\n")).toMatch(/customer_email|unrecognized/i)
    }
  })

  it("rejects an attempt to rewrite vehicle_id (vehicle theft)", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      vehicle_id: "00000000-0000-4000-8000-000000000001",
    })
    expect(r.ok).toBe(false)
  })

  it("rejects an attempt to rewrite deposit_amount (financial mutation)", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      deposit_amount: 1,
    })
    expect(r.ok).toBe(false)
  })

  it("rejects unknown status values", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      status: "approved", // not a reservation status
    })
    expect(r.ok).toBe(false)
  })

  it("rejects unknown deposit_status values", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      deposit_status: "free",
    })
    expect(r.ok).toBe(false)
  })

  it("rejects non-UUID assigned_to", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      assigned_to: "not-a-uuid",
    })
    expect(r.ok).toBe(false)
  })

  it("accepts assigned_to=null (unassign)", () => {
    const r = parseAdminPatch(adminReservationPatchSchema, {
      assigned_to: null,
    })
    expect(r.ok).toBe(true)
  })

  it("locks the canonical status / deposit_status enums", () => {
    expect(RESERVATION_STATUSES).toEqual([
      "pending",
      "confirmed",
      "completed",
      "cancelled",
      "expired",
    ])
    expect(DEPOSIT_STATUSES).toEqual(["pending", "paid", "failed", "refunded"])
  })
})

// ── C3b — admin lead PATCH allow-list ──────────────────────────────────────

describe("admin lead PATCH allow-list (C3b — mass-assignment)", () => {
  it("accepts canonical admin-mutable fields", () => {
    const r = parseAdminPatch(adminLeadPatchSchema, {
      status: "qualified",
      assigned_to: "11111111-2222-4333-8444-555566667777",
      notes: "Spoke to customer; warm",
      internal_notes: "Cross-sell candidate for protection plan",
    })
    expect(r.ok).toBe(true)
  })

  it("rejects rewriting customer_email", () => {
    const r = parseAdminPatch(adminLeadPatchSchema, {
      customer_email: "attacker@example.com",
    })
    expect(r.ok).toBe(false)
  })

  it("rejects rewriting source", () => {
    const r = parseAdminPatch(adminLeadPatchSchema, { source: "spoof" })
    expect(r.ok).toBe(false)
  })

  it("rejects rewriting created_at (history rewrite)", () => {
    const r = parseAdminPatch(adminLeadPatchSchema, {
      created_at: "2020-01-01T00:00:00.000Z",
    })
    expect(r.ok).toBe(false)
  })

  it("locks the lead status enum", () => {
    expect(LEAD_STATUSES).toEqual([
      "new",
      "contacted",
      "qualified",
      "converted",
      "lost",
      "archived",
    ])
  })
})

// ── R4 — Sentry PII / secret redaction ─────────────────────────────────────

describe("Sentry redaction (R4 — PII / secret scrubbing)", () => {
  it("redacts sensitive object keys regardless of nesting", () => {
    const e = redactSentryEvent({
      user: {
        email: "tony@example.com",
        phone: "+14165550101",
        first_name: "Tony",
        dob: "1990-01-01",
      },
      payload: {
        password: "hunter2",
        access_token: "should-vanish",
      },
    })
    expect(e.user.email).toBe("[REDACTED]")
    expect(e.user.phone).toBe("[REDACTED]")
    expect(e.user.first_name).toBe("[REDACTED]")
    expect(e.user.dob).toBe("[REDACTED]")
    expect(e.payload.password).toBe("[REDACTED]")
    expect(e.payload.access_token).toBe("[REDACTED]")
  })

  it("redacts Stripe secret keys appearing in free-text breadcrumb messages", () => {
    // Built at runtime to avoid tripping GitHub's secret-scanning push
    // protection — the literal `sk_<live>_…` is recognised as a Stripe
    // API key shape even when the trailing chars are obvious filler.
    const fakeStripeSecret = ["sk", "live", "AbCdEfGhIjKlMnOpQrStUvWx"].join("_")
    const c = redactSentryBreadcrumb({
      message: `Calling stripe.charges.create with key ${fakeStripeSecret}`,
    })
    expect(c.message).toContain("[REDACTED]")
    expect(c.message).not.toContain(fakeStripeSecret)
  })

  it("redacts JWT-shaped tokens in arbitrary strings", () => {
    const e = redactSentryEvent({
      url: "Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.signature",
    })
    expect(e.url).toContain("[REDACTED]")
    expect(e.url).not.toContain("Bearer ")
  })

  it("redacts SIN-shaped sequences in unstructured text", () => {
    const e = redactSentryEvent({
      breadcrumb: "Lead notes: Customer SIN 123 456 789 captured for credit pull",
    })
    expect(e.breadcrumb).toContain("[REDACTED]")
    expect(e.breadcrumb).not.toContain("123 456 789")
  })

  it("redacts credit-card-shaped digit runs", () => {
    const e = redactSentryEvent({
      note: "Saw card 4111 1111 1111 1111 in console — should never happen",
    })
    expect(e.note).not.toContain("4111 1111 1111 1111")
  })

  it("redacts emails that appear in free-text payload", () => {
    const e = redactSentryEvent({
      breadcrumb: "user.signup tony@example.com triggered",
    })
    expect(e.breadcrumb).not.toContain("@example.com")
  })

  it("does not throw on cyclic object input", () => {
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj // intentional cycle — depth cap should catch this
    expect(() => redactSentryEvent(obj)).not.toThrow()
  })

  it("preserves the literal redaction marker across helper boundaries", () => {
    expect(__testing.REDACTED).toBe("[REDACTED]")
  })
})

// ── R6 — security headers ──────────────────────────────────────────────────

describe("security headers (R6 — CSP + clickjacking + nosniff)", () => {
  function bareResponse() {
    return new Response("ok", { headers: { "content-type": "text/plain" } })
  }

  it("emits the canonical static security headers on every path", () => {
    const r = applySecurityHeaders(bareResponse(), "/")
    expect(r.headers.get("X-Frame-Options")).toBe("DENY")
    expect(r.headers.get("X-Content-Type-Options")).toBe("nosniff")
    expect(r.headers.get("Referrer-Policy")).toBe("strict-origin-when-cross-origin")
    expect(r.headers.get("Permissions-Policy")).toContain("camera=()")
    expect(r.headers.get("Cross-Origin-Opener-Policy")).toBe(
      "same-origin-allow-popups"
    )
  })

  it("emits a CSP that allow-lists each partner stack origin", () => {
    const r = applySecurityHeaders(bareResponse(), "/")
    const csp = r.headers.get("Content-Security-Policy") || ""
    // Stripe — JS + connect + frame
    expect(csp).toContain("https://js.stripe.com")
    expect(csp).toContain("https://api.stripe.com")
    expect(csp).toContain("https://hooks.stripe.com")
    // Supabase — connect (REST + realtime websocket) + image
    expect(csp).toContain("https://*.supabase.co")
    expect(csp).toContain("wss://*.supabase.co")
    // Sentry — connect
    expect(csp).toContain("https://*.sentry.io")
    expect(csp).toContain("https://*.ingest.sentry.io")
    // Resend — connect
    expect(csp).toContain("https://api.resend.com")
    // Upstash — connect
    expect(csp).toContain("https://*.upstash.io")
    // Typesense — connect
    expect(csp).toContain("https://*.typesense.net")
    // Defaults that defang clickjacking + plugin abuse
    expect(csp).toContain("frame-ancestors 'none'")
    expect(csp).toContain("object-src 'none'")
    expect(csp).toContain("base-uri 'self'")
  })

  it("skips CSP for /studio so Sanity Studio's own CSP wins", () => {
    const r = applySecurityHeaders(bareResponse(), "/studio")
    expect(r.headers.get("Content-Security-Policy")).toBeNull()
    // …but other static headers still apply.
    expect(r.headers.get("X-Frame-Options")).toBe("DENY")
  })

  it("emits HSTS only in production builds", () => {
    const original = process.env.NODE_ENV
    try {
      // @ts-expect-error — typed as readonly literal in lib.dom; mutate for the test
      process.env.NODE_ENV = "production"
      const r = applySecurityHeaders(bareResponse(), "/")
      expect(r.headers.get("Strict-Transport-Security")).toContain("max-age=63072000")
      expect(r.headers.get("Strict-Transport-Security")).toContain("preload")
    } finally {
      // @ts-expect-error — restore
      process.env.NODE_ENV = original
    }
  })
})
