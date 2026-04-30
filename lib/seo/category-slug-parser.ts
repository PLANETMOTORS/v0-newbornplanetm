/**
 * lib/seo/category-slug-parser.ts
 *
 * Parses single-segment URL slugs from `/cars/[slug]` into a typed
 * filter spec used to query inventory and render category landing
 * pages. Returns `null` for slugs that don't match any known grammar
 * so the page route can short-circuit to a 404.
 *
 * Supported grammars (lowercase, hyphen-separated):
 *
 *   <make>                                e.g. tesla, bmw, porsche
 *   <bodyStyle>                           e.g. sedan, suv, coupe
 *   <fuelType>                            e.g. electric, hybrid, gas
 *   <premiumTag>                          e.g. luxury-evs, accident-free
 *   <fuelType>-<bodyStyle>                e.g. electric-suv, hybrid-sedan
 *   <premiumTag>-<bodyStyle>              e.g. luxury-suvs
 *   under-<priceK>k                       e.g. under-30k, under-50k
 *   <anyOfTheAbove>-in-<city>             e.g. electric-in-toronto
 *
 * Each rule is matched by an explicit branch — adding a grammar means
 * adding a branch; we never silently accept tokens we don't recognize,
 * which keeps the URL surface predictable for SEO and prevents
 * accidental duplicate-content pages.
 */

import { normalizeMake, toUrlSlug } from './make-model-normalizer'

/* ---------------------------- Vocabulary ---------------------------- */

/** Body styles served by a category page. */
export const KNOWN_BODY_STYLES = [
  'sedan',
  'suv',
  'coupe',
  'hatchback',
  'wagon',
  'truck',
  'minivan',
  'convertible',
] as const
export type BodyStyle = (typeof KNOWN_BODY_STYLES)[number]

/** Fuel-type slugs accepted in URLs. Maps to canonical column values. */
export const FUEL_TYPE_TO_DB: Record<string, string> = {
  electric: 'Electric',
  ev: 'Electric',
  evs: 'Electric',
  hybrid: 'Hybrid',
  hybrids: 'Hybrid',
  'plug-in-hybrid': 'PHEV',
  phev: 'PHEV',
  gas: 'Gasoline',
  gasoline: 'Gasoline',
  diesel: 'Diesel',
}

/** Maps body-style URL slug to the canonical DB value. */
export const BODY_STYLE_TO_DB: Record<string, string> = {
  sedan: 'Sedan',
  sedans: 'Sedan',
  suv: 'SUV',
  suvs: 'SUV',
  coupe: 'Coupe',
  coupes: 'Coupe',
  hatchback: 'Hatchback',
  hatchbacks: 'Hatchback',
  wagon: 'Wagon',
  wagons: 'Wagon',
  truck: 'Truck',
  trucks: 'Truck',
  minivan: 'Minivan',
  minivans: 'Minivan',
  convertible: 'Convertible',
  convertibles: 'Convertible',
}

/** Premium / editorial tags that map to combined filter sets. */
const PREMIUM_TAGS: Record<string, Partial<CategoryFilter>> = {
  'luxury-evs': { fuelTypeDb: 'Electric', isLuxury: true },
  'luxury-suvs': { bodyStyleDb: 'SUV', isLuxury: true },
  'luxury-cars': { isLuxury: true },
  'accident-free': { isAccidentFree: true },
  'certified-pre-owned': { isCertified: true },
  cpo: { isCertified: true },
}

/**
 * Cities served by Planet Motors with metadata used in copy generation.
 * Distance is to the Richmond Hill HQ; population for content depth.
 *
 * Scope per launch decision: GTA + Hamilton + Burlington + Niagara.
 * Add new cities here to expose them in the slug parser AND the
 * category sitemap automatically.
 */
export const KNOWN_CITIES: Record<
  string,
  { name: string; region: string; distance: number; population: string }
> = {
  toronto: { name: 'Toronto', region: 'Ontario', distance: 25, population: '2.9M' },
  'richmond-hill': { name: 'Richmond Hill', region: 'Ontario', distance: 0, population: '202K' },
  markham: { name: 'Markham', region: 'Ontario', distance: 10, population: '338K' },
  vaughan: { name: 'Vaughan', region: 'Ontario', distance: 15, population: '323K' },
  mississauga: { name: 'Mississauga', region: 'Ontario', distance: 40, population: '717K' },
  brampton: { name: 'Brampton', region: 'Ontario', distance: 35, population: '656K' },
  oakville: { name: 'Oakville', region: 'Ontario', distance: 55, population: '213K' },
  hamilton: { name: 'Hamilton', region: 'Ontario', distance: 75, population: '569K' },
  burlington: { name: 'Burlington', region: 'Ontario', distance: 80, population: '186K' },
  'niagara-falls': { name: 'Niagara Falls', region: 'Ontario', distance: 130, population: '94K' },
  'st-catharines': { name: "St. Catharines", region: 'Ontario', distance: 110, population: '136K' },
  ontario: { name: 'Ontario', region: 'Canada', distance: 0, population: '15M' },
}

