#!/usr/bin/env npx tsx
export {}

// Load .env.local for local development
import { config } from "dotenv"
config({ path: ".env.local" })

/**
 * Full Drivee → Supabase 360° Frame Migration
 *
 * Fetches ALL vehicles from Pirelly's pModel_paginator API (no hardcoded MIDs),
 * downloads walk-around frames from Firebase Storage, uploads to Supabase,
 * and updates the drivee_mappings table.
 *
 * Usage:
 *   npx tsx scripts/migrate-all-360.ts                    # migrate all
 *   npx tsx scripts/migrate-all-360.ts --dry-run          # just list vehicles
 *   npx tsx scripts/migrate-all-360.ts --mid 190171976531 # single vehicle
 *   npx tsx scripts/migrate-all-360.ts --skip-existing    # skip already-migrated
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   DRIVEE_EMAIL (default: planetmotors@drivee.ai)
 *   DRIVEE_PASSWORD (default: planetmotors741)
 */

const FIREBASE_AUTH_URL =
  "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword"
const FIREBASE_API_KEY = "AIzaSyCEPNoOUcY2UCHsTf1r2c3zxaJOw-DbJxo"
const PIRELLY_PAGINATOR =
  "https://us-central1-pirelly360.cloudfunctions.net/pModel_paginator"
const FIREBASE_STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/public-iframe/o"
const DRIVEE_UID = "AZYuEtjX9NUvWpqmUQcKyiGHbNg1"
const BUCKET = "vehicle-360"

interface PirellyVehicle {
  mid: string
  vin: string
  brand: string
  model: string
  stock: string
  frameCount: number
  frameFilenames: string[]
}

type PirellySpin = {
  modelId?: string
  status?: boolean
  order?: number
  filename?: string
}

type PirellyVehicleItem = {
  car?: {
    vin?: string
    brand?: string
    carModel?: string
    stockNumber?: string
  }
  modelMainSpins?: Record<string, PirellySpin>
}

// ─── Auth ────────────────────────────────────────────────────────────────────

async function getFirebaseToken(): Promise<string> {
  const email = process.env.DRIVEE_EMAIL ?? "planetmotors@drivee.ai"
  const password = process.env.DRIVEE_PASSWORD ?? "planetmotors741"

  const res = await fetch(`${FIREBASE_AUTH_URL}?key=${FIREBASE_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, returnSecureToken: true }),
  })

  if (!res.ok) throw new Error(`Firebase auth failed: ${res.status}`)
  const data = await res.json()
  return data.idToken
}

// ─── Pirelly API ─────────────────────────────────────────────────────────────

async function fetchAllVehicles(token: string): Promise<PirellyVehicle[]> {
  const res = await fetch(`${PIRELLY_PAGINATOR}?limit=200`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) throw new Error(`Pirelly API failed: ${res.status}`)
  const data = (await res.json()) as { data?: PirellyVehicleItem[] }

  return (data.data ?? []).map((item) => {
    const car = item.car ?? {}
    const spins = item.modelMainSpins ?? {}
    const spinValues = Object.values(spins)
    const mid = spinValues[0]?.modelId ?? ""
    const filenames = spinValues
      .filter((s) => s.status !== false)
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((s) => s.filename)
      .filter((filename): filename is string => Boolean(filename))

    return {
      mid,
      vin: car.vin ?? "",
      brand: car.brand ?? "",
      model: car.carModel ?? "",
      stock: car.stockNumber ?? "",
      frameCount: filenames.length,
      frameFilenames: filenames,
    }
  }).filter((v: PirellyVehicle) => v.mid && v.vin)
}

// ─── Firebase Storage download ───────────────────────────────────────────────

function firebaseFrameUrl(mid: string, filename: string): string {
  const path = `users/${DRIVEE_UID}/models/${mid}/${filename}`
  return `${FIREBASE_STORAGE_BASE}/${encodeURIComponent(path)}?alt=media`
}

async function downloadFrame(mid: string, filename: string): Promise<Buffer> {
  const url = firebaseFrameUrl(mid, filename)
  const res = await fetch(url, { signal: AbortSignal.timeout(30_000) })
  if (!res.ok) throw new Error(`Download failed: ${url} → ${res.status}`)
  return Buffer.from(await res.arrayBuffer())
}

// ─── Supabase upload ─────────────────────────────────────────────────────────

async function uploadToSupabase(
  supabaseUrl: string,
  key: string,
  mid: string,
  frameNum: number,
  data: Buffer,
): Promise<string> {
  const padded = String(frameNum).padStart(2, "0")
  const storagePath = `${mid}/nobg/${padded}.webp`
  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "image/webp",
      "x-upsert": "true",
    },
    body: data,
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upload failed ${storagePath}: ${res.status} ${text}`)
  }

  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

