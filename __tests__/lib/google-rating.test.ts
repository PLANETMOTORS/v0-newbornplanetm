import { describe, expect, it } from "vitest"
import {
  GOOGLE_MAPS_URL,
  GOOGLE_RATING_DEFAULTS,
  GOOGLE_RATING_SEO,
  formatRatingDisplay,
  getStarCount,
} from "@/lib/constants/google-rating"

describe("constants/google-rating", () => {
  it("GOOGLE_MAPS_URL is the public Maps share link", () => {
    expect(GOOGLE_MAPS_URL).toMatch(/^https:\/\/maps\.app\.goo\.gl\//)
  })

  it("GOOGLE_RATING_DEFAULTS hold the expected fallback values", () => {
    expect(GOOGLE_RATING_DEFAULTS.rating).toBe(4.8)
    expect(GOOGLE_RATING_DEFAULTS.reviewCount).toBe(500)
    expect(GOOGLE_RATING_DEFAULTS.ratingDisplay).toBe("4.8/5")
    expect(GOOGLE_RATING_DEFAULTS.reviewsDisplay).toBe("500+ reviews")
  })

  it("GOOGLE_RATING_SEO supplies structured-data values as strings", () => {
    expect(GOOGLE_RATING_SEO.ratingValue).toBe("4.8")
    expect(GOOGLE_RATING_SEO.reviewCount).toBe("500")
    expect(GOOGLE_RATING_SEO.bestRating).toBe("5")
    expect(GOOGLE_RATING_SEO.worstRating).toBe("1")
  })

  describe("formatRatingDisplay", () => {
    it("formats with 'X/5 (N+ reviews)' shape", () => {
      expect(formatRatingDisplay(4.8, 500)).toBe("4.8/5 (500+ reviews)")
    })

    it("locale-formats large review counts", () => {
      expect(formatRatingDisplay(5.0, 1234)).toContain("1,234")
    })

    it("handles zero counts", () => {
      expect(formatRatingDisplay(0, 0)).toBe("0/5 (0+ reviews)")
    })
  })

  describe("getStarCount", () => {
    it.each([
      [4.4, 4],
      [4.5, 5],
      [4.8, 5],
      [3.49, 3],
      [0, 0],
      [5, 5],
    ])("rounds %s to %s", (rating, expected) => {
      expect(getStarCount(rating)).toBe(expected)
    })
  })
})
