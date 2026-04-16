// Typesense indexer — upsert / delete vehicle documents
import { getAdminClient, VEHICLES_COLLECTION } from "./client"

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

  await client
    .collections(VEHICLES_COLLECTION)
    .documents()
    .upsert(doc)

  return true
}

/**
 * Upsert vehicles in batches. Returns count of successful imports.
 */
export async function upsertVehiclesBatch(
  docs: VehicleDocument[],
  batchSize = 250
): Promise<{ success: number; errors: number }> {
  const client = getAdminClient()
  if (!client) return { success: 0, errors: 0 }

  let success = 0
  let errors = 0

  for (let i = 0; i < docs.length; i += batchSize) {
    const batch = docs.slice(i, i + batchSize)
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
