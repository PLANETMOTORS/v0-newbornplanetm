import { put, list } from "@vercel/blob"
import crypto from "node:crypto"
import { getSql, type SqlClient } from "@/lib/neon/sql"
import { processVehiclePhoto, isBgRemovalEnabled, type BgRemovalResult } from "@/lib/bg-removal"

// ==================== TYPES ====================

export interface ImagePipelineVehicle {
  stock_number: string
  vin: string
  image_urls: string[]
  has_360_spin: boolean
}

export interface ImagePipelineResult {
  totalImages: number
  downloaded: number
  skipped: number
  failed: number
  bgRemoved: number
  bgFallback: number
  vehiclesProcessed: number
  errors: { stockNumber: string; url: string; error: string }[]
}

interface BlobEntry {
  pathname: string
  url: string
}

// ==================== CONSTANTS ====================

const BATCH_CONCURRENCY = 10
const IMAGE_FETCH_TIMEOUT_MS = 15_000
const SPIN_URL_PATTERN = /spin|360|pano/i

// ==================== HELPERS ====================

/**
 * Generate a short, stable hash of a source URL for dedup. Uses SHA-256
 * truncated to 12 hex chars; this is non-cryptographic — purely a content
 * key — but avoids Sonar S4790 (weak hash MD5).
 */
export function urlHash(url: string): string {
  return crypto.createHash("sha256").update(url).digest("hex").slice(0, 12)
}

/** Check if a URL looks like a 360° spin frame */
function isSpinImage(url: string): boolean {
  return SPIN_URL_PATTERN.test(url)
}

/** Build the Blob destination path for an image */
function blobPath(stockNumber: string, index: number, isSpin: boolean): string {
  if (isSpin) {
    return `vehicles/${stockNumber}/spin/frame-${index.toString().padStart(3, "0")}.jpg`
  }
  return `vehicles/${stockNumber}/photo-${index}.jpg`
}

/** Build the Blob destination path for a thumbnail */
function thumbnailPath(stockNumber: string, index: number, isSpin: boolean): string {
  if (isSpin) {
    return `vehicles/${stockNumber}/spin/thumb-${index.toString().padStart(3, "0")}.jpg`
  }
  return `vehicles/${stockNumber}/thumb-${index}.jpg`
}

// ==================== EXISTING BLOB CHECK ====================

/**
 * List existing blobs under a vehicle prefix to detect duplicates.
 * Returns a Set of pathnames for fast lookup.
 */
async function getExistingBlobs(stockNumber: string): Promise<Set<string>> {
  const existing = new Set<string>()
  try {
    const { blobs } = await list({ prefix: `vehicles/${stockNumber}/` })
    for (const blob of blobs) {
      existing.add(blob.pathname)
    }
  } catch {
    // If listing fails, assume nothing exists (will re-download)
  }
  return existing
}

// ==================== SINGLE IMAGE DOWNLOAD + UPLOAD ====================

interface DownloadResult extends BlobEntry {
  bgRemoved: boolean
}

async function downloadAndUpload(
  sourceUrl: string,
  destPath: string,
  enableBgRemoval: boolean,
): Promise<DownloadResult | null> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), IMAGE_FETCH_TIMEOUT_MS)

  try {
    const response = await fetch(sourceUrl, {
      signal: controller.signal,
      headers: { "User-Agent": "PlanetMotors-ImagePipeline/1.0" },
    })
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const rawBuffer = Buffer.from(await response.arrayBuffer())
    let uploadBuffer: Buffer = rawBuffer
    let contentType = response.headers.get("content-type") || "image/jpeg"
    let bgRemoved = false

    // Run background removal + studio compositing if enabled
    if (enableBgRemoval) {
      try {
        const result: BgRemovalResult = await processVehiclePhoto(rawBuffer)
        uploadBuffer = result.processedBuffer
        bgRemoved = result.bgRemoved
        contentType = "image/jpeg" // Always JPEG after compositing
      } catch (bgError) {
        console.warn(
          `[ImagePipeline] BG removal failed for ${sourceUrl}, using original:`,
          bgError instanceof Error ? bgError.message : bgError,
        )
        // Fallback to original — uploadBuffer remains rawBuffer
      }
    }

    // Also store the original (raw) image for reference
    if (bgRemoved) {
      const origPath = destPath.replace(/\.(jpg|jpeg|png|webp)$/i, "-original.$1")
      put(origPath, rawBuffer, {
        access: "public",
        contentType: response.headers.get("content-type") || "image/jpeg",
        addRandomSuffix: false,
      }).catch((err) => console.warn("[ImagePipeline] Failed to store original:", err))
    }

    // Upload processed (or original) to Vercel Blob
    const blob = await put(destPath, uploadBuffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    })

    return { pathname: blob.pathname, url: blob.url, bgRemoved }
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Unknown error"
    throw new Error(`Failed to download ${sourceUrl}: ${msg}`, { cause: error })
  } finally {
    clearTimeout(timeout)
  }
}

