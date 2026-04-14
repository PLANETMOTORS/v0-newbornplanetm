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

    const metadata = user.user_metadata ?? {}
    const customer = {
      id: user.id,
      email: user.email,
      createdAt: user.created_at,
      firstName: metadata.first_name ?? metadata.firstName ?? null,
      lastName: metadata.last_name ?? metadata.lastName ?? null,
      phone: metadata.phone ?? null,
    }

    return NextResponse.json({ customer })
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to fetch customer" },
      { status: 500 }
    )
  }
}

// PUT /api/v1/customers/me - Update customer profile
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const allowedKeys = ["firstName", "lastName", "phone"] as const
    const profileUpdates: Record<string, string> = {}

    for (const key of allowedKeys) {
      const rawValue = body?.[key]
      if (typeof rawValue === "string") {
        const trimmed = rawValue.trim()
        if (trimmed.length > 0) {
          profileUpdates[key] = trimmed
        }
      }
    }

    const metadataPatch: Record<string, string> = {}
    if (profileUpdates.firstName) metadataPatch.first_name = profileUpdates.firstName
    if (profileUpdates.lastName) metadataPatch.last_name = profileUpdates.lastName
    if (profileUpdates.phone) metadataPatch.phone = profileUpdates.phone

    const emailUpdate = typeof body?.email === "string" ? body.email.trim() : ""
    const updatePayload: { email?: string; data?: Record<string, string> } = {}

    if (emailUpdate && emailUpdate !== user.email) {
      updatePayload.email = emailUpdate
    }
    if (Object.keys(metadataPatch).length > 0) {
      updatePayload.data = metadataPatch
    }

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json({
        success: true,
        customer: {
          id: user.id,
          email: user.email,
          updatedAt: new Date().toISOString(),
        },
      })
    }

    const { data: updatedUserData, error: updateError } = await supabase.auth.updateUser(updatePayload)
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }

    const updatedUser = updatedUserData.user
    const updatedMetadata = updatedUser?.user_metadata ?? user.user_metadata ?? {}

    return NextResponse.json({
      success: true,
      customer: {
        id: updatedUser?.id ?? user.id,
        email: updatedUser?.email ?? user.email,
        firstName: updatedMetadata.first_name ?? updatedMetadata.firstName ?? null,
        lastName: updatedMetadata.last_name ?? updatedMetadata.lastName ?? null,
        phone: updatedMetadata.phone ?? null,
        updatedAt: new Date().toISOString(),
      },
    })
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to update customer" },
      { status: 500 }
    )
  }
}
