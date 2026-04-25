import { NextRequest, NextResponse } from "next/server"
import {
  authenticateAdmin,
  getSearchParams,
  parsePagination,
  sanitizeSearch,
} from "@/lib/admin-api"

/**
 * Return a paginated, optionally search-filtered list of customer profiles for admin users.
 *
 * Only authenticated users whose email is listed in `ADMIN_EMAILS` may access this endpoint. Accepts query parameters `search`, `limit`, and `offset`. Each returned customer object includes per-customer `orderCount` and `reservationCount`; response also contains pagination metadata and total counts.
 *
 * @param request - Incoming request; may include query parameters: `search` (string), `limit` (number, defaults to 50, clamped to 1–200), and `offset` (number, defaults to 0, >= 0)
 * @returns JSON object containing:
 * - `customers`: array of customer objects with `id`, `email`, `firstName`, `lastName`, `phone`, `createdAt`, `updatedAt`, `orderCount`, and `reservationCount`
 * - `total`: number of rows returned by the filtered, paginated query
 * - `totalCustomers`: total number of customer profiles in the database
 * - `limit`: the applied limit
 * - `offset`: the applied offset
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin()
    if (!auth.ok) return auth.response
    const { adminClient } = auth

    const searchParams = getSearchParams(request)
    const search = searchParams.get("search") || ""
    const { limit, offset } = parsePagination(searchParams)

    // Fetch profiles with search
    let query = adminClient
      .from("profiles")
      .select("id, email, first_name, last_name, phone, created_at, updated_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (search) {
      // Allow @ and . for email searches, - for phone numbers
      const sanitizedSearch = sanitizeSearch(search, { allowEmail: true })
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

    // Fetch order and reservation counts per customer using exact count queries
    // to avoid Supabase's default 1000-row limit silently truncating results
    const customerIds = (profiles || []).map(p => p.id)
    let orderCounts: Record<string, number> = {}
    let reservationCounts: Record<string, number> = {}

    if (customerIds.length > 0) {
      const fetchOrderCount = async (id: string) => {
        const { count } = await adminClient.from("orders").select("id", { count: "exact", head: true }).eq("customer_id", id)
        return { id, count: count ?? 0 }
      }
      const fetchReservationCount = async (id: string) => {
        const { count } = await adminClient.from("reservations").select("id", { count: "exact", head: true }).eq("user_id", id)
        return { id, count: count ?? 0 }
      }
      const [orderResults, reservationResults] = await Promise.all([
        Promise.all(customerIds.map(fetchOrderCount)),
        Promise.all(customerIds.map(fetchReservationCount)),
      ])
      for (const r of orderResults) {
        if (r.count > 0) orderCounts[r.id] = r.count
      }
      for (const r of reservationResults) {
        if (r.count > 0) reservationCounts[r.id] = r.count
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
