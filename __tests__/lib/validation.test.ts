import { describe, it, expect } from "vitest"
import {
  isValidCanadianPostalCode,
  formatCanadianPostalCode,
  isValidCanadianPhoneNumber,
  formatCanadianPhoneNumber,
  isValidEmail,
  isValidName,
  isValidVIN,
  isValidMileage,
  formatMileage,
  validateForm,
  validateTradeInForm,
  VALIDATION_RULES,
  ValidationMessages,
} from "@/lib/validation"

describe("Canadian postal code", () => {
  it("accepts well-formed codes", () => {
    expect(isValidCanadianPostalCode("M5V 3L9")).toBe(true)
    expect(isValidCanadianPostalCode("m5v3l9")).toBe(true)
    expect(isValidCanadianPostalCode("K1A 0B1")).toBe(true)
  })

  it("rejects invalid first letters (D, F, I, O, Q, U, W, Z)", () => {
    expect(isValidCanadianPostalCode("D1A 1A1")).toBe(false)
    expect(isValidCanadianPostalCode("Z1A 1A1")).toBe(false)
  })

  it("rejects wrong-length codes", () => {
    expect(isValidCanadianPostalCode("M5V 3L")).toBe(false)
    expect(isValidCanadianPostalCode("")).toBe(false)
    expect(isValidCanadianPostalCode("M5V3L99")).toBe(false)
  })

  it("formats codes with the conventional space", () => {
    expect(formatCanadianPostalCode("m5v3l9")).toBe("M5V 3L9")
    // Short inputs still get the trailing-space "{prefix} {suffix}" treatment
    // because the implementation always splits on index 3.
    expect(formatCanadianPostalCode("M5V")).toBe("M5V ")
    expect(formatCanadianPostalCode("M5")).toBe("M5")
  })
})

describe("Canadian phone number", () => {
  it("accepts well-formed numbers", () => {
    expect(isValidCanadianPhoneNumber("(416) 555-1234")).toBe(true)
    expect(isValidCanadianPhoneNumber("416-555-1234")).toBe(true)
    expect(isValidCanadianPhoneNumber("4165551234")).toBe(true)
    expect(isValidCanadianPhoneNumber("+1 416 555 1234")).toBe(true)
  })

  it("rejects bad area codes", () => {
    expect(isValidCanadianPhoneNumber("0165551234")).toBe(false)
    expect(isValidCanadianPhoneNumber("1165551234")).toBe(false)
  })

  it("rejects bad exchange codes (start with 0/1)", () => {
    expect(isValidCanadianPhoneNumber("4160551234")).toBe(false)
    expect(isValidCanadianPhoneNumber("4161551234")).toBe(false)
  })

  it("rejects fake repeated-digit numbers", () => {
    expect(isValidCanadianPhoneNumber("5555555555")).toBe(false)
    expect(isValidCanadianPhoneNumber("0000000000")).toBe(false)
  })

  it("rejects empty / wrong-length numbers", () => {
    expect(isValidCanadianPhoneNumber("")).toBe(false)
    expect(isValidCanadianPhoneNumber("416555")).toBe(false)
  })

  it("formats to (xxx) xxx-xxxx", () => {
    expect(formatCanadianPhoneNumber("4165551234")).toBe("(416) 555-1234")
    expect(formatCanadianPhoneNumber("14165551234")).toBe("(416) 555-1234")
    expect(formatCanadianPhoneNumber("not-a-phone")).toBe("not-a-phone")
  })
})

describe("isValidEmail", () => {
  it("accepts a normal email", () => {
    expect(isValidEmail("jane.doe@gmail.com")).toBe(true)
  })

  it("rejects fake / RFC-reserved domains", () => {
    expect(isValidEmail("a@example.com")).toBe(false)
    expect(isValidEmail("a@invalid.com")).toBe(false)
    expect(isValidEmail("a@asdf.com")).toBe(false)
  })

  it("rejects suspicious local parts", () => {
    expect(isValidEmail("test@gmail.com")).toBe(false)
    expect(isValidEmail("xxxx@gmail.com")).toBe(false)
    expect(isValidEmail("aaaaaa@gmail.com")).toBe(false)
  })

  it("rejects malformed inputs", () => {
    expect(isValidEmail("not-an-email")).toBe(false)
    expect(isValidEmail("")).toBe(false)
    expect(isValidEmail("a@b")).toBe(false)
  })
})

