import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

// GET /api/v1/admin/analytics - Get analytics data for admin dashboard
export async function GET() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    let adminClient: ReturnType<typeof createAdminClient>
    try {
      adminClient = createAdminClient()
    } catch {
      return NextResponse.json({ error: "Admin client not configured" }, { status: 500 })
    }

    // Fetch all data in parallel
    const [
      ordersResult,
      customersResult,
      vehiclesResult,
      financeResult,
      tradeInsResult,
      reservationsResult,
    ] = await Promise.all([
      adminClient.from("orders").select("status, total_price_cents, payment_method, delivery_type, created_at"),
      adminClient.from("profiles").select("id, created_at"),
      adminClient.from("vehicles").select("id, status, price, make, year, created_at"),
      adminClient.from("finance_applications_v2").select("status, requested_amount, created_at"),
      adminClient.from("trade_in_quotes").select("status, offer_amount, created_at"),
      adminClient.from("reservations").select("id, status, created_at"),
    ])

    const orders = ordersResult.data || []
    const customers = customersResult.data || []
    const vehicles = vehiclesResult.data || []
    const financeApps = financeResult.data || []
    const tradeIns = tradeInsResult.data || []
    const reservations = reservationsResult.data || []

    // Date helpers
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    const isRecent = (dateStr: string, since: Date) => new Date(dateStr) >= since

    // Order stats
    const totalRevenue = orders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0)
    const recentOrders = orders.filter(o => isRecent(o.created_at, thirtyDaysAgo))
    const recentRevenue = recentOrders.reduce((sum, o) => sum + (o.total_price_cents || 0), 0)

    // Customer stats
    const newCustomers30d = customers.filter(c => isRecent(c.created_at, thirtyDaysAgo)).length
    const newCustomers7d = customers.filter(c => isRecent(c.created_at, sevenDaysAgo)).length

    // Vehicle stats
    const activeVehicles = vehicles.filter(v => v.status === "available" || v.status === "active").length
    const soldVehicles = vehicles.filter(v => v.status === "sold").length
    const reservedVehicles = vehicles.filter(v => v.status === "reserved" || v.status === "pending").length

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

    // Finance stats
    const pendingFinance = financeApps.filter(f => ["submitted", "under_review"].includes(f.status)).length
    const approvedFinance = financeApps.filter(f => f.status === "approved").length
    const totalFinanceValue = financeApps.reduce((sum, f) => sum + (f.requested_amount || 0), 0)

    // Trade-in stats
    const pendingTradeIns = tradeIns.filter(t => ["pending", "quoted"].includes(t.status)).length
    const acceptedTradeIns = tradeIns.filter(t => t.status === "accepted").length
    const totalTradeInValue = tradeIns.filter(t => t.status === "accepted").reduce((sum, t) => sum + (t.offer_amount || 0), 0)

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
        recentRevenue,
        totalOrders: orders.length,
        recentOrders: recentOrders.length,
        totalCustomers: customers.length,
        newCustomers30d,
        newCustomers7d,
        totalVehicles: vehicles.length,
        activeVehicles,
        soldVehicles,
        reservedVehicles,
        totalReservations: reservations.length,
      },
      finance: {
        total: financeApps.length,
        pending: pendingFinance,
        approved: approvedFinance,
        totalValue: totalFinanceValue,
      },
      tradeIns: {
        total: tradeIns.length,
        pending: pendingTradeIns,
        accepted: acceptedTradeIns,
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
