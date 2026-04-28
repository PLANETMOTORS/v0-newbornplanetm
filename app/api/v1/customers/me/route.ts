import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

// GET /api/v1/customers/me - Get current customer profile
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, notification_preferences, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to fetch customer")
    }

    const customer = {
      id: user.id,
      email: profile?.email ?? user.email,
      firstName: profile?.first_name ?? null,
      lastName: profile?.last_name ?? null,
      phone: profile?.phone ?? null,
      notificationPreferences: profile?.notification_preferences ?? { email: true, sms: false },
      createdAt: profile?.created_at ?? user.created_at,
      updatedAt: profile?.updated_at ?? null,
    }

    return apiSuccess({ customer })
  } catch (error) {
    console.error("[customers/me GET] failed:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to fetch customer")
  }
}

// Validation helpers
// Unicode allowlist covers all letters from all scripts (Latin, Cyrillic, CJK, etc.)
// to support diverse customer names. NFC normalization is applied before matching so
// pre-composed characters (e.g. "ắ") are matched as a single \p{L} code point;
// combining marks (\p{M}) are intentionally excluded to prevent homograph attacks.
const NAME_RE = /^[\p{L}'\s-]{1,50}$/u
const PHONE_RE = /^[+\d\s().-]{0,20}$/

// PUT /api/v1/customers/me - Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const body = await request.json()
    const { firstName, lastName, phone, notificationPreferences } = body

    // Validate provided fields
    if (firstName !== undefined) {
      // Normalize to NFC to prevent homograph attacks with lookalike Unicode characters
      const name = String(firstName).normalize('NFC').trim()
      if (name.length === 0 || name.length > 50 || !NAME_RE.test(name)) {
        return apiError(ErrorCode.VALIDATION_ERROR, "Invalid firstName: must be 1-50 characters containing only letters, spaces, hyphens, or apostrophes", 400)
      }
    }
    if (lastName !== undefined) {
      const name = String(lastName).normalize('NFC').trim()
      if (name.length === 0 || name.length > 50 || !NAME_RE.test(name)) {
        return apiError(ErrorCode.VALIDATION_ERROR, "Invalid lastName: must be 1-50 characters containing only letters, spaces, hyphens, or apostrophes", 400)
      }
    }
    if (phone !== undefined && phone !== null) {
      const ph = String(phone).trim()
      if (!PHONE_RE.test(ph)) {
        return apiError(ErrorCode.VALIDATION_ERROR, "Invalid phone number format", 400)
      }
    }

    const updates: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString(),
    }
    if (firstName !== undefined) updates.first_name = String(firstName).normalize('NFC').trim()
    if (lastName !== undefined) updates.last_name = String(lastName).normalize('NFC').trim()
    if (phone !== undefined) updates.phone = phone !== null ? String(phone).trim() : null
    if (notificationPreferences !== undefined) updates.notification_preferences = notificationPreferences

    const { data: row, error: upsertError } = await supabase
      .from("profiles")
      .upsert(updates)
      .select("id, email, first_name, last_name, phone, notification_preferences, created_at, updated_at")
      .single()

    if (upsertError) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to update customer")
    }


    return apiSuccess({
      customer: {
        id: row.id,
        email: row.email ?? user.email,
        firstName: row.first_name,
        lastName: row.last_name,
        phone: row.phone,
        notificationPreferences: row.notification_preferences,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      },
    })
  } catch (error) {
    console.error("[customers/me PATCH] failed:", error)
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to update customer")
  }
}
