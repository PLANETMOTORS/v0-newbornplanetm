import { describe, expect, it } from "vitest"
import { DRIVEE_DEALER_UID, DRIVEE_VIN_MAP, getDriveeMid } from "@/lib/drivee"

describe("lib/drivee constants", () => {
  it("exposes the production dealer UID", () => {
    expect(DRIVEE_DEALER_UID).toBe("AZYuEtjX9NUvWpqmUQcKyiGHbNg1")
  })

  it("contains a non-empty VIN→MID map", () => {
    expect(Object.keys(DRIVEE_VIN_MAP).length).toBeGreaterThan(50)
  })

  it("maps every value to a non-empty string", () => {
    for (const mid of Object.values(DRIVEE_VIN_MAP)) {
      expect(typeof mid).toBe("string")
      expect(mid.length).toBeGreaterThan(0)
    }
  })
})

describe("lib/drivee getDriveeMid", () => {
  it("returns null for null", () => {
    expect(getDriveeMid(null)).toBeNull()
  })

  it("returns null for undefined", () => {
    expect(getDriveeMid(undefined)).toBeNull()
  })

  it("returns null for the empty string (falsy guard)", () => {
    expect(getDriveeMid("")).toBeNull()
  })

  it("returns null for a VIN not in the map", () => {
    expect(getDriveeMid("UNKNOWN_VIN_XYZ")).toBeNull()
  })

  it("returns the mapped MID for a known VIN", () => {
    expect(getDriveeMid("1C4JJXP6XMW777356")).toBe("190171976531")
  })

  it("returns the mapped MID for another known VIN", () => {
    expect(getDriveeMid("LRW3E1EBXPC876367")).toBe("132601940353")
  })

  it("is case-sensitive for VIN keys", () => {
    expect(getDriveeMid("1c4jjxp6xmw777356")).toBeNull()
  })
})
