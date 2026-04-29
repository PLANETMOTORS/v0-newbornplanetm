import { describe, it, expect } from "vitest"
import {
  GOOGLE_MAPS_URL,
  GOOGLE_RATING_DEFAULTS,
  GOOGLE_RATING_SEO,
  formatRatingDisplay,
  getStarCount,
} from "@/lib/constants/google-rating"

describe("constants/google-rating", () => {
  it("has Google Maps URL", () => {
    expect(GOOGLE_MAPS_URL).toContain("maps.app.goo.gl")
  })

  it("has rating defaults", () => {
    expect(GOOGLE_RATING_DEFAULTS.rating).toBe(4.8)
    expect(GOOGLE_RATING_DEFAULTS.reviewCount).toBe(500)
    expect(GOOGLE_RATING_DEFAULTS.ratingDisplay).toContain("4.8")
  })

  it("has SEO rating data", () => {
    expect(GOOGLE_RATING_SEO.bestRating).toBe("5")
    expect(GOOGLE_RATING_SEO.worstRating).toBe("1")
  })

  describe("formatRatingDisplay", () => {
    it("formats rating with review count", () => {
      expect(formatRatingDisplay(4.8, 500)).toBe("4.8/5 (500+ reviews)")
    })

    it("formats with large review count", () => {
      expect(formatRatingDisplay(5.0, 1234)).toContain("1,234+")
    })
  })

  describe("getStarCount", () => {
    it("rounds to nearest star", () => {
      expect(getStarCount(4.8)).toBe(5)
      expect(getStarCount(4.2)).toBe(4)
      expect(getStarCount(3.5)).toBe(4)
    })
  })
})
