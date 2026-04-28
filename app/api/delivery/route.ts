import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { DEALERSHIP_LOCATION, DEALERSHIP_ADDRESS_DISPLAY } from "@/lib/constants/dealership"

type DeliveryStatus = "preparing" | "in-transit" | "nearby" | "delivered"

function mapStatus(status: string | null | undefined): DeliveryStatus {
  switch (status) {
    case "out_for_delivery":
      return "nearby"
    case "delivered":
      return "delivered"
    case "in_transit":
      return "in-transit"
    default:
      return "preparing"
  }
}

function formatVehicleName(vehicle: {
  year?: number | null
  make?: string | null
  model?: string | null
  trim?: string | null
} | null): string {
  if (!vehicle) return "Vehicle"
  const parts = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim]
    .filter(Boolean)
    .map(String)
  return parts.length > 0 ? parts.join(" ") : "Vehicle"
}

type SupaClient = Awaited<ReturnType<typeof createClient>>

async function findOrderForUser(supabase: SupaClient, orderId: string, userId: string) {
  let orderQuery = supabase
    .from("orders")
    .select("id, order_number, customer_id, created_at, vehicles(year, make, model, trim)")
    .eq("customer_id", userId)
    .limit(1)
  orderQuery = /^[0-9a-fA-F-]{36}$/.test(orderId)
    ? orderQuery.eq("id", orderId)
    : orderQuery.eq("order_number", orderId)
  return orderQuery
}

async function resolveDestinationAddress(
  supabase: SupaClient,
  addressId: string | null,
  userId: string,
): Promise<string> {
  if (!addressId) return "Delivery address on file"
  const { data: address } = await supabase
    .from("customer_addresses")
    .select("street, unit, city, province, postal_code")
    .eq("id", addressId)
    .eq("user_id", userId)
    .maybeSingle()
  if (!address) return "Delivery address on file"
  const line1 = [address.street, address.unit].filter(Boolean).join(" ")
  const line2 = [address.city, address.province, address.postal_code].filter(Boolean).join(", ")
  return [line1, line2].filter(Boolean).join(", ") || "Delivery address on file"
}

function pickEstimatedArrival(
  delivery: { estimated_delivery_date?: string | null; scheduled_date?: string | null },
  fallback: string,
): string {
  if (delivery.estimated_delivery_date) return new Date(`${delivery.estimated_delivery_date}T17:00:00.000Z`).toISOString()
  if (delivery.scheduled_date) return new Date(`${delivery.scheduled_date}T17:00:00.000Z`).toISOString()
  return new Date(fallback).toISOString()
}

function buildDeliveryTimeline(
  order: { created_at: string },
  delivery: {
    scheduled_date: string | null
    scheduled_time_slot: string | null
    updated_at: string | null
    delivery_notes: string | null
    delivered_at: string | null
    created_at: string | null
  },
) {
  const events = [
    {
      status: "Order confirmed",
      timestamp: order.created_at,
      description: "Order has been confirmed and queued for delivery processing.",
    },
    {
      status: "Delivery scheduled",
      timestamp: delivery.scheduled_date
        ? new Date(`${delivery.scheduled_date}T00:00:00.000Z`).toISOString()
        : delivery.created_at,
      description: delivery.scheduled_time_slot
        ? `Scheduled window: ${delivery.scheduled_time_slot}`
        : "Delivery has been scheduled.",
    },
    {
      status: "Status update",
      timestamp: delivery.updated_at,
      description: delivery.delivery_notes || "Latest delivery status has been recorded.",
    },
  ]
  if (delivery.delivered_at) {
    events.push({
      status: "Delivered",
      timestamp: delivery.delivered_at,
      description: "Vehicle delivery has been completed.",
    })
  }
  return events
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")?.trim()
  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: orderRows, error: orderError } = await findOrderForUser(supabase, orderId, user.id)
  if (orderError) {
    return NextResponse.json({ error: "Failed to fetch delivery" }, { status: 500 })
  }
  const order = orderRows?.[0]
  if (!order) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
  }

  const { data: deliveryRows, error: deliveryError } = await supabase
    .from("deliveries")
    .select("id, status, estimated_delivery_date, scheduled_date, scheduled_time_slot, driver_name, driver_phone, created_at, updated_at, delivered_at, delivery_notes, distance_km, address_id")
    .eq("order_id", order.id)
    .order("created_at", { ascending: false })
    .limit(1)
  if (deliveryError) {
    return NextResponse.json({ error: "Failed to fetch delivery" }, { status: 500 })
  }
  const delivery = deliveryRows?.[0]
  if (!delivery) {
    return NextResponse.json({ error: "Delivery not found" }, { status: 404 })
  }

  const destinationAddress = await resolveDestinationAddress(supabase, delivery.address_id, user.id)
  const vehicle = Array.isArray(order.vehicles) ? order.vehicles[0] : order.vehicles
  const estimatedArrival = pickEstimatedArrival(delivery, order.created_at)
  const timeline = buildDeliveryTimeline(order, delivery)

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.order_number || order.id,
      vehicleName: formatVehicleName(vehicle),
      status: mapStatus(delivery.status),
      estimatedArrival,
      driver: delivery.driver_name
        ? {
            name: delivery.driver_name,
            phone: delivery.driver_phone || "",
            photo: "/placeholder.svg",
          }
        : null,
      currentLocation: {
        lat: DEALERSHIP_LOCATION.lat,
        lng: DEALERSHIP_LOCATION.lng,
        address: DEALERSHIP_ADDRESS_DISPLAY,
      },
      destination: {
        lat: null,
        lng: null,
        address: destinationAddress,
      },
      timeline,
      distanceRemaining: delivery.distance_km ? `${delivery.distance_km} km` : undefined,
      etaMinutes: null,
    },
  })
}
