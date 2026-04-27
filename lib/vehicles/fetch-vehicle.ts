/**
 * Server-side vehicle data fetcher for SSR.
 *
 * Queries Supabase directly — no API round-trip.
 * Uses createStaticClient (anon key, no cookies) so the route remains
 * compatible with ISR / static generation.
 *
 * @module lib/vehicles/fetch-vehicle
 */

import { createStaticClient } from "@/lib/supabase/static"
import { getDriveeMidFromDb } from "@/lib/drivee-db"
import { calculateAllInPrice, safeNum, type AllInPriceBreakdown } from "@/lib/pricing/format"
import { cache } from "react"

/** UUID v4 pattern. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
/** Standard 17-character VIN. */
const VIN_RE = /^[A-HJ-NPR-Z0-9]{17}$/i

const VEHICLE_DETAIL_FIELDS = [
  'id', 'stock_number', 'vin', 'year', 'make', 'model', 'trim',
  'body_style', 'exterior_color', 'interior_color',
  'price', 'msrp', 'mileage', 'drivetrain', 'transmission', 'engine',
  'fuel_type', 'status', 'location',
  'primary_image_url', 'image_urls', 'has_360_spin', 'video_url',
  'is_certified', 'is_new_arrival', 'featured',
  'inspection_score', 'inspection_date',
  'is_ev', 'battery_capacity_kwh', 'range_miles', 'ev_battery_health_percent',
  'created_at', 'updated_at',
].join(',')

/** Public-facing vehicle shape after server-side transformation. */
export interface VehicleDetail {
  id: string
  stockNumber: string
  vin: string
  year: number
  make: string
  model: string
  trim: string
  bodyStyle: string | null
  exteriorColor: string | null
  interiorColor: string | null
  price: number // dollars
  msrp: number | null // dollars
  mileage: number
  drivetrain: string | null
  transmission: string | null
  engine: string | null
  fuelType: string | null
  status: string
  location: string | null
  primaryImageUrl: string | null
  imageUrls: string[]
  has360Spin: boolean
  videoUrl: string | null
  isCertified: boolean
  isNewArrival: boolean
  featured: boolean
  inspectionScore: number | null
  inspectionDate: string | null
  isEv: boolean
  batteryCapacityKwh: number | null
  rangeMiles: number | null
  evBatteryHealthPercent: number | null
  driveeMid: string | null
  pricing: AllInPriceBreakdown
}

/**
 * Fetch a vehicle by id (UUID), VIN, or stock number.
 *
 * Wrapped in React `cache()` so duplicate calls in the same
 * render pass (page + layout) are deduplicated automatically.
 */
export const fetchVehicleForSSR = cache(async (
  idOrVinOrStock: string,
): Promise<VehicleDetail | null> => {
  try {
    const supabase = createStaticClient()

    let lookupColumn: string
    if (UUID_RE.test(idOrVinOrStock)) {
      lookupColumn = "id"
    } else if (VIN_RE.test(idOrVinOrStock)) {
      lookupColumn = "vin"
    } else {
      lookupColumn = "stock_number"
    }

    const { data: row, error } = await supabase
      .from("vehicles")
      .select(VEHICLE_DETAIL_FIELDS)
      .eq(lookupColumn, idOrVinOrStock)
      .maybeSingle()

    if (error || !row) return null

    // Only show publicly visible statuses
    const status = (row as Record<string, unknown>).status as string
    if (!["available", "reserved", "pending", "sold"].includes(status)) return null

    const v = row as Record<string, unknown>
    const priceInDollars = safeNum(v.price) / 100
    const msrpInDollars = typeof v.msrp === "number" ? (v.msrp as number) / 100 : null
    const vin = typeof v.vin === "string" ? v.vin : ""

    const driveeMid = await getDriveeMidFromDb(vin)
    const pricing = calculateAllInPrice(priceInDollars)

    return {
      id: v.id as string,
      stockNumber: (v.stock_number as string) || "",
      vin,
      year: v.year as number,
      make: v.make as string,
      model: v.model as string,
      trim: (v.trim as string) || "",
      bodyStyle: (v.body_style as string) || null,
      exteriorColor: (v.exterior_color as string) || null,
      interiorColor: (v.interior_color as string) || null,
      price: priceInDollars,
      msrp: msrpInDollars,
      mileage: v.mileage as number,
      drivetrain: (v.drivetrain as string) || null,
      transmission: (v.transmission as string) || null,
      engine: (v.engine as string) || null,
      fuelType: (v.fuel_type as string) || null,
      status,
      location: (v.location as string) || null,
      primaryImageUrl: (v.primary_image_url as string) || null,
      imageUrls: Array.isArray(v.image_urls) ? v.image_urls as string[] : [],
      has360Spin: !!v.has_360_spin,
      videoUrl: (v.video_url as string) || null,
      isCertified: !!v.is_certified,
      isNewArrival: !!v.is_new_arrival,
      featured: !!v.featured,
      inspectionScore: (v.inspection_score as number) || null,
      inspectionDate: (v.inspection_date as string) || null,
      isEv: !!v.is_ev,
      batteryCapacityKwh: (v.battery_capacity_kwh as number) || null,
      rangeMiles: (v.range_miles as number) || null,
      evBatteryHealthPercent: (v.ev_battery_health_percent as number) || null,
      driveeMid,
      pricing,
    }
  } catch (err) {
    console.error("[fetchVehicleForSSR] Failed:", err)
    return null
  }
})
