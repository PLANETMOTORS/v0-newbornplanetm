import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { ADMIN_EMAILS } from "@/lib/admin"

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const adminClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? ""
    )

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()

    // Parallel queries for dashboard stats
    const [
      vehiclesCount,
      vehiclesAvailable,
      vehiclesSold,
      ordersTotal,
      ordersRecent,
      financeAppsTotal,
      financeAppsPending,
      reservationsActive,
      profilesTotal,
      profilesRecent,
      tradeInsTotal,
      leadsResult,
      recentOrdersResult,
      recentFinanceResult,
      recentReservationsResult,
      recentTradeInsResult,
    ] = await Promise.all([
      adminClient.from("vehicles").select("id", { count: "exact", head: true }),
      adminClient.from("vehicles").select("id", { count: "exact", head: true }).in("status", ["available", "active"]),
      adminClient.from("vehicles").select("id", { count: "exact", head: true }).eq("status", "sold"),
      adminClient.from("orders").select("id", { count: "exact", head: true }),
      adminClient.from("orders").select("id", { count: "exact", head: true }).gte("created_at", thirtyDaysAgo),
      adminClient.from("finance_applications_v2").select("id", { count: "exact", head: true }),
      adminClient.from("finance_applications_v2").select("id", { count: "exact", head: true }).in("status", ["submitted", "under_review"]),
      adminClient.from("reservations").select("id", { count: "exact", head: true }).in("status", ["pending", "confirmed"]),
      adminClient.from("profiles").select("id", { count: "exact", head: true }),
      adminClient.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", sevenDaysAgo),
      adminClient.from("trade_in_quotes").select("id", { count: "exact", head: true }),
      // Try leads table (may not exist yet)
      adminClient.from("leads").select("id, source, status, customer_name, customer_email, subject, vehicle_info, created_at").order("created_at", { ascending: false }).limit(10),
      // Recent activity items
      adminClient.from("orders").select("id, order_number, status, total_price_cents, created_at").order("created_at", { ascending: false }).limit(5),
      adminClient.from("finance_applications_v2").select("id, application_number, status, requested_amount, created_at").order("created_at", { ascending: false }).limit(5),
      adminClient.from("reservations").select("id, vehicle_id, customer_email, customer_name, status, deposit_amount, deposit_status, created_at").order("created_at", { ascending: false }).limit(5),
      adminClient.from("trade_in_quotes").select("id, vehicle_year, vehicle_make, vehicle_model, customer_name, customer_email, offer_amount, status, created_at").order("created_at", { ascending: false }).limit(5),
    ])

    // Build recent activity feed from all sources
    type ActivityItem = { type: string; title: string; detail: string; time: string; status: string; id: string }
    const recentActivity: ActivityItem[] = []

    for (const order of recentOrdersResult.data || []) {
      recentActivity.push({
        type: "order",
        title: `Order ${order.order_number}`,
        detail: `$${((order.total_price_cents || 0) / 100).toLocaleString()} — ${order.status}`,
        time: order.created_at,
        status: order.status,
        id: order.id,
      })
    }

    for (const app of recentFinanceResult.data || []) {
      recentActivity.push({
        type: "finance",
        title: `Finance App ${app.application_number}`,
        detail: `$${(app.requested_amount || 0).toLocaleString()} requested — ${app.status}`,
        time: app.created_at,
        status: app.status,
        id: app.id,
      })
    }

    for (const res of recentReservationsResult.data || []) {
      recentActivity.push({
        type: "reservation",
        title: `Reservation by ${res.customer_name || res.customer_email}`,
        detail: `$${Math.round((res.deposit_amount || 0) / 100).toLocaleString()} deposit — ${res.deposit_status}`,
        time: res.created_at,
        status: res.status,
        id: res.id,
      })
    }

    for (const ti of recentTradeInsResult.data || []) {
      recentActivity.push({
        type: "trade_in",
        title: `Trade-In: ${ti.vehicle_year} ${ti.vehicle_make} ${ti.vehicle_model}`,
        detail: `${ti.customer_name || ti.customer_email} — $${(ti.offer_amount || 0).toLocaleString()} offered`,
        time: ti.created_at,
        status: ti.status,
        id: ti.id,
      })
    }

    // Sort by time descending
    recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())

    return NextResponse.json({
      stats: {
        totalInventory: vehiclesCount.count || 0,
        availableVehicles: vehiclesAvailable.count || 0,
        soldVehicles: vehiclesSold.count || 0,
        totalOrders: ordersTotal.count || 0,
        recentOrders: ordersRecent.count || 0,
        totalFinanceApps: financeAppsTotal.count || 0,
        pendingFinanceApps: financeAppsPending.count || 0,
        activeReservations: reservationsActive.count || 0,
        totalCustomers: profilesTotal.count || 0,
        newCustomersThisWeek: profilesRecent.count || 0,
        totalTradeIns: tradeInsTotal.count || 0,
      },
      recentLeads: leadsResult.data || [],
      recentActivity: recentActivity.slice(0, 10),
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
