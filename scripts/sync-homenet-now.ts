#!/usr/bin/env tsx

/**
 * Full-replacement sync: reads PlanetMotorsDealer.csv via streaming and
 * replaces entire DB inventory. Uses ReadStream (never readFileSync) to
 * stay under 256MB memory at 10k+ rows.
 */
import { createReadStream } from "node:fs"
import { resolve } from "node:path"
import { getSql } from "../lib/homenet/parser"
import { streamingSyncToDatabase } from "../lib/homenet/streaming-sync"

async function main() {
  const csvPath = resolve(__dirname, "..", "PlanetMotorsDealer.csv")
  const stream = createReadStream(csvPath, { encoding: "utf-8" })

  const sql = getSql()
  if (!sql) {
    console.error("ERROR: DATABASE_URL not set. Export it first.")
    process.exit(1)
  }

  // Count before
  const before = await sql`SELECT COUNT(*) as total FROM vehicles`
  console.log("Before sync: " + (before as { total: string }[])[0]?.total + " vehicles in DB")

  console.log("Running streaming full-replacement sync (500-row batches)...")
  const result = await streamingSyncToDatabase(sql, stream, {
    batchSize: 500,
    onProgress: (p) => {
      if (p.batchesCompleted % 5 === 0) {
        console.log(`  Progress: ${p.vehiclesProcessed} vehicles, ${p.batchesCompleted} batches`)
      }
    },
  })
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
  const after = await sql`SELECT COUNT(*) as total FROM vehicles`
  console.log("\nAfter sync: " + (after as { total: string }[])[0]?.total + " vehicles in DB")

  // List all
  type VehicleRow = { vin: string; year: number; make: string; model: string }
  const live = await sql`SELECT vin, year, make, model FROM vehicles ORDER BY make, model`
  console.log("\nLive inventory (" + (live as VehicleRow[]).length + " vehicles):")
  for (const v of live as VehicleRow[]) {
    console.log("  " + v.vin + " | " + v.year + " " + v.make + " " + v.model)
  }

  process.exit(0)
}

main().catch((err) => {
  console.error("FATAL:", err)
  process.exit(1)
})
