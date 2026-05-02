import { describe, it, expect } from "vitest"
import {
  tradeInToAdfProspect,
  financeToAdfProspect,
  reservationToAdfProspect,
  inquiryToAdfProspect,
  testDriveToAdfProspect,
} from "@/lib/adf/adapters"

describe("tradeInToAdfProspect", () => {
  it("maps a complete trade-in lead to an ADFProspect", () => {
    const result = tradeInToAdfProspect({
      quoteId: "TQ-123",
      customerName: "Jenny Iagoudakis",
      customerEmail: "jenny@example.com",
      customerPhone: "4165625118",
      vehicleYear: 2008,
      vehicleMake: "BMW",
      vehicleModel: "M5",
      mileage: 120000,
      condition: "good",
      vin: "WBSNB93508CX12345",
      offerAmount: 9500,
      offerLow: 8500,
      offerHigh: 10500,
    })
    expect(result.id).toBe("TQ-123")
    expect(result.source).toBe("Trade-In Quote")
    expect(result.customer.firstName).toBe("Jenny")
    expect(result.customer.lastName).toBe("Iagoudakis")
    expect(result.customer.email).toBe("jenny@example.com")
    expect(result.tradeIn).toEqual({
      year: 2008,
      make: "BMW",
      model: "M5",
      trim: undefined,
      vin: "WBSNB93508CX12345",
      mileage: 120000,
      condition: "good",
      offerAmount: 9500,
    })
    expect(result.comments).toContain("$8,500")
    expect(result.comments).toContain("$10,500")
  })

  it("splits single-name into firstName only", () => {
    const result = tradeInToAdfProspect({
      quoteId: "TQ-1",
      customerName: "Cher",
      vehicleYear: 2020,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
    })
    expect(result.customer.firstName).toBe("Cher")
    expect(result.customer.lastName).toBeUndefined()
  })

  it("joins multi-word last names back together", () => {
    const result = tradeInToAdfProspect({
      quoteId: "TQ-1",
      customerName: "Mary Jane Watson Parker",
      vehicleYear: 2020,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
    })
    expect(result.customer.firstName).toBe("Mary")
    expect(result.customer.lastName).toBe("Jane Watson Parker")
  })

  it("uses 'now' if createdAt not supplied", () => {
    const before = Date.now()
    const result = tradeInToAdfProspect({
      quoteId: "TQ-1",
      vehicleYear: 2020,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
    })
    const after = Date.now()
    const ts = Date.parse(result.requestDate)
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it("omits comments when offer range is incomplete", () => {
    const result = tradeInToAdfProspect({
      quoteId: "TQ-1",
      vehicleYear: 2020,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      offerAmount: 9500,
      // offerLow / offerHigh missing
    })
    expect(result.comments).toBeUndefined()
  })
})

describe("financeToAdfProspect", () => {
  it("maps finance lead with vehicle of interest", () => {
    const result = financeToAdfProspect({
      applicationId: "FA-555",
      customerName: "John Doe",
      customerEmail: "john@example.com",
      vehicleYear: 2022,
      vehicleMake: "Tesla",
      vehicleModel: "Model 3",
      vin: "5YJ3E1EA0NF123456",
      stockNumber: "PM12345",
      vehiclePrice: 45000,
      vehicleStatus: "used",
      monthlyBudget: 600,
      downPayment: 5000,
    })
    expect(result.id).toBe("FA-555")
    expect(result.source).toBe("Finance Application")
    expect(result.vehicle?.interest).toBe("buy")
    expect(result.vehicle?.status).toBe("used")
    expect(result.vehicle?.year).toBe(2022)
    expect(result.vehicle?.vin).toBe("5YJ3E1EA0NF123456")
    expect(result.finance?.monthlyBudget).toBe(600)
    expect(result.finance?.downPayment).toBe(5000)
  })

  it("omits vehicle block when no make supplied", () => {
    const result = financeToAdfProspect({
      applicationId: "FA-555",
      customerName: "John Doe",
      monthlyBudget: 500,
    })
    expect(result.vehicle).toBeUndefined()
    expect(result.finance?.monthlyBudget).toBe(500)
  })
})

describe("reservationToAdfProspect", () => {
  it("captures deposit amount in comments", () => {
    const result = reservationToAdfProspect({
      reservationId: "R-99",
      customerName: "Alice Smith",
      vehicleMake: "Tesla",
      vehicleModel: "Model S",
      depositAmount: 250,
    })
    expect(result.source).toBe("Reservation Deposit")
    expect(result.comments).toContain("$250")
  })
})

describe("inquiryToAdfProspect", () => {
  it("maps message into comments", () => {
    const result = inquiryToAdfProspect({
      inquiryId: "IQ-1",
      customerName: "Bob",
      vehicleMake: "Honda",
      vehicleModel: "Civic",
      message: "Is it still available?",
    })
    expect(result.source).toBe("Vehicle Inquiry")
    expect(result.comments).toBe("Is it still available?")
  })
})

describe("testDriveToAdfProspect", () => {
  it("captures preferred date/time in comments", () => {
    const result = testDriveToAdfProspect({
      testDriveId: "TD-7",
      customerName: "Carol",
      vehicleMake: "Ford",
      vehicleModel: "Mustang",
      preferredDate: "2026-05-15",
      preferredTime: "14:00",
    })
    expect(result.source).toBe("Test Drive Request")
    expect(result.vehicle?.interest).toBe("test-drive")
    expect(result.comments).toContain("2026-05-15")
    expect(result.comments).toContain("14:00")
  })
})