/**
 * Makes Planet Motors regularly carries (or expects to carry post-launch).
 * Source-of-truth for category landing pages.
 */
export const KNOWN_MAKES = [
  'tesla',
  'bmw',
  'audi',
  'mercedes-benz',
  'porsche',
  'lexus',
  'genesis',
  'lucid',
  'rivian',
  'volkswagen',
  'volvo',
  'jaguar',
  'land-rover',
  'ford',
  'hyundai',
  'toyota',
  'honda',
  'kia',
  'mazda',
  'chevrolet',
  'nissan',
  'subaru',
  'acura',
  'infiniti',
] as const

/* ----------------------------- Types ------------------------------- */

export interface CategoryFilter {
  // Filter spec (used by Supabase queries)
  makeSlug?: string
  bodyStyleDb?: string
  fuelTypeDb?: string
  citySlug?: string
  priceMaxDollars?: number
  priceMinDollars?: number
  isLuxury?: boolean
  isAccidentFree?: boolean
  isCertified?: boolean

  // Display + SEO
  slug: string
  canonicalPath: string
  h1: string
  metaTitle: string
  metaDescription: string
  shortDescription: string
}

/* --------------------------- Parser ------------------------------- */

const PRICE_RE = /^under-(\d+)k$/

/**
 * Split slug at the `-in-<city>` boundary if and only if the suffix
 * matches a known city. Walks the boundaries right-to-left so the
 * latest `-in-` wins; this way, slugs like `plug-in-hybrid` stay
 * intact (because `hybrid` isn't a city) while `plug-in-hybrid-in-toronto`
 * still resolves to `[plug-in-hybrid, toronto]`.
 *
 *   "electric-in-toronto"          → ["electric", "toronto"]
 *   "luxury-evs-in-vaughan"        → ["luxury-evs", "vaughan"]
 *   "plug-in-hybrid"               → ["plug-in-hybrid", null]
 *   "plug-in-hybrid-in-toronto"    → ["plug-in-hybrid", "toronto"]
 *   "tesla"                        → ["tesla", null]
 */
function splitOnCity(slug: string): [string, string | null] {
  let idx = slug.lastIndexOf('-in-')
  while (idx >= 0) {
    const primary = slug.slice(0, idx)
    const city = slug.slice(idx + '-in-'.length)
    if (primary && city && KNOWN_CITIES[city]) {
      return [primary, city]
    }
    idx = idx === 0 ? -1 : slug.lastIndexOf('-in-', idx - 1)
  }
  return [slug, null]
}

/**
 * Resolve the "primary" portion (everything before `-in-<city>`) into
 * partial filter spec. Returns `null` if the primary doesn't match any
 * known grammar.
 */
function parsePrimary(primary: string): Partial<CategoryFilter> | null {
  // 1. Premium / editorial tags (multi-token literal match)
  if (PREMIUM_TAGS[primary]) {
    return { ...PREMIUM_TAGS[primary] }
  }

  // 2. Price filter: under-30k, under-50k, under-100k
  const priceMatch = PRICE_RE.exec(primary)
  if (priceMatch) {
    const num = parseInt(priceMatch[1], 10)
    if (num > 0 && num < 1000) {
      return { priceMaxDollars: num * 1000 }
    }
  }

  // 3. Single token: fuel, body, make
  if (FUEL_TYPE_TO_DB[primary]) {
    return { fuelTypeDb: FUEL_TYPE_TO_DB[primary] }
  }
  if (BODY_STYLE_TO_DB[primary]) {
    return { bodyStyleDb: BODY_STYLE_TO_DB[primary] }
  }
  // Strip trailing 's' for plural make slugs ("teslas" → "tesla")
  const makeCandidate = (KNOWN_MAKES as readonly string[]).includes(primary)
    ? primary
    : primary.endsWith('s') && (KNOWN_MAKES as readonly string[]).includes(primary.slice(0, -1))
      ? primary.slice(0, -1)
      : null
  if (makeCandidate) {
    return { makeSlug: normalizeMake(makeCandidate) }
  }

  // 4. Two-token combos: <fuelType>-<bodyStyle> or vice-versa
  const tokens = primary.split('-')
  if (tokens.length === 2) {
    const [a, b] = tokens
    const fuel = FUEL_TYPE_TO_DB[a] ?? FUEL_TYPE_TO_DB[b]
    const body = BODY_STYLE_TO_DB[a] ?? BODY_STYLE_TO_DB[b]
    if (fuel && body) {
      return { fuelTypeDb: fuel, bodyStyleDb: body }
    }
  }

  return null
}

/**
 * Build human-readable display fields for a fully-resolved filter.
 */
