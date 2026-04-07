import { type NextRequest, NextResponse } from "next/server"
import { neon } from "@neondatabase/serverless"
import { Client } from "ssh2"
import { XMLParser } from "fast-xml-parser"

// ─── Types ────────────────────────────────────────────────────────────────────

interface HomenetVehicle {
  // Identity
  vin: string
  stock_number: string

  // Basic info
  year: number
  make: string
  model: string
  trim: string
  body_style: string
  exterior_color: string
  interior_color: string

  // Pricing (in cents)
  price: number
  msrp: number

  // Specs
  mileage: number
  drivetrain: string
  transmission: string
  engine: string
  fuel_type: string
  fuel_economy_city: number | null
  fuel_economy_highway: number | null

  // EV
  is_ev: boolean
  battery_capacity_kwh: number | null
  range_miles: number | null

  // Media
  primary_image_url: string
  image_urls: string[]
  has_360_spin: boolean

  // Status
  status: string
  is_certified: boolean
  is_new_arrival: boolean
  featured: boolean
  inspection_score: number | null
}

// ─── SFTP Download ─────────────────────────────────────────────────────────────

function downloadFromSFTP(): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = new Client()

    client.on("ready", () => {
      client.sftp((err, sftp) => {
        if (err) {
          client.end()
          return reject(new Error(`SFTP session error: ${err.message}`))
        }

        const remotePath = process.env.HOMENET_SFTP_REMOTE_PATH || "/outgoing/planetmotors_inventory.xml"
        const chunks: Buffer[] = []

        const readStream = sftp.createReadStream(remotePath)

        readStream.on("data", (chunk: Buffer) => chunks.push(chunk))

        readStream.on("end", () => {
          client.end()
          resolve(Buffer.concat(chunks).toString("utf-8"))
        })

        readStream.on("error", (e: Error) => {
          client.end()
          reject(new Error(`File read error: ${e.message}`))
        })
      })
    })

    client.on("error", (err) => {
      reject(new Error(`SSH connection error: ${err.message}`))
    })

    client.connect({
      host: process.env.HOMENET_SFTP_HOST || "iol.homenetinc.com",
      port: parseInt(process.env.HOMENET_SFTP_PORT || "22"),
      username: process.env.HOMENET_SFTP_USERNAME || "hndatafeed",
      password: process.env.HOMENET_SFTP_PASSWORD,
      readyTimeout: 20000,
    })
  })
}

// ─── XML Parser ────────────────────────────────────────────────────────────────

function parseHomenetXML(xml: string): HomenetVehicle[] {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    parseAttributeValue: true,
    parseTagValue: true,
    trimValues: true,
  })

  const parsed = parser.parse(xml)

  // HomenetIOL standard XML format: <inventory><vehicle>...</vehicle></inventory>
  const raw = parsed?.inventory?.vehicle || parsed?.adf?.vehicle || []
  const vehicles = Array.isArray(raw) ? raw : [raw]

  return vehicles
    .filter((v: any) => v && v.vin)
    .map((v: any): HomenetVehicle => {
      const fuelType = (v.fuel_type || v.fueltype || v.FuelType || "Gasoline").toString()
      const isEV =
        fuelType.toLowerCase().includes("electric") ||
        fuelType.toLowerCase().includes("ev") ||
        fuelType.toLowerCase() === "bev" ||
        fuelType.toLowerCase() === "phev"

      // Handle image URLs — HomenetIOL sends them as pipe-separated or array
      const imageRaw = v.images?.image || v.image || v.Images?.Image || []
      const imageArr = Array.isArray(imageRaw) ? imageRaw : [imageRaw]
      const imageUrls = imageArr
        .map((img: any) => (typeof img === "string" ? img : img?.["#text"] || img?.url || ""))
        .filter(Boolean)

      const priceRaw = parseFloat(v.price || v.Price || v.asking_price || 0)
      const msrpRaw = parseFloat(v.msrp || v.MSRP || v.list_price || priceRaw)

      return {
        vin: (v.vin || v.VIN || "").toString().trim(),
        stock_number: (v.stock_number || v.stocknumber || v.StockNumber || v.stock || "").toString().trim(),
        year: parseInt(v.year || v.Year || 0),
        make: (v.make || v.Make || "").toString().trim(),
        model: (v.model || v.Model || "").toString().trim(),
        trim: (v.trim || v.Trim || "").toString().trim(),
        body_style: (v.body_style || v.bodystyle || v.BodyStyle || v.type || "").toString().trim(),
        exterior_color: (v.exterior_color || v.exteriorcolor || v.color || "").toString().trim(),
        interior_color: (v.interior_color || v.interiorcolor || "").toString().trim(),
        price: Math.round(priceRaw * 100),
        msrp: Math.round(msrpRaw * 100),
        mileage: parseInt(v.mileage || v.Mileage || v.odometer || 0),
        drivetrain: (v.drivetrain || v.DriveType || v.drive_type || "").toString().trim(),
        transmission: (v.transmission || v.Transmission || "").toString().trim(),
        engine: (v.engine || v.Engine || "").toString().trim(),
        fuel_type: fuelType.trim(),
        fuel_economy_city: v.fuel_economy_city ? parseInt(v.fuel_economy_city) : null,
        fuel_economy_highway: v.fuel_economy_hwy ? parseInt(v.fuel_economy_hwy) : null,
        is_ev: isEV,
        battery_capacity_kwh: v.battery_capacity ? parseFloat(v.battery_capacity) : null,
        range_miles: v.range ? parseInt(v.range) : null,
        primary_image_url: imageUrls[0] || "",
        image_urls: imageUrls,
        has_360_spin: !!(v.spin_url || v.has_360 || false),
        status: "available",
        is_certified: !!(v.certified || v.is_certified || false),
        is_new_arrival: false,
        featured: false,
        inspection_score: v.inspection_score ? parseInt(v.inspection_score) : null,
      }
    })
}