// ==================== GENERATE THUMBNAIL ====================

/**
 * For thumbnails, we re-upload from the same source but at a smaller size.
 * Since we can't resize in edge/serverless without sharp, we store the
 * original and use Vercel Image Optimization or imgix for on-the-fly resizing.
 * We create a metadata marker so the app knows thumbnails are available.
 */
async function uploadThumbnailMarker(
  stockNumber: string,
  index: number,
  isSpin: boolean,
  originalUrl: string,
): Promise<void> {
  const thumbDest = thumbnailPath(stockNumber, index, isSpin)
  // Store a small JSON marker pointing to the original + desired width
  const marker = JSON.stringify({ original: originalUrl, width: 600 })
  try {
    await put(thumbDest, marker, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
    })
  } catch {
    // Thumbnail marker failure is non-critical
  }
}

// ==================== BATCH PROCESSOR ====================

interface ImageProcessState {
  blobUrls: string[]
  primaryBlobUrl: string | null
}

/** Process a single image URL for a vehicle — download, bg-remove, upload, or skip if existing. */
async function processSingleImage(
  sourceUrl: string,
  stockNumber: string,
  idx: number,
  isSpin: boolean,
  existingBlobs: Set<string>,
  result: ImagePipelineResult,
  state: ImageProcessState,
  enableBgRemoval: boolean,
): Promise<void> {
  const dest = blobPath(stockNumber, idx, isSpin)
  result.totalImages++

  if (existingBlobs.has(dest)) {
    result.skipped++
    state.blobUrls.push(dest)
    if (!state.primaryBlobUrl && !isSpin) state.primaryBlobUrl = dest
    return
  }

  try {
    // Only apply bg removal to gallery photos, not spin frames
    const shouldRemoveBg = enableBgRemoval && !isSpin
    const blob = await downloadAndUpload(sourceUrl, dest, shouldRemoveBg)
    if (blob) {
      result.downloaded++
      if (blob.bgRemoved) {
        result.bgRemoved++
      } else if (shouldRemoveBg) {
        result.bgFallback++
      }
      state.blobUrls.push(blob.url)
      if (!state.primaryBlobUrl && !isSpin) state.primaryBlobUrl = blob.url
      uploadThumbnailMarker(stockNumber, idx, isSpin, blob.url).catch((err) => console.warn("[silent-catch]", err))
    }
  } catch (error) {
    result.failed++
    result.errors.push({
      stockNumber,
      url: sourceUrl,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}

/**
 * Process images for a single vehicle.
 * Downloads from CDN, optionally removes background, uploads to Blob, skips existing.
 */
async function processVehicleImages(
  vehicle: ImagePipelineVehicle,
  result: ImagePipelineResult,
  enableBgRemoval: boolean,
): Promise<{ blobUrls: string[]; primaryBlobUrl: string | null }> {
  const { stock_number, image_urls } = vehicle
  if (!image_urls || image_urls.length === 0) {
    return { blobUrls: [], primaryBlobUrl: null }
  }

  const existingBlobs = await getExistingBlobs(stock_number)
  const state: ImageProcessState = { blobUrls: [], primaryBlobUrl: null }

  let photoIndex = 0
  let spinIndex = 0

  for (const sourceUrl of image_urls) {
    const isSpin = isSpinImage(sourceUrl)
    const idx = isSpin ? spinIndex++ : photoIndex++
    await processSingleImage(sourceUrl, stock_number, idx, isSpin, existingBlobs, result, state, enableBgRemoval)
  }

  return { blobUrls: state.blobUrls, primaryBlobUrl: state.primaryBlobUrl }
}

// ==================== BATCH WITH CONCURRENCY CONTROL ====================

/**
 * Process items in batches of `concurrency` to avoid overwhelming the CDN.
 */
async function processBatch<T, R>(
  items: T[],
  concurrency: number,
  processor: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency)
    const batchResults = await Promise.all(batch.map(processor))
    results.push(...batchResults)
  }
  return results
}

// ==================== UPDATE VEHICLE RECORDS ====================

async function updateVehicleBlobUrls(
  sql: SqlClient,
  stockNumber: string,
  blobUrls: string[],
  primaryBlobUrl: string | null,
): Promise<void> {
  if (blobUrls.length === 0) return

  try {
    await sql`
      UPDATE vehicles
      SET
        image_urls = ${blobUrls},
        primary_image_url = COALESCE(${primaryBlobUrl}, primary_image_url),
        updated_at = NOW()
      WHERE stock_number = ${stockNumber}
    `
  } catch (error) {
    console.error(`[ImagePipeline] Failed to update vehicle ${stockNumber}:`, error)
  }
}

// ==================== MAIN ENTRY POINT ====================

/**
 * Run the image pipeline for a list of vehicles.
 * Downloads images from HomenetIOL CDN, optionally removes backgrounds
 * and composites onto a studio backdrop, then uploads to Vercel Blob.
 *
 * @param vehicles - Vehicles with image URLs from the feed
 * @returns Pipeline results with counts and errors
 */
export async function runImagePipeline(
  vehicles: ImagePipelineVehicle[],
): Promise<ImagePipelineResult> {
  const result: ImagePipelineResult = {
    totalImages: 0,
    downloaded: 0,
    skipped: 0,
    failed: 0,
    bgRemoved: 0,
    bgFallback: 0,
    vehiclesProcessed: 0,
    errors: [],
  }

  if (vehicles.length === 0) return result

  const sql = getSql()
  const enableBgRemoval = isBgRemovalEnabled()

  console.info(
    `[ImagePipeline] Starting pipeline for ${vehicles.length} vehicles (bg-removal: ${enableBgRemoval ? "ON" : "OFF"})`,
  )

  // Process vehicles in batches (each vehicle's images processed concurrently)
  await processBatch(vehicles, BATCH_CONCURRENCY, async (vehicle) => {
    try {
      const { blobUrls, primaryBlobUrl } = await processVehicleImages(vehicle, result, enableBgRemoval)

      // Update vehicle record with Blob URLs
      if (sql && blobUrls.length > 0) {
        await updateVehicleBlobUrls(sql, vehicle.stock_number, blobUrls, primaryBlobUrl)
      }

      result.vehiclesProcessed++
    } catch (error) {
      console.error(`[ImagePipeline] Error processing vehicle ${vehicle.stock_number}:`, error)
    }
  })

  console.info(
    `[ImagePipeline] Complete: ${result.downloaded} downloaded, ${result.skipped} skipped, ${result.failed} failed, ${result.bgRemoved} bg-removed, ${result.bgFallback} bg-fallback — ${result.totalImages} total images across ${result.vehiclesProcessed} vehicles`,
  )

  return result
}

/**
 * Fire-and-forget wrapper for async image pipeline execution.
 * Used by the cron job to avoid blocking the response.
 */
export function triggerImagePipelineAsync(vehicles: ImagePipelineVehicle[]): void {
  if (vehicles.length === 0) return

  // Use waitUntil if available (Vercel), otherwise fire-and-forget
  runImagePipeline(vehicles).catch((error) => {
    console.error("[ImagePipeline] Async pipeline failed:", error)
  })
}
