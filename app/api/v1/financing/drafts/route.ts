import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { validateOrigin } from "@/lib/csrf"

// GET /api/v1/financing/drafts - Get current user's finance application drafts
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const { data: drafts, error } = await supabase
      .from("finance_application_drafts")
      .select("id, vehicle_id, form_data, updated_at")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })

    if (error) {
      console.error("[financing/drafts] GET error:", error.message)
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to fetch drafts")
    }

    return apiSuccess(drafts || [])
  } catch (error) {
    console.error("[financing/drafts] GET unhandled:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to fetch drafts")
  }
}

// PUT /api/v1/financing/drafts - Save or update a finance application draft
export async function PUT(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return apiError(ErrorCode.FORBIDDEN, "Forbidden", 403)
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const body = await request.json()
    const { vehicleId, formData } = body

    if (!formData || typeof formData !== "object") {
      return apiError(ErrorCode.VALIDATION_ERROR, "formData is required", 400)
    }

    // Upsert: one draft per user per vehicle (or general if no vehicleId)
    const draftVehicleId = vehicleId || null

    // Check if draft already exists
    let query = supabase
      .from("finance_application_drafts")
      .select("id")
      .eq("user_id", user.id)

    if (draftVehicleId) {
      query = query.eq("vehicle_id", draftVehicleId)
    } else {
      query = query.is("vehicle_id", null)
    }

    const { data: existing } = await query.maybeSingle()

    if (existing) {
      // Update existing draft
      const { data: updated, error: updateError } = await supabase
        .from("finance_application_drafts")
        .update({
          form_data: formData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select("id, vehicle_id, form_data, updated_at")
        .single()

      if (updateError) {
        console.error("[financing/drafts] UPDATE error:", updateError.message)
        return apiError(ErrorCode.INTERNAL_ERROR, "Failed to update draft")
      }

      return apiSuccess(updated)
    }

    // Insert new draft
    const { data: inserted, error: insertError } = await supabase
      .from("finance_application_drafts")
      .insert({
        user_id: user.id,
        vehicle_id: draftVehicleId,
        form_data: formData,
      })
      .select("id, vehicle_id, form_data, updated_at")
      .single()

    if (insertError) {
      console.error("[financing/drafts] INSERT error:", insertError.message)
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to save draft")
    }

    return apiSuccess(inserted)
  } catch (error) {
    console.error("[financing/drafts] PUT unhandled:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to save draft")
  }
}

// DELETE /api/v1/financing/drafts - Delete a draft by ID or by vehicleId
export async function DELETE(request: NextRequest) {
  try {
    if (!validateOrigin(request)) {
      return apiError(ErrorCode.FORBIDDEN, "Forbidden", 403)
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get("id")
    const vehicleId = searchParams.get("vehicleId")
    const hasVehicleIdParam = searchParams.has("vehicleId")

    if (!draftId && !hasVehicleIdParam) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Draft ID or vehicleId param is required", 400)
    }

    let query = supabase
      .from("finance_application_drafts")
      .delete()
      .eq("user_id", user.id)

    if (draftId) {
      query = query.eq("id", draftId)
    } else if (vehicleId) {
      query = query.eq("vehicle_id", vehicleId)
    } else {
      // vehicleId param present but empty — delete the "general" draft
      query = query.is("vehicle_id", null)
    }

    const { error } = await query

    if (error) {
      console.error("[financing/drafts] DELETE error:", error.message)
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to delete draft")
    }

    return apiSuccess({ deleted: true })
  } catch (error) {
    console.error("[financing/drafts] DELETE unhandled:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to delete draft")
  }
}