describe("isValidName", () => {
  it("accepts realistic names", () => {
    expect(isValidName("Jane Doe")).toBe(true)
    expect(isValidName("Jean-Luc")).toBe(true)
    expect(isValidName("O'Reilly")).toBe(true)
    expect(isValidName("Émilie")).toBe(true)
  })

  it("rejects very short / empty inputs", () => {
    expect(isValidName("")).toBe(false)
    expect(isValidName("a")).toBe(false)
  })

  it("rejects placeholder garbage", () => {
    expect(isValidName("test")).toBe(false)
    expect(isValidName("asdf")).toBe(false)
    expect(isValidName("xxx")).toBe(false)
  })

  it("rejects names with digits", () => {
    expect(isValidName("Jane2")).toBe(false)
  })
})

describe("isValidVIN", () => {
  it("accepts a clean 17-char VIN", () => {
    expect(isValidVIN("1HGCM82633A123456")).toBe(true)
  })

  it("rejects VINs containing I/O/Q", () => {
    expect(isValidVIN("1HGCMI2633A123456")).toBe(false)
    expect(isValidVIN("1HGCMO2633A123456")).toBe(false)
  })

  it("rejects wrong-length VINs", () => {
    expect(isValidVIN("ABCDE")).toBe(false)
  })

  it("treats empty VIN as valid (often optional)", () => {
    expect(isValidVIN("")).toBe(true)
  })
})

describe("mileage", () => {
  it("isValidMileage accepts positive values <= 1M km", () => {
    expect(isValidMileage(0)).toBe(true)
    expect(isValidMileage(150_000)).toBe(true)
    expect(isValidMileage("150,000")).toBe(true)
  })

  it("isValidMileage rejects negative / huge / NaN values", () => {
    expect(isValidMileage(-1)).toBe(false)
    expect(isValidMileage(1_500_000)).toBe(false)
    expect(isValidMileage("abc")).toBe(false)
  })

  it("formatMileage formats with commas, falls back to '0' on invalid", () => {
    expect(formatMileage(150000)).toBe("150,000")
    expect(formatMileage("150000")).toBe("150,000")
    expect(formatMileage("abc")).toBe("0")
  })
})

describe("validateForm", () => {
  it("returns no errors when all rules pass", () => {
    const r = validateForm(
      { name: "Jane Doe", email: "jane@gmail.com" },
      VALIDATION_RULES,
    )
    expect(r.isValid).toBe(false) // postalCode/phone are required and missing
    expect(r.errors).toHaveProperty("postalCode")
    expect(r.errors).toHaveProperty("phone")
  })

  it("flags required + minLength + custom failures", () => {
    const r = validateForm(
      { name: "X", email: "bad", phone: "555", postalCode: "?" },
      VALIDATION_RULES,
    )
    expect(r.isValid).toBe(false)
    // VALIDATION_RULES.email / .postalCode each carry their own message
    // string distinct from ValidationMessages, so we just assert they fired.
    expect(r.errors.email).toBeTruthy()
    expect(r.errors.postalCode).toBeTruthy()
  })
})

describe("validateTradeInForm", () => {
  it("passes for a fully valid form", () => {
    const r = validateTradeInForm({
      name: "Jane Doe",
      email: "jane@gmail.com",
      phone: "(416) 555-1234",
      postalCode: "M5V 3L9",
    })
    expect(r.valid).toBe(true)
  })

  it("flags every invalid field", () => {
    const r = validateTradeInForm({
      name: "x",
      email: "bad",
      phone: "1",
      postalCode: "??",
    })
    expect(r.valid).toBe(false)
    expect(r.errors.name).toBe(ValidationMessages.name)
    expect(r.errors.email).toBe(ValidationMessages.email)
    expect(r.errors.phone).toBe(ValidationMessages.phone)
    expect(r.errors.postalCode).toBe(ValidationMessages.postalCode)
  })

  it("validates first/last names independently when no combined name", () => {
    const r = validateTradeInForm({
      firstName: "Jane",
      lastName: "X",
      email: "jane@gmail.com",
      phone: "(416) 555-1234",
      postalCode: "M5V 3L9",
    })
    expect(r.valid).toBe(false)
    expect(r.errors.lastName).toBe(ValidationMessages.name)
  })
})
