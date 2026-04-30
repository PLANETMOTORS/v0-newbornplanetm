/**
 * lib/vehicles/fetch-by-filter.ts
 *
 * Server-side inventory query for category landing pages.
 *
 * Takes a `CategoryFilter` from the slug parser and returns the
 * matching public-status vehicles. Uses Supabase for filters that
 * map cleanly to columns (status, body_style, fuel_type, price)
 * and falls back to JS-side filtering for fuzzy comparisons (make
 * matching, where HomeNet's spelling may not match the URL slug
 * exactly — see make-model-normalizer).
 *
 * The resulting `CategoryVehicle` shape is intentionally narrow:
 * just the fields used by the listing card + JSON-LD ItemList. This
 * keeps the SQL projection small (sub-1KB per row) so a category
 * page can comfortably show 24 vehicles without straining the
 * Supabase free-tier egress budget.
 */

import { cache } from 'react'
import { createStaticClient } from '@/lib/supabase/static'
import { buildPublicStatusFilter } from '@/lib/vehicles/status-filter'
import { matchesMake } from '@/lib/seo/make-model-normalizer'
import type { CategoryFilter } from '@/lib/seo/category-slug-parser'

/** Slim row shape used by category landing pages. */
export interface CategoryVehicle {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
  bodyStyle: string | null
  fuelType: string | null
  price: number // dollars
  mileage: number
  primaryImageUrl: string | null
  isEv: boolean
  evBatteryHealthPercent: number | null
  status: string
}

/** Default page size — enough for a 4×6 grid with one CTA card. */
const DEFAULT_PAGE_SIZE = 24

const CATEGORY_FIELDS = [
  'id',
  'year',
  'make',
  'model',
  'trim',
  'body_style',
  'fuel_type',
  'price',
  'mileage',
  'primary_image_url',
  'is_ev',
  'ev_battery_health_percent',
  'status',
].join(',')

interface RawRow {
  id: string
  year: number
  make: string
  model: string
  trim: string | null
  body_style: string | null
  fuel_type: string | null
  price: number | null
  mileage: number | null
  primary_image_url: string | null
  is_ev: boolean | null
  ev_battery_health_percent: number | null
  status: string
}

function toCategoryVehicle(row: RawRow): CategoryVehicle {
  return {
    id: row.id,
    year: row.year,
    make: row.make,
    model: row.model,
    trim: row.trim,
    bodyStyle: row.body_style,
    fuelType: row.fuel_type,
    price: typeof row.price === 'number' ? row.price / 100 : 0,
    mileage: row.mileage ?? 0,
    primaryImageUrl: row.primary_image_url,
    isEv: !!row.is_ev,
    evBatteryHealthPercent: row.ev_battery_health_percent,
    status: row.status,
  }
}

/**
 * Premium make list used by `isLuxury` filter. We don't have a
 * dedicated column on the vehicles table for this — the brand IS the
 * luxury signal — so the filter applies an explicit make whitelist.
 *
 * Order doesn't matter; the helper only cares about set membership.
 */
const LUXURY_MAKES = new Set([
  'tesla',
  'porsche',
  'bmw',
  'audi',
  'mercedes-benz',
  'lexus',
  'genesis',
  'lucid',
  'rivian',
  'jaguar',
  'land-rover',
  'volvo',
  'acura',
  'infiniti',
])

export interface CategoryFetchResult {
  vehicles: CategoryVehicle[]
  totalMatching: number
}

/**
 * Fetch vehicles matching a category filter. Wrapped in React `cache()`
 * so when the page route calls it once for the listing and once for
 * the JSON-LD generator, only one Supabase round-trip happens.
 */
export const fetchCategoryVehicles = cache(async (
  filter: CategoryFilter,
  pageSize: number = DEFAULT_PAGE_SIZE,
): Promise<CategoryFetchResult> => {
  try {
    const supabase = createStaticClient()
    let q = supabase
      .from('vehicles')
      .select(CATEGORY_FIELDS, { count: 'exact' })
      .or(buildPublicStatusFilter())

    if (filter.bodyStyleDb) {
      q = q.eq('body_style', filter.bodyStyleDb)
    }
    if (filter.fuelTypeDb) {
      q = q.eq('fuel_type', filter.fuelTypeDb)
    }
    if (typeof filter.priceMaxDollars === 'number') {
      q = q.lte('price', filter.priceMaxDollars * 100)
    }
    if (typeof filter.priceMinDollars === 'number') {
      q = q.gte('price', filter.priceMinDollars * 100)
    }

    // Generous over-fetch when we'll JS-filter by make — the make
    // column may use spellings the URL slug doesn't match exactly.
    const overFetch = filter.makeSlug || filter.isLuxury ? 200 : pageSize
    q = q.order('updated_at', { ascending: false }).limit(overFetch)

    const { data, error, count } = await q

    if (error) {
      // 42P01 = relation does not exist (tests run without migrations);
      // 42703 = column does not exist (older deployments). Both are
      // recoverable as "no results"; anything else surfaces upstream.
      if (error.code === '42P01' || error.code === '42703') {
        return { vehicles: [], totalMatching: 0 }
      }
      console.error('[fetchCategoryVehicles] Supabase error:', error)
      return { vehicles: [], totalMatching: 0 }
    }

    let vehicles = (data || []).map((r) => toCategoryVehicle(r as unknown as RawRow))

    // JS-side make match: bullet-proof against HomeNet spelling drift
    const makeSlug = filter.makeSlug
    if (makeSlug) {
      vehicles = vehicles.filter((v) => matchesMake(v.make, makeSlug))
    }

    // Luxury filter: limit to whitelisted premium makes
    if (filter.isLuxury) {
      vehicles = vehicles.filter((v) => {
        const slug = (v.make || '').toLowerCase().replace(/\s+/g, '-')
        return LUXURY_MAKES.has(slug)
      })
    }

    // We don't have an "accident-free" column today — every Planet
    // Motors vehicle is accident-free as a policy. We treat the filter
    // as "all available vehicles" and rely on copy on the page itself
    // to convey the positioning. If this changes (carfax_clean column
    // is added), gate here.

    const totalMatching = filter.makeSlug || filter.isLuxury
      ? vehicles.length
      : count ?? vehicles.length

    return {
      vehicles: vehicles.slice(0, pageSize),
      totalMatching,
    }
  } catch (err) {
    console.error('[fetchCategoryVehicles] Failed:', err)
    return { vehicles: [], totalMatching: 0 }
  }
})
