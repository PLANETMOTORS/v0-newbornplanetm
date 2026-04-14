import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function toStatusLabel(status: string): string {
  switch (status) {
    case "scheduled":
      return "Scheduled"
    case "preparing":
      return "Preparing"
    case "in_transit":
      return "In Transit"
    case "out_for_delivery":
      return "Out for Delivery"
    case "delivered":
      return "Delivered"
    case "failed":
      return "Delivery Exception"
    default:
      return "Pending"
  }
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

  const { data: delivery, error: deliveryError } = await supabase
    .from("deliveries")
    .select("id, order_id, status, estimated_delivery_date, scheduled_date, scheduled_time_slot, driver_name, driver_phone, distance_km, updated_at, created_at, delivered_at, delivery_notes")
    .eq("id", id)
    .maybeSingle()

  if (deliveryError) {
    return NextResponse.json({ error: "Failed to load tracking" }, { status: 500 })
  }

  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", delivery.order_id)
    .maybeSingle()

  if (orderError) {
    return NextResponse.json({ error: "Failed to load tracking" }, { status: 500 })
  }

  if (!order || order.customer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const status = String(delivery.status || "pending")
  const statusLabel = toStatusLabel(status)
  const estimatedDate = delivery.estimated_delivery_date || delivery.scheduled_date
  const estimatedArrival = estimatedDate
    ? `${estimatedDate} ${delivery.scheduled_time_slot || ""}`.trim()
    : "Pending schedule confirmation"

  const timeline = [
    {
      status: "Scheduled",
      timestamp: delivery.scheduled_date
        ? new Date(`${delivery.scheduled_date}T00:00:00.000Z`).toISOString()
        : delivery.created_at,
      completed: ["scheduled", "preparing", "in_transit", "out_for_delivery", "delivered"].includes(status),
    },
    {
      status: "Preparing",
      timestamp: ["preparing", "in_transit", "out_for_delivery", "delivered"].includes(status)
        ? delivery.updated_at
        : null,
      completed: ["preparing", "in_transit", "out_for_delivery", "delivered"].includes(status),
    },
    {
      status: "In transit",
      timestamp: ["in_transit", "out_for_delivery", "delivered"].includes(status)
        ? delivery.updated_at
        : null,
      completed: ["in_transit", "out_for_delivery", "delivered"].includes(status),
      current: status === "in_transit",
    },
    {
      status: "Out for delivery",
      timestamp: ["out_for_delivery", "delivered"].includes(status)
        ? delivery.updated_at
        : null,
      completed: ["out_for_delivery", "delivered"].includes(status),
      current: status === "out_for_delivery",
    },
    {
      status: "Delivered",
      timestamp: delivery.delivered_at || null,
      completed: status === "delivered",
      current: status === "delivered",
    },
  ]

  const updates = [
    {
      message: delivery.delivery_notes || `Latest status: ${statusLabel}`,
      timestamp: delivery.updated_at,
      type: status === "delivered" ? "success" : "info",
    },
  ]

  return NextResponse.json({
    tracking: {
      deliveryId: delivery.id,
      status,
      statusLabel,
      estimatedArrival,
      driver: delivery.driver_name
        ? {
            name: delivery.driver_name,
            phone: delivery.driver_phone || null,
            rating: 0,
            vehicleType: "Carrier",
          }
        : null,
      currentLocation: null,
      route: {
        origin: {
          lat: 43.8828,
          lng: -79.4403,
          address: "Richmond Hill, ON",
        },
        destination: {
          lat: 43.6532,
          lng: -79.3832,
          address: "Address on file",
        },
        distanceRemaining: delivery.distance_km ? `${delivery.distance_km} km` : "Unknown",
        etaMinutes: null,
      },
      timeline,
      updates,
    },
  })
}
