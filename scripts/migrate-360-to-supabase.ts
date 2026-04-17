#!/usr/bin/env npx tsx
// Force module scope so `main()` doesn't collide with other scripts
export {}

/**
 * Migrate 360° walk-around frames from Drivee's Firebase Storage
 * to our own Supabase Storage bucket (`vehicle-360`).
 *
 * Usage:
 *   npx tsx scripts/migrate-360-to-supabase.ts
 *
 * Required env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * What it does:
 *   1. Iterates every unique MID in DRIVEE_VIN_MAP
 *   2. Probes Firebase Storage for frames 01..50 (parallel HEAD requests)
 *   3. Downloads each frame as a WebP blob
 *   4. Uploads to Supabase Storage: vehicle-360/{mid}/nobg/{NN}.webp
 *   5. Prints a summary with public URLs
 */

const FIREBASE_STORAGE_BASE =
  "https://firebasestorage.googleapis.com/v0/b/public-iframe/o"
const DRIVEE_DEALER_UID = "AZYuEtjX9NUvWpqmUQcKyiGHbNg1"
const BUCKET = "vehicle-360"
const MAX_PROBE = 50

// All unique MIDs from DRIVEE_VIN_MAP
const UNIQUE_MIDS: Record<string, string> = {
  "190171976531": "2021 Jeep Wrangler 4xe",
  "744761075195": "2025 Chevrolet Equinox EV",
  "132601940353": "2021 Tesla Model 3",
  "806787519944": "2023 Volkswagen Taos",
  "890747363179": "2024 Tesla Model 3",
  "640326639530": "2019 Tesla Model 3",
  "061789806057": "2022 Tesla Model 3",
  "396425623701": "2018 Volkswagen Tiguan",
  "625294835450": "2025 Hyundai Kona Electric",
  "085109772520": "2018 Audi Q3",
  "860125156862": "2021 Tesla Model 3 (2nd)",
}

function firebaseFrameUrl(mid: string, frameNumber: number): string {
  const padded = String(frameNumber).padStart(2, "0")
  const path = `users/${DRIVEE_DEALER_UID}/models/${mid}/walk-around/${padded}.webp`
  return `${FIREBASE_STORAGE_BASE}/${encodeURIComponent(path)}?alt=media`
}

async function discoverFrameCount(mid: string): Promise<number> {
  const probes = Array.from({ length: MAX_PROBE }, (_, i) => {
    const url = firebaseFrameUrl(mid, i + 1)
    return fetch(url, { method: "HEAD" })
      .then((res) => res.ok)
      .catch(() => false)
  })

  const results = await Promise.all(probes)

  // Find longest consecutive run of true starting at index 0
  let count = 0
  for (const ok of results) {
    if (!ok) break
    count++
  }
  return count
}

async function downloadFrame(mid: string, frameNumber: number): Promise<Buffer> {
  const url = firebaseFrameUrl(mid, frameNumber)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

async function uploadToSupabase(
  supabaseUrl: string,
  serviceRoleKey: string,
  mid: string,
  frameNumber: number,
  data: Buffer,
): Promise<string> {
  const padded = String(frameNumber).padStart(2, "0")
  const storagePath = `${mid}/nobg/${padded}.webp`

  const uploadUrl = `${supabaseUrl}/storage/v1/object/${BUCKET}/${storagePath}`

  const res = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceRoleKey}`,
      "Content-Type": "image/webp",
      "x-upsert": "true", // overwrite if exists
    },
    body: data,
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Upload failed for ${storagePath}: ${res.status} ${text}`)
  }

  // Public URL
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${storagePath}`
}

async function migrateMid(
  supabaseUrl: string,
  serviceRoleKey: string,
  mid: string,
  vehicleName: string,
): Promise<{ mid: string; frameCount: number; publicUrls: string[] }> {
  console.log(`\n📸 ${vehicleName} (MID: ${mid})`)
  console.log("   Discovering frames...")

  const frameCount = await discoverFrameCount(mid)
  if (frameCount === 0) {
    console.log("   ⚠️  No frames found — skipping")
    return { mid, frameCount: 0, publicUrls: [] }
  }
  console.log(`   Found ${frameCount} frames`)

  const publicUrls: string[] = []

  // Download and upload in batches of 6 to avoid overwhelming either server
  for (let i = 1; i <= frameCount; i += 6) {
    const batch = Array.from(
      { length: Math.min(6, frameCount - i + 1) },
      (_, j) => i + j,
    )

    await Promise.all(
      batch.map(async (frameNum) => {
        const data = await downloadFrame(mid, frameNum)
        const publicUrl = await uploadToSupabase(
          supabaseUrl,
          serviceRoleKey,
          mid,
          frameNum,
          data,
        )
        publicUrls.push(publicUrl)
        process.stdout.write(".")
      }),
    )
  }

  console.log(` Done (${publicUrls.length} frames uploaded)`)
  return { mid, frameCount, publicUrls }
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY",
    )
    process.exit(1)
  }

  console.log("🚀 Drivee → Supabase 360° Frame Migration")
  console.log(`   Source: Firebase Storage (public-iframe bucket)`)
  console.log(`   Destination: Supabase Storage (${BUCKET} bucket)`)
  console.log(`   MIDs to migrate: ${Object.keys(UNIQUE_MIDS).length}`)

  const results: { mid: string; frameCount: number; publicUrls: string[] }[] = []
  let totalFrames = 0

  for (const [mid, name] of Object.entries(UNIQUE_MIDS)) {
    const result = await migrateMid(supabaseUrl, serviceRoleKey, mid, name)
    results.push(result)
    totalFrames += result.frameCount
  }

  console.log("\n\n═══════════════════════════════════════")
  console.log("📊 Migration Summary")
  console.log("═══════════════════════════════════════")
  for (const r of results) {
    const name = UNIQUE_MIDS[r.mid]
    const status = r.frameCount > 0 ? "✅" : "⚠️"
    console.log(`  ${status} ${name}: ${r.frameCount} frames`)
    if (r.publicUrls.length > 0) {
      console.log(`     First: ${r.publicUrls[0]}`)
    }
  }
  console.log(`\n  Total: ${totalFrames} frames across ${results.filter(r => r.frameCount > 0).length} vehicles`)
  console.log("═══════════════════════════════════════\n")

  // Write a JSON manifest for the PR to reference
  const manifest = results.map((r) => ({
    mid: r.mid,
    vehicle: UNIQUE_MIDS[r.mid],
    frameCount: r.frameCount,
    firstUrl: r.publicUrls[0] || null,
  }))

  const fs = await import("fs")
  fs.writeFileSync(
    "scripts/migration-manifest.json",
    JSON.stringify(manifest, null, 2),
  )
  console.log("📄 Manifest written to scripts/migration-manifest.json")
}

main().catch((err) => {
  console.error("Migration failed:", err)
  process.exit(1)
})
