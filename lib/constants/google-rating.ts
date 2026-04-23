// Google Rating Configuration
// This is the single source of truth for Google rating display across the site
// The live data is fetched via /api/google-reviews which syncs with Google Places API

// Google Maps URL for Planet Motors
export const GOOGLE_MAPS_URL = "https://maps.app.goo.gl/BnMSuy2N9ssa3qo19"

// Default/fallback values (used when API is unavailable)
// These should match the current live Google rating
export const GOOGLE_RATING_DEFAULTS = {
  rating: 4.8,
  reviewCount: 500,
  ratingDisplay: "4.8/5",
  reviewsDisplay: "500+ reviews"
} as const

// For SEO structured data
export const GOOGLE_RATING_SEO = {
  ratingValue: "4.8",
  reviewCount: "500",
  bestRating: "5",
  worstRating: "1"
} as const

// Helper function to format rating display
export function formatRatingDisplay(rating: number, reviewCount: number): string {
  return `${rating}/5 (${reviewCount.toLocaleString()}+ reviews)`
}

// Helper function to get star count for display
export function getStarCount(rating: number): number {
  return Math.round(rating)
}
