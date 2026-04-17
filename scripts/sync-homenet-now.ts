#!/usr/bin/env tsx
/**
 * Full-replacement sync: reads PlanetMotorsDealer.csv and replaces entire DB inventory.
 * Incoming file IS the inventory. Old vehicles not in file are deleted.
 */
import { parseHomenetCSV, syncVehiclesToDatabase, getSql } from "../lib/homenet/parser"
import { readFileSync } from "fs"
import { resolve } from "path"

type CountRow = { total: string }
type VehicleRow = { vin: string; year: number; make: string; model: string }

async function main() {
  const csvPath = resolve(__dirname, "..", "PlanetMotorsDealer.csv")
  const csv = readFileSync(csvPath, "utf-8")
  const vehicles = parseHomenetCSV(csv)
  console.log("Parsed: " + vehicles.length + " vehicles from HomeNet file")

  const sql = getSql()
  if (!sql) {
    console.error("ERROR: DATABASE_URL not set. Export it first.")
    process.exit(1)
  }

  // Count before
  const before = (await sql`SELECT COUNT(*) as total FROM vehicles`) as unknown as CountRow[]
  console.log("Before sync: " + before[0]?.total + " vehicles in DB")

  console.log("Running full-replacement sync...")
  const result = await syncVehiclesToDatabase(sql, vehicles)
  console.log("\n=== SYNC COMPLETE ===")
  console.log("Inserted: " + result.inserted)
  console.log("Updated:  " + result.updated)
  console.log("Removed:  " + result.removed)
  console.log("Errors:   " + result.errors.length)

  if (result.errors.length > 0) {
    console.log("\nErrors:")
    result.errors.forEach((e) => console.error("  " + e.vin + ": " + e.error))
  }

  // Count after
  const after = (await sql`SELECT COUNT(*) as total FROM vehicles`) as unknown as CountRow[]
  console.log("\nAfter sync: " + after[0]?.total + " vehicles in DB")

  // List all
  const live = (await sql`SELECT vin, year, make, model FROM vehicles ORDER BY make, model`) as unknown as VehicleRow[]
  console.log("\nLive inventory (" + live.length + " vehicles):")
  for (const v of live) {
    console.log("  " + v.vin + " | " + v.year + " " + v.make + " " + v.model)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("FATAL:", err)
  process.exit(1)
})
