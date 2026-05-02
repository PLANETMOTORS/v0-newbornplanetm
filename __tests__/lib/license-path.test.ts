import { describe, it, expect } from "vitest"
import { isValidLicensePath } from "@/lib/license-path"

describe("isValidLicensePath", () => {
  it("accepts well-formed paths", () => {
    expect(isValidLicensePath("abc-123/0_license.jpg", "abc-123")).toBe(true)
    expect(isValidLicensePath("abc-123/1_license.png", "abc-123")).toBe(true)
    expect(isValidLicensePath("abc-123/2_license.webp", "abc-123")).toBe(true)
    expect(isValidLicensePath("abc-123/9_license.pdf", "abc-123")).toBe(true)
  })

  it("rejects paths whose prefix doesn't match the vehicleId", () => {
    expect(isValidLicensePath("other-vehicle/0_license.jpg", "abc-123")).toBe(
      false
    )
  })

  it("rejects unknown extensions", () => {
    expect(isValidLicensePath("abc-123/0_license.gif", "abc-123")).toBe(false)
  })

  it("rejects paths missing the index", () => {
    expect(isValidLicensePath("abc-123/license.jpg", "abc-123")).toBe(false)
  })

  it("rejects paths with traversal characters", () => {
    expect(isValidLicensePath("../abc-123/0_license.jpg", "abc-123")).toBe(
      false
    )
    expect(isValidLicensePath("abc-123/../0_license.jpg", "abc-123")).toBe(
      false
    )
  })

  it("sanitises non-alphanumeric characters in the vehicleId before matching", () => {
    // vehicleId 'abc/123' becomes 'abc_123' for the prefix check
    expect(isValidLicensePath("abc_123/0_license.jpg", "abc/123")).toBe(true)
  })
})
