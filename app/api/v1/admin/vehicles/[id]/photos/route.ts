import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { isAdminEmail } from "@/lib/admin"

const BUCKET = "vehicle-photos"
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per image
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"]

/**
 * POST /api/v1/admin/vehicles/[id]/photos
 *
 * Upload gallery photos for a vehicle to Supabase Storage.
 * Photos are stored under vehicle-photos/{vehicle_id}/{filename}.
 * Updates the vehicle's image_urls array and optionally primary_image_url.
 *
 * FormData fields:
 *   photos: File[] — the image files
 *   setPrimary: "true" | "false" — set the first uploaded image as primary (default: false)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
  }

  // Verify vehicle exists
  const { data: vehicle, error: vehicleError } = await adminClient
    .from("vehicles")
    .select("id, image_urls, primary_image_url")
    .eq("id", id)
    .single()

  if (vehicleError || !vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }

  const setPrimary = formData.get("setPrimary") === "true"

  // Collect photo files
  const photos: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key === "photos" && value instanceof File) {
      if (value.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          { error: `File "${value.name}" exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit` },
          { status: 400 },
        )
      }
      if (!ALLOWED_TYPES.includes(value.type)) {
        return NextResponse.json(
          { error: `File "${value.name}" has unsupported type "${value.type}". Allowed: JPEG, PNG, WebP, AVIF.` },
          { status: 400 },
        )
      }
      photos.push(value)
    }
  }

  if (photos.length === 0) {
    return NextResponse.json({ error: "No photos provided" }, { status: 400 })
  }

  const uploaded: string[] = []
  const errors: string[] = []

  for (const photo of photos) {
    // Generate unique filename
    const ext = photo.name.split(".").pop()?.toLowerCase() || "jpg"
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 8)
    const storagePath = `${id}/${timestamp}-${randomSuffix}.${ext}`

    const arrayBuffer = await photo.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { error } = await adminClient.storage
      .from(BUCKET)
      .upload(storagePath, buffer, {
        contentType: photo.type,
        upsert: false,
      })

    if (error) {
      errors.push(`${photo.name}: ${error.message}`)
    } else {
      const { data: urlData } = adminClient.storage
        .from(BUCKET)
        .getPublicUrl(storagePath)
      uploaded.push(urlData.publicUrl)
    }
  }

  // Update vehicle record with new image URLs
  if (uploaded.length > 0) {
    const existingUrls: string[] = vehicle.image_urls || []
    const newUrls = [...existingUrls, ...uploaded]

    const updateData: Record<string, unknown> = {
      image_urls: newUrls,
      updated_at: new Date().toISOString(),
    }

    // Set primary image if requested or if vehicle has none
    if (setPrimary || !vehicle.primary_image_url) {
      updateData.primary_image_url = uploaded[0]
    }

    await adminClient
      .from("vehicles")
      .update(updateData)
      .eq("id", id)
  }

  return NextResponse.json({
    uploaded: uploaded.length,
    urls: uploaded,
    errors: errors.length > 0 ? errors : undefined,
    message: errors.length > 0
      ? `Uploaded ${uploaded.length}/${photos.length} photos (${errors.length} failed)`
      : `Successfully uploaded ${uploaded.length} photos`,
  })
}

/**
 * GET /api/v1/admin/vehicles/[id]/photos
 *
 * List all photos for a vehicle.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
  }

  const { data: vehicle } = await adminClient
    .from("vehicles")
    .select("id, image_urls, primary_image_url, has_360_spin")
    .eq("id", id)
    .single()

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  // Also list files in storage bucket for this vehicle
  const { data: storageFiles } = await adminClient.storage
    .from(BUCKET)
    .list(id, { limit: 100 })

  return NextResponse.json({
    imageUrls: vehicle.image_urls || [],
    primaryImageUrl: vehicle.primary_image_url,
    has360Spin: vehicle.has_360_spin,
    storageFiles: (storageFiles || []).map(f => ({
      name: f.name,
      size: f.metadata?.size,
      url: adminClient.storage.from(BUCKET).getPublicUrl(`${id}/${f.name}`).data.publicUrl,
    })),
  })
}

/**
 * DELETE /api/v1/admin/vehicles/[id]/photos
 *
 * Remove a photo from a vehicle.
 * Body: { url: string } — the URL of the photo to remove
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const urlToRemove = body.url

  if (!urlToRemove || typeof urlToRemove !== "string") {
    return NextResponse.json({ error: "URL is required" }, { status: 400 })
  }

  let adminClient: ReturnType<typeof createAdminClient>
  try {
    adminClient = createAdminClient()
  } catch {
    return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
  }

  // Update vehicle record
  const { data: vehicle } = await adminClient
    .from("vehicles")
    .select("image_urls, primary_image_url")
    .eq("id", id)
    .single()

  if (!vehicle) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  const existingUrls: string[] = vehicle.image_urls || []
  const newUrls = existingUrls.filter(u => u !== urlToRemove)

  const updateData: Record<string, unknown> = {
    image_urls: newUrls,
    updated_at: new Date().toISOString(),
  }

  // If removing the primary image, set the next one as primary
  if (vehicle.primary_image_url === urlToRemove) {
    updateData.primary_image_url = newUrls.length > 0 ? newUrls[0] : null
  }

  await adminClient
    .from("vehicles")
    .update(updateData)
    .eq("id", id)

  // Try to remove from storage (extract path from URL)
  try {
    const bucketUrl = `/storage/v1/object/public/${BUCKET}/`
    const idx = urlToRemove.indexOf(bucketUrl)
    if (idx >= 0) {
      const storagePath = urlToRemove.substring(idx + bucketUrl.length)
      await adminClient.storage.from(BUCKET).remove([storagePath])
    }
  } catch {
    // Non-critical — the DB record is already updated
  }

  return NextResponse.json({ success: true, message: "Photo removed" })
}
