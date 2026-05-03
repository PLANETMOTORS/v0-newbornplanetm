/**
 * POST /api/v1/admin/vehicles/[id]/remove-bg
 *
 * On-demand background removal for a single vehicle's photos.
 * Re-downloads each image, removes the background via Replicate rembg,
 * composites onto the Carvana studio backdrop, and re-uploads to Vercel Blob.
 *
 * Admin-only endpoint.
 */

import { NextRequest, NextResponse } from "next/server"
import { put } from "@vercel/blob"
import { authenticateAdmin } from "@/lib/admin-api"
import {
  processVehiclePhoto,
  isBgRemovalEnabled,
} from "@/lib/bg-removal"

export const maxDuration = 300 // 5 minutes — bg removal can be slow

/** Spin frame URL patterns (match HomenetIOL 360° spin URLs) */
const SPIN_URL_PATTERN = /\/Spin\//i

/** Validate URL is from a known safe CDN host */
function isSafeImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "https:") return false
    // Allow known CDN/blob hosts
    const safeHosts = [
      "homenetiol.com",
      "vercel.app",
      "blob.vercel-storage.com",
      "public.blob.vercel-storage.com",
    ]
    return safeHosts.some((h) => parsed.hostname.endsWith(h))
  } catch {
    return false
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await authenticateAdmin()
  if (!auth.ok) return auth.response

  const { adminClient } = auth
  const { id } = await params

  // Check bg removal is configured
  if (!isBgRemovalEnabled()) {
    return NextResponse.json(
      {
        error: "Background removal is not enabled. Set BG_REMOVAL_ENABLED=true and REPLICATE_API_TOKEN.",
      },
      { status: 503 },
    )
  }

  // Fetch vehicle
  const { data: vehicle, error: fetchError } = await adminClient
    .from("vehicles")
    .select("id, stock_number, image_urls, primary_image_url")
    .eq("id", id)
    .single()

  if (fetchError || !vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  const imageUrls: string[] = vehicle.image_urls || []
  if (imageUrls.length === 0) {
    return NextResponse.json({ error: "Vehicle has no images" }, { status: 400 })
  }

  // Process each image (skip spin frames — they have canvas backdrop already)
  const results: {
    url: string
    newUrl: string | null
    bgRemoved: boolean
    skipped?: boolean
    error?: string
  }[] = []

  for (const [idx, url] of imageUrls.entries()) {
    // Skip 360° spin frames
    if (SPIN_URL_PATTERN.test(url)) {
      results.push({ url, newUrl: url, bgRemoved: false, skipped: true })
      continue
    }

    // Validate URL before fetching (SSRF protection)
    if (!isSafeImageUrl(url)) {
      results.push({ url, newUrl: url, bgRemoved: false, error: "URL not from allowed host" })
      continue
    }

    try {
      // Download original
      const res = await fetch(url)
      if (!res.ok) {
        results.push({ url, newUrl: null, bgRemoved: false, error: `HTTP ${res.status}` })
        continue
      }
      const buffer = Buffer.from(await res.arrayBuffer())

      // Store original backup before processing
      const origPath = `vehicles/${vehicle.stock_number}/photo-${idx}-original.jpg`
      await put(origPath, buffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      })

      // Process (bg removal + studio composite)
      const { processedBuffer, bgRemoved } = await processVehiclePhoto(buffer)

      // Upload processed version
      const blobPath = `vehicles/${vehicle.stock_number}/photo-${idx}.jpg`
      const blob = await put(blobPath, processedBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
        allowOverwrite: true,
      })

      results.push({ url, newUrl: blob.url, bgRemoved })
    } catch (err) {
      results.push({
        url,
        newUrl: null,
        bgRemoved: false,
        error: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  // Update vehicle with new URLs
  const newUrls = results.map((r) => r.newUrl || r.url)
  const { error: updateError } = await adminClient
    .from("vehicles")
    .update({
      image_urls: newUrls,
      primary_image_url: newUrls[0] || vehicle.primary_image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  if (updateError) {
    return NextResponse.json(
      { error: "Images processed but DB update failed", details: updateError.message, results },
      { status: 500 },
    )
  }

  const removed = results.filter((r) => r.bgRemoved).length
  const failed = results.filter((r) => r.error).length
  const skipped = results.filter((r) => r.skipped).length

  return NextResponse.json({
    success: true,
    vehicleId: id,
    stockNumber: vehicle.stock_number,
    totalImages: imageUrls.length,
    bgRemoved: removed,
    failed,
    skipped,
    results,
  })
}
