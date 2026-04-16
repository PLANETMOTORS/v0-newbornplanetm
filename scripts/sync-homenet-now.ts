#!/usr/bin/env tsx
/**
 * Direct sync: reads PlanetMotorsDealer.csv and pushes to production DB.
 * No SFTP needed — uses the CSV already downloaded from FilePulse.
 */
import { parseHomenetCSV, syncVehiclesToDatabase, getSql } from "../lib/homenet/parser"
import { readFileSync } from "fs"
import { resolve } from "path"

async function main() {
  const csvPath = resolve(__dirname, "..", "PlanetMotorsDealer.csv")
  const csv = readFileSync(csvPath, "utf-8")
  const vehicles = parseHomenetCSV(csv)
  console.log(`Parsed: ${vehicles.length} vehicles`)

  const sql = getSql()
  if (!sql) {
    console.error("ERROR: DATABASE_URL not set. Export it first.")
    process.exit(1)
  }

  console.log("Syncing to database...")
  const result = await syncVehiclesToDatabase(sql, vehicles)
  console.log(`\n=== SYNC COMPLETE ===`)
  console.log(`Inserted: ${result.inserted}`)
  console.log(`Updated:  ${result.updated}`)
  console.log(`Errors:   ${result.errors.length}`)

  if (result.errors.length > 0) {
    console.log("\nErrors:")
    result.errors.forEach((e) => console.error(`  ${e.vin}: ${e.error}`))
  }

  // Verify by querying back
  const count = await sql`SELECT COUNT(*) as total FROM vehicles`
  console.log(`\nTotal vehicles in DB: ${(count as any)[0]?.total}`)

  const sample = await sql`SELECT vin, year, make, model, price, mileage FROM vehicles ORDER BY updated_at DESC LIMIT 5`
  console.log("\nLatest 5 vehicles:")
  for (const v of sample as any[]) {
    console.log(`  ${v.vin} | ${v.year} ${v.make} ${v.model} | $${(v.price / 100).toLocaleString()} | ${v.mileage} km`)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("FATAL:", err)
  process.exit(1)
})
