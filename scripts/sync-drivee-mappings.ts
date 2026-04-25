#!/usr/bin/env npx tsx
 
/**
 * Sync drivee_mappings table from migration-manifest.json
 *
 * Reads the manifest (MID → VIN → vehicle name → frame count) and upserts
 * each entry into the `drivee_mappings` table with `frames_in_storage = true`.
 *
 * This enables the 360° viewer for ALL vehicles that have frames in Supabase.
 *
 * Usage:
 *   npx tsx scripts/sync-drivee-mappings.ts
 *   npx tsx scripts/sync-drivee-mappings.ts --dry-run
 */

import { readFileSync } from "node:fs"
import { resolve } from "node:path"

interface ManifestEntry {
  mid: string
  vin: string
  vehicle: string
  frameCount: number
}

async function main() {
  const dryRun = process.argv.includes("--dry-run")

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  // Load manifest
  const manifestPath = resolve(__dirname, "migration-manifest.json")
  const manifest: ManifestEntry[] = JSON.parse(readFileSync(manifestPath, "utf-8"))

  console.log("🔄 Syncing drivee_mappings from migration-manifest.json")
  console.log(`   Vehicles: ${manifest.length}`)
  console.log(`   Dry run: ${dryRun}`)
  console.log()

  let synced = 0
  let failed = 0

  for (const entry of manifest) {
    const body = {
      vin: entry.vin,
      mid: entry.mid,
      frame_count: entry.frameCount,
      frames_in_storage: true,
      vehicle_name: entry.vehicle,
      source: "pirelly",
      verified_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (dryRun) {
      console.log(`  📋 [DRY RUN] ${entry.vehicle} — MID: ${entry.mid}, VIN: ${entry.vin}, frames: ${entry.frameCount}`)
      synced++
      continue
    }

    try {
      const url = `${supabaseUrl}/rest/v1/drivee_mappings`
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates",
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        console.log(`  ✅ ${entry.vehicle} — MID: ${entry.mid}, ${entry.frameCount} frames`)
        synced++
      } else {
        const text = await res.text()
        console.error(`  ❌ ${entry.vehicle} (${entry.vin}): ${res.status} ${text}`)
        failed++
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ ${entry.vehicle}: ${msg}`)
      failed++
    }
  }

  console.log()
  console.log("═══════════════════════════════════════")
  console.log("📊 Sync Summary")
  console.log("═══════════════════════════════════════")
  console.log(`  ✅ Synced: ${synced}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  📋 Total:  ${manifest.length}`)
  console.log("═══════════════════════════════════════")
}

main().catch((err) => {
  console.error("Sync failed:", err)
  process.exit(1)
})
