import { describe, it, expect } from "vitest"
import { maskEmail, maskPhone } from "@/lib/redact"

describe("maskEmail", () => {
  it("masks a normal email keeping first/last + domain", () => {
    expect(maskEmail("jane.doe@example.com")).toBe("j***e@example.com")
  })

  it("uses short form when the local part is 2 chars or fewer", () => {
    expect(maskEmail("jo@example.com")).toBe("j***@example.com")
    expect(maskEmail("a@example.com")).toBe("a***@example.com")
  })

  it("strips control characters before masking", () => {
    expect(maskEmail("a\nb\tc@example.com")).toBe("a***c@example.com")
  })

  it("returns <missing> for missing input", () => {
    expect(maskEmail(undefined)).toBe("<missing>")
    expect(maskEmail(null)).toBe("<missing>")
    expect(maskEmail("")).toBe("<missing>")
    expect(maskEmail("   ")).toBe("<missing>")
  })

  it("returns <redacted> when input is malformed", () => {
    expect(maskEmail("notanemail")).toBe("<redacted>")
    expect(maskEmail("@nolocal.com")).toBe("<redacted>")
    expect(maskEmail("nolocal@")).toBe("<redacted>")
  })

  it("handles non-string inputs", () => {
    // @ts-expect-error — runtime guard
    expect(maskEmail(42)).toBe("<missing>")
  })
})

describe("maskPhone", () => {
  it("preserves last 4 digits", () => {
    expect(maskPhone("+14165551234")).toBe("***1234")
    expect(maskPhone("(416) 555-1234")).toBe("***1234")
  })

  it("returns <redacted> when too few digits", () => {
    expect(maskPhone("12")).toBe("<redacted>")
  })

  it("returns <missing> for missing input", () => {
    expect(maskPhone(undefined)).toBe("<missing>")
    expect(maskPhone(null)).toBe("<missing>")
    // @ts-expect-error — runtime guard
    expect(maskPhone(0)).toBe("<missing>")
  })
})
