import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function buildTimeline(status: string, createdAt: string | null) {
  const statusOrder = ["created", "processing", "ready", "in_transit", "delivered"]
  const statusIndex = Math.max(statusOrder.indexOf(status), 0)

  return [
    { status: "Order confirmed", completed: statusIndex >= 0, timestamp: createdAt },
    { status: "Preparing vehicle", completed: statusIndex >= 1, timestamp: null },
    { status: "Ready for dispatch", completed: statusIndex >= 2, timestamp: null },
    { status: "In transit", completed: statusIndex >= 3, timestamp: null, current: statusIndex === 3 },
    { status: "Delivered", completed: statusIndex >= 4, timestamp: null, current: statusIndex === 4 },
  ]
}

// GET /api/v1/deliveries/:id/tracking - Get real-time tracking
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status, delivery_type, preferred_date, preferred_time_slot, created_at")
    .eq("customer_id", user.id)
    .or(`id.eq.${id},order_number.eq.${id}`)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Unable to fetch tracking information" }, { status: 500 })
  }

  if (!order) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
  }

  if (order.delivery_type !== "delivery") {
    return NextResponse.json({ error: "Tracking is available for delivery orders only" }, { status: 400 })
  }

  const status = String(order.status || "created").toLowerCase()
  const statusLabel = status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  const estimatedArrival = order.preferred_date && order.preferred_time_slot
    ? `${order.preferred_date} ${order.preferred_time_slot}`
    : order.preferred_date || "Pending scheduling"

  const tracking = {
    deliveryId: order.order_number || order.id,
    status,
    statusLabel,
    estimatedArrival,
    driver: null,
    currentLocation: null,
    route: {
      origin: {
        lat: 43.8828,
        lng: -79.4403,
        address: "Richmond Hill, ON",
      },
      destination: {
        lat: 0,
        lng: 0,
        address: "Customer delivery address",
      },
      distanceRemaining: "Pending carrier dispatch",
      etaMinutes: null,
    },
    timeline: buildTimeline(status, order.created_at),
    updates: [],
  }

  return NextResponse.json({ tracking })
}
