/* eslint-disable no-useless-assignment */
/**
 * lib/typesense/sync.ts
 *
 * Sanity → Typesense real-time sync helper.
 *
 * Called by app/api/webhooks/sanity/route.ts whenever a vehicle document
 * is created, updated, or deleted in Sanity CMS.
 *
 * Design principles:
 *  - NEVER blocks ISR cache revalidation — all Typesense work is fire-and-forget
 *    from the webhook's perspective (errors are logged, not re-thrown).
 *  - Uses the Typesense admin client (server-side only).
 *  - Fetches the full vehicle document from Sanity by _id so we always index
 *    the canonical, freshest data (not just the partial webhook payload).
 *  - Maps Sanity field names → VehicleDocument shape expected by Typesense.
 */

import { sanityClient } from "@/lib/sanity/client"
import { getAdminClient, isTypesenseConfigured, VEHICLES_COLLECTION } from "./client"
import { normalizeBodyStyle } from "./indexer"
import { logger } from "@/lib/logger"

// ── GROQ query — fetch a single vehicle by its Sanity _id ─────────────────

const VEHICLE_BY_ID_QUERY = `
  *[_type == "vehicle" && _id == $id][0] {
    _id, year, make, model, trim, vin, stockNumber, price, specialPrice,
    status, mileage, exteriorColor, bodyStyle, fuelType, transmission,
    drivetrain, engine, description, "mainImage": mainImage.asset->url,
    _createdAt
  }
`

// ── Sanity vehicle shape (partial — only fields we need for Typesense) ────

interface SanityVehicle {
  _id: string
  year?: number
  make?: string
  model?: string
  trim?: string
  vin?: string
  stockNumber?: string
  price?: number
  specialPrice?: number
  status?: string
  mileage?: number
  exteriorColor?: string
  bodyStyle?: string
  fuelType?: string
  transmission?: string
  drivetrain?: string
  engine?: string
  description?: string
  mainImage?: string
  _createdAt?: string
}

// ── Map Sanity → Typesense VehicleDocument ────────────────────────────────

function mapSanityVehicleToTypesense(v: SanityVehicle) {
  const fuelType = v.fuelType ?? ""
  const isEv = /electric|ev|bev/i.test(fuelType)

  // Prices in Sanity are dollars; Typesense stores cents
  const priceCents = Math.round((v.specialPrice ?? v.price ?? 0) * 100)

  return {
    // Use Sanity _id as the stable Typesense document ID
    id: v._id,
    stock_number: v.stockNumber ?? "",
    year: v.year ?? 0,
    make: v.make ?? "",
    model: v.model ?? "",
    trim: v.trim ?? undefined,
    body_style: v.bodyStyle ? normalizeBodyStyle(v.bodyStyle) : undefined,
    exterior_color: v.exteriorColor ?? undefined,
    price: priceCents,
    mileage: v.mileage ?? 0,
    drivetrain: v.drivetrain ?? undefined,
    fuel_type: fuelType || undefined,
    transmission: v.transmission ?? undefined,
    engine: v.engine ?? undefined,
    is_ev: isEv,
    is_certified: false, // Sanity schema doesn't have this field; default false
    status: v.status ?? "available",
    primary_image_url: v.mainImage ?? undefined,
    description: v.description ?? undefined,
    vin: v.vin ?? undefined,
    created_at: v._createdAt
      ? Math.floor(new Date(v._createdAt).getTime() / 1000)
      : Math.floor(Date.now() / 1000),
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Sync a single vehicle from Sanity into Typesense.
 *
 * Fetches the latest document from Sanity by _id, maps it to the
 * VehicleDocument shape, and upserts it into the Typesense vehicles collection.
 *
 * Returns a result object — never throws (errors are logged internally).
 *
 * @param sanityId - The Sanity document _id (e.g. "drafts.abc123" or "abc123")
 * @param operation - "create" | "update" | "delete" — from the webhook payload
 */
export async function syncVehicleToTypesense(
  sanityId: string,
  operation: string
): Promise<{ success: boolean; action: string; error?: string }> {
  if (!isTypesenseConfigured()) {
    logger.info("[Typesense Sync] Typesense not configured — skipping sync")
    return { success: true, action: "skipped_not_configured" }
  }

  const client = getAdminClient()
  if (!client) {
    logger.warn("[Typesense Sync] Admin client unavailable — skipping sync")
    return { success: false, action: "skipped_no_client", error: "Admin client unavailable" }
  }

  // ── Handle delete ────────────────────────────────────────────────────────
  if (operation === "delete") {
    try {
      await client
        .collections(VEHICLES_COLLECTION)
        .documents(sanityId)
        .delete()
      logger.info(`[Typesense Sync] Deleted document: ${sanityId}`)
      return { success: true, action: "deleted" }
    } catch (err: unknown) {
      // 404 = already gone — treat as success
      if (
        err &&
        typeof err === "object" &&
        "httpStatus" in err &&
        (err as { httpStatus: number }).httpStatus === 404
      ) {
        return { success: true, action: "deleted_not_found" }
      }
      const message = err instanceof Error ? err.message : String(err)
      logger.error(`[Typesense Sync] Delete failed for ${sanityId}:`, message)
      return { success: false, action: "delete_failed", error: message }
    }
  }

  // ── Handle create / update — fetch from Sanity first ────────────────────
  let vehicle: SanityVehicle | null = null
  try {
    vehicle = await sanityClient.fetch<SanityVehicle>(VEHICLE_BY_ID_QUERY, { id: sanityId })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`[Typesense Sync] Sanity fetch failed for ${sanityId}:`, message)
    return { success: false, action: "sanity_fetch_failed", error: message }
  }

  if (!vehicle) {
    // Document may be a draft or not yet published — skip silently
    logger.info(`[Typesense Sync] No published vehicle found for id=${sanityId} — skipping`)
    return { success: true, action: "skipped_not_published" }
  }

  // ── Upsert into Typesense ────────────────────────────────────────────────
  try {
    const doc = mapSanityVehicleToTypesense(vehicle)
    await client
      .collections(VEHICLES_COLLECTION)
      .documents()
      .upsert(doc)
    logger.info(
      `[Typesense Sync] Upserted vehicle: ${sanityId} ` +
      `(${vehicle.year} ${vehicle.make} ${vehicle.model})`
    )
    return { success: true, action: "upserted" }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    logger.error(`[Typesense Sync] Upsert failed for ${sanityId}:`, message)
    return { success: false, action: "upsert_failed", error: message }
  }
}
