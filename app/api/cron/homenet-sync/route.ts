import { NextResponse } from "next/server"
import { downloadLatestCSV } from "@/lib/homenet/sftp-client"
import { parseHomenetCSV, syncVehiclesToDatabase, getSql } from "@/lib/homenet/parser"
import { upsertVehiclesBatch, type VehicleDocument } from "@/lib/typesense/indexer"
import { isTypesenseConfigured } from "@/lib/typesense/client"
import { verifyCronSecret } from "@/lib/security/cron-auth"
import {
  buildVehicleUrls,
  isIndexNowConfigured,
  pingIndexNow,
} from "@/lib/seo/indexnow"
import { getPublicSiteUrl } from "@/lib/site-url"

/**
 * Vercel Cron Job: HomenetIOL SFTP Feed Sync
 *
 * Runs every 15 minutes (configured in vercel.json).
 * Connects to HomenetIOL SFTP, downloads the latest CSV feed,
 * parses it, and upserts vehicles into the database.
 */

export const maxDuration = 120 // Allow up to 120s for SFTP + DB sync (was 60s, caused occasional 504s)
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const startTime = Date.now()

  const auth = verifyCronSecret(request)
  if (!auth.ok) return auth.response

  const sql = getSql()
  if (!sql) {
    console.error("[HomenetIOL Cron] Database not configured")
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  try {
    // Step 1: Download latest CSV from SFTP
    console.info("[HomenetIOL Cron] Starting SFTP sync...")
    const { filename, content, filesFound } = await downloadLatestCSV()

    console.info(`[HomenetIOL Cron] Downloaded ${filename} (${content.length} chars). Files on server: ${filesFound.length}`)

    // Step 2: Parse CSV content
    const vehicles = parseHomenetCSV(content)
    console.info(`[HomenetIOL Cron] Parsed ${vehicles.length} vehicles from ${filename}`)

    if (vehicles.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No valid vehicles found in CSV feed",
        filename,
        filesFound,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      })
    }

    // Step 3: Sync to database
    const result = await syncVehiclesToDatabase(sql, vehicles)

    // Step 4: Index to Typesense (non-blocking — log errors but don't fail the cron)
    let typesenseResult: { success: number; errors: number } = { success: 0, errors: 0 }
    if (isTypesenseConfigured()) {
      try {
        const docs: VehicleDocument[] = vehicles.map((v) => ({
          id: v.vin, // use VIN as stable Typesense doc ID
          stock_number: v.stock_number,
          year: v.year,
          make: v.make,
          model: v.model,
          trim: v.trim,
          body_style: v.body_style,
          exterior_color: v.exterior_color,
          price: v.price,
          mileage: v.mileage,
          drivetrain: v.drivetrain,
          fuel_type: v.fuel_type,
          transmission: v.transmission,
          engine: v.engine,
          is_ev: v.is_ev ?? false,
          is_certified: v.is_certified ?? false,
          status: v.status || "available",
          primary_image_url: v.primary_image_url,
          description: v.description,
          vin: v.vin,
          location: v.location,
          created_at: Math.floor(Date.now() / 1000),
        }))
        typesenseResult = await upsertVehiclesBatch(docs)
        console.info(
          `[HomenetIOL Cron] Typesense indexed: ${typesenseResult.success} ok, ${typesenseResult.errors} errors`
        )
      } catch (tsErr) {
        console.error("[HomenetIOL Cron] Typesense indexing failed:", tsErr)
      }
    }

    // Step 5: Ping IndexNow for new + soft-deleted URLs (non-blocking).
    // We never let an IndexNow failure cascade into a 500 — the cron's job
    // is to keep the database in sync, IndexNow is a best-effort SEO signal.
    let indexNowPings = 0
    let indexNowOk = false
    if (isIndexNowConfigured()) {
      const baseUrl = getPublicSiteUrl()
      const changedUrls: string[] = [
        ...buildVehicleUrls(result.insertedVehicleIds),
        ...buildVehicleUrls(result.soldVehicleIds),
      ]
      const hasInventoryChanges =
        result.inserted > 0 || result.updated > 0 || result.removed > 0
      // Always nudge the inventory listing when the sync changed inventory state
      // — sort, filters, pricing, or availability may have changed.
      if (hasInventoryChanges) changedUrls.push(`${baseUrl}/inventory`)

      if (changedUrls.length > 0) {
        try {
          const pingResult = await pingIndexNow(changedUrls)
          indexNowPings = pingResult.count
          indexNowOk = pingResult.ok
          if (pingResult.ok) {
            console.info(`[HomenetIOL Cron] IndexNow pinged ${pingResult.count} URLs`)
          } else {
            console.warn(`[HomenetIOL Cron] IndexNow ping failed: ${pingResult.error}`)
          }
        } catch (pingErr) {
          // pingIndexNow already swallows errors, but belt-and-suspenders.
          console.warn(`[HomenetIOL Cron] IndexNow ping threw:`, pingErr)
        }
      }
    }

    const duration = Date.now() - startTime
    console.info(
      `[HomenetIOL Cron] Sync complete in ${duration}ms: ` +
      `${result.inserted} inserted, ${result.updated} updated, ${result.removed} sold, ${result.errors.length} errors`
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${vehicles.length} vehicles from ${filename}`,
      filename,
      filesFound,
      vehiclesParsed: vehicles.length,
      inserted: result.inserted,
      updated: result.updated,
      removed: result.removed,
      typesenseIndexed: typesenseResult.success,
      typesenseErrors: typesenseResult.errors,
      indexNowPings,
      indexNowOk,
      errors: result.errors.length > 0 ? result.errors.slice(0, 10) : undefined,
      errorCount: result.errors.length,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    const duration = Date.now() - startTime
    const message = error instanceof Error ? error.message : "Unknown error"
    console.error(`[HomenetIOL Cron] Error after ${duration}ms:`, error)

    return NextResponse.json({
      success: false,
      error: "Failed to sync HomenetIOL feed",
      details: message,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
    }, { status: 500 })
  }
}
