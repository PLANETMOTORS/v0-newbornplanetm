import { NextResponse } from "next/server"
import { triggerImagePipelineAsync, type ImagePipelineVehicle } from "@/lib/homenet/image-pipeline"
import {
  type VehicleData,
  getSql,
  parseHomenetCSV,
  parseHomenetXML,
  syncVehiclesToDatabase,
} from "@/lib/homenet/parser"

// API Key for HomenetIOL webhook authentication
const HOMENET_API_KEY = process.env.HOMENET_API_KEY

/**
 * HomenetIOL Inventory Feed Webhook
 * 
 * This endpoint receives inventory data from HomenetIOL in XML or CSV format
 * and syncs it to the Neon Postgres database.
 * 
 * Flow: HomenetIOL -> This Webhook -> Parse XML/CSV -> Upsert to Neon -> Response
 */

export async function POST(request: Request) {
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }
  if (!HOMENET_API_KEY) {
    return NextResponse.json({ error: "HOMENET_API_KEY is not configured" }, { status: 503 })
  }
  try {
    // Authenticate the request
    const authHeader = request.headers.get("authorization")
    const apiKeyHeader = request.headers.get("x-api-key")
    const apiKey = apiKeyHeader || authHeader?.replace("Bearer ", "")
    
    if (apiKey !== HOMENET_API_KEY) {
      console.log("[HomenetIOL] Unauthorized request attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const contentType = request.headers.get("content-type") || ""
    let vehicles: VehicleData[] = []

    // Handle different content types
    if (contentType.includes("multipart/form-data")) {
      // File upload (XML or CSV)
      const formData = await request.formData()
      const file = formData.get("file") as File
      
      if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 })
      }

      const text = await file.text()
      const filename = file.name.toLowerCase()

      if (filename.endsWith(".xml")) {
        vehicles = parseHomenetXML(text)
      } else if (filename.endsWith(".csv") || filename.endsWith(".txt")) {
        vehicles = parseHomenetCSV(text)
      } else {
        return NextResponse.json({ error: "Unsupported file format. Use XML, CSV, or TXT." }, { status: 400 })
      }
    } else if (contentType.includes("application/xml") || contentType.includes("text/xml")) {
      // Direct XML body
      const text = await request.text()
      vehicles = parseHomenetXML(text)
    } else if (contentType.includes("application/json")) {
      // JSON payload (alternative)
      const json = await request.json()
      vehicles = Array.isArray(json) ? json : json.vehicles || []
    } else {
      // Try to parse as text (CSV or XML)
      const text = await request.text()
      if (text.trim().startsWith("<?xml") || text.trim().startsWith("<")) {
        vehicles = parseHomenetXML(text)
      } else {
        vehicles = parseHomenetCSV(text)
      }
    }

    if (vehicles.length === 0) {
      return NextResponse.json({ 
        error: "No valid vehicles found in the feed",
        received_content_type: contentType
      }, { status: 400 })
    }

    console.log(`[HomenetIOL] Processing ${vehicles.length} vehicles`)

    // Sync to database
    const result = await syncVehiclesToDatabase(sql, vehicles)

    console.log(`[HomenetIOL] Sync complete: ${result.inserted} inserted, ${result.updated} updated, ${result.errors.length} errors`)

    // Trigger image pipeline async (don't block the cron response)
    const pipelineVehicles: ImagePipelineVehicle[] = vehicles
      .filter((v) => v.image_urls && v.image_urls.length > 0)
      .map((v) => ({
        stock_number: v.stock_number,
        vin: v.vin,
        image_urls: v.image_urls || [],
        has_360_spin: v.has_360_spin || false,
      }))

    if (pipelineVehicles.length > 0) {
      console.log(`[HomenetIOL] Triggering image pipeline for ${pipelineVehicles.length} vehicles with images`)
      triggerImagePipelineAsync(pipelineVehicles)
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${vehicles.length} vehicles`,
      inserted: result.inserted,
      updated: result.updated,
      imagePipelineTriggered: pipelineVehicles.length,
      errors: result.errors.length > 0 ? result.errors : undefined,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error("[HomenetIOL] Error processing feed:", error)
    return NextResponse.json({ 
      error: "Failed to process inventory feed",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

// GET endpoint - returns feed status and instructions (requires API key)
export async function GET(request: Request) {
  const sql = getSql()
  if (!sql) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }
  if (!HOMENET_API_KEY) {
    return NextResponse.json({ error: "HOMENET_API_KEY is not configured" }, { status: 503 })
  }

  // Authenticate — same API key check as POST
  const authHeader = request.headers.get("authorization")
  const apiKeyHeader = request.headers.get("x-api-key")
  const apiKey = apiKeyHeader || authHeader?.replace("Bearer ", "")

  if (apiKey !== HOMENET_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const vehicleCount = await sql`SELECT COUNT(*) as count FROM vehicles` as Record<string, unknown>[]
  const lastUpdated = await sql`SELECT MAX(updated_at) as last_updated FROM vehicles` as Record<string, unknown>[]

  return NextResponse.json({
    status: "active",
    endpoint: "/api/v1/inventory/homenet",
    method: "POST",
    supported_formats: ["XML", "CSV", "TXT", "JSON"],
    authentication: "API Key via 'x-api-key' header or 'Authorization: Bearer <key>'",
    current_inventory_count: vehicleCount[0]?.count || 0,
    last_updated: lastUpdated[0]?.last_updated || null,
    instructions: {
      xml: "POST XML file with Content-Type: application/xml",
      csv: "POST CSV or TXT file as multipart/form-data with field name 'file'",
      json: "POST JSON array with Content-Type: application/json"
    }
  })
}

// Types, parsers, and DB sync are now imported from @/lib/homenet/parser
