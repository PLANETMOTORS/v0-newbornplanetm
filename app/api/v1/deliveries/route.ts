import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/v1/deliveries - Schedule delivery
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, vehicleId, destinationPostalCode, scheduledDate, timeSlot, specialInstructions, addressId } = body

    if (!orderId || !destinationPostalCode || !scheduledDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const quoteUrl = new URL(`/api/v1/deliveries/quote?postalCode=${encodeURIComponent(destinationPostalCode)}`, request.url)
    const quoteResponse = await fetch(quoteUrl, { cache: "no-store" })

    if (!quoteResponse.ok) {
      const quoteError = await quoteResponse.json().catch(() => ({ error: "Invalid postal code" }))
      return NextResponse.json(
        { error: quoteError?.error || "Unable to calculate delivery quote" },
        { status: 400 }
      )
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
      return NextResponse.json({ error: "Failed to schedule delivery" }, { status: 500 })
    }

    const order = orderRows?.[0]
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (vehicleId && order.vehicle_id && vehicleId !== order.vehicle_id) {
      return NextResponse.json({ error: "Vehicle does not match order" }, { status: 409 })
    }

    const { data: existingRows, error: existingError } = await supabase
      .from("deliveries")
      .select("id, status, scheduled_date, scheduled_time_slot, estimated_delivery_date, distance_km, delivery_fee, created_at")
      .eq("order_id", order.id)
      .in("status", ["pending", "scheduled", "preparing", "in_transit", "out_for_delivery"])
      .order("created_at", { ascending: false })
      .limit(1)

    if (existingError) {
      return NextResponse.json({ error: "Failed to schedule delivery" }, { status: 500 })
    }

    const existing = existingRows?.[0]
    if (existing) {
      const isSameSchedule =
        String(existing.scheduled_date || "") === String(scheduledDate) &&
        String(existing.scheduled_time_slot || "") === String(normalizedTimeSlot || "")

      if (isSameSchedule) {
        return NextResponse.json({
          success: true,
          idempotentReplay: true,
          delivery: {
            id: existing.id,
            orderId: order.order_number || order.id,
            status: existing.status,
            scheduledDate: existing.scheduled_date,
            timeSlot: existing.scheduled_time_slot,
            estimatedDeliveryDate: existing.estimated_delivery_date,
            distanceKm: existing.distance_km,
            cost: existing.delivery_fee,
            isFree: Number(existing.delivery_fee || 0) === 0,
            createdAt: existing.created_at,
          },
        })
      }

      return NextResponse.json(
        { error: "An active delivery already exists for this order" },
        { status: 409 }
      )
    }

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
      return NextResponse.json({ error: "Failed to schedule delivery" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      delivery: {
        id: insertedRows.id,
        orderId: order.order_number || order.id,
        status: insertedRows.status,
        scheduledDate: insertedRows.scheduled_date,
        timeSlot: insertedRows.scheduled_time_slot,
        estimatedDeliveryDate: insertedRows.estimated_delivery_date,
        distanceKm: insertedRows.distance_km,
        cost: insertedRows.delivery_fee,
        isFree: Number(insertedRows.delivery_fee || 0) === 0,
        createdAt: insertedRows.created_at,
      },
    })
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to schedule delivery" },
      { status: 500 }
    )
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

  return NextResponse.json({ availableSlots: slots })
}
