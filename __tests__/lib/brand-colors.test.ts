import { describe, it, expect } from "vitest"
import {
  BRAND,
  BRAND_ROLE,
  BRAND_BG_CLASS,
  BRAND_TEXT_CLASS,
  BRAND_RING_CLASS,
} from "@/lib/brand/colors"

const HEX = /^#[0-9a-f]{6}$/

describe("BRAND palette", () => {
  it("every value is a 6-digit lowercase hex", () => {
    for (const [name, value] of Object.entries(BRAND)) {
      expect(value, `BRAND.${name} = ${value}`).toMatch(HEX)
    }
  })

  it("BRAND_ROLE aliases all resolve to a hex in BRAND", () => {
    const palette = new Set(Object.values(BRAND))
    for (const v of Object.values(BRAND_ROLE)) {
      expect(palette.has(v)).toBe(true)
    }
  })
})

describe("Tailwind class maps", () => {
  it.each([
    ["bg", BRAND_BG_CLASS],
    ["text", BRAND_TEXT_CLASS],
    ["ring", BRAND_RING_CLASS],
  ])("each %s class is bg/text/ring-brand-<role>", (kind, map) => {
    for (const [role, klass] of Object.entries(map)) {
      expect(klass).toBe(`${kind}-brand-${role === "primary" ? "navy" : role === "urgency" ? "red" : role === "ev" ? "green" : role === "shopping" ? "orange" : "purple"}`)
    }
  })

  it("each role appears in all three maps", () => {
    for (const role of Object.keys(BRAND_ROLE)) {
      expect(BRAND_BG_CLASS[role as keyof typeof BRAND_BG_CLASS]).toBeTruthy()
      expect(BRAND_TEXT_CLASS[role as keyof typeof BRAND_TEXT_CLASS]).toBeTruthy()
      expect(BRAND_RING_CLASS[role as keyof typeof BRAND_RING_CLASS]).toBeTruthy()
    }
  })
})
