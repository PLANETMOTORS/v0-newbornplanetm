'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB
const ACCEPTED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
])

const BUCKET_NAME = 'secure_documents'

interface UploadLicenseResult {
  success: boolean
  storagePath?: string
  error?: string
}

/**
 * Upload a driver's license securely via server-side Supabase Storage.
 *
 * The client sends the file via FormData. The server validates it
 * (type, size) and uploads to the private `secure_documents` bucket
 * using the service role key -- the browser never touches Supabase
 * Storage directly.
 *
 * Authorization:
 * - Authenticated users: session email must match customerEmail.
 * - Guest users: rejected (checkout requires authentication).
 *
 * Returns the raw bucket path (e.g. `<vehicleId>/<timestamp>_license.jpg`)
 * which is stored in the `reservations.license_storage_path` column.
 * Signed URLs are generated on demand by the admin portal when staff
 * need to view the document.
 */
export async function uploadDriversLicense(formData: FormData): Promise<UploadLicenseResult> {
  const file = formData.get('file')
  const vehicleId = formData.get('vehicleId')
  const customerEmail = formData.get('customerEmail')

  if (!(file instanceof File)) {
    return { success: false, error: 'No file provided' }
  }

  if (typeof vehicleId !== 'string' || !vehicleId.trim()) {
    return { success: false, error: 'Vehicle ID is required' }
  }

  if (typeof customerEmail !== 'string' || !customerEmail.trim()) {
    return { success: false, error: 'Customer email is required' }
  }

  const normalizedEmail = customerEmail.trim().toLowerCase()

  // --- Authorization: require authenticated user whose email matches ---
  // The checkout flow requires login (checkout-flow.tsx redirects to auth).
  // This prevents unauthenticated callers and cross-customer overwrites.
  const authClient = await createClient()
  const { data: { user } } = await authClient.auth.getUser()

  if (!user) {
    return { success: false, error: 'Authentication required' }
  }

  if (user.email?.toLowerCase() !== normalizedEmail) {
    return { success: false, error: 'Email does not match your account' }
  }

  // Validate MIME type
  if (!ACCEPTED_MIME_TYPES.has(file.type)) {
    return { success: false, error: 'File must be a JPG, PNG, WebP, or PDF' }
  }

  // Validate size (5 MB server-side limit)
  if (file.size > MAX_FILE_SIZE) {
    return { success: false, error: 'File must be under 5 MB' }
  }

  // Determine file extension from MIME type
  const extensions: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'application/pdf': 'pdf',
  }
  const ext = extensions[file.type] ?? 'bin'
  const timestamp = Date.now()
  const sanitizedVehicleId = vehicleId.replace(/[^a-zA-Z0-9_-]/g, '_')
  const storagePath = `${sanitizedVehicleId}/${timestamp}_license.${ext}`

  let supabase: ReturnType<typeof createAdminClient>
  try {
    supabase = createAdminClient()
  } catch (e) {
    console.error('[upload-license] Admin client not configured:', e)
    return { success: false, error: 'Service configuration error. Please try again later.' }
  }

  // Upload to the private bucket using service role (bypasses RLS)
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) {
    console.error('[upload-license] Storage upload failed:', uploadError.message)
    return { success: false, error: 'Failed to upload document securely. Please try again.' }
  }

  // Best-effort: link the license to an existing reservation if one exists.
  // In the normal checkout flow, the reservation row may not exist yet at
  // step 5 (license upload) — it gets created later during deposit payment.
  // The storagePath is returned to the client and passed through Stripe
  // session metadata so the webhook can persist it on the reservation.
  const { data: targetRow, error: selectError } = await supabase
    .from('reservations')
    .select('id')
    .eq('vehicle_id', vehicleId)
    .eq('customer_email', normalizedEmail)
    .in('status', ['pending', 'confirmed'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (selectError) {
    console.error('[upload-license] Reservation lookup failed:', selectError.message)
  } else if (targetRow) {
    const { error: dbError } = await supabase
      .from('reservations')
      .update({
        license_storage_path: storagePath,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetRow.id)

    if (dbError) {
      console.error('[upload-license] DB update failed:', dbError.message)
    }
  }

  console.info(`[upload-license] Uploaded ${storagePath} for vehicle ${vehicleId}`)

  return { success: true, storagePath }
}
