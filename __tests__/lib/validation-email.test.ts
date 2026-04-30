import { describe, it, expect } from "vitest"
import { isEmailLike } from "@/lib/validation/email"

describe("isEmailLike — branch coverage", () => {
  it("returns true for a valid email", () => {
    expect(isEmailLike("user@example.com")).toBe(true)
  })

  it("returns false for non-string input", () => {
    expect(isEmailLike(42 as unknown as string)).toBe(false)
  })

  it("returns false for empty string", () => {
    expect(isEmailLike("")).toBe(false)
    expect(isEmailLike("   ")).toBe(false)
  })

  it("returns false for string > 254 chars", () => {
    expect(isEmailLike("a".repeat(250) + "@b.co")).toBe(false)
  })

  it("returns false when @ is missing or first char", () => {
    expect(isEmailLike("nodomain")).toBe(false)
    expect(isEmailLike("@example.com")).toBe(false)
  })

  it("returns false for multiple @ signs", () => {
    expect(isEmailLike("a@b@c.com")).toBe(false)
  })

  it("returns false when domain has no dot or dot at boundary", () => {
    expect(isEmailLike("user@localhost")).toBe(false)
    expect(isEmailLike("user@.com")).toBe(false)
    expect(isEmailLike("user@example.")).toBe(false)
  })

  it("returns false for whitespace in email", () => {
    expect(isEmailLike("us er@example.com")).toBe(false)
  })
})
