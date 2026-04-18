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
      query = query.or(
        `order_number.ilike.%${search}%`
      )
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

    // Stats
    const { data: allOrders } = await adminClient
      .from("orders")
      .select("status, total_price_cents")

    const stats = {
      total: allOrders?.length || 0,
      created: allOrders?.filter(o => o.status === "created").length || 0,
      processing: allOrders?.filter(o => ["documents_pending", "payment_processing", "vehicle_preparation"].includes(o.status)).length || 0,
      delivered: allOrders?.filter(o => o.status === "delivered").length || 0,
      cancelled: allOrders?.filter(o => o.status === "cancelled").length || 0,
      totalRevenue: allOrders?.reduce((sum, o) => sum + (o.total_price_cents || 0), 0) || 0,
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
