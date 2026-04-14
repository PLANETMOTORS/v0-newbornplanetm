import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getCachedSearchResults, cacheSearchResults } from '@/lib/redis'

const FACETS_CACHE_KEY = 'vehicles:facets:snapshot'
const FACETS_TTL = 900 // 15 minutes

interface FacetRow {
  make: string | null
  body_style: string | null
  fuel_type: string | null
  transmission: string | null
  drivetrain: string | null
  price: number | null
  year: number | null
}

interface FacetsPayload {
  makes: string[]
  bodyStyles: string[]
  fuelTypes: string[]
  transmissions: string[]
  drivetrains: string[]
  priceRange: { min: number; max: number }
  yearRange: { min: number; max: number }
  total: number
  cachedAt: string
}

// GET /api/v1/vehicles/facets
// Returns distilled filter options for the inventory sidebar.
// Response is Redis-cached for 15 min and CDN-cached for the same window.
export async function GET() {
  // --- Redis cache read ---
  const cached = await getCachedSearchResults(FACETS_CACHE_KEY)
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        'Cache-Control': `public, s-maxage=${FACETS_TTL}, stale-while-revalidate=3600`,
        'X-Cache': 'HIT',
      },
    })
  }

  // --- Cache miss: query Supabase ---
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('vehicles')
    .select('make, body_style, fuel_type, transmission, drivetrain, price, year')
    .eq('status', 'available')
    .limit(5000)

  if (error) {
    return NextResponse.json({ error: 'Failed to load facets' }, { status: 500 })
  }

  const rows = (data ?? []) as FacetRow[]

  const makesSet = new Set<string>()
  const bodyStylesSet = new Set<string>()
  const fuelTypesSet = new Set<string>()
  const transmissionsSet = new Set<string>()
  const drivetrainsSet = new Set<string>()
  let minPrice = Infinity
  let maxPrice = -Infinity
  let minYear = Infinity
  let maxYear = -Infinity

  for (const row of rows) {
    if (row.make) makesSet.add(row.make)
    if (row.body_style) bodyStylesSet.add(row.body_style)
    if (row.fuel_type) fuelTypesSet.add(row.fuel_type)
    if (row.transmission) transmissionsSet.add(row.transmission)
    if (row.drivetrain) drivetrainsSet.add(row.drivetrain)
    if (row.price != null) {
      if (row.price < minPrice) minPrice = row.price
      if (row.price > maxPrice) maxPrice = row.price
    }
    if (row.year != null) {
      if (row.year < minYear) minYear = row.year
      if (row.year > maxYear) maxYear = row.year
    }
  }

  const payload: FacetsPayload = {
    makes: [...makesSet].sort(),
    bodyStyles: [...bodyStylesSet].sort(),
    fuelTypes: [...fuelTypesSet].sort(),
    transmissions: [...transmissionsSet].sort(),
    drivetrains: [...drivetrainsSet].sort(),
    priceRange: {
      min: minPrice === Infinity ? 0 : minPrice / 100,
      max: maxPrice === -Infinity ? 0 : maxPrice / 100,
    },
    yearRange: {
      min: minYear === Infinity ? 0 : minYear,
      max: maxYear === -Infinity ? 0 : maxYear,
    },
    total: rows.length,
    cachedAt: new Date().toISOString(),
  }

  // --- Populate Redis cache ---
  await cacheSearchResults(FACETS_CACHE_KEY, payload, FACETS_TTL)

  return NextResponse.json(payload, {
    headers: {
      'Cache-Control': `public, s-maxage=${FACETS_TTL}, stale-while-revalidate=3600`,
      'X-Cache': 'MISS',
    },
  })
}
