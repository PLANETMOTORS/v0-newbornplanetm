#!/usr/bin/env tsx
/**
 * Full-replacement sync to SUPABASE (the database the website reads from).
 * 1. Parse PlanetMotorsDealer.csv
 * 2. Delete ALL existing vehicles in Supabase
 * 3. Insert only what's in the CSV
 */
import { createClient } from "@supabase/supabase-js"
import { parseHomenetCSV } from "../lib/homenet/parser"
import { readFileSync } from "fs"
import { resolve } from "path"

async function main() {
  const csvPath = resolve(__dirname, "..", "PlanetMotorsDealer.csv")
  const csv = readFileSync(csvPath, "utf-8")
  const vehicles = parseHomenetCSV(csv)
  console.log("Parsed:", vehicles.length, "vehicles from HomeNet")

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  const supabase = createClient(url, key)

  // Count before
  const { count: before } = await supabase.from("vehicles").select("*", { count: "exact", head: true })
  console.log("Before:", before, "vehicles in Supabase")

  // Step 1: Delete ALL existing vehicles
  const { error: delErr } = await supabase.from("vehicles").delete().neq("vin", "IMPOSSIBLE_VIN")
  if (delErr) {
    console.error("Delete failed:", delErr.message)
    process.exit(1)
  }
  console.log("Wiped all existing vehicles")

  // Step 2: Insert new vehicles from CSV
  // Map to Supabase schema (no description, source_vdp_url, title_status columns)
  const rows = vehicles.map((v) => ({
    stock_number: v.stock_number,
    vin: v.vin,
    year: v.year,
    make: v.make,
    model: v.model,
    trim: v.trim || null,
    body_style: v.body_style || null,
    exterior_color: v.exterior_color || null,
    interior_color: v.interior_color || null,
    price: v.price,
    msrp: v.msrp || null,
    mileage: v.mileage,
    drivetrain: v.drivetrain || null,
    transmission: v.transmission || null,
    engine: v.engine || null,
    fuel_type: v.fuel_type || null,
    fuel_economy_city: v.fuel_economy_city || null,
    fuel_economy_highway: v.fuel_economy_highway || null,
    is_ev: v.is_ev || false,
    battery_capacity_kwh: v.battery_capacity_kwh || null,
    range_miles: v.range_miles || null,
    status: v.status || "available",
    is_certified: v.is_certified || false,
    is_new_arrival: v.is_new_arrival || false,
    featured: v.featured || false,
    inspection_score: v.inspection_score || 210,
    primary_image_url: v.primary_image_url || null,
    image_urls: v.image_urls || [],
    has_360_spin: v.has_360_spin || false,
    video_url: v.video_url || null,
    location: v.location || "Richmond Hill, ON",
  }))

  // Insert in batches of 20
  let inserted = 0
  const errors: string[] = []
  for (let i = 0; i < rows.length; i += 20) {
    const batch = rows.slice(i, i + 20)
    const { error } = await supabase.from("vehicles").insert(batch)
    if (error) {
      console.error("Insert batch error:", error.message)
      errors.push(error.message)
    } else {
      inserted += batch.length
    }
  }

  // Count after
  const { count: after } = await supabase.from("vehicles").select("*", { count: "exact", head: true })
  console.log("\n=== SYNC COMPLETE ===")
  console.log("Inserted:", inserted)
  console.log("Errors:", errors.length)
  console.log("After:", after, "vehicles in Supabase")

  if (errors.length > 0) {
    errors.forEach((e) => console.error("  ", e))
  }

  // List all
  const { data: live } = await supabase
    .from("vehicles")
    .select("vin, year, make, model")
    .order("make")
  console.log("\nLive inventory:")
  for (const v of live || []) {
    console.log("  " + v.vin + " | " + v.year + " " + v.make + " " + v.model)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("FATAL:", err)
  process.exit(1)
})
