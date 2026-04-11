import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

function toStatusLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

function parseMaybeDate(value: unknown): string | null {
  if (!value) return null
  const date = new Date(String(value))
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// GET /api/v1/returns/:id - Get return status
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  const { data: returnRow, error: returnError } = await supabase
    .from("returns")
    .select("*")
    .eq("id", id)
    .maybeSingle()

  if (returnError) {
    return NextResponse.json({ error: "Failed to fetch return" }, { status: 500 })
  }

  if (!returnRow) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 })
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, order_number, customer_id, vehicle_id")
    .eq("id", returnRow.order_id)
    .maybeSingle()

  if (orderError) {
    return NextResponse.json({ error: "Failed to fetch return" }, { status: 500 })
  }

  if (!order || order.customer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  let vehicle: Record<string, unknown> | null = null
  if (order.vehicle_id) {
    const { data: vehicleRow } = await supabase
      .from("vehicles")
      .select("year, make, model, vin")
      .eq("id", order.vehicle_id)
      .maybeSingle()
    vehicle = vehicleRow || null
  }

  const status = String(returnRow.status || "requested")
  const requestedAt = parseMaybeDate(returnRow.requested_at || returnRow.created_at)
  const approvedAt = parseMaybeDate(returnRow.approved_at)
  const pickupScheduledDate = parseMaybeDate(returnRow.pickup_scheduled_date)
  const completedAt = parseMaybeDate(returnRow.completed_at)
  const refundProcessedAt = parseMaybeDate(returnRow.refund_processed_at)

  const timeline = [
    {
      step: "Return requested",
      status: requestedAt ? "completed" : "upcoming",
      timestamp: requestedAt,
    },
    {
      step: "Return approved",
      status: approvedAt ? "completed" : status === "requested" ? "pending" : "upcoming",
      timestamp: approvedAt,
    },
    {
      step: "Pickup scheduled",
      status: pickupScheduledDate ? "completed" : status === "pickup_scheduled" ? "pending" : "upcoming",
      timestamp: pickupScheduledDate,
    },
    {
      step: "Vehicle inspection",
      status: completedAt ? "completed" : ["vehicle_received", "inspected"].includes(status) ? "pending" : "upcoming",
      timestamp: completedAt,
    },
    {
      step: "Refund processed",
      status: refundProcessedAt || status === "refunded" ? "completed" : "upcoming",
      timestamp: refundProcessedAt,
    },
  ]

  return NextResponse.json({
    return: {
      id: returnRow.id,
      orderId: order.order_number || order.id,
      status,
      statusLabel: toStatusLabel(status),
      vehicle,
      reason: returnRow.reason,
      pickup: {
        scheduledDate: pickupScheduledDate,
      },
      refund: {
        amount: returnRow.refund_amount ?? null,
        status: status === "refunded" ? "processed" : "pending",
        method: returnRow.refund_method || "Original payment method",
        estimatedDate: parseMaybeDate(returnRow.return_deadline),
      },
      timeline,
      createdAt: returnRow.created_at,
      updatedAt: returnRow.updated_at,
    },
  })
}

// POST /api/v1/returns/:id/schedule-pickup - Schedule vehicle pickup
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params
  const body = await request.json()
  const date = typeof body?.date === "string" ? body.date.trim() : ""
  const timeSlot = typeof body?.timeSlot === "string" ? body.timeSlot.trim() : ""
  const address = body?.address
  const contactPhone = typeof body?.contactPhone === "string" ? body.contactPhone.trim() : ""

  if (!date || !timeSlot || !address) {
    return NextResponse.json({ error: "Date, time slot, and address are required" }, { status: 400 })
  }

  const { data: returnRow, error: returnError } = await supabase
    .from("returns")
    .select("id, order_id, status")
    .eq("id", id)
    .maybeSingle()

  if (returnError) {
    return NextResponse.json({ error: "Failed to schedule pickup" }, { status: 500 })
  }

  if (!returnRow) {
    return NextResponse.json({ error: "Return not found" }, { status: 404 })
  }

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, customer_id")
    .eq("id", returnRow.order_id)
    .maybeSingle()

  if (orderError) {
    return NextResponse.json({ error: "Failed to schedule pickup" }, { status: 500 })
  }

  if (!order || order.customer_id !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const notePayload = [
    `Pickup scheduled for ${date} (${timeSlot})`,
    contactPhone ? `Contact: ${contactPhone}` : null,
    `Address: ${JSON.stringify(address)}`,
  ]
    .filter(Boolean)
    .join(" | ")

  const primaryUpdate = await supabase
    .from("returns")
    .update({
      status: "pickup_scheduled",
      pickup_scheduled_date: date,
      reason_details: notePayload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("order_id", order.id)
    .select("id, pickup_scheduled_date, status")
    .single()

  const updated = primaryUpdate.error
    ? await supabase
        .from("returns")
        .update({
          status: "pickup_scheduled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .eq("order_id", order.id)
        .select("id, status")
        .single()
    : primaryUpdate

  if (updated.error || !updated.data) {
    return NextResponse.json({ error: "Failed to schedule pickup" }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    pickup: {
      returnId: updated.data.id,
      scheduledDate: (updated.data as { pickup_scheduled_date?: string }).pickup_scheduled_date || date,
      timeSlot,
      address,
      contactPhone,
      status: String(updated.data.status || "pickup_scheduled"),
    },
  })
}
