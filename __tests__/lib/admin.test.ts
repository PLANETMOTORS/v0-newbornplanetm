import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const original: { ADMIN_EMAILS?: string } = {}

beforeEach(() => {
  original.ADMIN_EMAILS = process.env.ADMIN_EMAILS
  delete process.env.ADMIN_EMAILS
  vi.resetModules()
})

afterEach(() => {
  if (original.ADMIN_EMAILS === undefined) delete process.env.ADMIN_EMAILS
  else process.env.ADMIN_EMAILS = original.ADMIN_EMAILS
})

describe("lib/admin ADMIN_EMAILS", () => {
  it("uses the hardcoded fallback when ADMIN_EMAILS env var is unset", async () => {
    const { ADMIN_EMAILS } = await import("@/lib/admin")
    expect([...ADMIN_EMAILS]).toEqual(["admin@planetmotors.ca", "toni@planetmotors.ca"])
  })

  it("parses a comma-separated env var into a list", async () => {
    process.env.ADMIN_EMAILS = "a@x.com,b@x.com,c@x.com"
    const { ADMIN_EMAILS } = await import("@/lib/admin")
    expect([...ADMIN_EMAILS]).toEqual(["a@x.com", "b@x.com", "c@x.com"])
  })

  it("trims whitespace and drops empty entries", async () => {
    process.env.ADMIN_EMAILS = " a@x.com , , b@x.com ,   "
    const { ADMIN_EMAILS } = await import("@/lib/admin")
    expect([...ADMIN_EMAILS]).toEqual(["a@x.com", "b@x.com"])
  })

  it("returns the hardcoded fallback when ADMIN_EMAILS is the empty string", async () => {
    process.env.ADMIN_EMAILS = ""
    const { ADMIN_EMAILS } = await import("@/lib/admin")
    expect([...ADMIN_EMAILS]).toEqual(["admin@planetmotors.ca", "toni@planetmotors.ca"])
  })
})

describe("lib/admin isAdminEmail", () => {
  it("returns false for null/undefined/empty", async () => {
    const { isAdminEmail } = await import("@/lib/admin")
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail("")).toBe(false)
  })

  it("returns true for an email in the list (default fallback)", async () => {
    const { isAdminEmail } = await import("@/lib/admin")
    expect(isAdminEmail("toni@planetmotors.ca")).toBe(true)
    expect(isAdminEmail("admin@planetmotors.ca")).toBe(true)
  })

  it("returns false for an email NOT in the list", async () => {
    const { isAdminEmail } = await import("@/lib/admin")
    expect(isAdminEmail("hacker@example.com")).toBe(false)
  })

  it("is case-sensitive (membership test)", async () => {
    const { isAdminEmail } = await import("@/lib/admin")
    expect(isAdminEmail("TONI@PLANETMOTORS.CA")).toBe(false)
  })

  it("respects ADMIN_EMAILS env var override", async () => {
    process.env.ADMIN_EMAILS = "ceo@x.com"
    const { isAdminEmail } = await import("@/lib/admin")
    expect(isAdminEmail("ceo@x.com")).toBe(true)
    expect(isAdminEmail("toni@planetmotors.ca")).toBe(false)
  })
})
