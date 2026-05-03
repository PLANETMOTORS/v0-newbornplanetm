#!/usr/bin/env tsx
/**
 * 10K Vehicle Streaming Pipeline Stress Test
 * ─────────────────────────────────────────
 * Generates a synthetic 10,000-row HomenetIOL CSV and pushes it
 * through the PapaParse streaming parser + batch processing.
 *
 * Measures:
 *   1. Peak RSS Memory  (target: < 256 MB)
 *   2. Total Parse Time
 *   3. Batch count & valid vehicle count
 *
 * No database or Typesense connection needed — this is a pure
 * parser/memory stress test that can run in any environment.
 *
 * Usage:  npx tsx scripts/stress-test-10k.ts
 */

import { parseHomenetCSVStream } from "../lib/homenet/streaming-parser"

// ── Config ──
const TOTAL_VEHICLES = 10_000
const BATCH_SIZE = 500

// ── Synthetic Data Generators ──
const MAKES = ["Toyota", "Honda", "Ford", "Chevrolet", "BMW", "Tesla", "Hyundai", "Kia", "Nissan", "Mazda", "Subaru", "Volkswagen", "Mercedes-Benz", "Audi", "Lexus"]
const MODELS: Record<string, string[]> = {
  Toyota: ["Camry", "RAV4", "Corolla", "Highlander", "Tacoma"],
  Honda: ["Civic", "CR-V", "Accord", "Pilot", "HR-V"],
  Ford: ["F-150", "Escape", "Explorer", "Mustang", "Bronco"],
  Chevrolet: ["Silverado", "Equinox", "Malibu", "Traverse", "Blazer"],
  BMW: ["3 Series", "X3", "X5", "5 Series", "iX"],
  Tesla: ["Model 3", "Model Y", "Model S", "Model X", "Cybertruck"],
  Hyundai: ["Tucson", "Elantra", "Santa Fe", "Ioniq 5", "Kona"],
  Kia: ["Sportage", "Forte", "Seltos", "Telluride", "EV6"],
  Nissan: ["Rogue", "Altima", "Sentra", "Pathfinder", "Kicks"],
  Mazda: ["CX-5", "Mazda3", "CX-50", "CX-9", "MX-5"],
  Subaru: ["Outback", "Forester", "Crosstrek", "Impreza", "WRX"],
  Volkswagen: ["Jetta", "Tiguan", "Atlas", "Golf", "ID.4"],
  "Mercedes-Benz": ["C-Class", "GLC", "E-Class", "GLE", "A-Class"],
  Audi: ["A4", "Q5", "A3", "Q7", "e-tron"],
  Lexus: ["RX", "NX", "ES", "IS", "UX"],
}
const BODY_STYLES = ["Sedan", "SUV", "Truck", "Coupe", "Hatchback", "Wagon", "Convertible"]
const COLORS = ["Black", "White", "Silver", "Red", "Blue", "Grey", "Green", "Pearl White"]
const FUEL_TYPES = ["Gasoline", "Electric", "Hybrid", "Diesel", "Plug-In Hybrid"]
const DRIVETRAINS = ["FWD", "AWD", "RWD", "4WD"]
const TRANSMISSIONS = ["Automatic", "Manual", "CVT"]

function rand<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)] }
function randInt(min: number, max: number): number { return Math.floor(Math.random() * (max - min + 1)) + min }
function fakeVin(i: number): string {
  const chars = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789"
  const base = String(i).padStart(6, "0")
  let vin = "1HGBH41JXMN"
  for (const c of base) vin += chars[parseInt(c) % chars.length]
  return vin.slice(0, 17)
}

// ── Generate CSV ──
function generateCSV(count: number): string {
  const header = "VIN,StockNumber,Year,Make,Model,Trim,BodyStyle,ExteriorColor,InteriorColor,Price,MSRP,Mileage,Drivetrain,Transmission,Engine,FuelType,FuelEconomyCity,FuelEconomyHighway,Status,IsCertified,IsNewArrival,Featured,InspectionScore,PrimaryImageUrl,ImageUrls,Has360Spin,VideoUrl,Location,Description\n"
  const rows: string[] = []
  for (let i = 0; i < count; i++) {
    const make = rand(MAKES)
    const model = rand(MODELS[make])
    const year = randInt(2018, 2026)
    const price = randInt(15000, 95000)
    const msrp = price + randInt(1000, 5000)
    const mileage = randInt(500, 150000)
    const vin = fakeVin(i)
    const stock = `PM-${String(i).padStart(5, "0")}`
    const imgBase = `https://content.homenetiol.com/2003873/${i}/0x0`
    const images = Array.from({ length: randInt(3, 15) }, (_, j) => `${imgBase}/img${j}.jpg`).join("|")
    rows.push(
      `${vin},${stock},${year},${make},${model},${rand(["SE", "XLE", "Limited", "Sport", "Base"])},` +
      `${rand(BODY_STYLES)},${rand(COLORS)},${rand(COLORS)},${price},${msrp},${mileage},` +
      `${rand(DRIVETRAINS)},${rand(TRANSMISSIONS)},2.5L 4-Cylinder,${rand(FUEL_TYPES)},` +
      `${randInt(20, 35)},${randInt(28, 45)},available,true,${i < 50 ? "true" : "false"},` +
      `${i < 20 ? "true" : "false"},210,${imgBase}/img0.jpg,${images},false,,Richmond Hill ON,` +
      `"Beautiful ${year} ${make} ${model} in excellent condition with low mileage."`
    )
  }
  return header + rows.join("\n")
}

