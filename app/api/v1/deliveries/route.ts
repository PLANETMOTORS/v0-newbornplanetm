import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

function buildDeliveryNotes(normalizedPostal: string, specialInstructions: unknown): string | null {
  const parts = [
    `Destination postal code: ${normalizedPostal}`,
    typeof specialInstructions === "string" && specialInstructions.trim()
      ? `Instructions: ${specialInstructions.trim()}`
      : null,
  ].filter(Boolean)
  return parts.join(" | ") || null
}

function buildDeliveryResponseBody(delivery: Record<string, unknown>, orderId: string) {
  return {
    id: delivery.id,
    orderId,
    status: delivery.status,
    scheduledDate: delivery.scheduled_date,
    timeSlot: delivery.scheduled_time_slot,
    estimatedDeliveryDate: delivery.estimated_delivery_date,
    distanceKm: delivery.distance_km,
    cost: delivery.delivery_fee,
    isFree: Number(delivery.delivery_fee || 0) === 0,
    createdAt: delivery.created_at,
  }
}

function validateDeliveryBody(body: Record<string, unknown>): string | null {
  if (!body.orderId || !body.destinationPostalCode || !body.scheduledDate) {
    return "Missing required fields: orderId, destinationPostalCode, scheduledDate"
  }
  return null
}

function vehicleMatchesOrder(vehicleId: unknown, order: { vehicle_id?: string }): boolean {
  return !vehicleId || !order.vehicle_id || vehicleId === order.vehicle_id
}

// POST /api/v1/deliveries - Schedule delivery
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return apiError(ErrorCode.UNAUTHORIZED, "Authentication required", 401)
    }

    const body = await request.json()
    const { orderId, vehicleId, destinationPostalCode, scheduledDate, timeSlot, specialInstructions, addressId } = body

    const validationError = validateDeliveryBody(body)
    if (validationError) {
      return apiError(ErrorCode.VALIDATION_ERROR, validationError, 400)
    }

    const quoteUrl = new URL(`/api/v1/deliveries/quote?postalCode=${encodeURIComponent(destinationPostalCode)}`, request.url)
    const quoteResponse = await fetch(quoteUrl, { cache: "no-store" })

    if (!quoteResponse.ok) {
      const quoteError = await quoteResponse.json().catch(() => ({ error: "Invalid postal code" }))
      return apiError(ErrorCode.VALIDATION_ERROR, quoteError?.error || "Unable to calculate delivery quote", 400)
    }

    const quote = await quoteResponse.json()
    const estimatedDistanceKm = Number(quote.distanceKm || 0)
    const deliveryCost = Number(quote.deliveryCost || 0)

    const normalizedOrderId = String(orderId).trim()
    const orderIdIsUuid = /^[0-9a-fA-F-]{36}$/.test(normalizedOrderId)
    const normalizedPostal = String(destinationPostalCode).trim().toUpperCase()
    const normalizedTimeSlot = typeof timeSlot === "string" ? timeSlot.trim() : null

    let orderQuery = supabase
      .from("orders")
      .select("id, order_number, customer_id, vehicle_id")
      .eq("customer_id", user.id)
      .limit(1)

    orderQuery = orderIdIsUuid
      ? orderQuery.eq("id", normalizedOrderId)
      : orderQuery.eq("order_number", normalizedOrderId)

    const { data: orderRows, error: orderError } = await orderQuery
    if (orderError) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to schedule delivery")
    }

    const order = orderRows?.[0]
    if (!order) {
      return apiError(ErrorCode.NOT_FOUND, "Order not found", 404)
    }

    if (!vehicleMatchesOrder(vehicleId, order)) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Vehicle does not match order", 409)
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("deliveries")
      .select("id, status, scheduled_date, scheduled_time_slot, estimated_delivery_date, distance_km, delivery_fee, created_at")
      .eq("order_id", order.id)
      .in("status", ["pending", "scheduled", "preparing", "in_transit", "out_for_delivery"])
      .order("created_at", { ascending: false })
      .limit(1)

    if (existingError) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to schedule delivery")
    }

    const existing = existingRows?.[0]
    if (existing) {
      const isSameSchedule =
        String(existing.scheduled_date || "") === String(scheduledDate) &&
        String(existing.scheduled_time_slot || "") === String(normalizedTimeSlot || "")
      if (isSameSchedule) {
        return apiSuccess({ idempotentReplay: true, delivery: buildDeliveryResponseBody(existing as Record<string, unknown>, String(order.order_number || order.id)) })
      }
      return apiError(ErrorCode.VALIDATION_ERROR, "An active delivery already exists for this order", 409)
    }

    const notes = buildDeliveryNotes(normalizedPostal, specialInstructions)

    const { data: insertedRows, error: insertError } = await supabase
      .from("deliveries")
      .insert({
        order_id: order.id,
        delivery_type: "delivery",
        address_id: addressId || null,
        scheduled_date: scheduledDate,
        scheduled_time_slot: normalizedTimeSlot,
        estimated_delivery_date: scheduledDate,
        status: "scheduled",
        distance_km: Number.isFinite(estimatedDistanceKm) ? Math.round(estimatedDistanceKm) : null,
        delivery_fee: Number.isFinite(deliveryCost) ? deliveryCost : null,
        delivery_notes: notes || null,
      })
      .select("id, status, scheduled_date, scheduled_time_slot, estimated_delivery_date, distance_km, delivery_fee, created_at")
      .single()

    if (insertError || !insertedRows) {
      return apiError(ErrorCode.INTERNAL_ERROR, "Failed to schedule delivery")
    }

    return apiSuccess({
      delivery: buildDeliveryResponseBody(insertedRows as unknown as Record<string, unknown>, String(order.order_number || order.id)),
    })
  } catch (_error) {
    return apiError(ErrorCode.INTERNAL_ERROR, "Failed to schedule delivery")
  }
}

// GET /api/v1/deliveries - Get available time slots
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const date = searchParams.get("date")

  // Generate available time slots for next 14 days
  const slots = []
  const startDate = date ? new Date(date) : new Date()

  for (let i = 1; i <= 14; i++) {
    const slotDate = new Date(startDate)
    slotDate.setDate(slotDate.getDate() + i)

    // Skip Sundays
    if (slotDate.getDay() === 0) continue

    const dayOfWeek = slotDate.getDay()
    slots.push({
      date: slotDate.toISOString().split("T")[0],
      slots: [
        { time: "9:00 AM - 12:00 PM", available: dayOfWeek !== 6 }, // Not Saturday morning
        { time: "12:00 PM - 3:00 PM", available: true },
        { time: "3:00 PM - 6:00 PM", available: dayOfWeek !== 5 }, // Not Friday evening
      ]
    })
  }

  return apiSuccess({ availableSlots: slots })
}
