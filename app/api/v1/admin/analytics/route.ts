import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

/**
 * Provide aggregated analytics for the admin dashboard.
 *
 * Requires an authenticated user whose email is listed in `ADMIN_EMAILS`; returns
 * a 401 JSON response when unauthorized, a 500 JSON response when the admin
 * client is not configured, and a 500 JSON response for other internal errors.
 *
 * @returns A JSON object containing:
 * - `overview`: totals and recent counts (`totalRevenue`, `recentRevenue`, `totalOrders`, `recentOrders`, `totalCustomers`, `newCustomers30d`, `newCustomers7d`, `totalVehicles`, `activeVehicles`, `soldVehicles`, `reservedVehicles`, `totalReservations`)
 * - `finance`: finance application counts and aggregated value (`total`, `pending`, `approved`, `totalValue`)
 * - `tradeIns`: trade-in quote counts and aggregated value (`total`, `pending`, `accepted`, `totalValue`)
 * - `breakdowns`: aggregation maps and lists (`ordersByStatus`: Record<string, number>, `ordersByPayment`: Record<string, number>, `ordersPerDay`: Record<string, number>, `topMakes`: Array<{ make: string; count: number }>)
 */
export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    /**
     * Retrieve all rows produced by a paginated query function.
     *
     * @param queryFn - A function that accepts (offset, batchSize) and returns a promise resolving to an object with a `data` array or `null`. The function will be repeatedly called with increasing offsets until no more rows are returned.
     * @returns An array containing every row returned by repeated `queryFn` calls (empty array if no rows).
     */
    async function fetchAll<T>(
      queryFn: (offset: number, batchSize: number) => Promise<{ data: T[] | null }>
    ): Promise<T[]> {
      const results: T[] = []
      let offset = 0
      const batchSize = 1000
      while (true) {
        const { data } = await queryFn(offset, batchSize)
        if (!data || data.length === 0) break
        results.push(...data)
        if (data.length < batchSize) break
        offset += batchSize
      }
      return results
    }

    // Fetch counts in parallel (no row limit issues with head: true)
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    const [
      totalOrdersResult,
      recentOrdersResult,
      totalCustomersResult,
      newCustomers30dResult,
      newCustomers7dResult,
      totalVehiclesResult,
      activeVehiclesResult,
      soldVehiclesResult,
      reservedVehiclesResult,
      totalReservationsResult,
      totalFinanceResult,
      pendingFinanceResult,
      approvedFinanceResult,
      totalTradeInsResult,
      pendingTradeInsResult,
      acceptedTradeInsResult,
    ] = await Promise.all([
      adminClient.from("orders").select("id", { count: "exact", head: true }),
      adminClient.from("orders").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      adminClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      adminClient.from("vehicles").select("id", { count: "exact", head: true }),
      adminClient.from("vehicles").select("id", { count: "exact", head: true }).in("status", ["available", "active"]),
      adminClient.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "sold"),
      adminClient.from("vehicles").select("id", { count: "exact", head: true }).in("status", ["reserved", "pending"]),
      adminClient.from("reservations").select("id", { count: "exact", head: true }),
      adminClient.from("finance_applications_v2").select("id", { count: "exact", head: true }),
      adminClient.from("finance_applications_v2").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      adminClient.from("finance_applications_v2").select("id", { count: "exact", head: true }).eq("status", "approved"),
      adminClient.from("trade_in_quotes").select("id", { count: "exact", head: true }),
      adminClient.from("trade_in_quotes").select("id", { count: "exact", head: true }).eq("status", "pending"),
      adminClient.from("trade_in_quotes").select("id", { count: "exact", head: true }).eq("status", "accepted"),
    ])

    // Fetch rows that need aggregation (revenue, breakdowns) with pagination
    const [orders, vehicles, financeApps, acceptedTradeIns, recentOrders] = await Promise.all([
      fetchAll<{ status: string; total_price_cents: number; payment_method: string; delivery_type: string }>(
        async (offset, bs) => { return await adminClient.from("orders").select("status, total_price_cents, payment_method, delivery_type").range(offset, offset + bs - 1) }
      ),
      fetchAll<{ make: string }>(
        async (offset, bs) => { return await adminClient.from("vehicles").select("make").range(offset, offset + bs - 1) }
      ),
      fetchAll<{ requested_amount: number }>(
        async (offset, bs) => { return await adminClient.from("finance_applications_v2").select("requested_amount").range(offset, offset + bs - 1) }
      ),
      fetchAll<{ offer_amount: number }>(
        async (offset, bs) => { return await adminClient.from("trade_in_quotes").select("offer_amount").eq("status", "accepted").range(offset, offset + bs - 1) }
      ),
      fetchAll<{ created_at: string }>(
        async (offset, bs) => { return await adminClient.from("orders").select("created_at").gte("created_at", thirtyDaysAgo).range(offset, offset + bs - 1) }
      ),
    ])

    // Revenue
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0)
    // Fetch recent revenue with pagination to avoid 1000-row truncation
    const recentOrdersWithRevenue = await fetchAll<{ total_price_cents: number }>(
      async (offset, bs) => { return await adminClient.from("orders").select("total_price_cents").gte("created_at", thirtyDaysAgo).range(offset, offset + bs - 1) }
    )
    const recentRevenueTotal = recentOrdersWithRevenue.reduce((sum, o) => sum + (o.total_price_cents || 0), 0)

    // Top makes
    const makeCounts: Record<string, number> = {}
    for (const v of vehicles) {
      const make = v.make || "Unknown"
      makeCounts[make] = (makeCounts[make] || 0) + 1
    }
    const topMakes = Object.entries(makeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([make, count]) => ({ make, count }))

    // Finance value
    const totalFinanceValue = financeApps.reduce((sum, f) => sum + (f.requested_amount || 0), 0)

    // Trade-in value
    const totalTradeInValue = acceptedTradeIns.reduce((sum, t) => sum + (t.offer_amount || 0), 0)

    // Order status breakdown
    const ordersByStatus: Record<string, number> = {}
    for (const o of orders) {
      const s = o.status || "unknown"
      ordersByStatus[s] = (ordersByStatus[s] || 0) + 1
    }

    // Payment method breakdown
    const ordersByPayment: Record<string, number> = {}
    for (const o of orders) {
      const pm = o.payment_method || "unknown"
      ordersByPayment[pm] = (ordersByPayment[pm] || 0) + 1
    }

    // Orders over time (last 30 days, grouped by day)
    const ordersPerDay: Record<string, number> = {}
    for (const o of recentOrders) {
      const day = o.created_at.split("T")[0]
      ordersPerDay[day] = (ordersPerDay[day] || 0) + 1
    }

    return NextResponse.json({
      overview: {
        totalRevenue,
        recentRevenue: recentRevenueTotal,
        totalOrders: totalOrdersResult.count ?? 0,
        recentOrders: recentOrdersResult.count ?? 0,
        totalCustomers: totalCustomersResult.count ?? 0,
        newCustomers30d: newCustomers30dResult.count ?? 0,
        newCustomers7d: newCustomers7dResult.count ?? 0,
        totalVehicles: totalVehiclesResult.count ?? 0,
        activeVehicles: activeVehiclesResult.count ?? 0,
        soldVehicles: soldVehiclesResult.count ?? 0,
        reservedVehicles: reservedVehiclesResult.count ?? 0,
        totalReservations: totalReservationsResult.count ?? 0,
      },
      finance: {
        total: totalFinanceResult.count ?? 0,
        pending: pendingFinanceResult.count ?? 0,
        approved: approvedFinanceResult.count ?? 0,
        totalValue: totalFinanceValue,
      },
      tradeIns: {
        total: totalTradeInsResult.count ?? 0,
        pending: pendingTradeInsResult.count ?? 0,
        accepted: acceptedTradeInsResult.count ?? 0,
        totalValue: totalTradeInValue,
      },
      breakdowns: {
        ordersByStatus,
        ordersByPayment,
        ordersPerDay,
        topMakes,
      },
    })
  } catch (error) {
    console.error("Admin analytics error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
