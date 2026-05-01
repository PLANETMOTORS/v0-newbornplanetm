/**
 * Coverage for the senior-security-engineer audit fixes.
 *
 * Each block locks one concrete behaviour from the audit:
 *   - C3a/C3b mass-assignment allow-list (admin reservation + lead PATCH)
 *   - R4     Sentry PII / secret redaction (incl. cycle + depth markers)
 *   - R8     covered indirectly via lib/supabase/middleware integration —
 *            see __tests__/lib/supabase-cookie-defaults.test.ts
 *
 * Security headers (CSP / HSTS / X-Frame-Options / etc) are NOT covered
 * here: they live in `next.config.mjs:async headers()` as the project's
 * single source of truth and are exercised by the Next.js framework
 * itself + the production smoke checks.
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
    // 'negotiating' added in fix/trade-in-persist-and-lead-status — the admin
    // UI rendered a button for it but the schema was missing the value, so
    // every click returned a silent 400.
    expect(LEAD_STATUSES).toEqual([
      "new",
      "contacted",
      "qualified",
      "negotiating",
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

  it("substitutes a string marker for a self-referencing cycle (FU-2)", () => {
    // Self-cycle: obj.self === obj. The previous implementation's depth
    // cap returned the original object, which re-introduced the cycle and
    // caused Sentry's serializer to drop the event silently.
    const obj: Record<string, unknown> = { a: 1 }
    obj.self = obj
    const out = redactSentryEvent(obj) as Record<string, unknown>
    expect(out.a).toBe(1)
    // Cycle is broken with a primitive string — Sentry can serialize this.
    expect(out.self).toBe("[REDACTED:cycle]")
  })

  it("substitutes a string marker for a multi-hop cycle (FU-2)", () => {
    // a -> b -> c -> a chain: every cycle exit must be a string, never an
    // object reference. Uses neutral keys ("id"/"next"/"back") so the
    // sensitive-key matcher does not interfere with this test.
    type Node = Record<string, unknown>
    const a: Node = { id: "a" }
    const b: Node = { id: "b" }
    const c: Node = { id: "c" }
    a.next = b
    b.next = c
    c.back = a
    const out = redactSentryEvent(a) as Node
    expect((out.next as Node).id).toBe("b")
    expect(((out.next as Node).next as Node).id).toBe("c")
    // The closing `c.back -> a` edge becomes a marker — JSON.stringify
    // proves it's safe to serialize.
    expect(((out.next as Node).next as Node).back).toBe("[REDACTED:cycle]")
    expect(() => JSON.stringify(out)).not.toThrow()
  })

  it("substitutes a string marker beyond the depth cap (FU-2)", () => {
    // Build a 12-deep nested object. With MAX_DEPTH=8 the inner three
    // levels MUST collapse into the depth marker, not return the raw
    // sub-object (which could hide a cycle).
    type Box = { v?: number; inner?: Box }
    const root: Box = { v: 0 }
    let cur: Box = root
    for (let i = 1; i <= 12; i += 1) {
      const next: Box = { v: i }
      cur.inner = next
      cur = next
    }
    const out = redactSentryEvent(root) as unknown
    let level = out as Record<string, unknown>
    for (let i = 0; i < 8; i += 1) {
      level = level.inner as Record<string, unknown>
    }
    // 9th level should be the depth marker string.
    expect(level.inner).toBe("[REDACTED:depth]")
  })

  it("preserves the literal redaction marker across helper boundaries", () => {
    expect(__testing.REDACTED).toBe("[REDACTED]")
  })
})
