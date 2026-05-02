import { describe, it, expect } from "vitest"
import {
  coerceFrameCountInput,
  resolveFrameCount,
  sanitizeStockNumber,
  DEFAULT_SPIN_FRAME_COUNT,
  MIN_SPIN_FRAME_COUNT,
} from "@/lib/spin-manifest/helpers"

describe("lib/spin-manifest/helpers → coerceFrameCountInput", () => {
  it("returns numbers unchanged", () => {
    expect(coerceFrameCountInput(72)).toBe(72)
    expect(coerceFrameCountInput(0)).toBe(0)
    expect(coerceFrameCountInput(-5)).toBe(-5)
  })

  it("parses numeric strings", () => {
    expect(coerceFrameCountInput("60")).toBe(60)
    expect(coerceFrameCountInput("0")).toBe(0)
    expect(coerceFrameCountInput("12px")).toBe(12)
  })

  it("returns NaN for unparseable strings", () => {
    expect(Number.isNaN(coerceFrameCountInput("abc"))).toBe(true)
  })

  it("returns NaN for non-string non-number input", () => {
    expect(Number.isNaN(coerceFrameCountInput(null))).toBe(true)
    expect(Number.isNaN(coerceFrameCountInput(undefined))).toBe(true)
    expect(Number.isNaN(coerceFrameCountInput({}))).toBe(true)
    expect(Number.isNaN(coerceFrameCountInput([]))).toBe(true)
    expect(Number.isNaN(coerceFrameCountInput(true))).toBe(true)
  })
})

describe("lib/spin-manifest/helpers → resolveFrameCount", () => {
  it("returns the value when it is a valid number ≥ MIN_SPIN_FRAME_COUNT", () => {
    expect(resolveFrameCount(72)).toBe(72)
    expect(resolveFrameCount(120)).toBe(120)
    expect(resolveFrameCount(MIN_SPIN_FRAME_COUNT)).toBe(MIN_SPIN_FRAME_COUNT)
  })

  it("clamps low values up to MIN_SPIN_FRAME_COUNT", () => {
    expect(resolveFrameCount(10)).toBe(MIN_SPIN_FRAME_COUNT)
    expect(resolveFrameCount(0)).toBe(MIN_SPIN_FRAME_COUNT)
    expect(resolveFrameCount(-5)).toBe(MIN_SPIN_FRAME_COUNT)
  })

  it("falls back to DEFAULT_SPIN_FRAME_COUNT for non-finite inputs", () => {
    expect(resolveFrameCount(undefined)).toBe(DEFAULT_SPIN_FRAME_COUNT)
    expect(resolveFrameCount(null)).toBe(DEFAULT_SPIN_FRAME_COUNT)
    expect(resolveFrameCount("abc")).toBe(DEFAULT_SPIN_FRAME_COUNT)
    expect(resolveFrameCount({})).toBe(DEFAULT_SPIN_FRAME_COUNT)
    expect(resolveFrameCount(Number.NaN)).toBe(DEFAULT_SPIN_FRAME_COUNT)
    expect(resolveFrameCount(Number.POSITIVE_INFINITY)).toBe(DEFAULT_SPIN_FRAME_COUNT)
  })

  it("parses numeric strings", () => {
    expect(resolveFrameCount("96")).toBe(96)
    expect(resolveFrameCount("16")).toBe(MIN_SPIN_FRAME_COUNT) // clamped
  })
})

describe("lib/spin-manifest/helpers → sanitizeStockNumber", () => {
  it("returns trimmed string for non-empty string input", () => {
    expect(sanitizeStockNumber("PM-001")).toBe("PM-001")
    expect(sanitizeStockNumber("  PM-002 ")).toBe("PM-002")
  })

  it("returns null for empty / whitespace-only strings", () => {
    expect(sanitizeStockNumber("")).toBeNull()
    expect(sanitizeStockNumber("   ")).toBeNull()
  })

  it("returns null for non-string input", () => {
    expect(sanitizeStockNumber(123)).toBeNull()
    expect(sanitizeStockNumber(null)).toBeNull()
    expect(sanitizeStockNumber(undefined)).toBeNull()
    expect(sanitizeStockNumber({})).toBeNull()
    expect(sanitizeStockNumber([])).toBeNull()
    expect(sanitizeStockNumber(true)).toBeNull()
  })
})
