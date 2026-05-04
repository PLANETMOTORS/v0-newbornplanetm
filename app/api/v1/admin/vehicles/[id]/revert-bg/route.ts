/**
 * POST /api/v1/admin/vehicles/[id]/revert-bg
 *
 * Revert a vehicle's photos to the originals stored before bg removal.
 * Originals are stored at `vehicles/{stock_number}/photo-{idx}-original.jpg`
 * in Vercel Blob.
 */

import { NextRequest, NextResponse } from "next/server"
import { list } from "@vercel/blob"
import { requirePermission } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

export const maxDuration = 60

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requirePermission("backgrounds", "full")
  if (!auth.ok) return auth.error

  const adminClient = createAdminClient()
  const { id } = await params

  // Fetch vehicle
  const { data: vehicle, error: fetchError } = await adminClient
    .from("vehicles")
    .select("id, stock_number, image_urls, primary_image_url")
    .eq("id", id)
    .single()

  if (fetchError || !vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  // Find original backups in Vercel Blob
  const prefix = `vehicles/${vehicle.stock_number}/`
  const { blobs } = await list({ prefix, limit: 200 })

  const originals = blobs
    .filter((b) => b.pathname.includes("-original."))
    .sort((a, b) => a.pathname.localeCompare(b.pathname, undefined, { numeric: true }))

  if (originals.length === 0) {
    return NextResponse.json(
      { error: "No original backups found. Background removal may not have been run on this vehicle." },
      { status: 404 },
    )
  }

  // Build new image_urls from originals
  const newUrls = originals.map((b) => b.url)

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
      { error: "Failed to update vehicle", details: updateError.message },
      { status: 500 },
    )
  }

  return NextResponse.json({
    success: true,
    vehicleId: id,
    stockNumber: vehicle.stock_number,
    restoredCount: originals.length,
    message: `Reverted ${originals.length} photos to originals`,
  })
}
