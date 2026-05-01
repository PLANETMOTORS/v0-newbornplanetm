import { describe, it, expect } from "vitest"
import {
  cleanupBodySchema,
  cleanupByIdSchema,
  cleanupTestPatternSchema,
  CLEANABLE_TABLES,
  MAX_IDS_PER_CALL,
} from "@/lib/admin/cleanup/schemas"

describe("CLEANABLE_TABLES", () => {
  it("has the canonical 3", () => {
    expect(new Set(CLEANABLE_TABLES)).toEqual(
      new Set(["leads", "reservations", "trade_in_quotes"]),
    )
  })
})

describe("cleanupByIdSchema", () => {
  it("accepts a valid by-id body", () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: ["a", "b"],
    })
    expect(r.success).toBe(true)
  })

  it("rejects unknown table", () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "users",
      ids: ["a"],
    })
    expect(r.success).toBe(false)
  })

  it("rejects empty ids array", () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: [],
    })
    expect(r.success).toBe(false)
  })

  it(`rejects more than ${MAX_IDS_PER_CALL} ids`, () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: Array.from({ length: MAX_IDS_PER_CALL + 1 }, (_, i) => `id-${i}`),
    })
    expect(r.success).toBe(false)
  })

  it("rejects non-string ids", () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: ["a", 1, "c"],
    })
    expect(r.success).toBe(false)
  })

  it("rejects ids containing only whitespace", () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: ["valid", "   "],
    })
    expect(r.success).toBe(false)
  })

  it("rejects unknown extra keys", () => {
    const r = cleanupByIdSchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: ["a"],
      bonus: true,
    })
    expect(r.success).toBe(false)
  })
})

describe("cleanupTestPatternSchema", () => {
  it("defaults dryRun to true when omitted", () => {
    const r = cleanupTestPatternSchema.safeParse({ mode: "test-pattern" })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.dryRun).toBe(true)
  })

  it("accepts dryRun:false explicitly", () => {
    const r = cleanupTestPatternSchema.safeParse({
      mode: "test-pattern",
      dryRun: false,
    })
    expect(r.success).toBe(true)
    if (r.success) expect(r.data.dryRun).toBe(false)
  })

  it("rejects dryRun as a string", () => {
    const r = cleanupTestPatternSchema.safeParse({
      mode: "test-pattern",
      dryRun: "yes",
    })
    expect(r.success).toBe(false)
  })

  it("rejects unknown extra keys", () => {
    const r = cleanupTestPatternSchema.safeParse({
      mode: "test-pattern",
      bonus: true,
    })
    expect(r.success).toBe(false)
  })
})

describe("cleanupBodySchema (discriminated union)", () => {
  it("accepts a by-id body via the union", () => {
    const r = cleanupBodySchema.safeParse({
      mode: "by-id",
      table: "leads",
      ids: ["a"],
    })
    expect(r.success).toBe(true)
  })

  it("accepts a test-pattern body via the union", () => {
    const r = cleanupBodySchema.safeParse({ mode: "test-pattern" })
    expect(r.success).toBe(true)
  })

  it("rejects unknown mode", () => {
    const r = cleanupBodySchema.safeParse({ mode: "wipe-everything" })
    expect(r.success).toBe(false)
  })

  it("rejects missing mode", () => {
    const r = cleanupBodySchema.safeParse({ table: "leads", ids: ["a"] })
    expect(r.success).toBe(false)
  })

  it("rejects non-object inputs", () => {
    expect(cleanupBodySchema.safeParse(null).success).toBe(false)
    expect(cleanupBodySchema.safeParse("hi").success).toBe(false)
    expect(cleanupBodySchema.safeParse(42).success).toBe(false)
  })
})
