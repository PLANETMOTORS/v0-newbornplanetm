import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { validateOrigin } from "@/lib/csrf"

// DELETE /api/v1/customers/me/delete - Delete current customer account
export async function DELETE(request: NextRequest) {
  try {
    // CSRF protection
    if (!validateOrigin(request)) {
      return apiError(ErrorCode.FORBIDDEN, "Invalid request origin", 403)
    }

    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const adminClient = createAdminClient()

    // Clean up user data from related tables (partial failure tolerant)
    // price_alerts uses email
    if (user.email) {
      await adminClient
        .from("price_alerts")
        .delete()
        .eq("email", user.email)
    }

    // finance_application_drafts uses user_id
    await adminClient
      .from("finance_application_drafts")
      .delete()
      .eq("user_id", user.id)

    // profiles uses id
    await adminClient
      .from("profiles")
      .delete()
      .eq("id", user.id)

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)
    
    if (deleteError) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to delete account", 500)
    }

    return apiSuccess({ deleted: true })
  } catch (_error) {
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to delete account", 500)
  }
}