function withDisplay(
  partial: Partial<CategoryFilter>,
  slug: string,
): CategoryFilter {
  const cityMeta = partial.citySlug ? KNOWN_CITIES[partial.citySlug] : null
  const cityName = cityMeta?.name
  const cityPhrase = cityName ? ` in ${cityName}` : ''

  // Build the noun phrase: "Electric SUVs", "Luxury EVs", "Teslas", etc.
  const parts: string[] = []
  if (partial.isLuxury) parts.push('Luxury')
  if (partial.isAccidentFree) parts.push('Accident-Free')
  if (partial.isCertified) parts.push('Certified Pre-Owned')
  if (partial.fuelTypeDb === 'Electric') parts.push('Electric')
  else if (partial.fuelTypeDb === 'Hybrid') parts.push('Hybrid')
  else if (partial.fuelTypeDb === 'PHEV') parts.push('Plug-in Hybrid')
  else if (partial.fuelTypeDb === 'Gasoline') parts.push('Gasoline')
  else if (partial.fuelTypeDb === 'Diesel') parts.push('Diesel')

  if (partial.makeSlug) {
    const makeDisplay = partial.makeSlug
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join('-')
    parts.push(makeDisplay)
  }

  if (partial.bodyStyleDb) {
    parts.push(`${partial.bodyStyleDb}s`)
  } else if (parts.length === 0 || (!partial.makeSlug && !partial.fuelTypeDb)) {
    parts.push('Vehicles')
  } else {
    parts.push('Vehicles')
  }

  const noun = parts.join(' ')
  const priceClause = partial.priceMaxDollars
    ? ` Under $${(partial.priceMaxDollars / 1000).toFixed(0)}K`
    : ''

  const h1 = `${noun}${priceClause}${cityPhrase}`
  const metaTitle = `${h1} for Sale | Planet Motors`
  const metaDescription = cityName
    ? `Browse ${noun.toLowerCase()}${priceClause.toLowerCase()} for sale${cityPhrase}. 100% accident-free, 210-point inspection, Aviloo battery health on every EV. Free delivery in the GTA from Planet Motors Richmond Hill.`
    : `Browse ${noun.toLowerCase()}${priceClause.toLowerCase()} at Planet Motors. 100% accident-free, 210-point inspection, Aviloo battery health on every EV. Free delivery within 300km from Richmond Hill, Ontario.`
  const shortDescription = `${noun}${priceClause}${cityPhrase} — accident-free, inspected, Aviloo certified.`

  return {
    ...partial,
    slug,
    canonicalPath: `/cars/${slug}`,
    h1,
    metaTitle,
    metaDescription,
    shortDescription,
  }
}

/**
 * Top-level parser: resolves a `/cars/[slug]` segment into a full
 * `CategoryFilter`, or `null` if the slug isn't recognised.
 */
export function parseCategorySlug(rawSlug: string): CategoryFilter | null {
  const slug = toUrlSlug(rawSlug)
  if (!slug) return null

  const [primary, citySlug] = splitOnCity(slug)

  const partial = parsePrimary(primary)
  if (!partial) return null

  if (citySlug) {
    partial.citySlug = citySlug
  }

  return withDisplay(partial, slug)
}

/**
 * Enumerate all category slugs that are worth emitting in the sitemap.
 * Used by `lib/sitemap-builders.ts` so search engines see every page.
 *
 * The combinatorial explosion is bounded by:
 *   - cities × (fuel ∪ body ∪ premium) — single-pass cross-product
 *   - price-band × city
 *   - make × city (top luxury/EV makes only — see CITY_MAKES below)
 */
export const SITEMAP_CITY_MAKES = [
  'tesla',
  'bmw',
  'porsche',
  'audi',
  'mercedes-benz',
  'lexus',
  'genesis',
  'lucid',
  'rivian',
] as const

export const SITEMAP_PRIMARY_SLUGS = [
  // Fuel types
  'electric',
  'hybrid',
  'plug-in-hybrid',
  // Body styles
  'sedan',
  'suv',
  'coupe',
  'hatchback',
  'truck',
  // Premium tags
  'luxury-evs',
  'luxury-suvs',
  'luxury-cars',
  'accident-free',
  // Combos
  'electric-suv',
  'electric-sedan',
  'hybrid-suv',
  'hybrid-sedan',
  // Price bands
  'under-30k',
  'under-50k',
  'under-100k',
] as const

export function enumerateCategorySlugs(): string[] {
  const out: string[] = []

  // Bare primaries (no city)
  for (const p of SITEMAP_PRIMARY_SLUGS) out.push(p)
  for (const m of SITEMAP_CITY_MAKES) out.push(m)

  // City crosses
  for (const city of Object.keys(KNOWN_CITIES)) {
    for (const p of SITEMAP_PRIMARY_SLUGS) out.push(`${p}-in-${city}`)
    for (const m of SITEMAP_CITY_MAKES) out.push(`${m}-in-${city}`)
  }

  return out
}
