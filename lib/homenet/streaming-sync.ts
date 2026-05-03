/**
 * Streaming DMS sync — processes vehicles in 500-record batches to stay
 * under Vercel's 256MB memory ceiling at 10k+ vehicles.
 *
 * Architecture:
 *   CSV text/stream → PapaParse streaming → 500-row batches →
 *   upsertVehicleBatch (Neon) + collect VINs for soft-delete →
 *   soft-delete stale vehicles → return result
 *
 * Memory: Only one batch + the VIN set live in RAM at any time.
 * The VIN set for 10k vehicles is ~170 KB (17 bytes × 10k).
 */
import { Readable } from "node:stream"
import { parseHomenetCSVStream } from "./streaming-parser"
import type { VehicleData, SyncVehiclesResult, SqlClient } from "./parser"

// ==================== TYPES ====================

export interface StreamingSyncOptions {
  /** Batch size for CSV parsing AND DB upserts (default: 500) */
  batchSize?: number
  /** Progress callback for monitoring */
  onProgress?: (progress: StreamingSyncProgress) => void
}

export interface StreamingSyncProgress {
  phase: "parsing" | "soft-delete" | "complete"
  vehiclesProcessed: number
  batchesCompleted: number
  inserted: number
  updated: number
  errors: number
}

// ==================== BATCH UPSERT ====================

