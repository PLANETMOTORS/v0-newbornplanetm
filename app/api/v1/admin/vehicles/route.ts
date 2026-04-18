import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

const VEHICLE_FIELDS = [
  'id', 'stock_number', 'vin', 'year', 'make', 'model', 'trim',
  'body_style', 'exterior_color', 'interior_color',
  'price', 'msrp', 'mileage', 'drivetrain', 'transmission', 'engine',
  'fuel_type', 'status', 'is_certified', 'is_new_arrival', 'featured',
  'primary_image_url', 'created_at', 'updated_at'
].join(', ')

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user || !ADMIN_EMAILS.includes(user.email || "")) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) }
  }
  return { user }
}

// GET /api/v1/admin/vehicles - List all vehicles for admin
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if ('error' in auth) return auth.error

  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q") || ""
  const status = searchParams.get("status") || ""
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  const adminClient = createAdminClient()
  let query = adminClient
    .from("vehicles")
    .select(VEHICLE_FIELDS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (status && status !== "all") {
    query = query.eq("status", status)
  }

  if (q.trim()) {
    const pattern = `%${q.trim()}%`
    query = query.or(`make.ilike.${pattern},model.ilike.${pattern},trim.ilike.${pattern},vin.ilike.${pattern},stock_number.ilike.${pattern}`)
  }

  const { data: vehicles, error, count } = await query

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    vehicles: vehicles || [],
    total: count || 0,
    limit,
    offset,
  })
}
