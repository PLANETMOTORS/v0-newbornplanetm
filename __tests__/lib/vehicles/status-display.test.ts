import { describe, expect, it } from "vitest"
import { getVehicleStatusDisplay } from "@/lib/vehicles/status-display"

describe("getVehicleStatusDisplay (Sonar S3358 — replaces VDP nested ternaries)", () => {
  it("maps 'available' → InStock + emerald + Available", () => {
    const d = getVehicleStatusDisplay("available")
    expect(d.schemaAvailability).toBe("https://schema.org/InStock")
    expect(d.bannerClassName).toContain("emerald")
    expect(d.longLabel).toBe("Available")
  })

  it("maps 'reserved' → LimitedAvailability + yellow + 'Vehicle Reserved'", () => {
    const d = getVehicleStatusDisplay("reserved")
    expect(d.schemaAvailability).toBe("https://schema.org/LimitedAvailability")
    expect(d.bannerClassName).toContain("yellow")
    expect(d.longLabel).toBe("Vehicle Reserved")
    expect(d.shortLabel).toBe("This vehicle is reserved")
  })

  it("maps 'pending' → LimitedAvailability + orange + 'Sale Pending'", () => {
    const d = getVehicleStatusDisplay("pending")
    expect(d.schemaAvailability).toBe("https://schema.org/LimitedAvailability")
    expect(d.bannerClassName).toContain("orange")
    expect(d.longLabel).toBe("Sale Pending")
    expect(d.shortLabel).toBe("Sale pending")
  })

  it("maps 'sold' → SoldOut + red + 'Vehicle Sold'", () => {
    const d = getVehicleStatusDisplay("sold")
    expect(d.schemaAvailability).toBe("https://schema.org/SoldOut")
    expect(d.bannerClassName).toContain("red")
    expect(d.longLabel).toBe("Vehicle Sold")
    expect(d.shortLabel).toBe("This vehicle has been sold")
  })

  it("falls back to the 'sold' tokens for any unknown status (safe-by-default)", () => {
    const d = getVehicleStatusDisplay("totally-unknown" as unknown as string)
    expect(d.schemaAvailability).toBe("https://schema.org/SoldOut")
    expect(d.longLabel).toBe("Vehicle Sold")
  })

  it("falls back to the 'sold' tokens for null/undefined", () => {
    const dN = getVehicleStatusDisplay(null)
    const dU = getVehicleStatusDisplay(undefined)
    expect(dN.schemaAvailability).toBe("https://schema.org/SoldOut")
    expect(dU.schemaAvailability).toBe("https://schema.org/SoldOut")
  })

  it("never collides — every known status has a unique long label", () => {
    const statuses = ["available", "reserved", "pending", "sold"] as const
    const labels = statuses.map((s) => getVehicleStatusDisplay(s).longLabel)
    expect(new Set(labels).size).toBe(labels.length)
  })

  it("never collides — every known status has a unique schema.org URL only when semantically distinct", () => {
    // 'reserved' and 'pending' both correctly map to LimitedAvailability
    // (Google's vehicle structured data spec). The other two are unique.
    const a = getVehicleStatusDisplay("available").schemaAvailability
    const r = getVehicleStatusDisplay("reserved").schemaAvailability
    const p = getVehicleStatusDisplay("pending").schemaAvailability
    const s = getVehicleStatusDisplay("sold").schemaAvailability
    expect(a).not.toBe(r)
    expect(a).not.toBe(s)
    expect(r).not.toBe(s)
    expect(r).toBe(p) // both LimitedAvailability — by design
  })
})
