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
