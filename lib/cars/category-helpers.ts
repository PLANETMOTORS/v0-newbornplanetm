/**
 * lib/cars/category-helpers.ts
 *
 * Pure helpers used by the `/cars/[slug]` category page route. Lifted
 * out of the page module so they can be unit-tested without the
 * Server Component rendering harness.
 */

import type { CategoryFilter } from '@/lib/seo/category-slug-parser'

/** Format a dollar amount as a localized CAD string with no decimals. */
export function formatPrice(p: number): string {
  return `$${p.toLocaleString('en-CA', { maximumFractionDigits: 0 })}`
}

/** Format a kilometer count as a localized "X km" string. */
export function formatKm(km: number): string {
  return `${km.toLocaleString('en-CA')} km`
}

/**
 * Pick the closest related in-stock category to surface as a fallback
 * link on the empty-state. The priority order matches what a buyer
 * would most likely accept as a substitute: same fuel-type wins over
 * same body-style wins over same brand tier.
 *
 *   { fuelTypeDb: 'Electric' }   → /cars/electric
 *   { bodyStyleDb: 'SUV' }       → /cars/suv
 *   { makeSlug: 'tesla' }        → /cars/luxury-evs
 *   else                         → /inventory
 */
export function pickFallbackHref(filter: CategoryFilter): string {
  if (filter.fuelTypeDb === 'Electric') return '/cars/electric'
  if (filter.bodyStyleDb === 'SUV') return '/cars/suv'
  if (filter.makeSlug) return '/cars/luxury-evs'
  return '/inventory'
}
