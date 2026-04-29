import { describe, expect, it } from "vitest"
import {
  liveVideoTourRequestSchema,
  formatPhoneNumber,
  isValidPhone,
} from "@/lib/liveVideoTour/schema"

describe("liveVideoTourRequestSchema", () => {
  const validInput = {
    vehicleId: "v-1",
    vehicleName: "2024 RAV4",
    customerName: "Jane",
    customerEmail: "jane@example.com",
    customerPhone: "4165550001",
    preferredTime: "2099-01-01T15:00:00Z",
  }

  it("accepts valid input with defaults", () => {
    const r = liveVideoTourRequestSchema.safeParse(validInput)
    expect(r.success).toBe(true)
    if (r.success) {
      expect(r.data.timezone).toBe("America/Toronto")
      expect(r.data.provider).toBe("google_meet")
    }
  })

  it("rejects empty vehicleId", () => {
    const r = liveVideoTourRequestSchema.safeParse({ ...validInput, vehicleId: "" })
    expect(r.success).toBe(false)
  })

  it("rejects invalid email", () => {
    const r = liveVideoTourRequestSchema.safeParse({ ...validInput, customerEmail: "not-an-email" })
    expect(r.success).toBe(false)
  })

  it("rejects too-short phone", () => {
    const r = liveVideoTourRequestSchema.safeParse({ ...validInput, customerPhone: "123" })
    expect(r.success).toBe(false)
  })

  it("rejects invalid provider value", () => {
    const r = liveVideoTourRequestSchema.safeParse({ ...validInput, provider: "skype" })
    expect(r.success).toBe(false)
  })

  it("accepts all 3 valid providers", () => {
    for (const p of ["google_meet", "zoom", "whatsapp"]) {
      const r = liveVideoTourRequestSchema.safeParse({ ...validInput, provider: p })
      expect(r.success).toBe(true)
    }
  })
})

describe("formatPhoneNumber", () => {
  it("returns digits as-is for short input", () => {
    expect(formatPhoneNumber("12")).toBe("12")
    expect(formatPhoneNumber("123")).toBe("123")
  })

  it("formats 4-6 digits with parens", () => {
    expect(formatPhoneNumber("1234")).toBe("(123) 4")
    expect(formatPhoneNumber("123456")).toBe("(123) 456")
  })

  it("formats full 10-digit number with dash", () => {
    expect(formatPhoneNumber("4165550001")).toBe("(416) 555-0001")
  })

  it("strips non-digit characters", () => {
    expect(formatPhoneNumber("(416) 555-0001 ext 5")).toBe("(416) 555-0001")
  })

  it("ignores extra digits beyond 10", () => {
    expect(formatPhoneNumber("41655500011234")).toBe("(416) 555-0001")
  })
})

describe("isValidPhone", () => {
  it("returns true when at least 10 digits", () => {
    expect(isValidPhone("4165550001")).toBe(true)
    expect(isValidPhone("(416) 555-0001")).toBe(true)
    expect(isValidPhone("+1-416-555-0001")).toBe(true)
  })

  it("returns false for shorter inputs", () => {
    expect(isValidPhone("416555")).toBe(false)
    expect(isValidPhone("")).toBe(false)
  })
})
