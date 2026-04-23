import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const POSTAL_CODE_RE = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/

// GET /api/v1/customers/me/addresses - Get customer's saved addresses
export async function GET(_request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: rows, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: true })

  if (error) {
    return NextResponse.json({ error: "Failed to fetch addresses" }, { status: 500 })
  }

  const addresses = (rows ?? []).map((row) => ({
    id: row.id,
    type: row.type,
    label: row.label,
    firstName: row.first_name,
    lastName: row.last_name,
    street: row.street,
    unit: row.unit,
    city: row.city,
    province: row.province,
    postalCode: row.postal_code,
    country: row.country,
    phone: row.phone,
    isDefault: row.is_default,
    deliveryInstructions: row.delivery_instructions,
    createdAt: row.created_at,
  }))

  return NextResponse.json({ addresses })
}

// POST /api/v1/customers/me/addresses - Add new address
export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json()
  const {
    type, label, firstName, lastName, street, unit,
    city, province, postalCode, phone, isDefault, deliveryInstructions
  } = body

  if (!street || !city || !province || !postalCode) {
    return NextResponse.json(
      { error: "Street, city, province, and postal code are required" },
      { status: 400 }
    )
  }

  if (!POSTAL_CODE_RE.test(postalCode)) {
    return NextResponse.json(
      { error: "Invalid Canadian postal code format" },
      { status: 400 }
    )
  }

  // If setting as default, clear existing default first to satisfy the unique partial index
  if (isDefault) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: false, updated_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("is_default", true)
  }

  const { data: row, error: insertError } = await supabase
    .from("customer_addresses")
    .insert({
      user_id: user.id,
      type: type || "other",
      label: label || type || "Other",
      first_name: firstName || null,
      last_name: lastName || null,
      street,
      unit: unit || null,
      city,
      province,
      postal_code: postalCode.toUpperCase().replace(/\s/g, " "),
      phone: phone || null,
      is_default: isDefault || false,
      delivery_instructions: deliveryInstructions || null,
    })
    .select()
    .single()

  if (insertError) {
    return NextResponse.json({ error: "Failed to save address" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    address: {
      id: row.id,
      type: row.type,
      label: row.label,
      firstName: row.first_name,
      lastName: row.last_name,
      street: row.street,
      unit: row.unit,
      city: row.city,
      province: row.province,
      postalCode: row.postal_code,
      country: row.country,
      phone: row.phone,
      isDefault: row.is_default,
      deliveryInstructions: row.delivery_instructions,
      createdAt: row.created_at,
    },
  })
}
