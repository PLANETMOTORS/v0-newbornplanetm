/**
 * lib/bg-removal.ts
 *
 * Server-side background removal + Carvana-style studio backdrop compositing.
 *
 * Pipeline:  raw photo → Replicate rembg → transparent PNG → sharp composite
 *            onto gradient backdrop → final JPEG stored in Vercel Blob.
 *
 * Toggle via BG_REMOVAL_ENABLED env var ("true" to enable).
 */

import Replicate from "replicate"
import sharp from "sharp"

// ==================== CONFIG ====================

/** Carvana studio backdrop — matches SpinViewer canvas gradient */
const STUDIO_TOP = { r: 230, g: 230, b: 230 }     // #e6e6e6
const STUDIO_MID = { r: 220, g: 220, b: 220 }     // #dcdcdc
const STUDIO_BOTTOM = { r: 194, g: 194, b: 194 }   // #c2c2c2

const OUTPUT_WIDTH = 1600
const OUTPUT_HEIGHT = 1200
const OUTPUT_QUALITY = 85

const REPLICATE_MODEL = "cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003"
const REPLICATE_TIMEOUT_MS = 60_000

// ==================== HELPERS ====================

export function isBgRemovalEnabled(): boolean {
  return process.env.BG_REMOVAL_ENABLED === "true" && !!process.env.REPLICATE_API_TOKEN
}

/**
 * Create a gradient backdrop buffer matching the Carvana studio look.
 * Uses sharp's raw pixel manipulation for a smooth 3-stop linear gradient.
 */
async function createStudioBackdrop(width: number, height: number): Promise<Buffer> {
  const channels = 3 // RGB
  const pixels = Buffer.alloc(width * height * channels)

  const midPoint = Math.floor(height * 0.55) // gradient midpoint at 55%

  for (let y = 0; y < height; y++) {
    let r: number, g: number, b: number

    if (y <= midPoint) {
      // Top → Mid (0% → 55%)
      const t = y / midPoint
      r = Math.round(STUDIO_TOP.r + (STUDIO_MID.r - STUDIO_TOP.r) * t)
      g = Math.round(STUDIO_TOP.g + (STUDIO_MID.g - STUDIO_TOP.g) * t)
      b = Math.round(STUDIO_TOP.b + (STUDIO_MID.b - STUDIO_TOP.b) * t)
    } else {
      // Mid → Bottom (55% → 100%)
      const t = (y - midPoint) / (height - midPoint)
      r = Math.round(STUDIO_MID.r + (STUDIO_BOTTOM.r - STUDIO_MID.r) * t)
      g = Math.round(STUDIO_MID.g + (STUDIO_BOTTOM.g - STUDIO_MID.g) * t)
      b = Math.round(STUDIO_MID.b + (STUDIO_BOTTOM.b - STUDIO_MID.b) * t)
    }

    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * channels
      pixels[offset] = r
      pixels[offset + 1] = g
      pixels[offset + 2] = b
    }
  }

  return sharp(pixels, { raw: { width, height, channels } })
    .jpeg({ quality: 100 })
    .toBuffer()
}

// ==================== CORE ====================

/**
 * Remove background from an image using Replicate's rembg model.
 * Returns a transparent PNG buffer, or null on failure.
 */
export async function removeBackground(imageBuffer: Buffer): Promise<Buffer | null> {
  const token = process.env.REPLICATE_API_TOKEN
  if (!token) {
    console.warn("[BgRemoval] REPLICATE_API_TOKEN not set, skipping")
    return null
  }

  const replicate = new Replicate({ auth: token })

  try {
    const base64 = `data:image/jpeg;base64,${imageBuffer.toString("base64")}`

    const output = await Promise.race([
      replicate.run(REPLICATE_MODEL as `${string}/${string}:${string}`, {
        input: { image: base64 },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Replicate timeout")), REPLICATE_TIMEOUT_MS),
      ),
    ])

    // rembg returns a URL to the result image
    if (typeof output === "string") {
      const res = await fetch(output)
      if (!res.ok) throw new Error(`Failed to fetch result: HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    }

    // Some model versions return a ReadableStream or FileOutput
    if (output && typeof output === "object" && "url" in (output as Record<string, unknown>)) {
      const url = (output as { url: string }).url
      const res = await fetch(url)
      if (!res.ok) throw new Error(`Failed to fetch result: HTTP ${res.status}`)
      return Buffer.from(await res.arrayBuffer())
    }

    console.warn("[BgRemoval] Unexpected output format:", typeof output)
    return null
  } catch (error) {
    console.error("[BgRemoval] Failed:", error instanceof Error ? error.message : error)
    return null
  }
}

/**
 * Composite a transparent PNG onto the Carvana studio gradient backdrop.
 * Returns a JPEG buffer ready for upload.
 */
export async function compositeOnStudioBackdrop(
  transparentPng: Buffer,
  width = OUTPUT_WIDTH,
  height = OUTPUT_HEIGHT,
): Promise<Buffer> {
  const backdrop = await createStudioBackdrop(width, height)

  // Resize the transparent car to fit within the backdrop, centered
  const car = await sharp(transparentPng)
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer()

  return sharp(backdrop)
    .composite([{ input: car, gravity: "center" }])
    .jpeg({ quality: OUTPUT_QUALITY, mozjpeg: true })
    .toBuffer()
}

// ==================== FULL PIPELINE ====================

export interface BgRemovalResult {
  /** The processed image buffer (studio backdrop JPEG) */
  processedBuffer: Buffer
  /** Whether background removal was actually performed (false = original returned) */
  bgRemoved: boolean
}

/**
 * Full pipeline: remove background → composite on studio backdrop.
 * If bg removal fails or is disabled, returns the original image resized to fit.
 */
export async function processVehiclePhoto(
  originalBuffer: Buffer,
  width = OUTPUT_WIDTH,
  height = OUTPUT_HEIGHT,
): Promise<BgRemovalResult> {
  if (!isBgRemovalEnabled()) {
    // Just resize/optimize the original
    const optimized = await sharp(originalBuffer)
      .resize(width, height, { fit: "contain", background: "#dcdcdc" })
      .jpeg({ quality: OUTPUT_QUALITY, mozjpeg: true })
      .toBuffer()
    return { processedBuffer: optimized, bgRemoved: false }
  }

  const transparentPng = await removeBackground(originalBuffer)

  if (!transparentPng) {
    // Fallback: optimize original without bg removal
    const optimized = await sharp(originalBuffer)
      .resize(width, height, { fit: "contain", background: "#dcdcdc" })
      .jpeg({ quality: OUTPUT_QUALITY, mozjpeg: true })
      .toBuffer()
    return { processedBuffer: optimized, bgRemoved: false }
  }

  const processed = await compositeOnStudioBackdrop(transparentPng, width, height)
  return { processedBuffer: processed, bgRemoved: true }
}