// ─── Neon Upsert ───────────────────────────────────────────────────────────────

async function upsertVehicles(vehicles: HomenetVehicle[]): Promise<{
  inserted: number
  updated: number
  removed: number
}> {
  const sql = neon(process.env.DATABASE_URL!)

  let inserted = 0
  let updated = 0

  // Get all current VINs from DB to detect removed vehicles
  const existing = await sql`SELECT vin FROM vehicles WHERE status != 'sold'`
  const existingVins = new Set(existing.map((r: any) => r.vin))
  const incomingVins = new Set(vehicles.map((v) => v.vin))

  // Mark vehicles no longer in feed as sold
  const removedVins = [...existingVins].filter((vin) => !incomingVins.has(vin))
  let removed = 0
  if (removedVins.length > 0) {
    await sql`
      UPDATE vehicles
      SET status = 'sold', updated_at = NOW()
      WHERE vin = ANY(${removedVins}::text[])
    `
    removed = removedVins.length
  }

  // Upsert each vehicle
  for (const v of vehicles) {
    const result = await sql`
      INSERT INTO vehicles (
        vin, stock_number, year, make, model, trim, body_style,
        exterior_color, interior_color, price, msrp, mileage,
        drivetrain, transmission, engine, fuel_type,
        fuel_economy_city, fuel_economy_highway,
        is_ev, battery_capacity_kwh, range_miles,
        primary_image_url, image_urls, has_360_spin,
        status, is_certified, is_new_arrival, featured,
        inspection_score, updated_at
      ) VALUES (
        ${v.vin}, ${v.stock_number}, ${v.year}, ${v.make}, ${v.model},
        ${v.trim}, ${v.body_style}, ${v.exterior_color}, ${v.interior_color},
        ${v.price}, ${v.msrp}, ${v.mileage}, ${v.drivetrain}, ${v.transmission},
        ${v.engine}, ${v.fuel_type}, ${v.fuel_economy_city}, ${v.fuel_economy_highway},
        ${v.is_ev}, ${v.battery_capacity_kwh}, ${v.range_miles},
        ${v.primary_image_url}, ${v.image_urls}, ${v.has_360_spin},
        ${v.status}, ${v.is_certified}, ${v.is_new_arrival}, ${v.featured},
        ${v.inspection_score}, NOW()
      )
      ON CONFLICT (vin) DO UPDATE SET
        stock_number        = EXCLUDED.stock_number,
        year                = EXCLUDED.year,
        make                = EXCLUDED.make,
        model               = EXCLUDED.model,
        trim                = EXCLUDED.trim,
        body_style          = EXCLUDED.body_style,
        exterior_color      = EXCLUDED.exterior_color,
        interior_color      = EXCLUDED.interior_color,
        price               = EXCLUDED.price,
        msrp                = EXCLUDED.msrp,
        mileage             = EXCLUDED.mileage,
        drivetrain          = EXCLUDED.drivetrain,
        transmission        = EXCLUDED.transmission,
        engine              = EXCLUDED.engine,
        fuel_type           = EXCLUDED.fuel_type,
        fuel_economy_city   = EXCLUDED.fuel_economy_city,
        fuel_economy_highway= EXCLUDED.fuel_economy_highway,
        is_ev               = EXCLUDED.is_ev,
        battery_capacity_kwh= EXCLUDED.battery_capacity_kwh,
        range_miles         = EXCLUDED.range_miles,
        primary_image_url   = EXCLUDED.primary_image_url,
        image_urls          = EXCLUDED.image_urls,
        has_360_spin        = EXCLUDED.has_360_spin,
        status              = EXCLUDED.status,
        inspection_score    = EXCLUDED.inspection_score,
        updated_at          = NOW()
      RETURNING (xmax = 0) AS is_insert
    `

    if (result[0]?.is_insert) {
      inserted++
    } else {
      updated++
    }
  }

  return { inserted, updated, removed }
}

// ─── API Route ─────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // Verify cron secret to prevent unauthorized triggers
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const startTime = Date.now()

  try {
    // Step 1: Download XML from HomenetIOL SFTP
    let xmlContent: string
    try {
      xmlContent = await downloadFromSFTP()
    } catch (sftpErr: any) {
      return NextResponse.json(
        { error: "SFTP connection failed", details: sftpErr.message },
        { status: 502 }
      )
    }

    // Step 2: Parse XML into vehicle records
    const vehicles = parseHomenetXML(xmlContent)
    if (vehicles.length === 0) {
      return NextResponse.json(
        { error: "No vehicles found in feed", xml_length: xmlContent.length },
        { status: 422 }
      )
    }

    // Step 3: Upsert into Neon Postgres
    const { inserted, updated, removed } = await upsertVehicles(vehicles)

    const duration = Date.now() - startTime

    return NextResponse.json({
      success: true,
      sync_at: new Date().toISOString(),
      duration_ms: duration,
      vehicles_in_feed: vehicles.length,
      inserted,
      updated,
      removed,
    })
  } catch (err: any) {
    console.error("[HomenetSync] Unhandled error:", err)
    return NextResponse.json(
      { error: "Sync failed", details: err.message },
      { status: 500 }
    )
  }
}

// Allow GET for manual trigger checks
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  return NextResponse.json({
    status: "ready",
    endpoint: "/api/v1/inventory/sync",
    trigger: "POST",
    schedule: "every 15 minutes via Vercel Cron",
  })
}
