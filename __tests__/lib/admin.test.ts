import { describe, it, expect } from "vitest"
import { ADMIN_EMAILS, isAdminEmail } from "@/lib/admin"

describe("ADMIN_EMAILS", () => {
  it("is a non-empty list", () => {
    expect(ADMIN_EMAILS.length).toBeGreaterThan(0)
  })

  it("contains the canonical fallback admins when ADMIN_EMAILS env is unset", () => {
    // Default fallback list (env-driven values may differ at runtime)
    if (!process.env.ADMIN_EMAILS) {
      expect(ADMIN_EMAILS).toContain("admin@planetmotors.ca")
      expect(ADMIN_EMAILS).toContain("toni@planetmotors.ca")
    } else {
      expect(ADMIN_EMAILS.every((e) => typeof e === "string")).toBe(true)
    }
  })
})

describe("isAdminEmail", () => {
  it("returns true for known admin emails", () => {
    for (const email of ADMIN_EMAILS) {
      expect(isAdminEmail(email)).toBe(true)
    }
  })

  it("returns false for unknown emails", () => {
    expect(isAdminEmail("random@example.com")).toBe(false)
  })

  it("returns false for nullish input", () => {
    expect(isAdminEmail(null)).toBe(false)
    expect(isAdminEmail(undefined)).toBe(false)
    expect(isAdminEmail("")).toBe(false)
  })
})
