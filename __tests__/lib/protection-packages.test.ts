import { describe, expect, it } from "vitest"
import {
  PROTECTION_PACKAGES,
  COMPARISON_ROWS,
  CHECKOUT_PLANS,
  getPackageById,
  getCheckoutPackages,
} from "@/lib/constants/protection-packages"

describe("PROTECTION_PACKAGES", () => {
  it("declares 4 packages", () => {
    expect(PROTECTION_PACKAGES.length).toBe(4)
    expect(PROTECTION_PACKAGES.map(p => p.id)).toEqual([
      "basic",
      "essential",
      "certified",
      "certified-plus",
    ])
  })

  it("exactly one package is highlighted", () => {
    const highlighted = PROTECTION_PACKAGES.filter(p => p.highlighted)
    expect(highlighted).toHaveLength(1)
    expect(highlighted[0].id).toBe("certified")
  })

  it("certified-plus is finance-only", () => {
    const cp = PROTECTION_PACKAGES.find(p => p.id === "certified-plus")
    expect(cp?.paymentMethod).toBe("finance")
  })

  it("basic package has 0 deposit", () => {
    expect(PROTECTION_PACKAGES.find(p => p.id === "basic")?.deposit).toBe(0)
  })

  it("essential and above have $250 deposit", () => {
    const ids = ["essential", "certified", "certified-plus"]
    for (const id of ids) {
      expect(PROTECTION_PACKAGES.find(p => p.id === id)?.deposit).toBe(250)
    }
  })

  it("each package has every feature flag declared", () => {
    const expectedFeatures = [
      "returnPolicy",
      "tradeInCredit",
      "detailing",
      "fullTankOfGas",
      "tireRimProtection",
      "rustProtection",
      "freeDelivery",
      "inspection",
      "safetyCertificate",
    ].sort()
    for (const p of PROTECTION_PACKAGES) {
      expect(Object.keys(p.features).sort()).toEqual(expectedFeatures)
    }
  })
})

describe("COMPARISON_ROWS", () => {
  it("contains the expected row keys in order", () => {
    expect(COMPARISON_ROWS[0].key).toBe("paymentMethod")
    expect(COMPARISON_ROWS[1].key).toBe("deposit")
    expect(COMPARISON_ROWS.find(r => r.key === "warranty")).toBeDefined()
    expect(COMPARISON_ROWS.find(r => r.key === "freeDelivery")).toBeDefined()
  })

  it("every row has a non-empty label", () => {
    for (const row of COMPARISON_ROWS) {
      expect(typeof row.label).toBe("string")
      expect(row.label.length).toBeGreaterThan(0)
    }
  })
})

describe("getPackageById", () => {
  it("returns the matching package", () => {
    expect(getPackageById("certified")?.name).toBe("PlanetCare Certified™")
  })

  it("returns undefined for unknown id", () => {
    expect(getPackageById("nonexistent")).toBeUndefined()
  })
})

describe("getCheckoutPackages", () => {
  it("returns all 4 packages", () => {
    expect(getCheckoutPackages()).toBe(PROTECTION_PACKAGES)
    expect(getCheckoutPackages().length).toBe(4)
  })
})

describe("CHECKOUT_PLANS", () => {
  it("derives one plan per package", () => {
    expect(CHECKOUT_PLANS.length).toBe(PROTECTION_PACKAGES.length)
  })

  it("preserves price, deposit, name, badge, highlighted", () => {
    const certified = CHECKOUT_PLANS.find(p => p.id === "certified")
    expect(certified?.price).toBe(3000)
    expect(certified?.deposit).toBe(250)
    expect(certified?.badge).toBe("Most Popular")
    expect(certified?.highlighted).toBe(true)
  })

  it("basic has no warranty label and only essentially-true features", () => {
    const basic = CHECKOUT_PLANS.find(p => p.id === "basic")
    // No warranty (warranty='none' means no label)
    expect(basic?.features.find(f => f.toLowerCase().includes("warranty"))).toBeUndefined()
    // 10-day money-back guarantee should appear (returnPolicy: true)
    expect(basic?.features).toContain("10-day money-back guarantee")
  })

  it("standard warranty label appears for essential", () => {
    const ess = CHECKOUT_PLANS.find(p => p.id === "essential")
    expect(ess?.features).toContain("Standard warranty")
  })

  it("extended warranty label appears for certified and certified-plus", () => {
    const c = CHECKOUT_PLANS.find(p => p.id === "certified")
    const cp = CHECKOUT_PLANS.find(p => p.id === "certified-plus")
    expect(c?.features).toContain("Extended warranty")
    expect(cp?.features).toContain("Extended warranty")
  })

  it("certified-plus includes tire & rim AND rust protection labels", () => {
    const cp = CHECKOUT_PLANS.find(p => p.id === "certified-plus")
    expect(cp?.features).toContain("Tire & rim protection")
    expect(cp?.features).toContain("Rust protection")
  })

  it("essential does NOT include tire & rim or rust protection", () => {
    const ess = CHECKOUT_PLANS.find(p => p.id === "essential")
    expect(ess?.features).not.toContain("Tire & rim protection")
    expect(ess?.features).not.toContain("Rust protection")
  })
})
