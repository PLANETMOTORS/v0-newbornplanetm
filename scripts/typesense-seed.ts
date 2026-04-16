#!/usr/bin/env npx tsx
/**
 * Seed Typesense with all vehicles from Supabase.
 *
 * Usage:
 *   npx tsx scripts/typesense-seed.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 *   TYPESENSE_API_KEY, TYPESENSE_HOST
 */

import { createClient } from "@supabase/supabase-js"
import { getAdminClient, VEHICLES_COLLECTION, VEHICLES_SCHEMA } from "../lib/typesense/client"
import type { VehicleDocument } from "../lib/typesense/indexer"

const BATCH_SIZE = 250

async function main() {
  // 1. Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials")
    process.exit(1)
  }
  const supabase = createClient(supabaseUrl, supabaseKey)

  // 2. Typesense client
  const tsClient = getAdminClient()
  if (!tsClient) {
    console.error("Missing Typesense credentials (TYPESENSE_API_KEY / TYPESENSE_HOST)")
    process.exit(1)
  }

  // 3. Ensure collection exists
  try {
    await tsClient.collections(VEHICLES_COLLECTION).retrieve()
    console.log(`Collection '${VEHICLES_COLLECTION}' already exists`)
  } catch {
    console.log(`Creating collection '${VEHICLES_COLLECTION}'...`)
    await tsClient.collections().create(VEHICLES_SCHEMA)
    console.log("Collection created")
  }

  // 4. Fetch all vehicles from Supabase
  console.log("Fetching vehicles from Supabase...")
  let allVehicles: Record<string, unknown>[] = []
  let from = 0
  const pageSize = 1000

  while (true) {
    const { data, error } = await supabase
      .from("vehicles")
      .select("id, stock_number, year, make, model, trim, body_style, exterior_color, price, mileage, drivetrain, fuel_type, transmission, engine, is_ev, is_certified, status, primary_image_url, description, vin, location, created_at")
      .range(from, from + pageSize - 1)

    if (error) {
      console.error("Supabase error:", error.message)
      process.exit(1)
    }
    if (!data || data.length === 0) break
    allVehicles = allVehicles.concat(data)
    console.log(`  Fetched ${allVehicles.length} vehicles so far...`)
    if (data.length < pageSize) break
    from += pageSize
  }

  console.log(`Total vehicles: ${allVehicles.length}`)

  // 5. Transform and index in batches
  const docs: VehicleDocument[] = allVehicles.map((v) => ({
    id: String(v.id),
    stock_number: String(v.stock_number || ""),
    year: Number(v.year || 0),
    make: String(v.make || ""),
    model: String(v.model || ""),
    trim: v.trim ? String(v.trim) : undefined,
    body_style: v.body_style ? String(v.body_style) : undefined,
    exterior_color: v.exterior_color ? String(v.exterior_color) : undefined,
    price: Number(v.price || 0),
    mileage: Number(v.mileage || 0),
    drivetrain: v.drivetrain ? String(v.drivetrain) : undefined,
    fuel_type: v.fuel_type ? String(v.fuel_type) : undefined,
    transmission: v.transmission ? String(v.transmission) : undefined,
    engine: v.engine ? String(v.engine) : undefined,
    is_ev: Boolean(v.is_ev),
    is_certified: Boolean(v.is_certified),
    status: String(v.status || "available"),
    primary_image_url: v.primary_image_url ? String(v.primary_image_url) : undefined,
    description: v.description ? String(v.description) : undefined,
    vin: v.vin ? String(v.vin) : undefined,
    location: v.location ? String(v.location) : undefined,
    created_at: v.created_at ? Math.floor(new Date(String(v.created_at)).getTime() / 1000) : undefined,
  }))

  let success = 0
  let errors = 0

  for (let i = 0; i < docs.length; i += BATCH_SIZE) {
    const batch = docs.slice(i, i + BATCH_SIZE)
    const results = await tsClient
      .collections(VEHICLES_COLLECTION)
      .documents()
      .import(batch, { action: "upsert" })

    for (const r of results) {
      if (r.success) success++
      else {
        errors++
        console.error(`  Error: ${r.error}`)
      }
    }
    console.log(`  Indexed batch ${Math.floor(i / BATCH_SIZE) + 1}: ${success} ok, ${errors} errors`)
  }

  console.log(`\nDone! ${success} indexed, ${errors} errors.`)
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exit(1)
})
