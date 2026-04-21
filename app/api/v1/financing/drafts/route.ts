import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateOrigin } from '@/lib/csrf'
import { apiSuccess, apiError, ErrorCode } from '@/lib/api-response'

/**
 * GET /api/v1/financing/drafts
 * List all finance application drafts for the authenticated user.
 */
export async function GET() {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401)
  }

  const { data, error } = await supabase
    .from('finance_application_drafts')
    .select('id, vehicle_id, form_data, updated_at')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false })

  if (error) {
    return apiError(ErrorCode.INTERNAL_ERROR, 'Failed to fetch drafts', 500, error.message)
  }

  return apiSuccess(data ?? [])
}

/**
 * PUT /api/v1/financing/drafts
 * Create or update a finance application draft.
 * Body: { vehicleId?: string, formData: object }
 */
export async function PUT(request: NextRequest) {
  if (!validateOrigin(request)) {
    return apiError(ErrorCode.FORBIDDEN, 'Forbidden', 403)
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401)
  }

  const body = await request.json()
  const { vehicleId, formData } = body

  if (!formData || typeof formData !== 'object') {
    return apiError(ErrorCode.VALIDATION_ERROR, 'formData is required and must be an object', 400)
  }

  // Upsert the draft (vehicle_id can be null for a "general" draft)
  const { data, error } = await supabase
    .from('finance_application_drafts')
    .upsert(
      {
        user_id: user.id,
        vehicle_id: vehicleId ?? null,
        form_data: formData,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,vehicle_id' }
    )
    .select()
    .single()

  if (error) {
    return apiError(ErrorCode.INTERNAL_ERROR, 'Failed to save draft', 500, error.message)
  }

  return apiSuccess(data)
}

/**
 * DELETE /api/v1/financing/drafts
 * Delete a finance application draft by id or vehicleId.
 * Query params: id (draft id) OR vehicleId (vehicle id, empty string for general draft)
 */
export async function DELETE(request: NextRequest) {
  if (!validateOrigin(request)) {
    return apiError(ErrorCode.FORBIDDEN, 'Forbidden', 403)
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return apiError(ErrorCode.UNAUTHORIZED, 'Authentication required', 401)
  }

  const url = new URL(request.url)
  const draftId = url.searchParams.get('id')
  const vehicleIdParam = url.searchParams.has('vehicleId')
  const vehicleId = url.searchParams.get('vehicleId')

  // Must provide either id or vehicleId param
  if (!draftId && !vehicleIdParam) {
    return apiError(ErrorCode.VALIDATION_ERROR, 'Either id or vehicleId query parameter is required', 400)
  }

  let query = supabase.from('finance_application_drafts').delete().eq('user_id', user.id)

  // id takes precedence over vehicleId
  if (draftId) {
    query = query.eq('id', draftId)
  } else {
    // vehicleId param present: empty string means null (general draft)
    query = query.eq('vehicle_id', vehicleId || null)
  }

  const { error } = await query

  if (error) {
    return apiError(ErrorCode.INTERNAL_ERROR, 'Failed to delete draft', 500, error.message)
  }

  return apiSuccess({ deleted: true })
}
