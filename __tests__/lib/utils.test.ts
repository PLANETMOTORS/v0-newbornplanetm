import { describe, it, expect } from "vitest"
import { cn } from "@/lib/utils"

describe("cn (class merge helper)", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b", "c")).toBe("a b c")
  })

  it("filters falsy values", () => {
    expect(cn("a", false, "b", null, undefined, "c")).toBe("a b c")
  })

  it("handles object form", () => {
    expect(cn({ a: true, b: false })).toBe("a")
  })

  it("dedupes Tailwind class collisions (twMerge)", () => {
    // twMerge keeps the last px-* directive
    expect(cn("px-2 px-4")).toBe("px-4")
    expect(cn("text-sm", "text-base")).toBe("text-base")
  })

  it("returns empty string when no classes", () => {
    expect(cn()).toBe("")
  })
})
