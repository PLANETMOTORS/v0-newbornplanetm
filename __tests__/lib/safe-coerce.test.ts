import { describe, it, expect } from "vitest"
import {
  asStr,
  asOptStr,
  asNum,
  asScalarString,
  pickString,
  pickNumber,
} from "@/lib/safe-coerce"

describe("lib/safe-coerce", () => {
  describe("asStr", () => {
    it("returns a plain string unchanged", () => {
      expect(asStr("Tesla")).toBe("Tesla")
    })

    it("returns the empty string for non-string input by default", () => {
      expect(asStr(undefined)).toBe("")
      expect(asStr(null)).toBe("")
      expect(asStr(42)).toBe("")
      expect(asStr(true)).toBe("")
      expect(asStr({ toString: () => "evil" })).toBe("")
      expect(asStr(["array"])).toBe("")
    })

    it("respects a custom fallback for non-string input", () => {
      expect(asStr(undefined, "default")).toBe("default")
      expect(asStr({ a: 1 }, "fallback")).toBe("fallback")
    })

    it("returns the empty string unchanged (it is still a string)", () => {
      expect(asStr("")).toBe("")
    })
  })

  describe("asOptStr", () => {
    it("returns the string when input is a string", () => {
      expect(asOptStr("Model 3")).toBe("Model 3")
    })

    it("returns undefined for non-string input", () => {
      expect(asOptStr(undefined)).toBeUndefined()
      expect(asOptStr(null)).toBeUndefined()
      expect(asOptStr(0)).toBeUndefined()
      expect(asOptStr(false)).toBeUndefined()
      expect(asOptStr({})).toBeUndefined()
      expect(asOptStr([])).toBeUndefined()
    })
  })

  describe("asNum", () => {
    it("returns a finite number unchanged", () => {
      expect(asNum(42)).toBe(42)
      expect(asNum(-7.5)).toBe(-7.5)
      expect(asNum(0)).toBe(0)
    })

    it("returns the fallback for non-numeric input", () => {
      expect(asNum("42")).toBe(0)
      expect(asNum(undefined)).toBe(0)
      expect(asNum(null)).toBe(0)
      expect(asNum({})).toBe(0)
      expect(asNum([1, 2, 3])).toBe(0)
    })

    it("treats Infinity / NaN as non-numeric and falls back", () => {
      expect(asNum(Number.POSITIVE_INFINITY)).toBe(0)
      expect(asNum(Number.NEGATIVE_INFINITY)).toBe(0)
      expect(asNum(Number.NaN)).toBe(0)
    })

    it("respects a custom fallback", () => {
      expect(asNum(undefined, 999)).toBe(999)
      expect(asNum(Number.NaN, -1)).toBe(-1)
    })
  })

  describe("asScalarString", () => {
    it("returns plain strings unchanged", () => {
      expect(asScalarString("hello")).toBe("hello")
    })

    it("stringifies finite numbers", () => {
      expect(asScalarString(42)).toBe("42")
      expect(asScalarString(-7.5)).toBe("-7.5")
      expect(asScalarString(0)).toBe("0")
    })

    it("falls back for NaN / Infinity / non-primitives", () => {
      expect(asScalarString(Number.NaN)).toBe("")
      expect(asScalarString(Number.POSITIVE_INFINITY)).toBe("")
      expect(asScalarString(Number.NEGATIVE_INFINITY)).toBe("")
      expect(asScalarString(undefined)).toBe("")
      expect(asScalarString(null)).toBe("")
      expect(asScalarString({})).toBe("")
      expect(asScalarString([1])).toBe("")
      expect(asScalarString(true)).toBe("")
    })

    it("respects a custom fallback for non-primitives", () => {
      expect(asScalarString(undefined, "n/a")).toBe("n/a")
      expect(asScalarString({}, "n/a")).toBe("n/a")
    })
  })

  describe("pickString", () => {
    it("reads a string field from a record", () => {
      expect(pickString({ a: "yes" }, "a")).toBe("yes")
    })

    it("returns the fallback for missing or non-string fields", () => {
      expect(pickString({ a: 1 }, "a")).toBe("")
      expect(pickString({ a: null }, "a")).toBe("")
      expect(pickString({ a: { nested: true } }, "a")).toBe("")
      expect(pickString({}, "missing")).toBe("")
    })

    it("returns the fallback when the record is null or undefined", () => {
      expect(pickString(null, "any")).toBe("")
      expect(pickString(undefined, "any")).toBe("")
      expect(pickString(null, "any", "default")).toBe("default")
      expect(pickString(undefined, "any", "default")).toBe("default")
    })

    it("respects a custom fallback for missing fields", () => {
      expect(pickString({}, "k", "fallback")).toBe("fallback")
    })
  })

  describe("pickNumber", () => {
    it("reads a finite number field from a record", () => {
      expect(pickNumber({ a: 42 }, "a")).toBe(42)
      expect(pickNumber({ a: 0 }, "a")).toBe(0)
    })

    it("returns the fallback for missing / non-numeric / NaN / Infinity fields", () => {
      expect(pickNumber({ a: "42" }, "a")).toBe(0)
      expect(pickNumber({ a: null }, "a")).toBe(0)
      expect(pickNumber({ a: Number.NaN }, "a")).toBe(0)
      expect(pickNumber({ a: Number.POSITIVE_INFINITY }, "a")).toBe(0)
      expect(pickNumber({}, "missing")).toBe(0)
    })

    it("returns the fallback when the record is null or undefined", () => {
      expect(pickNumber(null, "any")).toBe(0)
      expect(pickNumber(undefined, "any")).toBe(0)
      expect(pickNumber(null, "any", 99)).toBe(99)
      expect(pickNumber(undefined, "any", 99)).toBe(99)
    })

    it("respects a custom fallback for missing / non-numeric fields", () => {
      expect(pickNumber({}, "k", -1)).toBe(-1)
      expect(pickNumber({ a: "x" }, "a", -1)).toBe(-1)
    })
  })
})
