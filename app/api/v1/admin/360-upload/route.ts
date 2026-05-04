import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { requireAdmin } from "@/lib/security/admin-route-helpers"

const BUCKET = "vehicle-360"
const MAX_FRAME_SIZE = 5 * 1024 * 1024 // 5 MB per frame
const ALLOWED_TYPES = new Set(["image/webp"])

interface UploadMessageInput {
  allFailed: boolean
  errors: unknown[]
  uploaded: unknown[]
  frames: unknown[]
  vehicleName: string
}

/**
 * Build the human-readable status message for a 360° upload response.
 * Extracted from a nested ternary to satisfy SonarCloud rule
 * typescript:S3358.
 */
function buildUploadMessage(input: UploadMessageInput): string {
  const { allFailed, errors, uploaded, frames, vehicleName } = input
  if (allFailed) return `All ${errors.length} frames failed to upload`
  if (errors.length > 0) {
    return `Uploaded ${uploaded.length}/${frames.length} frames (${errors.length} failed)`
  }
  return `Successfully uploaded ${uploaded.length} frames for ${vehicleName}`
}

async function requireAdminUser() {
  const auth = await requireAdmin()
  if (!auth.ok) return auth.error
  return null
}

function validateUploadMetadata(formData: FormData):
  | { ok: true; mid: string; vehicleName: string }
  | { ok: false; res: NextResponse } {
  const mid = formData.get("mid")
  const vehicleName = formData.get("vehicleName")
  if (!mid || typeof mid !== "string" || !/^\d{6,15}$/.test(mid)) {
    return { ok: false, res: NextResponse.json({ error: "Invalid MID — must be a numeric string (6-15 digits)" }, { status: 400 }) }
  }
  if (!vehicleName || typeof vehicleName !== "string") {
    return { ok: false, res: NextResponse.json({ error: "Vehicle name is required" }, { status: 400 }) }
  }
  return { ok: true, mid, vehicleName }
}

function collectFrames(formData: FormData):
  | { ok: true; frames: File[] }
  | { ok: false; res: NextResponse } {
  const frames: File[] = []
  for (const [key, value] of formData.entries()) {
    if (key !== "frames" || !(value instanceof File)) continue
    if (value.size > MAX_FRAME_SIZE) {
      return { ok: false, res: NextResponse.json({ error: `Frame "${value.name}" exceeds ${MAX_FRAME_SIZE / 1024 / 1024}MB limit` }, { status: 400 }) }
    }
    if (!ALLOWED_TYPES.has(value.type)) {
      return { ok: false, res: NextResponse.json({ error: `Frame "${value.name}" has unsupported type "${value.type}". Only WebP files are allowed.` }, { status: 400 }) }
    }
    frames.push(value)
  }
  if (frames.length === 0) {
    return { ok: false, res: NextResponse.json({ error: "No frames provided" }, { status: 400 }) }
  }
  return { ok: true, frames }
}

type AdminClient = ReturnType<typeof createAdminClient>

async function clearExistingFrames(
  adminClient: AdminClient,
  mid: string,
): Promise<NextResponse | null> {
  const { data: existingFiles, error: listError } = await adminClient.storage
    .from(BUCKET)
    .list(`${mid}/nobg`, { limit: 200 })

  if (listError) {
    return NextResponse.json(
      { error: `Failed to list existing frames: ${listError.message}. Aborting upload to prevent stale frame mix.` },
      { status: 500 },
    )
  }

  if (!existingFiles || existingFiles.length === 0) return null

  const pathsToDelete = existingFiles.map((f) => `${mid}/nobg/${f.name}`)
  const { error: deleteError } = await adminClient.storage.from(BUCKET).remove(pathsToDelete)
  if (deleteError) {
    return NextResponse.json(
      { error: `Failed to clean up existing frames: ${deleteError.message}. Aborting upload to prevent stale frame mix.` },
      { status: 500 },
    )
  }
  return null
}

