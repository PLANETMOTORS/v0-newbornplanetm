import { describe, it, expect } from "vitest"
import {
  captureLeadRequestSchema,
  PERSIST_ERROR_CODE,
  RETRY_PHONE,
} from "@/lib/leads/capture/schemas"

const VALID = {
  firstName: " Tony ",
  lastName: " Sultzberg ",
  email: "  Tony@PlanetMotors.CA  ",
  phone: "+1 (416) 555-0102",
  annualIncome: "90000",
  requestedAmount: 35000,
  requestedTerm: "72",
}

describe("captureLeadRequestSchema — happy path", () => {
  it("accepts a clean payload, trims/lowercases email, coerces numbers", () => {
    const r = captureLeadRequestSchema.safeParse(VALID)
    expect(r.success).toBe(true)
    if (!r.success) return
    expect(r.data).toEqual({
      firstName: "Tony",
      lastName: "Sultzberg",
      email: "tony@planetmotors.ca",
      phone: "+1 (416) 555-0102",
      annualIncome: 90000,
      requestedAmount: 35000,
      requestedTerm: 72,
    })
  })

  it("accepts already-numeric numeric fields", () => {
    const r = captureLeadRequestSchema.safeParse({
      ...VALID,
      annualIncome: 90000,
      requestedAmount: 35000,
      requestedTerm: 72,
    })
    expect(r.success).toBe(true)
  })
})

describe("captureLeadRequestSchema — required fields", () => {
  it.each([
    ["firstName", { ...VALID, firstName: "" }],
    ["firstName whitespace-only", { ...VALID, firstName: "   " }],
    ["lastName", { ...VALID, lastName: "" }],
    ["email missing", { ...VALID, email: "" }],
    ["email malformed", { ...VALID, email: "not-an-email" }],
    ["phone missing", { ...VALID, phone: "" }],
    ["phone too short", { ...VALID, phone: "12" }],
    ["phone forbidden chars", { ...VALID, phone: "<script>" }],
  ])("rejects when %s", (_label, body) => {
    const r = captureLeadRequestSchema.safeParse(body)
    expect(r.success).toBe(false)
  })
})

describe("captureLeadRequestSchema — numeric bounds", () => {
  it.each([
    ["annualIncome zero", { ...VALID, annualIncome: 0 }],
    ["annualIncome negative", { ...VALID, annualIncome: -1 }],
    ["annualIncome NaN", { ...VALID, annualIncome: "abc" }],
    ["annualIncome Infinity", { ...VALID, annualIncome: Infinity }],
    ["requestedAmount zero", { ...VALID, requestedAmount: 0 }],
    ["requestedAmount negative", { ...VALID, requestedAmount: -1 }],
    ["requestedTerm zero", { ...VALID, requestedTerm: 0 }],
    ["requestedTerm fractional", { ...VALID, requestedTerm: 12.5 }],
    ["requestedTerm negative", { ...VALID, requestedTerm: -3 }],
  ])("rejects when %s", (_label, body) => {
    const r = captureLeadRequestSchema.safeParse(body)
    expect(r.success).toBe(false)
  })
})

describe("captureLeadRequestSchema — strict mode", () => {
  it("rejects unknown fields", () => {
    const r = captureLeadRequestSchema.safeParse({
      ...VALID,
      attackerField: "<script>alert(1)</script>",
    })
    expect(r.success).toBe(false)
  })
})

describe("captureLeadRequestSchema — name length cap", () => {
  it("rejects firstName over 200 chars", () => {
    const r = captureLeadRequestSchema.safeParse({
      ...VALID,
      firstName: "a".repeat(201),
    })
    expect(r.success).toBe(false)
  })
})

describe("constants", () => {
  it("exposes a stable persist-failure code and retry phone", () => {
    expect(PERSIST_ERROR_CODE).toBe("LEAD_PERSIST_FAILED")
    expect(RETRY_PHONE).toMatch(/^\(\d{3}\) \d{3}-\d{4}$/)
  })
})
