import { describe, it, expect } from "vitest"
import {
  RESERVATION_STATUSES,
  DEPOSIT_STATUSES,
  LEAD_STATUSES,
  adminReservationPatchSchema,
  adminLeadPatchSchema,
  parseAdminPatch,
} from "@/lib/security/admin-mutation-schemas"

describe("constant lists", () => {
  it("RESERVATION_STATUSES contains the canonical 5", () => {
    expect(new Set(RESERVATION_STATUSES)).toEqual(
      new Set(["pending", "confirmed", "completed", "cancelled", "expired"])
    )
  })
  it("DEPOSIT_STATUSES contains the canonical 4", () => {
    expect(new Set(DEPOSIT_STATUSES)).toEqual(
      new Set(["pending", "paid", "failed", "refunded"])
    )
  })
  it("LEAD_STATUSES contains the canonical 7", () => {
    expect(new Set(LEAD_STATUSES)).toEqual(
      new Set([
        "new",
        "contacted",
        "qualified",
        "negotiating",
        "converted",
        "lost",
        "archived",
      ])
    )
  })
})

describe("adminReservationPatchSchema", () => {
  it("accepts a valid partial patch", () => {
    const r = adminReservationPatchSchema.safeParse({
      status: "confirmed",
      deposit_status: "paid",
      internal_notes: "looks ok",
    })
    expect(r.success).toBe(true)
  })

  it("rejects unknown columns (mass-assignment defence)", () => {
    const r = adminReservationPatchSchema.safeParse({
      status: "confirmed",
      customer_email: "x@y.com",
    })
    expect(r.success).toBe(false)
  })

  it("rejects invalid status enum", () => {
    const r = adminReservationPatchSchema.safeParse({ status: "wat" })
    expect(r.success).toBe(false)
  })

  it("rejects internal_notes longer than 4000 chars", () => {
    const r = adminReservationPatchSchema.safeParse({
      internal_notes: "a".repeat(4001),
    })
    expect(r.success).toBe(false)
  })

  it("accepts assigned_to = null (un-assign)", () => {
    const r = adminReservationPatchSchema.safeParse({ assigned_to: null })
    expect(r.success).toBe(true)
  })

  it("rejects non-uuid assigned_to", () => {
    const r = adminReservationPatchSchema.safeParse({
      assigned_to: "not-a-uuid",
    })
    expect(r.success).toBe(false)
  })
})

describe("adminLeadPatchSchema", () => {
  it("accepts a valid partial patch", () => {
    const r = adminLeadPatchSchema.safeParse({
      status: "qualified",
      notes: "called twice",
    })
    expect(r.success).toBe(true)
  })

  it("rejects unknown fields", () => {
    const r = adminLeadPatchSchema.safeParse({
      status: "new",
      vehicle_id: "abc",
    })
    expect(r.success).toBe(false)
  })

  it("rejects oversize notes", () => {
    const r = adminLeadPatchSchema.safeParse({ notes: "x".repeat(8001) })
    expect(r.success).toBe(false)
  })
})

describe("parseAdminPatch", () => {
  it("returns ok+data on success", () => {
    const res = parseAdminPatch(adminLeadPatchSchema, { status: "new" })
    expect(res.ok).toBe(true)
    if (res.ok) expect(res.data.status).toBe("new")
  })

  it("returns ok=false + flat issue strings on failure", () => {
    const res = parseAdminPatch(adminLeadPatchSchema, {
      status: "??",
      notes: 5,
    })
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.issues.length).toBeGreaterThan(0)
      expect(res.issues.every((s) => typeof s === "string")).toBe(true)
    }
  })

  it("uses (root) for top-level errors", () => {
    const res = parseAdminPatch(adminLeadPatchSchema, "not-an-object")
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(
        res.issues.some((i) => i.includes("(root)"))
      ).toBe(true)
    }
  })
})
