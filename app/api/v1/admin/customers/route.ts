import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

// GET /api/v1/admin/customers - List all customers for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get("search") || ""
    const rawLimit = parseInt(searchParams.get("limit") || "50")
    const limit = Math.min(Math.max(1, isNaN(rawLimit) ? 50 : rawLimit), 200)
    const rawOffset = parseInt(searchParams.get("offset") || "0")
    const offset = Math.max(0, isNaN(rawOffset) ? 0 : rawOffset)

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    // Fetch profiles with search
    let query = adminClient
      .from("profiles")
      .select("id, email, first_name, last_name, phone, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      // Sanitize to prevent PostgREST filter injection via commas/parentheses
      // Allow @ and . for email searches, - for phone numbers
      const sanitizedSearch = search.trim().slice(0, 200).replace(/[^a-zA-Z0-9\s@.\-]/g, "").trim()
      if (sanitizedSearch) {
        query = query.or(
          `email.ilike.%${sanitizedSearch}%,first_name.ilike.%${sanitizedSearch}%,last_name.ilike.%${sanitizedSearch}%,phone.ilike.%${sanitizedSearch}%`
        )
      }
    }

    const { data: profiles, error, count } = await query

    if (error) {
      console.error("Error fetching customers:", error)
      return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 })
    }

    // Fetch order counts for each customer
    const customerIds = (profiles || []).map(p => p.id)
    let orderCounts: Record<string, number> = {}

    if (customerIds.length > 0) {
      const { data: orders } = await adminClient
        .from("orders")
        .select("customer_id")
        .in("customer_id", customerIds)

      if (orders) {
        orderCounts = orders.reduce((acc: Record<string, number>, o) => {
          const cid = o.customer_id as string
          acc[cid] = (acc[cid] || 0) + 1
          return acc
        }, {})
      }
    }

    // Fetch reservation counts
    let reservationCounts: Record<string, number> = {}
    if (customerIds.length > 0) {
      const { data: reservations } = await adminClient
        .from("reservations")
        .select("user_id")
        .in("user_id", customerIds)

      if (reservations) {
        reservationCounts = reservations.reduce((acc: Record<string, number>, r) => {
          const uid = r.user_id as string
          acc[uid] = (acc[uid] || 0) + 1
          return acc
        }, {})
      }
    }

    const customers = (profiles || []).map(p => ({
      id: p.id,
      email: p.email,
      firstName: p.first_name,
      lastName: p.last_name,
      phone: p.phone,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      orderCount: orderCounts[p.id] || 0,
      reservationCount: reservationCounts[p.id] || 0,
    }))

    // Get total customer count for stats
    const { count: totalCount } = await adminClient
      .from("profiles")
      .select("id", { count: "exact", head: true })

    return NextResponse.json({
      customers,
      total: count ?? 0,
      totalCustomers: totalCount ?? 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Admin customers error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
