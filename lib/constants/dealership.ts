/**
 * Dealership location — single source of truth for coordinates and address.
 *
 * Used by delivery tracking APIs, JSON-LD structured data, and anywhere
 * the physical dealership location is referenced.
 */
export const DEALERSHIP_LOCATION = {
  name: "Planet Motors",
  streetAddress: "30 Major Mackenzie Dr E",
  city: "Richmond Hill",
  province: "ON",
  postalCode: "L4C 1G7",
  country: "CA",
  lat: 43.8828,
  lng: -79.4375,
} as const

/** Pre-formatted address string for display. */
export const DEALERSHIP_ADDRESS_DISPLAY = `${DEALERSHIP_LOCATION.streetAddress}, ${DEALERSHIP_LOCATION.city}, ${DEALERSHIP_LOCATION.province}`

// ─── Business Hours — Single Source of Truth ───────────────────────
// Change hours HERE and every component, JSON-LD schema, API route,
// and display string across the site will update automatically.

export const DEALERSHIP_TIMEZONE = "America/Toronto"

/** Weekday (Mon-Fri) hours */
export const WEEKDAY_OPEN = 9   // 9:00 AM
export const WEEKDAY_CLOSE = 19 // 7:00 PM

/** Saturday hours */
export const SATURDAY_OPEN = 9  // 9:00 AM
export const SATURDAY_CLOSE = 18 // 6:00 PM

/** Sunday — closed */
export const SUNDAY_CLOSED = true

/**
 * Numeric business hours map.
 * 0 = Sunday, 1 = Monday … 6 = Saturday.
 * Used by booking/availability logic.
 */
export const BUSINESS_HOURS: Record<number, { open: number; close: number } | null> = {
  0: null, // Sunday — Closed
  1: { open: WEEKDAY_OPEN, close: WEEKDAY_CLOSE },
  2: { open: WEEKDAY_OPEN, close: WEEKDAY_CLOSE },
  3: { open: WEEKDAY_OPEN, close: WEEKDAY_CLOSE },
  4: { open: WEEKDAY_OPEN, close: WEEKDAY_CLOSE },
  5: { open: WEEKDAY_OPEN, close: WEEKDAY_CLOSE },
  6: { open: SATURDAY_OPEN, close: SATURDAY_CLOSE },
}

// ─── Derived display / schema helpers ──────────────────────────────

const fmt12 = (h: number) => {
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h > 12 ? h - 12 : h
  return `${hour}${suffix}`
}
const fmt24 = (h: number) => `${String(h).padStart(2, "0")}:00`

/** "Mon-Fri 9AM-7PM, Sat 9AM-6PM (EST)" */
export const BUSINESS_HOURS_DISPLAY = `Mon-Fri ${fmt12(WEEKDAY_OPEN)}-${fmt12(WEEKDAY_CLOSE)}, Sat ${fmt12(SATURDAY_OPEN)}-${fmt12(SATURDAY_CLOSE)} (EST)`

/** "Mon-Fri 9AM-7PM | Sat 9AM-6PM" — used in header bar */
export const BUSINESS_HOURS_SHORT = `Mon-Fri ${fmt12(WEEKDAY_OPEN)}-${fmt12(WEEKDAY_CLOSE)} | Sat ${fmt12(SATURDAY_OPEN)}-${fmt12(SATURDAY_CLOSE)}`

/** Fallback display strings for components reading from CMS */
export const WEEKDAY_HOURS_FALLBACK = `${fmt12(WEEKDAY_OPEN)}-${fmt12(WEEKDAY_CLOSE)}`
export const SATURDAY_HOURS_FALLBACK = `${fmt12(SATURDAY_OPEN)}-${fmt12(SATURDAY_CLOSE)}`

/** "9:00 AM - 7:00 PM" style for contact pages */
const fmtLong = (h: number) => {
  const suffix = h >= 12 ? "PM" : "AM"
  const hour = h > 12 ? h - 12 : h
  return `${hour}:00 ${suffix}`
}
export const WEEKDAY_HOURS_LONG = `${fmtLong(WEEKDAY_OPEN)} - ${fmtLong(WEEKDAY_CLOSE)}`
export const SATURDAY_HOURS_LONG = `${fmtLong(SATURDAY_OPEN)} - ${fmtLong(SATURDAY_CLOSE)}`

/** JSON-LD openingHoursSpecification array — reuse in all schemas */
export const OPENING_HOURS_SPECIFICATION = [
  {
    "@type": "OpeningHoursSpecification" as const,
    dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    opens: fmt24(WEEKDAY_OPEN),
    closes: fmt24(WEEKDAY_CLOSE),
  },
  {
    "@type": "OpeningHoursSpecification" as const,
    dayOfWeek: "Saturday",
    opens: fmt24(SATURDAY_OPEN),
    closes: fmt24(SATURDAY_CLOSE),
  },
]
