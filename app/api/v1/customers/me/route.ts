import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/customers/me - Get current customer profile
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, first_name, last_name, phone, notification_preferences, created_at, updated_at")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError) {
      return NextResponse.json({ error: "Failed to fetch customer" }, { status: 500 })
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

    return NextResponse.json({ customer })
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    )
  }
}

// Validation helpers - allowlist only safe characters for human names
const NAME_RE = /^[\p{L}\p{M}'\-\s]{1,50}$/u // Unicode letters, marks, apostrophe, hyphen, space
const PHONE_RE = /^[+\d\s().\-]{0,20}$/

// PUT /api/v1/customers/me - Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { firstName, lastName, phone, notificationPreferences } = body

    // Validate provided fields
    if (firstName !== undefined) {
      const name = String(firstName).trim()
      if (name.length === 0 || name.length > 50 || !NAME_RE.test(name)) {
        return NextResponse.json({ error: "Invalid firstName: must be 1-50 characters containing only letters, spaces, hyphens, or apostrophes" }, { status: 400 })
      }
    }
    if (lastName !== undefined) {
      const name = String(lastName).trim()
      if (name.length === 0 || name.length > 50 || !NAME_RE.test(name)) {
        return NextResponse.json({ error: "Invalid lastName: must be 1-50 characters containing only letters, spaces, hyphens, or apostrophes" }, { status: 400 })
      }
    }
    if (phone !== undefined && phone !== null) {
      const ph = String(phone).trim()
      if (!PHONE_RE.test(ph)) {
        return NextResponse.json({ error: "Invalid phone number format" }, { status: 400 })
      }
    }

    const updates: Record<string, unknown> = {
      id: user.id,
      email: user.email,
      updated_at: new Date().toISOString(),
    }
    if (firstName !== undefined) updates.first_name = String(firstName).trim().slice(0, 50)
    if (lastName !== undefined) updates.last_name = String(lastName).trim().slice(0, 50)
    if (phone !== undefined) updates.phone = phone !== null ? String(phone).trim().slice(0, 20) : null
    if (notificationPreferences !== undefined) updates.notification_preferences = notificationPreferences

    const { data: row, error: upsertError } = await supabase
      .from("profiles")
      .upsert(updates)
      .select("id, email, first_name, last_name, phone, notification_preferences, created_at, updated_at")
      .single()

    if (upsertError) {
      return NextResponse.json({ error: "Failed to update customer" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
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
  } catch {
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    )
  }
}
