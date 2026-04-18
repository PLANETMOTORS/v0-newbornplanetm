import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { ADMIN_EMAILS } from "@/lib/admin"

// GET /api/v1/admin/orders - List all orders for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
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

    let query = adminClient
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      // Sanitize to prevent PostgREST filter injection via commas/parentheses
      const sanitizedSearch = search.trim().slice(0, 200).replace(/[^a-zA-Z0-9\s\-]/g, "").trim()
      if (sanitizedSearch) {
        query = query.or(
          `order_number.ilike.%${sanitizedSearch}%`
        )
      }
    }

    const { data: orders, error, count } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
    }

    // Enrich with customer and vehicle info
    const customerIds = [...new Set((orders || []).map(o => o.customer_id).filter(Boolean))]
    const vehicleIds = [...new Set((orders || []).map(o => o.vehicle_id).filter(Boolean))]

    let customerMap: Record<string, { email: string; first_name: string | null; last_name: string | null }> = {}
    if (customerIds.length > 0) {
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("id, email, first_name, last_name")
        .in("id", customerIds)

      if (profiles) {
        customerMap = Object.fromEntries(profiles.map(p => [p.id, p]))
      }
    }

    let vehicleMap: Record<string, { year: number; make: string; model: string; trim: string; price: number; stock_number: string }> = {}
    if (vehicleIds.length > 0) {
      const { data: vehicles } = await adminClient
        .from("vehicles")
        .select("id, year, make, model, trim, price, stock_number")
        .in("id", vehicleIds)

      if (vehicles) {
        vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]))
      }
    }

    const enrichedOrders = (orders || []).map(order => {
      const customer = customerMap[order.customer_id] || null
      const vehicle = vehicleMap[order.vehicle_id] || null

      return {
        id: order.id,
        orderNumber: order.order_number,
        status: order.status,
        paymentMethod: order.payment_method,
        deliveryType: order.delivery_type,
        vehiclePriceCents: order.vehicle_price_cents,
        totalPriceCents: order.total_price_cents,
        taxAmountCents: order.tax_amount_cents,
        downPaymentCents: order.down_payment_cents,
        createdAt: order.created_at,
        updatedAt: order.updated_at,
        customer: customer ? {
          id: order.customer_id,
          email: customer.email,
          firstName: customer.first_name,
          lastName: customer.last_name,
        } : null,
        vehicle: vehicle ? {
          id: order.vehicle_id,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          price: vehicle.price,
          stockNumber: vehicle.stock_number,
        } : null,
      }
    })

    // Stats — use count queries to avoid Supabase's 1000-row default limit
    // Order statuses per schema: created, confirmed, processing, ready_for_delivery, in_transit, delivered, cancelled, refunded
    const [totalResult, createdResult, processingResult, deliveredResult, cancelledResult] = await Promise.all([
      adminClient.from("orders").select("id", { count: "exact", head: true }),
      adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "created"),
      adminClient.from("orders").select("id", { count: "exact", head: true }).in("status", ["confirmed", "processing", "ready_for_delivery", "in_transit"]),
      adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
      adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
    ])

    // For revenue, we still need row data but paginate to avoid truncation
    let totalRevenue = 0
    let revenueOffset = 0
    const revenueBatchSize = 1000
    while (true) {
      const { data: batch } = await adminClient
        .from("orders")
        .select("total_price_cents")
        .range(revenueOffset, revenueOffset + revenueBatchSize - 1)
      if (!batch || batch.length === 0) break
      totalRevenue += batch.reduce((sum, o) => sum + (o.total_price_cents || 0), 0)
      if (batch.length < revenueBatchSize) break
      revenueOffset += revenueBatchSize
    }

    const stats = {
      total: totalResult.count ?? 0,
      created: createdResult.count ?? 0,
      processing: processingResult.count ?? 0,
      delivered: deliveredResult.count ?? 0,
      cancelled: cancelledResult.count ?? 0,
      totalRevenue,
    }

    return NextResponse.json({
      orders: enrichedOrders,
      stats,
      total: count ?? 0,
      limit,
      offset,
    })
  } catch (error) {
    console.error("Admin orders error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
