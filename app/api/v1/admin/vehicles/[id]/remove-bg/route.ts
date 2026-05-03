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

  // Process each image
  const results: {
    url: string
    newUrl: string | null
    bgRemoved: boolean
    error?: string
  }[] = []

  for (const url of imageUrls) {
    try {
      // Download original
      const res = await fetch(url)
      if (!res.ok) {
        results.push({ url, newUrl: null, bgRemoved: false, error: `HTTP ${res.status}` })
        continue
      }
      const buffer = Buffer.from(await res.arrayBuffer())

      // Process
      const { processedBuffer, bgRemoved } = await processVehiclePhoto(buffer)

      // Re-upload
      const idx = imageUrls.indexOf(url)
      const blobPath = `vehicles/${vehicle.stock_number}/photo-${idx}.jpg`
      const blob = await put(blobPath, processedBuffer, {
        access: "public",
        contentType: "image/jpeg",
        addRandomSuffix: false,
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
  await adminClient
    .from("vehicles")
    .update({
      image_urls: newUrls,
      primary_image_url: newUrls[0] || vehicle.primary_image_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)

  const removed = results.filter((r) => r.bgRemoved).length
  const failed = results.filter((r) => r.error).length

  return NextResponse.json({
    success: true,
    vehicleId: id,
    stockNumber: vehicle.stock_number,
    totalImages: imageUrls.length,
    bgRemoved: removed,
    failed,
    results,
  })
}
