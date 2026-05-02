import { NextRequest, NextResponse } from "next/server"
import {
  authenticateAdmin,
  getSearchParams,
  parsePagination,
  sanitizeSearch,
} from "@/lib/admin-api"

type AuthOk = Extract<Awaited<ReturnType<typeof authenticateAdmin>>, { ok: true }>
type AdminClient = AuthOk['adminClient']
type OrderRow = Record<string, unknown> & {
  id: string
  customer_id: string
  vehicle_id: string
  order_number?: string | null
  status?: string | null
  payment_method?: string | null
  delivery_type?: string | null
  vehicle_price_cents?: number | null
  total_price_cents?: number | null
  tax_amount_cents?: number | null
  down_payment_cents?: number | null
  created_at?: string | null
  updated_at?: string | null
}

async function enrichOrders(adminClient: AdminClient, orders: OrderRow[]) {
  const customerIds = [...new Set(orders.map(o => o.customer_id).filter(Boolean))] as string[]
  const vehicleIds = [...new Set(orders.map(o => o.vehicle_id).filter(Boolean))] as string[]

  let customerMap: Record<string, { email: string; first_name: string | null; last_name: string | null }> = {}
  if (customerIds.length > 0) {
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, email, first_name, last_name")
      .in("id", customerIds)
    if (profiles) customerMap = Object.fromEntries(profiles.map(p => [p.id, p]))
  }

  let vehicleMap: Record<string, { year: number; make: string; model: string; trim: string; price: number; stock_number: string }> = {}
  if (vehicleIds.length > 0) {
    const { data: vehicles } = await adminClient
      .from("vehicles")
      .select("id, year, make, model, trim, price, stock_number")
      .in("id", vehicleIds)
    if (vehicles) vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]))
  }

  return orders.map(order => {
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
}

async function computeOrderStats(adminClient: AdminClient) {
  // Order statuses per schema: created, confirmed, processing, ready_for_delivery, in_transit, delivered, cancelled, refunded
  const [totalResult, createdResult, processingResult, deliveredResult, cancelledResult] = await Promise.all([
    adminClient.from("orders").select("id", { count: "exact", head: true }),
    adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "created"),
    adminClient.from("orders").select("id", { count: "exact", head: true }).in("status", ["confirmed", "processing", "ready_for_delivery", "in_transit"]),
    adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "delivered"),
    adminClient.from("orders").select("id", { count: "exact", head: true }).eq("status", "cancelled"),
  ])

  // Revenue: page through to avoid the 1000-row default limit truncating sums.
  let totalRevenue = 0
  let revenueOffset = 0
  const revenueBatchSize = 1000
  for (;;) {
    const { data: batch } = await adminClient
      .from("orders")
      .select("total_price_cents")
      .order("id")
      .range(revenueOffset, revenueOffset + revenueBatchSize - 1)
    if (!batch || batch.length === 0) break
    totalRevenue += batch.reduce((sum: number, o: { total_price_cents: number | null }) => sum + (o.total_price_cents || 0), 0)
    if (batch.length < revenueBatchSize) break
    revenueOffset += revenueBatchSize
  }

  return {
    total: totalResult.count ?? 0,
    created: createdResult.count ?? 0,
    processing: processingResult.count ?? 0,
    delivered: deliveredResult.count ?? 0,
    cancelled: cancelledResult.count ?? 0,
    totalRevenue,
  }
}

/**
 * Handle GET /api/v1/admin/orders: authenticate an admin and return a paginated, optionally filtered list of orders enriched with customer and vehicle data plus aggregate stats.
 *
 * The handler checks the caller's Supabase session and restricts access to emails in `ADMIN_EMAILS`. It supports `status`, `search`, `limit`, and `offset` query parameters, sanitizes `search`, clamps `limit` to 1–200 and `offset` to >= 0, and paginates results. Returned orders include selected order fields and attached `customer` and `vehicle` objects when available. The response also includes counts by status and the total revenue computed by batching through all orders.
 *
 * @param request - Incoming NextRequest whose URL query may include `status`, `search`, `limit`, and `offset`
 * @returns On success, a JSON object with:
 *  - `orders`: array of enriched order objects,
 *  - `stats`: object with `total`, `created`, `processing`, `delivered`, `cancelled`, and `totalRevenue`,
 *  - `total`: the total matching orders (from the main query),
 *  - `limit`: the effective page size,
 *  - `offset`: the effective offset.
 * On failure, a JSON error object is returned with an appropriate HTTP status (e.g., 401 for unauthorized, 500 for server/admin-client errors).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await authenticateAdmin()
    if (!auth.ok) return auth.response
    const { adminClient } = auth

    const searchParams = getSearchParams(request)
    const status = searchParams.get("status")
    const search = searchParams.get("search") || ""
    const { limit, offset } = parsePagination(searchParams)

    let query = adminClient
      .from("orders")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (status && status !== "all") {
      query = query.eq("status", status)
    }

    if (search) {
      const sanitizedSearch = sanitizeSearch(search)
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

    const enrichedOrders = await enrichOrders(adminClient, orders || [])
    const stats = await computeOrderStats(adminClient)

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
