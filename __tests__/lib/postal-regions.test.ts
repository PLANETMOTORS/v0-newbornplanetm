import { describe, expect, it } from "vitest"
import { getRegionFromPostalCode, getRegionalMultiplier } from "@/lib/postal-regions"

describe("lib/postal-regions getRegionFromPostalCode", () => {
  it("returns the default Ontario region when postal is missing", () => {
    const r = getRegionFromPostalCode()
    expect(r.province).toBe("ON")
    expect(r.regionName).toBe("Ontario (default)")
  })

  it("returns the default for an empty / whitespace string", () => {
    expect(getRegionFromPostalCode("").province).toBe("ON")
    expect(getRegionFromPostalCode("   ").province).toBe("ON")
  })

  it("returns the default for an unrecognized first character (e.g. digit)", () => {
    const r = getRegionFromPostalCode("9X9 9X9")
    expect(r.regionName).toBe("Ontario (default)")
  })

  it("maps M-prefix → Toronto", () => {
    const r = getRegionFromPostalCode("M5V 3L9")
    expect(r.province).toBe("ON")
    expect(r.regionName).toBe("Toronto")
    expect(r.evBonus).toBe(1.05)
  })

  it("maps L-prefix → Central Ontario", () => {
    expect(getRegionFromPostalCode("L4C 1G7").regionName).toBe("Central Ontario")
  })

  it("maps T-prefix → Alberta", () => {
    const r = getRegionFromPostalCode("T2P 1J9")
    expect(r.province).toBe("AB")
    expect(r.truckBonus).toBe(1.1)
    expect(r.evBonus).toBe(0.92)
  })

  it("maps V-prefix → British Columbia", () => {
    const r = getRegionFromPostalCode("V6B 1A1")
    expect(r.province).toBe("BC")
    expect(r.evBonus).toBe(1.12)
  })

  it("maps H-prefix → Montreal (highest EV bonus)", () => {
    expect(getRegionFromPostalCode("H2X 1Y4").evBonus).toBe(1.1)
  })

  it("is case-insensitive on the first character", () => {
    expect(getRegionFromPostalCode("m5v 3l9").regionName).toBe("Toronto")
    expect(getRegionFromPostalCode("M5V 3L9").regionName).toBe("Toronto")
  })

  it("trims leading whitespace before reading the first char", () => {
    expect(getRegionFromPostalCode("  M5V 3L9").regionName).toBe("Toronto")
  })

  it("covers all Atlantic + Territory prefixes", () => {
    expect(getRegionFromPostalCode("B0J").province).toBe("NS")
    expect(getRegionFromPostalCode("C1A").province).toBe("PE")
    expect(getRegionFromPostalCode("E1A").province).toBe("NB")
    expect(getRegionFromPostalCode("A1A").province).toBe("NL")
    expect(getRegionFromPostalCode("X0A").province).toBe("NT/NU")
    expect(getRegionFromPostalCode("Y1A").province).toBe("YT")
  })

  it("covers Saskatchewan, Manitoba, Quebec, Eastern/Northern Ontario", () => {
    expect(getRegionFromPostalCode("S7K").province).toBe("SK")
    expect(getRegionFromPostalCode("R3C").province).toBe("MB")
    expect(getRegionFromPostalCode("G1A").province).toBe("QC")
    expect(getRegionFromPostalCode("J1A").province).toBe("QC")
    expect(getRegionFromPostalCode("K1A").province).toBe("ON")
    expect(getRegionFromPostalCode("N6A").province).toBe("ON")
    expect(getRegionFromPostalCode("P1A").province).toBe("ON")
  })
})

describe("lib/postal-regions getRegionalMultiplier", () => {
  it("classifies a Tesla Model 3 as EV and applies the BC EV bonus", () => {
    const out = getRegionalMultiplier("V6B 1A1", "Tesla", "Model 3")
    expect(out.vehicleType).toBe("ev")
    expect(out.region.province).toBe("BC")
    // 1.03 (BC base) × 1.12 (EV bonus)
    expect(out.multiplier).toBeCloseTo(1.03 * 1.12, 5)
  })

  it("classifies a Ford F-150 as truck and applies the Alberta truck bonus", () => {
    const out = getRegionalMultiplier("T2P 1J9", "Ford", "F-150 Lariat")
    expect(out.vehicleType).toBe("truck")
    expect(out.region.province).toBe("AB")
    expect(out.multiplier).toBeCloseTo(1.02 * 1.1, 5)
  })

  it("classifies a Jeep Wrangler as SUV (truck-keyword exclusive of SUV)", () => {
    const out = getRegionalMultiplier("M5V 3L9", "Jeep", "Wrangler 4xe")
    expect(out.vehicleType).toBe("suv")
    // Toronto truckBonus is 0.97 (cars more in demand than trucks downtown)
    expect(out.multiplier).toBeCloseTo(1.02 * 0.97, 5)
  })

  it("returns standard multiplier for an unknown sedan", () => {
    const out = getRegionalMultiplier("M5V 3L9", "Honda", "Civic")
    expect(out.vehicleType).toBe("standard")
    expect(out.multiplier).toBe(1.02)
  })

  it("compounds truck bonus + EV bonus when applicable (Lightning is a truck-named EV)", () => {
    // "F-150" matches TRUCK_KEYWORDS (so the truck branch runs and applies BC's
    // truckBonus of 1) and "Lightning" then matches EV_KEYWORDS (applies the EV
    // bonus and overwrites vehicleType to "ev"). Final reported type: "ev".
    const out = getRegionalMultiplier("V6B 1A1", "Ford", "F-150 Lightning")
    expect(out.vehicleType).toBe("ev")
    expect(out.multiplier).toBeCloseTo(1.03 * 1.12, 5)
  })

  it("treats blank make/model as standard", () => {
    expect(getRegionalMultiplier("M5V 3L9", "", "").vehicleType).toBe("standard")
  })

  it("falls back to default region when postal is undefined", () => {
    const out = getRegionalMultiplier(undefined, "Honda", "Civic")
    expect(out.region.regionName).toContain("default")
    expect(out.multiplier).toBe(1)
  })

  it("classifies any Tesla as EV regardless of the model", () => {
    const out = getRegionalMultiplier("M5V 3L9", "Tesla", "RoadsterX")
    expect(out.vehicleType).toBe("ev")
  })
})
