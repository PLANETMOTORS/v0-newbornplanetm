// Typesense indexer — upsert / delete vehicle documents
import { getAdminClient, VEHICLES_COLLECTION } from "./client"

/**
 * Normalize raw DB body_style values to consistent terms for Typesense filtering.
 * DB values may have prefixes ("4dr") and suffixes ("Vehicle") — e.g.
 * "4dr Sport Utility Vehicle" → "Sport Utility".
 * This ensures exact-match filters work correctly against indexed data.
 */
export function normalizeBodyStyle(raw: string): string {
  const lower = raw.toLowerCase()
  if (lower.includes('sport utility') || lower.includes('suv')) return 'Sport Utility'
  if (lower === '4dr car' || lower.includes('sedan')) return '4dr Car'
  if (lower.includes('pickup') || lower.includes('truck')) return 'Pickup'
  if (lower.includes('convertible')) return 'Convertible'
  if (lower.includes('hatchback')) return 'Hatchback'
  if (lower.includes('van') || lower.includes('minivan')) return 'Van'
  if (lower.includes('wagon')) return 'Wagon'
  if (lower.includes('coupe') || lower.includes('coupé')) return 'Coupe'
  return raw
}

export interface VehicleDocument {
  id: string
  stock_number: string
  year: number
  make: string
  model: string
  trim?: string
  body_style?: string
  exterior_color?: string
  price: number       // stored in cents
  mileage: number
  drivetrain?: string
  fuel_type?: string
  transmission?: string
  engine?: string
  is_ev: boolean
  is_certified: boolean
  status: string
  primary_image_url?: string
  description?: string
  vin?: string
  location?: string
  created_at?: number // unix timestamp
}

/**
 * Upsert a single vehicle document into Typesense.
 * Returns true on success, false if Typesense is not configured.
 */
export async function upsertVehicle(doc: VehicleDocument): Promise<boolean> {
  const client = getAdminClient()
  if (!client) return false

  const normalized = { ...doc }
  if (normalized.body_style) {
    normalized.body_style = normalizeBodyStyle(normalized.body_style)
  }

  await client
    .collections(VEHICLES_COLLECTION)
    .documents()
    .upsert(normalized)

  return true
}

/**
 * Upsert vehicles in batches using the Typesense Bulk Import API.
 * Each batch is sent as a single JSONL payload — 10k vehicles in ~10
 * round-trips instead of 10k individual API calls.
 *
 * Default batch size is 1000 (Typesense recommended max for upsert).
 */
export async function upsertVehiclesBatch(
  docs: VehicleDocument[],
  batchSize = 1000
): Promise<{ success: number; errors: number }> {
  const client = getAdminClient()
  if (!client) return { success: 0, errors: 0 }

  // Normalize body_style values before indexing
  const normalizedDocs = docs.map(doc => ({
    ...doc,
    body_style: doc.body_style ? normalizeBodyStyle(doc.body_style) : undefined,
  }))

  let success = 0
  let errors = 0

  for (let i = 0; i < normalizedDocs.length; i += batchSize) {
    const batch = normalizedDocs.slice(i, i + batchSize)
    const results = await client
      .collections(VEHICLES_COLLECTION)
      .documents()
      .import(batch, { action: "upsert" })

    for (const result of results) {
      if (result.success) {
        success++
      } else {
        errors++
        console.error(`[Typesense] Import error: ${result.error}`)
      }
    }
  }

  return { success, errors }
}

/**
 * Delete a vehicle document by ID.
 */
export async function deleteVehicle(vehicleId: string): Promise<boolean> {
  const client = getAdminClient()
  if (!client) return false

  try {
    await client
      .collections(VEHICLES_COLLECTION)
      .documents(vehicleId)
      .delete()
    return true
  } catch (err: unknown) {
    // 404 is fine — document already gone
    if (err && typeof err === "object" && "httpStatus" in err && (err as { httpStatus: number }).httpStatus === 404) {
      return true
    }
    throw err
  }
}
