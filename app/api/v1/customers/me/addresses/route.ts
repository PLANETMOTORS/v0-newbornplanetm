import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/customers/me/addresses - Get customer's saved addresses
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: fetch real addresses from DB for user.id
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
