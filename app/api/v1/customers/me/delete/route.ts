import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"
import { validateOrigin } from "@/lib/csrf"

// DELETE /api/v1/customers/me/delete - Delete current user's account
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

    const adminClient = createAdminClient()

    // Delete user's data from related tables (cascade handles most via FK constraints)
    // Explicitly clean up tables that may not have ON DELETE CASCADE
    const cleanupTables = [
      { table: "price_alerts", column: "email", value: user.email },
      { table: "finance_application_drafts", column: "user_id", value: user.id },
      { table: "profiles", column: "id", value: user.id },
    ]

    for (const { table, column, value } of cleanupTables) {
      if (!value) continue
      const { error } = await adminClient
        .from(table)
        .delete()
        .eq(column, value)
      if (error) {
        console.error(`[delete-account] Failed to clean ${table}:`, error.message)
        // Continue cleanup — don't abort on partial failure
      }
    }

    // Delete the auth user via admin API
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id)

    if (deleteError) {
      console.error("[delete-account] Failed to delete auth user:", deleteError.message)
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to delete account. Please contact support.")
    }

    return apiSuccess({ deleted: true })
  } catch (error) {
    console.error("[delete-account] Unhandled error:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to delete account")
  }
}
