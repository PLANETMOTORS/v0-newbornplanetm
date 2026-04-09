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

  const addresses = [
    {
      id: "addr_001",
      type: "home",
      label: "Home",
      firstName: "John",
      lastName: "Doe",
      street: "123 Main Street",
      unit: "Unit 456",
      city: "Toronto",
      province: "ON",
      postalCode: "M5V 1A1",
      country: "Canada",
      phone: "+1 (416) 555-0123",
      isDefault: true,
      deliveryInstructions: "Ring doorbell, side entrance",
      createdAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "addr_002",
      type: "work",
      label: "Office",
      firstName: "John",
      lastName: "Doe",
      street: "456 Business Ave",
      unit: "Suite 800",
      city: "Toronto",
      province: "ON",
      postalCode: "M4W 1A8",
      country: "Canada",
      phone: "+1 (416) 555-0456",
      isDefault: false,
      deliveryInstructions: "Deliver to reception",
      createdAt: "2024-02-20T14:30:00Z",
    },
  ]

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

  // Validate Canadian postal code format
  const postalCodeRegex = /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/
  if (!postalCodeRegex.test(postalCode)) {
    return NextResponse.json(
      { error: "Invalid Canadian postal code format" },
      { status: 400 }
    )
  }

  const address = {
    id: "addr_" + Date.now(),
    type: type || "other",
    label: label || type || "Other",
    firstName,
    lastName,
    street,
    unit,
    city,
    province,
    postalCode: postalCode.toUpperCase().replace(/\s/g, " "),
    country: "Canada",
    phone,
    isDefault: isDefault || false,
    deliveryInstructions,
    createdAt: new Date().toISOString(),
  }

  return NextResponse.json({ success: true, address })
}
