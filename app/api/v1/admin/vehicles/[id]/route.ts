import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user }
}

// Allowed fields for update — prevents writing arbitrary columns
const UPDATABLE_FIELDS = new Set([
  'year', 'make', 'model', 'trim', 'body_style',
  'exterior_color', 'interior_color', 'price', 'msrp',
  'mileage', 'drivetrain', 'transmission', 'engine', 'fuel_type',
  'status', 'is_certified', 'is_new_arrival', 'featured',
  'stock_number', 'vin',
])

// PATCH /api/v1/admin/vehicles/:id — Update a vehicle
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { id } = await params
  const body = await request.json()

  // Filter to only allowed fields
  const updateData: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(body)) {
    if (UPDATABLE_FIELDS.has(key)) {
      updateData[key] = value
    }
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "No valid fields to update" },
      { status: 400 }
    )
  }

  updateData.updated_at = new Date().toISOString()

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from("vehicles")
    .update(updateData)
    .eq("id", id)
    .select("id, year, make, model, price, msrp, status, updated_at")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!data) {
    return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })
  }

  return NextResponse.json({ vehicle: data })
}