async function uploadSingleFrame(
  adminClient: AdminClient,
  mid: string,
  frame: File,
  index: number,
): Promise<{ ok: true; url: string } | { ok: false; padded: string; error: string }> {
  const padded = String(index + 1).padStart(2, "0")
  const storagePath = `${mid}/nobg/${padded}.webp`
  const arrayBuffer = await frame.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const { error } = await adminClient.storage
    .from(BUCKET)
    .upload(storagePath, buffer, { contentType: "image/webp", upsert: true })

  if (error) return { ok: false, padded, error: error.message }

  const { data: urlData } = adminClient.storage.from(BUCKET).getPublicUrl(storagePath)
  return { ok: true, url: urlData.publicUrl }
}

async function uploadAllFrames(
  adminClient: AdminClient,
  mid: string,
  frames: File[],
): Promise<{ uploaded: string[]; errors: string[] }> {
  const uploaded: string[] = []
  const errors: string[] = []
  for (let i = 0; i < frames.length; i++) {
    const result = await uploadSingleFrame(adminClient, mid, frames[i], i)
    if (result.ok) uploaded.push(result.url)
    else errors.push(`Frame ${result.padded}: ${result.error}`)
  }
  return { uploaded, errors }
}

async function parseFormData(request: NextRequest): Promise<FormData | NextResponse> {
  try {
    return await request.formData()
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 })
  }
}

/**
 * POST /api/v1/admin/360-upload
 *
 * Upload 360° walk-around frames to Supabase Storage. Requires admin auth.
 */
export async function POST(request: NextRequest) {
  const unauthorized = await requireAdminUser()
  if (unauthorized) return unauthorized

  const formDataOrError = await parseFormData(request)
  if (formDataOrError instanceof NextResponse) return formDataOrError
  const formData = formDataOrError

  const meta = validateUploadMetadata(formData)
  if (!meta.ok) return meta.res
  const { mid, vehicleName } = meta

  const collected = collectFrames(formData)
  if (!collected.ok) return collected.res
  const frames = collected.frames
  frames.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))

  const adminClient = createAdminClient()
  const cleanupError = await clearExistingFrames(adminClient, mid)
  if (cleanupError) return cleanupError

  const { uploaded, errors } = await uploadAllFrames(adminClient, mid, frames)
  const allFailed = uploaded.length === 0 && errors.length > 0

  return NextResponse.json(
    {
      mid,
      vehicleName,
      frameCount: uploaded.length,
      frames: uploaded,
      errors: errors.length > 0 ? errors : undefined,
      error: allFailed ? `All ${errors.length} frames failed to upload` : undefined,
      message: buildUploadMessage({ allFailed, errors, uploaded, frames, vehicleName }),
    },
    allFailed ? { status: 500 } : undefined,
  )
}

/**
 * GET /api/v1/admin/360-upload
 *
 * List all vehicles with 360° frames in Supabase Storage.
 * Returns MID folders and their frame counts.
 */
export async function GET(_request: NextRequest) {
  const unauthorized = await requireAdminUser()
  if (unauthorized) return unauthorized

  const adminClient = createAdminClient()

  // List top-level folders (MIDs) in the bucket
  const { data: folders, error } = await adminClient.storage
    .from(BUCKET)
    .list("", { limit: 100, sortBy: { column: "name", order: "asc" } })

  if (error) {
    return NextResponse.json(
      { error: `Failed to list storage: ${error.message}` },
      { status: 500 },
    )
  }

  // For each MID folder, count frames in the nobg/ subfolder
  const vehicles: { mid: string; frameCount: number; firstFrameUrl: string | null }[] = []

  for (const folder of folders ?? []) {
    if (!folder.name || folder.id) continue // skip files, only process folders

    const { data: nobgFiles } = await adminClient.storage
      .from(BUCKET)
      .list(`${folder.name}/nobg`, {
        limit: 100,
        sortBy: { column: "name", order: "asc" },
      })

    const frameFiles = (nobgFiles ?? []).filter(f => f.name.endsWith(".webp"))
    const firstFrameUrl = frameFiles.length > 0
      ? adminClient.storage.from(BUCKET).getPublicUrl(`${folder.name}/nobg/${frameFiles[0].name}`).data.publicUrl
      : null

    vehicles.push({
      mid: folder.name,
      frameCount: frameFiles.length,
      firstFrameUrl,
    })
  }

  return NextResponse.json({ vehicles })
}
