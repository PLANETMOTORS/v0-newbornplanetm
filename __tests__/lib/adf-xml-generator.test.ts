import { describe, it, expect } from "vitest"
import { generateAdfXml, escapeXml } from "@/lib/adf/xml-generator"
import type { ADFProspect } from "@/lib/adf/types"

const dealer = "Planet Motors"

describe("escapeXml", () => {
  it("escapes the five XML control characters", () => {
    expect(escapeXml("a & b")).toBe("a &amp; b")
    expect(escapeXml("<tag>")).toBe("&lt;tag&gt;")
    expect(escapeXml('she said "hi"')).toBe("she said &quot;hi&quot;")
    expect(escapeXml("it's")).toBe("it&apos;s")
  })

  it("escapes ampersand first to avoid double-escaping", () => {
    expect(escapeXml("&amp;")).toBe("&amp;amp;")
  })

  it("returns empty string for null/undefined", () => {
    expect(escapeXml(null)).toBe("")
    expect(escapeXml(undefined)).toBe("")
  })
})

describe("generateAdfXml — trade-in lead", () => {
  const tradeInProspect: ADFProspect = {
    id: "TQ-1777577634248-492EF8",
    requestDate: "2026-04-30T19:33:00.000Z",
    customer: {
      firstName: "Jenny",
      lastName: "Iagoudakis",
      email: "jennykoukla5@hotmail.com",
      phone: "4165625118",
    },
    tradeIn: {
      year: 2008,
      make: "BMW",
      model: "M5",
      mileage: 120000,
      condition: "good",
      offerAmount: 9500,
    },
    source: "Trade-In Quote",
    comments: "Estimate range: $8,500 – $10,500 CAD",
  }

  it("emits the ADF XML preamble + envelope", () => {
    const xml = generateAdfXml(tradeInProspect, dealer)
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
    expect(xml).toContain('<?adf version="1.0"?>')
    expect(xml).toContain("<adf>")
    expect(xml).toContain("</adf>")
    expect(xml).toContain("<prospect>")
    expect(xml).toContain("</prospect>")
  })

  it("includes the source ID with sequence + source attributes", () => {
    const xml = generateAdfXml(tradeInProspect, dealer)
    expect(xml).toContain(
      '<id sequence="1" source="planetmotors.ca">TQ-1777577634248-492EF8</id>',
    )
  })

  it("emits a <vehicle interest=\"trade-in\"> block with year/make/model", () => {
    const xml = generateAdfXml(tradeInProspect, dealer)
    expect(xml).toContain('<vehicle interest="trade-in">')
    expect(xml).toContain("<year>2008</year>")
    expect(xml).toContain("<make>BMW</make>")
    expect(xml).toContain("<model>M5</model>")
    expect(xml).toContain('<odometer units="km">120000</odometer>')
    expect(xml).toContain('<price type="appraisal">9500</price>')
  })

  it("emits the customer contact section with name parts + email + phone", () => {
    const xml = generateAdfXml(tradeInProspect, dealer)
    expect(xml).toContain('<name part="first">Jenny</name>')
    expect(xml).toContain('<name part="last">Iagoudakis</name>')
    expect(xml).toContain("<email>jennykoukla5@hotmail.com</email>")
    expect(xml).toContain("<phone>4165625118</phone>")
  })

  it("includes vendor + provider sections", () => {
    const xml = generateAdfXml(tradeInProspect, dealer)
    expect(xml).toContain('<name part="full">Planet Motors</name>')
    expect(xml).toContain('<name part="full">planetmotors.ca</name>')
    expect(xml).toContain("<service>Trade-In Quote</service>")
  })

  it("includes comments when supplied", () => {
    const xml = generateAdfXml(tradeInProspect, dealer)
    expect(xml).toContain(
      "<comments>Estimate range: $8,500 – $10,500 CAD</comments>",
    )
  })

  it("escapes XML special characters in user-supplied data", () => {
    const malicious: ADFProspect = {
      ...tradeInProspect,
      customer: {
        firstName: "Bobby",
        lastName: "</customer><script>alert(1)</script>",
        email: "bobby&tables@example.com",
      },
      comments: 'Notes with "quotes" and <tags>',
    }
    const xml = generateAdfXml(malicious, dealer)
    expect(xml).not.toContain("<script>")
    expect(xml).toContain("&lt;/customer&gt;")
    expect(xml).toContain("&lt;script&gt;")
    expect(xml).toContain("bobby&amp;tables@example.com")
    expect(xml).toContain("&quot;quotes&quot;")
  })

  it("omits empty optional elements rather than emitting blank tags", () => {
    const minimal: ADFProspect = {
      id: "TQ-MIN",
      requestDate: "2026-04-30T00:00:00.000Z",
      customer: { firstName: "A" },
      tradeIn: { year: 2020, make: "Toyota", model: "Camry" },
      source: "Trade-In Quote",
    }
    const xml = generateAdfXml(minimal, dealer)
    expect(xml).not.toContain("<email></email>")
    expect(xml).not.toContain("<phone></phone>")
    expect(xml).not.toContain("<comments></comments>")
    expect(xml).not.toContain("<odometer")
    expect(xml).not.toContain("<price")
  })
})

describe("generateAdfXml — finance lead", () => {
  it("emits a vehicle interest=buy block with full vehicle details", () => {
    const prospect: ADFProspect = {
      id: "FA-12345",
      requestDate: "2026-04-30T00:00:00.000Z",
      customer: {
        firstName: "John",
        lastName: "Doe",
        email: "john@example.com",
      },
      vehicle: {
        interest: "buy",
        status: "used",
        year: 2022,
        make: "Tesla",
        model: "Model 3",
        vin: "5YJ3E1EA0NF123456",
        stockNumber: "PM12345",
        price: 45000,
      },
      finance: {
        monthlyBudget: 600,
        downPayment: 5000,
      },
      source: "Finance Application",
    }
    const xml = generateAdfXml(prospect, dealer)
    expect(xml).toContain('<vehicle interest="buy" status="used">')
    expect(xml).toContain("<vin>5YJ3E1EA0NF123456</vin>")
    expect(xml).toContain("<stock>PM12345</stock>")
    expect(xml).toContain('<price type="asking">45000</price>')
    expect(xml).toContain("<finance>")
    expect(xml).toContain('<amount type="monthly">600</amount>')
    expect(xml).toContain('<balance type="downpayment">5000</balance>')
  })
})
