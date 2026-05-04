import { NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const adminClient = createAdminClient()

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
      // Leads table — may be empty even though it exists; we always
      // aggregate from finance/reservation/trade-in tables AS WELL so the
      // dashboard never shows "No leads yet" when capture-lead, finance
      // applications, reservations, or trade-in quotes are flowing.
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

    // Build the unified Recent Leads feed.
    //
    // Rule: always surface the most recent customer-facing intake events
    // (finance pre-approvals, trade-in quotes, reservations) in addition
    // to whatever sits in the `leads` table directly. The dashboard
    // becomes useless if the operator has to bounce between four tabs to
    // see who came in this hour.
    const leadsTableRows = (leadsResult.data || []).map((row) => ({
      id: row.id as string,
      source: row.source as string,
      status: row.status as string,
      customer_name: (row.customer_name as string | null) ?? "",
      customer_email: (row.customer_email as string | null) ?? "",
      subject: (row.subject as string | null) ?? "",
      vehicle_info: (row.vehicle_info as string | null) ?? null,
      created_at: row.created_at as string,
    }))
    const aggregated: typeof leadsTableRows = []
    for (const ti of recentTradeInsResult.data || []) {
      aggregated.push({
        id: ti.id,
        source: "trade_in",
        status: ti.status === "accepted" ? "converted" : "new",
        customer_name: ti.customer_name || ti.customer_email || "Unknown",
        customer_email: ti.customer_email || "",
        subject: `Trade-In: ${ti.vehicle_year} ${ti.vehicle_make} ${ti.vehicle_model}`,
        vehicle_info: `Offered $${(ti.offer_amount || 0).toLocaleString()}`,
        created_at: ti.created_at,
      })
    }
    for (const app of recentFinanceResult.data || []) {
      aggregated.push({
        id: app.id,
        source: "finance_app",
        status: app.status === "approved" ? "qualified" : "new",
        customer_name: `Finance Application ${app.application_number}`,
        customer_email: "",
        subject: `Finance Application — $${(app.requested_amount || 0).toLocaleString()}`,
        vehicle_info: null,
        created_at: app.created_at,
      })
    }
    for (const res of recentReservationsResult.data || []) {
      aggregated.push({
        id: res.id,
        source: "reservation",
        status: res.status === "completed" ? "converted" : "new",
        customer_name: res.customer_name || res.customer_email || "Unknown",
        customer_email: res.customer_email || "",
        subject: `Reservation — $${Math.round((res.deposit_amount || 0) / 100).toLocaleString()} deposit`,
        vehicle_info: null,
        created_at: res.created_at,
      })
    }
    const seenIds = new Set(leadsTableRows.map((r) => r.id))
    const merged = [
      ...leadsTableRows,
      ...aggregated.filter((r) => !seenIds.has(r.id)),
    ].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )

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
      recentLeads: merged.slice(0, 10),
      recentActivity: recentActivity.slice(0, 10),
    })
  } catch (error) {
    console.error("Dashboard API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
