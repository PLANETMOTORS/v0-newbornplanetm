import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { apiSuccess, apiError, ErrorCode } from "@/lib/api-response"

type DeliveryRow = {
  id: string
  status: string
  scheduled_date: string | null
  scheduled_time_slot: string | null
  estimated_delivery_date: string | null
  distance_km: number | null
  delivery_fee: number | null
  created_at: string | null
}

async function lookupOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  userId: string,
) {
  const normalizedOrderId = String(orderId).trim()
  const orderIdIsUuid = /^[0-9a-fA-F-]{36}$/.test(normalizedOrderId)
  let orderQuery = supabase
    .from("orders")
    .select("id, order_number, customer_id, vehicle_id")
    .eq("customer_id", userId)
    .limit(1)
  orderQuery = orderIdIsUuid
    ? orderQuery.eq("id", normalizedOrderId)
    : orderQuery.eq("order_number", normalizedOrderId)
  const { data: orderRows, error: orderError } = await orderQuery
  if (orderError) return { error: apiError(ErrorCode.INTERNAL_ERROR, "Failed to schedule delivery") as ReturnType<typeof apiError> }
  const order = orderRows?.[0]
  if (!order) return { error: apiError(ErrorCode.NOT_FOUND, "Order not found", 404) as ReturnType<typeof apiError> }
  return { order }
}

async function checkExistingDelivery(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderId: string,
  scheduledDate: string,
  normalizedTimeSlot: string | null,
  orderRef: string,
) {
  const { data: existingRows, error: existingError } = await supabase
    .from("deliveries")
    .select("id, status, scheduled_date, scheduled_time_slot, estimated_delivery_date, distance_km, delivery_fee, created_at")
    .eq("order_id", orderId)
    .in("status", ["pending", "scheduled", "preparing", "in_transit", "out_for_delivery"])
    .order("created_at", { ascending: false })
    .limit(1)
  if (existingError) return { error: apiError(ErrorCode.INTERNAL_ERROR, "Failed to schedule delivery") as ReturnType<typeof apiError> }
  const existing = existingRows?.[0]
  if (!existing) return null
  const isSameSchedule =
    String(existing.scheduled_date || "") === String(scheduledDate) &&
    String(existing.scheduled_time_slot || "") === String(normalizedTimeSlot || "")
  if (isSameSchedule) {
    return { response: apiSuccess(toDeliveryDto(existing as DeliveryRow, orderRef, { idempotentReplay: true })) as ReturnType<typeof apiSuccess> }
  }
  return { error: apiError(ErrorCode.VALIDATION_ERROR, "An active delivery already exists for this order", 409) as ReturnType<typeof apiError> }
}

function toDeliveryDto(
  row: DeliveryRow,
  orderRef: string,
  extra: { idempotentReplay?: boolean } = {},
) {
  return {
    ...(extra.idempotentReplay ? { idempotentReplay: true } : {}),
    delivery: {
      id: row.id,
      orderId: orderRef,
      status: row.status,
      scheduledDate: row.scheduled_date,
      timeSlot: row.scheduled_time_slot,
      estimatedDeliveryDate: row.estimated_delivery_date,
      distanceKm: row.distance_km,
      cost: row.delivery_fee,
      isFree: Number(row.delivery_fee || 0) === 0,
      createdAt: row.created_at,
    },
  }
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

    if (!orderId || !destinationPostalCode || !scheduledDate) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Missing required fields: orderId, destinationPostalCode, scheduledDate", 400)
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

    const normalizedPostal = String(destinationPostalCode).trim().toUpperCase()
    const normalizedTimeSlot = typeof timeSlot === "string" ? timeSlot.trim() : null

    const orderResult = await lookupOrder(supabase, orderId, user.id)
    if ('error' in orderResult) return orderResult.error
    const { order } = orderResult

    if (vehicleId && order.vehicle_id && vehicleId !== order.vehicle_id) {
      return apiError(ErrorCode.VALIDATION_ERROR, "Vehicle does not match order", 409)
    }

    const existingCheck = await checkExistingDelivery(supabase, order.id, scheduledDate, normalizedTimeSlot, order.order_number || order.id)
    if (existingCheck) return 'response' in existingCheck ? existingCheck.response : existingCheck.error

    const notes = [
      `Destination postal code: ${normalizedPostal}`,
      typeof specialInstructions === "string" && specialInstructions.trim()
        ? `Instructions: ${specialInstructions.trim()}`
        : null,
    ]
      .filter(Boolean)
      .join(" | ")

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

    return apiSuccess(toDeliveryDto(insertedRows as DeliveryRow, order.order_number || order.id))
  } catch (error) {
    console.error("[deliveries POST] failed:", error)
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
