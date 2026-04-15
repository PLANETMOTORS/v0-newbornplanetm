import { NextResponse } from "next/server"
import { downloadLatestCSV } from "@/lib/homenet/sftp-client"
import { parseHomenetCSV, syncVehiclesToDatabase, getSql } from "@/lib/homenet/parser"

/**
 * Vercel Cron Job: HomenetIOL SFTP Feed Sync
 *
 * Runs every 15 minutes (configured in vercel.json).
 * Connects to HomenetIOL SFTP, downloads the latest CSV feed,
 * parses it, and upserts vehicles into the database.
 */

export const maxDuration = 60 // Allow up to 60s for SFTP + DB sync
export const dynamic = "force-dynamic"

export async function GET(request: Request) {
  const startTime = Date.now()

  // Verify cron secret (Vercel sets CRON_SECRET automatically)
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    console.error("[HomenetIOL Cron] Unauthorized request")
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const sql = getSql()
  if (!sql) {
    console.error("[HomenetIOL Cron] Database not configured")
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  try {
    // Step 1: Download latest CSV from SFTP
    console.log("[HomenetIOL Cron] Starting SFTP sync...")
    const { filename, content, filesFound } = await downloadLatestCSV()

    console.log(`[HomenetIOL Cron] Downloaded ${filename} (${content.length} chars). Files on server: ${filesFound.length}`)

    // Step 2: Parse CSV content
    const vehicles = parseHomenetCSV(content)
    console.log(`[HomenetIOL Cron] Parsed ${vehicles.length} vehicles from ${filename}`)

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

    const duration = Date.now() - startTime
    console.log(
      `[HomenetIOL Cron] Sync complete in ${duration}ms: ` +
      `${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`
    )

    return NextResponse.json({
      success: true,
      message: `Processed ${vehicles.length} vehicles from ${filename}`,
      filename,
      filesFound,
      vehiclesParsed: vehicles.length,
      inserted: result.inserted,
      updated: result.updated,
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