/** Upsert a single vehicle — reuses the existing INSERT…ON CONFLICT query. */
async function upsertSingleVehicle(
  sql: SqlClient,
  v: VehicleData,
  acc: { inserted: number; updated: number; insertedIds: string[]; updatedIds: string[]; errors: { vin: string; error: string }[] },
): Promise<void> {
  try {
    const result = await sql`
      INSERT INTO vehicles (
        stock_number, vin, year, make, model, trim, body_style,
        exterior_color, interior_color, price, msrp, mileage,
        drivetrain, transmission, engine, fuel_type,
        fuel_economy_city, fuel_economy_highway, is_ev,
        battery_capacity_kwh, range_miles, status, is_certified,
        is_new_arrival, featured, inspection_score,
        primary_image_url, image_urls, has_360_spin, video_url, location,
        description, source_vdp_url, title_status
      ) VALUES (
        ${v.stock_number}, ${v.vin}, ${v.year},
        ${v.make}, ${v.model}, ${v.trim || null},
        ${v.body_style || null}, ${v.exterior_color || null},
        ${v.interior_color || null}, ${v.price},
        ${v.msrp || null}, ${v.mileage},
        ${v.drivetrain || null}, ${v.transmission || null},
        ${v.engine || null}, ${v.fuel_type || null},
        ${v.fuel_economy_city || null}, ${v.fuel_economy_highway || null},
        ${v.is_ev ?? false}, ${v.battery_capacity_kwh || null},
        ${v.range_miles || null}, ${v.status || 'available'},
        ${v.is_certified ?? false}, ${v.is_new_arrival ?? false},
        ${v.featured ?? false}, ${v.inspection_score ?? 210},
        ${v.primary_image_url || null}, ${v.image_urls || []},
        ${v.has_360_spin || false}, ${v.video_url || null},
        ${v.location || 'Richmond Hill, ON'},
        ${v.description || null}, ${v.source_vdp_url || null},
        ${v.title_status || null}
      )
      ON CONFLICT (vin) DO UPDATE SET
        stock_number = EXCLUDED.stock_number,
        year = EXCLUDED.year, make = EXCLUDED.make,
        model = EXCLUDED.model, trim = EXCLUDED.trim,
        body_style = EXCLUDED.body_style,
        exterior_color = EXCLUDED.exterior_color,
        interior_color = EXCLUDED.interior_color,
        price = EXCLUDED.price, msrp = EXCLUDED.msrp,
        mileage = EXCLUDED.mileage, drivetrain = EXCLUDED.drivetrain,
        transmission = EXCLUDED.transmission, engine = EXCLUDED.engine,
        fuel_type = EXCLUDED.fuel_type,
        fuel_economy_city = EXCLUDED.fuel_economy_city,
        fuel_economy_highway = EXCLUDED.fuel_economy_highway,
        is_ev = EXCLUDED.is_ev,
        battery_capacity_kwh = EXCLUDED.battery_capacity_kwh,
        range_miles = EXCLUDED.range_miles, status = EXCLUDED.status,
        is_certified = EXCLUDED.is_certified,
        is_new_arrival = EXCLUDED.is_new_arrival,
        featured = EXCLUDED.featured,
        inspection_score = EXCLUDED.inspection_score,
        primary_image_url = EXCLUDED.primary_image_url,
        image_urls = EXCLUDED.image_urls,
        has_360_spin = EXCLUDED.has_360_spin,
        video_url = EXCLUDED.video_url,
        location = EXCLUDED.location,
        description = EXCLUDED.description,
        source_vdp_url = EXCLUDED.source_vdp_url,
        title_status = EXCLUDED.title_status,
        updated_at = NOW()
      WHERE (
        vehicles.stock_number, vehicles.year, vehicles.make, vehicles.model,
        vehicles.trim, vehicles.body_style, vehicles.exterior_color,
        vehicles.interior_color, vehicles.price, vehicles.msrp,
        vehicles.mileage, vehicles.drivetrain, vehicles.transmission,
        vehicles.engine, vehicles.fuel_type, vehicles.fuel_economy_city,
        vehicles.fuel_economy_highway, vehicles.is_ev, vehicles.battery_capacity_kwh,
        vehicles.range_miles, vehicles.status, vehicles.is_certified,
        vehicles.is_new_arrival, vehicles.featured, vehicles.inspection_score,
        vehicles.primary_image_url, vehicles.image_urls, vehicles.has_360_spin,
        vehicles.video_url, vehicles.location, vehicles.description,
        vehicles.source_vdp_url, vehicles.title_status
      ) IS DISTINCT FROM (
        EXCLUDED.stock_number, EXCLUDED.year, EXCLUDED.make, EXCLUDED.model,
        EXCLUDED.trim, EXCLUDED.body_style, EXCLUDED.exterior_color,
        EXCLUDED.interior_color, EXCLUDED.price, EXCLUDED.msrp,
        EXCLUDED.mileage, EXCLUDED.drivetrain, EXCLUDED.transmission,
        EXCLUDED.engine, EXCLUDED.fuel_type, EXCLUDED.fuel_economy_city,
        EXCLUDED.fuel_economy_highway, EXCLUDED.is_ev, EXCLUDED.battery_capacity_kwh,
        EXCLUDED.range_miles, EXCLUDED.status, EXCLUDED.is_certified,
        EXCLUDED.is_new_arrival, EXCLUDED.featured, EXCLUDED.inspection_score,
        EXCLUDED.primary_image_url, EXCLUDED.image_urls, EXCLUDED.has_360_spin,
        EXCLUDED.video_url, EXCLUDED.location, EXCLUDED.description,
        EXCLUDED.source_vdp_url, EXCLUDED.title_status
      )
      RETURNING id, (xmax = 0) AS inserted
    `
    const rows = result as unknown as Array<{ id: string; inserted: boolean }>
    const row = rows?.[0]
    if (row?.inserted) {
      acc.inserted++
      if (row.id) acc.insertedIds.push(row.id)
    } else if (row?.id) {
      acc.updated++
      acc.updatedIds.push(row.id)
    }
  } catch (error) {
    console.error(`[HomenetIOL Stream] Error syncing VIN ${v.vin}:`, error)
    acc.errors.push({
      vin: v.vin,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}


// ==================== STREAMING SYNC ====================

/**
 * Stream-parse CSV and upsert to database in 500-row batches.
 * Only one batch of VehicleData lives in memory at a time.
 * VINs are collected in a Set (~170 KB for 10k) for soft-delete.
 */
export async function streamingSyncToDatabase(
  sql: SqlClient,
  csvInput: string | Readable,
  options: StreamingSyncOptions = {},
): Promise<SyncVehiclesResult> {
  const { batchSize = 500, onProgress } = options

  const acc = {
    inserted: 0,
    updated: 0,
    insertedIds: [] as string[],
    updatedIds: [] as string[],
    errors: [] as { vin: string; error: string }[],
  }

  // Collect VINs for soft-delete (Set<string> ≈ 170 KB for 10k VINs)
  const incomingVins = new Set<string>()

  const stats = await parseHomenetCSVStream(csvInput, {
    batchSize,
    onBatch: async (batch, batchIndex) => {
      for (const v of batch) {
        incomingVins.add(v.vin)
      }

      // Upsert batch with concurrency limiter (50 concurrent queries)
      const CONCURRENCY = 50
      for (let i = 0; i < batch.length; i += CONCURRENCY) {
        const chunk = batch.slice(i, i + CONCURRENCY)
        await Promise.all(chunk.map((v) => upsertSingleVehicle(sql, v, acc)))
      }

      onProgress?.({
        phase: "parsing",
        vehiclesProcessed: acc.inserted + acc.updated + acc.errors.length,
        batchesCompleted: batchIndex + 1,
        inserted: acc.inserted,
        updated: acc.updated,
        errors: acc.errors.length,
      })

      console.info(
        `[HomenetIOL Stream] Batch ${batchIndex + 1}: ${batch.length} vehicles ` +
        `(total: ${acc.inserted}i/${acc.updated}u/${acc.errors.length}e)`,
      )
    },
    onError: (error, row) => {
      console.warn(`[HomenetIOL Stream] Parse error row ${row}: ${error}`)
    },
  })

  console.info(
    `[HomenetIOL Stream] Parse complete: ${stats.validVehicles} valid ` +
    `from ${stats.totalRows} rows in ${stats.batches} batches`,
  )

  // Soft-delete stale vehicles
  const vinArray = Array.from(incomingVins)
  const sd = await softDeleteStale(sql, vinArray)

  return {
    inserted: acc.inserted,
    updated: acc.updated,
    removed: sd.removed,
    insertedVehicleIds: acc.insertedIds,
    soldVehicleIds: sd.soldVehicleIds,
    updatedVehicleIds: acc.updatedIds,
    safetyAborted: sd.safetyAborted,
    safetyContext: sd.safetyContext,
    errors: [...acc.errors, ...sd.errors],
  }
}

// ==================== SOFT-DELETE ====================

const DEFAULT_INVENTORY_FLOOR_PCT = 50

function getInventoryFloorPct(): number {
  const raw = process.env.HOMENET_INVENTORY_FLOOR_PCT
  if (!raw) return DEFAULT_INVENTORY_FLOOR_PCT
  const parsed = Number(raw)
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
    return DEFAULT_INVENTORY_FLOOR_PCT
  }
  return parsed
}

async function softDeleteStale(
  sql: SqlClient,
  incomingVins: string[],
): Promise<{
  removed: number
  soldVehicleIds: string[]
  safetyAborted: boolean
  safetyContext?: SyncVehiclesResult["safetyContext"]
  errors: { vin: string; error: string }[]
}> {
  const errors: { vin: string; error: string }[] = []
  const soldVehicleIds: string[] = []

  if (incomingVins.length === 0) {
    return { removed: 0, soldVehicleIds, safetyAborted: false, errors }
  }

  let currentLive: number | null = null
  try {
    const rows = (await sql`
      SELECT COUNT(*)::int AS live_count FROM vehicles
      WHERE status IS DISTINCT FROM 'sold'
    `) as Array<{ live_count: number }>
    currentLive = rows?.[0]?.live_count ?? 0
  } catch (error) {
    console.error("[HomenetIOL Stream] Live-count query failed:", error)
  }

  const floorPct = getInventoryFloorPct()
  const minimumExpected =
    currentLive !== null && currentLive > 0
      ? Math.floor(currentLive * (floorPct / 100))
      : 0

  if (
    currentLive !== null &&
    currentLive > 0 &&
    incomingVins.length < minimumExpected
  ) {
    console.error(
      `[HomenetIOL Stream] SAFETY ABORT: feed=${incomingVins.length} ` +
      `db=${currentLive} floor=${minimumExpected}`,
    )
    return {
      removed: 0,
      soldVehicleIds,
      safetyAborted: true,
      safetyContext: {
        incoming: incomingVins.length,
        currentLive,
        floorPct,
        minimumExpected,
      },
      errors,
    }
  }

  try {
    const soldResult = await sql`
      UPDATE vehicles
      SET status = 'sold',
          sold_at = COALESCE(sold_at, NOW()),
          updated_at = NOW()
      WHERE vin != ALL(${incomingVins})
        AND status IS DISTINCT FROM 'sold'
      RETURNING id
    `
    const soldRows = soldResult as unknown as Array<{ id: string }>
    for (const row of soldRows) {
      if (row.id) soldVehicleIds.push(row.id)
    }
    if (soldRows.length > 0) {
      console.info(`[HomenetIOL Stream] Soft-deleted ${soldRows.length}`)
    }
    return { removed: soldRows.length, soldVehicleIds, safetyAborted: false, errors }
  } catch (error) {
    console.error("[HomenetIOL Stream] Soft-delete error:", error)
    errors.push({
      vin: "BULK_SOFT_DELETE",
      error: error instanceof Error ? error.message : "Unknown error",
    })
    return { removed: 0, soldVehicleIds, safetyAborted: false, errors }
  }
}