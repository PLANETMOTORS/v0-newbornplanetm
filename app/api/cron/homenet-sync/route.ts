import { NextResponse } from "next/server"
import { downloadLatestCSV } from "@/lib/homenet/sftp-client"
import { getSql, type VehicleData } from "@/lib/homenet/parser"
import { streamingSyncToDatabase } from "@/lib/homenet/streaming-sync"
import { upsertVehiclesBatch, type VehicleDocument } from "@/lib/typesense/indexer"
import { isTypesenseConfigured } from "@/lib/typesense/client"
import { verifyCronSecret } from "@/lib/security/cron-auth"
import {
  buildVehicleUrls,
  isIndexNowConfigured,
  pingIndexNow,
} from "@/lib/seo/indexnow"
import { getPublicSiteUrl } from "@/lib/site-url"
import { mapCSVRowToVehicle } from "@/lib/homenet/csv-row-mapper"
import Papa from "papaparse"

/**
 * Vercel Cron Job: HomenetIOL SFTP Feed Sync
 *
 * Runs every 15 minutes (configured in vercel.json).
 * Connects to HomenetIOL SFTP, downloads the latest CSV feed,
 * parses it, and upserts vehicles into the database.
 */

export const maxDuration = 120 // Allow up to 120s for SFTP + DB sync (was 60s, caused occasional 504s)
export const dynamic = "force-dynamic"

/** Index vehicles into Typesense via streaming re-parse (best-effort). */
async function indexTypesenseStreaming(
  csvContent: string,
): Promise<{ success: number; errors: number }> {
  if (!isTypesenseConfigured()) return { success: 0, errors: 0 }
  try {
    const docs: VehicleDocument[] = []
    const now = Math.floor(Date.now() / 1000)

    // Lightweight re-parse just to collect Typesense docs
    Papa.parse(csvContent, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h: string) =>
        h.trim().toLowerCase().replaceAll(/[^a-z0-9]/g, "_")
          .replaceAll(/_+/g, "_").replaceAll(/^_|_$/g, ""),
      step: (row: Papa.ParseStepResult<Record<string, string>>) => {
        const v = mapCSVRowToVehicle(row.data)
        if (v?.vin && v.stock_number) {
          docs.push({
            id: v.vin,
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
            created_at: now,
          })
        }
      },
    })

    const result = await upsertVehiclesBatch(docs)
    console.info(
      `[HomenetIOL Cron] Typesense indexed: ${result.success} ok, ${result.errors} errors`,
    )
    return result
  } catch (tsErr) {
    console.error("[HomenetIOL Cron] Typesense indexing failed:", tsErr)
    return { success: 0, errors: 0 }
  }
}

interface IndexNowResult { pings: number; ok: boolean }

/** Ping IndexNow for changed vehicle URLs (best-effort, never throws). */
async function notifyIndexNow(
  result: Awaited<ReturnType<typeof streamingSyncToDatabase>>,
): Promise<IndexNowResult> {
  if (!isIndexNowConfigured()) return { pings: 0, ok: false }

  const baseUrl = getPublicSiteUrl()
  const soldUrls = result.safetyAborted
    ? []
    : buildVehicleUrls(result.soldVehicleIds)
  const changedUrlSet = new Set<string>([
    ...buildVehicleUrls(result.insertedVehicleIds),
    ...buildVehicleUrls(result.updatedVehicleIds),
    ...soldUrls,
  ])

  const hasInventoryChanges =
    result.inserted > 0 || result.updated > 0 || result.removed > 0
  if (hasInventoryChanges) changedUrlSet.add(`${baseUrl}/inventory`)

  const changedUrls = Array.from(changedUrlSet)
  if (changedUrls.length === 0) return { pings: 0, ok: false }

  try {
    const pingResult = await pingIndexNow(changedUrls)
    if (pingResult.ok) {
      console.info(`[HomenetIOL Cron] IndexNow pinged ${pingResult.count} URLs`)
    } else {
      console.warn(`[HomenetIOL Cron] IndexNow ping failed: ${pingResult.error}`)
    }
    return { pings: pingResult.count, ok: pingResult.ok }
  } catch (pingErr) {
    console.warn(`[HomenetIOL Cron] IndexNow ping threw:`, pingErr)
    return { pings: 0, ok: false }
  }
}

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

    // Step 2+3: Stream-parse CSV and upsert in 500-row batches
    // Memory-safe: only one batch lives in RAM at a time
    const result = await streamingSyncToDatabase(sql, content, {
      batchSize: 500,
      onProgress: (p) => {
        if (p.phase === "parsing" && p.batchesCompleted % 5 === 0) {
          console.info(
            `[HomenetIOL Cron] Progress: ${p.vehiclesProcessed} vehicles, ${p.batchesCompleted} batches`,
          )
        }
      },
    })

    if (result.inserted === 0 && result.updated === 0 && result.errors.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No valid vehicles found in CSV feed",
        filename,
        filesFound,
        duration_ms: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      })
    }

    // Step 4: Index to Typesense using streaming re-parse (avoid holding full array)
    // Re-parse the CSV to collect Typesense docs without holding both arrays
    const typesenseResult = await indexTypesenseStreaming(content)

    if (result.safetyAborted) {
      console.error(
        "[HomenetIOL Cron] CRITICAL SAFETY ABORT — inventory floor breached. " +
          "Soft-delete was SKIPPED to prevent a partial CSV from wiping the inventory.",
        result.safetyContext,
      )
    }

    // Step 5: Ping IndexNow for changed URLs (non-blocking)
    const { pings: indexNowPings, ok: indexNowOk } = await notifyIndexNow(result)

    const duration = Date.now() - startTime
    console.info(
      `[HomenetIOL Cron] Sync complete in ${duration}ms: ` +
      `${result.inserted} inserted, ${result.updated} updated, ${result.removed} sold, ${result.errors.length} errors` +
      (result.safetyAborted ? " [SAFETY ABORT]" : "")
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${result.inserted + result.updated} vehicles from ${filename}`,
      filename,
      filesFound,
      vehiclesParsed: result.inserted + result.updated + result.errors.length,
      inserted: result.inserted,
      updated: result.updated,
      removed: result.removed,
      safetyAborted: result.safetyAborted,
      safetyContext: result.safetyContext,
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