// ── Memory Tracker ──
let peakRssBytes = 0
let memInterval: ReturnType<typeof setInterval>
function startMemoryTracking() {
  peakRssBytes = process.memoryUsage.rss()
  memInterval = setInterval(() => {
    const rss = process.memoryUsage.rss()
    if (rss > peakRssBytes) peakRssBytes = rss
  }, 50) // sample every 50ms
}
function stopMemoryTracking() { clearInterval(memInterval) }
function formatMB(bytes: number): string { return (bytes / 1024 / 1024).toFixed(1) + " MB" }

// ── Main ──
async function main() {
  console.log("╔══════════════════════════════════════════════════╗")
  console.log("║   Planet Motors — 10K Streaming Stress Test      ║")
  console.log("╚══════════════════════════════════════════════════╝\n")

  // Force GC if available
  if (global.gc) global.gc()
  const baselineRss = process.memoryUsage.rss()
  console.log(`Baseline RSS:        ${formatMB(baselineRss)}`)
  console.log(`Generating ${TOTAL_VEHICLES.toLocaleString()} synthetic CSV rows...\n`)

  const csvGenStart = Date.now()
  const csv = generateCSV(TOTAL_VEHICLES)
  const csvGenTime = Date.now() - csvGenStart
  const csvSizeBytes = Buffer.byteLength(csv, "utf-8")
  console.log(`CSV generated:       ${(csvSizeBytes / 1024 / 1024).toFixed(1)} MB in ${csvGenTime}ms`)

  // Start memory tracking and parsing
  startMemoryTracking()
  const parseStart = Date.now()

  let batchVehicleTotal = 0
  const stats = await parseHomenetCSVStream(csv, {
    batchSize: BATCH_SIZE,
    onBatch: async (batch, batchIndex) => {
      batchVehicleTotal += batch.length
      // Simulate realistic DB upsert latency: 500 vehicles × ~2ms each = ~1s per batch
      // This keeps batches in memory longer, stress-testing the GC
      await new Promise((r) => setTimeout(r, Math.min(batch.length * 2, 1000)))
      if ((batchIndex + 1) % 5 === 0) {
        const rss = process.memoryUsage.rss()
        if (rss > peakRssBytes) peakRssBytes = rss
        console.log(
          `  Batch ${String(batchIndex + 1).padStart(2)}: ${batch.length} vehicles | ` +
          `cumulative: ${batchVehicleTotal.toLocaleString()} | RSS: ${formatMB(rss)}`
        )
      }
    },
  })

  stopMemoryTracking()
  const totalTime = Date.now() - parseStart
  const finalRss = process.memoryUsage.rss()
  if (finalRss > peakRssBytes) peakRssBytes = finalRss

  // ── Results ──
  const memDelta = peakRssBytes - baselineRss
  const passMemory = peakRssBytes < 256 * 1024 * 1024

  console.log("\n" + "═".repeat(55))
  console.log("  10K STRESS TEST RESULTS")
  console.log("═".repeat(55))
  console.log(`  CSV Size:            ${(csvSizeBytes / 1024 / 1024).toFixed(1)} MB`)
  console.log(`  Total Rows Parsed:   ${stats.totalRows.toLocaleString()}`)
  console.log(`  Valid Vehicles:      ${stats.validVehicles.toLocaleString()}`)
  console.log(`  Skipped Rows:        ${stats.skippedRows.toLocaleString()}`)
  console.log(`  Batches Processed:   ${stats.batches}`)
  console.log(`  Batch Size:          ${BATCH_SIZE}`)
  console.log("─".repeat(55))
  console.log(`  Total Parse Time:    ${(totalTime / 1000).toFixed(2)}s`)
  console.log(`  Throughput:          ${Math.round(stats.validVehicles / (totalTime / 1000))} vehicles/sec`)
  console.log("─".repeat(55))
  console.log(`  Baseline RSS:        ${formatMB(baselineRss)}`)
  console.log(`  Peak RSS:            ${formatMB(peakRssBytes)}`)
  console.log(`  Memory Delta:        ${formatMB(memDelta)}`)
  console.log(`  Peak < 256 MB:       ${passMemory ? "✅ PASS" : "❌ FAIL"}`)
  console.log("─".repeat(55))

  // Typesense sync estimate
  const typesenseBatches = Math.ceil(stats.validVehicles / 1000)
  console.log(`  Typesense Batches:   ${typesenseBatches} (batch size: 1000)`)
  console.log(`  Est. Typesense Sync: ${(typesenseBatches * 0.8).toFixed(1)}s @ 800ms/batch`)
  console.log("═".repeat(55))

  if (!passMemory) {
    console.error("\n❌ STRESS TEST FAILED: Peak memory exceeded 256 MB limit!")
    process.exit(1)
  }

  console.log("\n✅ All checks passed. Pipeline is 10K-ready.\n")
  process.exit(0)
}

main().catch((err) => {
  console.error("FATAL:", err)
  process.exit(1)
})