// ─── Supabase drivee_mappings upsert ─────────────────────────────────────────

async function upsertMapping(
  supabaseUrl: string,
  key: string,
  v: PirellyVehicle,
  framesUploaded: number,
): Promise<void> {
  const url = `${supabaseUrl}/rest/v1/drivee_mappings`
  const body = {
    vin: v.vin,
    mid: v.mid,
    frame_count: framesUploaded,
    frames_in_storage: framesUploaded > 0,
    brand: v.brand,
    model: v.model,
    stock_number: v.stock,
    synced_at: new Date().toISOString(),
  }

  await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      apikey: key,
      "Content-Type": "application/json",
      Prefer: "resolution=merge-duplicates",
    },
    body: JSON.stringify(body),
  })
}

// ─── Check if already migrated ──────────────────────────────────────────────

async function countExistingFrames(supabaseUrl: string, mid: string): Promise<number> {
  let count = 0
  for (let i = 1; i <= 50; i++) {
    const padded = String(i).padStart(2, "0")
    const url = `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${mid}/nobg/${padded}.webp`
    try {
      const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5_000) })
      if (!res.ok) break
      count++
    } catch { break }
  }
  return count
}

// ─── Migrate one vehicle ─────────────────────────────────────────────────────

async function migrateVehicle(
  supabaseUrl: string,
  key: string,
  v: PirellyVehicle,
  skipExisting: boolean,
): Promise<{ mid: string; uploaded: number; skipped: boolean }> {
  const label = `${v.brand} ${v.model} (VIN: ${v.vin}, MID: ${v.mid})`
  console.log(`\n📸 ${label}`)

  if (skipExisting) {
    const existing = await countExistingFrames(supabaseUrl, v.mid)
    if (existing >= v.frameCount - 2) { // allow 2-frame tolerance
      console.log(`   ⏭  Already migrated (${existing} frames in Supabase) — skipping`)
      await upsertMapping(supabaseUrl, key, v, existing)
      return { mid: v.mid, uploaded: 0, skipped: true }
    }
  }

  console.log(`   Downloading ${v.frameFilenames.length} frames from Firebase...`)

  let uploaded = 0
  const BATCH = 4

  for (let i = 0; i < v.frameFilenames.length; i += BATCH) {
    const batch = v.frameFilenames.slice(i, i + BATCH)
    await Promise.all(
      batch.map(async (filename, j) => {
        const frameNum = i + j + 1
        try {
          const data = await downloadFrame(v.mid, filename)
          await uploadToSupabase(supabaseUrl, key, v.mid, frameNum, data)
          uploaded++
          process.stdout.write(".")
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : "Unknown error"
          process.stdout.write("✗")
          console.error(`\n   ⚠️  Frame ${frameNum} failed: ${message}`)
        }
      }),
    )
  }

  console.log(` → ${uploaded}/${v.frameFilenames.length} frames uploaded`)

  // Update drivee_mappings
  await upsertMapping(supabaseUrl, key, v, uploaded)
  return { mid: v.mid, uploaded, skipped: false }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const skipExisting = args.includes("--skip-existing")
  const midFilter = args.includes("--mid") ? args[args.indexOf("--mid") + 1] : null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")
    process.exit(1)
  }

  console.log("🔐 Authenticating with Drivee/Pirelly...")
  const token = await getFirebaseToken()
  console.log("✅ Authenticated")

  console.log("\n📡 Fetching all vehicles from Pirelly API...")
  let vehicles = await fetchAllVehicles(token)
  console.log(`✅ Found ${vehicles.length} vehicles`)

  if (midFilter) {
    vehicles = vehicles.filter((v) => v.mid === midFilter)
    if (vehicles.length === 0) {
      console.error(`❌ No vehicle found with MID ${midFilter}`)
      process.exit(1)
    }
    console.log(`🔍 Filtered to MID ${midFilter}`)
  }

  if (dryRun) {
    console.log("\n📋 Dry run — listing all vehicles:\n")
    for (const v of vehicles) {
      console.log(`  VIN=${v.vin}  MID=${v.mid}  ${v.brand} ${v.model}  stock=${v.stock}  frames=${v.frameCount}`)
    }
    console.log(`\n  Total: ${vehicles.length} vehicles, ${vehicles.reduce((s, v) => s + v.frameCount, 0)} frames`)
    return
  }

  console.log("\n🚀 Starting migration...")
  console.log(`   Source: Firebase Storage (public-iframe bucket)`)
  console.log(`   Destination: Supabase Storage (${BUCKET} bucket)`)
  console.log(`   Vehicles: ${vehicles.length}`)
  console.log(`   Skip existing: ${skipExisting}`)

  const results: { mid: string; uploaded: number; skipped: boolean }[] = []
  let totalUploaded = 0

  for (const v of vehicles) {
    const result = await migrateVehicle(supabaseUrl, serviceRoleKey, v, skipExisting)
    results.push(result)
    totalUploaded += result.uploaded
  }

  // ─── Summary ─────────────────────────────────────────────────────────────

  console.log("\n\n═══════════════════════════════════════════════════")
  console.log("📊 Migration Summary")
  console.log("═══════════════════════════════════════════════════")

  const migrated = results.filter((r) => r.uploaded > 0)
  const skipped = results.filter((r) => r.skipped)
  const failed = results.filter((r) => !r.skipped && r.uploaded === 0)

  console.log(`  ✅ Migrated: ${migrated.length} vehicles (${totalUploaded} frames)`)
  console.log(`  ⏭  Skipped:  ${skipped.length} vehicles (already in Supabase)`)
  console.log(`  ❌ Failed:   ${failed.length} vehicles`)

  if (failed.length > 0) {
    console.log("\n  Failed MIDs:")
    for (const f of failed) console.log(`    - ${f.mid}`)
  }

  // ─── Write manifest ──────────────────────────────────────────────────────

  const manifest: Record<string, number> = {}
  for (const v of vehicles) {
    const r = results.find((r) => r.mid === v.mid)
    if (r && (r.uploaded > 0 || r.skipped)) {
      manifest[v.mid] = r.skipped
        ? (await countExistingFrames(supabaseUrl, v.mid))
        : r.uploaded
    }
  }

  const fs = await import("fs")

  // Save JSON manifest
  const manifestJson = vehicles
    .filter((v) => manifest[v.mid])
    .map((v) => ({
      mid: v.mid,
      vin: v.vin,
      vehicle: `${v.brand} ${v.model}`,
      frameCount: manifest[v.mid],
    }))

  fs.writeFileSync("scripts/migration-manifest.json", JSON.stringify(manifestJson, null, 2))
  console.log("\n📄 Manifest written to scripts/migration-manifest.json")

  // Generate FRAME_MANIFEST update for drivee-frames.ts
  const manifestLines = Object.entries(manifest)
    .sort(([, a], [, b]) => b - a)
    .map(([mid, count]) => {
      const v = vehicles.find((v) => v.mid === mid)
      return `  "${mid}": ${count}, // ${v?.brand ?? ""} ${v?.model ?? ""}`
    })

  console.log("\n📝 Update FRAME_MANIFEST in lib/drivee-frames.ts with:\n")
  console.log("export const FRAME_MANIFEST: Record<string, number> = {")
  for (const line of manifestLines) console.log(line)
  console.log("}")
  console.log("\n═══════════════════════════════════════════════════\n")
}

main().catch((err) => {
  console.error("❌ Migration failed:", err)
  process.exit(1)
})
