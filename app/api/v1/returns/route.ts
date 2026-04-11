import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { createClient } from "@/lib/supabase/server"

function isUuid(value: string): boolean {
  return /^[0-9a-fA-F-]{36}$/.test(value)
}

function toDateOnly(input: Date): string {
  return input.toISOString().split("T")[0]
}

// POST /api/v1/returns - Initiate 10-day return
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Idempotency: check for request replay or duplicate submission
    const idempotencyKey = request.headers.get("Idempotency-Key")
    if (idempotencyKey) {
      const { data: existingIdempotent } = await supabase
        .from("request_cache")
        .select("response")
        .eq("key", `returns-${idempotencyKey}`)
        .eq("user_id", user.id)
        .single()

      if (existingIdempotent?.response) {
        try {
          return NextResponse.json(JSON.parse(existingIdempotent.response))
        } catch {
          // Cached response malformed; continue with new processing
        }
      }
    }

    const body = await request.json()
    const orderIdRaw = String(body?.orderId || "").trim()
    const reason = typeof body?.reason === "string" ? body.reason.trim() : ""
    const additionalComments = typeof body?.additionalComments === "string" ? body.additionalComments.trim() : ""
    const preferredPickupDate = typeof body?.preferredPickupDate === "string" ? body.preferredPickupDate.trim() : ""

    if (!orderIdRaw || !reason) {
      return NextResponse.json({ error: "Order ID and reason are required" }, { status: 400 })
    }

    let orderQuery = supabase
      .from("orders")
      .select("id, order_number, customer_id, created_at, total_price_cents")
      .eq("customer_id", user.id)
      .limit(1)

    orderQuery = isUuid(orderIdRaw)
      ? orderQuery.eq("id", orderIdRaw)
      : orderQuery.eq("order_number", orderIdRaw)

    const { data: orderRows, error: orderError } = await orderQuery
    if (orderError) {
      return NextResponse.json({ error: "Failed to validate order" }, { status: 500 })
    }

    const order = orderRows?.[0]
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    const { data: deliveryRows } = await supabase
      .from("deliveries")
      .select("delivered_at, scheduled_date")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false })
      .limit(1)

    const latestDelivery = deliveryRows?.[0]
    const effectiveDeliveryDate = latestDelivery?.delivered_at
      ? new Date(latestDelivery.delivered_at)
      : latestDelivery?.scheduled_date
        ? new Date(`${latestDelivery.scheduled_date}T00:00:00.000Z`)
        : new Date(order.created_at)

    const now = new Date()
    const daysSinceDelivery = Math.floor((now.getTime() - effectiveDeliveryDate.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceDelivery > 10) {
      return NextResponse.json(
        { error: "Return window has expired. Returns must be initiated within 10 days of delivery." },
        { status: 400 }
      )
    }

    const { data: existingReturns, error: existingError } = await supabase
      .from("returns")
      .select("id, status, created_at, order_id")
      .eq("order_id", order.id)
      .in("status", ["requested", "approved", "pickup_scheduled", "vehicle_received", "inspected"])
      .order("created_at", { ascending: false })
      .limit(1)

    if (existingError) {
      return NextResponse.json({ error: "Failed to verify existing return requests" }, { status: 500 })
    }

    const activeReturn = existingReturns?.[0]
    if (activeReturn) {
      return NextResponse.json(
        {
          error: "An active return request already exists for this order",
          returnId: activeReturn.id,
          status: activeReturn.status,
        },
        { status: 409 }
      )
    }

    const returnDeadline = new Date(effectiveDeliveryDate)
    returnDeadline.setUTCDate(returnDeadline.getUTCDate() + 10)

    const noteParts = [
      additionalComments || null,
      preferredPickupDate ? `Preferred pickup date: ${preferredPickupDate}` : null,
    ].filter(Boolean)
    const reasonDetails = noteParts.length > 0 ? noteParts.join(" | ") : null

    const primaryInsertPayload = {
      order_id: order.id,
      reason,
      reason_details: reasonDetails,
      status: "requested",
      delivery_date: toDateOnly(effectiveDeliveryDate),
      return_deadline: toDateOnly(returnDeadline),
      mileage_at_delivery: 0,
    }

    let insertedReturn: Record<string, unknown> | null = null

    const primaryInsert = await supabase
      .from("returns")
      .insert(primaryInsertPayload)
      .select("*")
      .single()

    if (!primaryInsert.error && primaryInsert.data) {
      insertedReturn = primaryInsert.data
    } else {
      const fallbackInsertPayload = {
        order_id: order.id,
        customer_id: user.id,
        return_number: `RET-${randomUUID()}`,
        reason,
        reason_details: reasonDetails,
        purchase_date: toDateOnly(effectiveDeliveryDate),
        return_deadline: toDateOnly(returnDeadline),
        mileage_at_purchase: 0,
        status: "requested",
      }

      const fallbackInsert = await supabase
        .from("returns")
        .insert(fallbackInsertPayload)
        .select("*")
        .single()

      if (fallbackInsert.error || !fallbackInsert.data) {
        return NextResponse.json({ error: "Failed to initiate return" }, { status: 500 })
      }

      insertedReturn = fallbackInsert.data
    }

    if (!insertedReturn) {
      return NextResponse.json({ error: "Failed to initiate return" }, { status: 500 })
    }

    const responseReturnId = String(insertedReturn.id || "")
    const responseStatus = String(insertedReturn.status || "requested")

    const responseBody = {
      success: true,
      return: {
        id: responseReturnId,
        orderId: order.order_number || order.id,
        status: responseStatus,
        statusLabel: responseStatus.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
        reason,
        daysSinceDelivery,
        daysRemaining: Math.max(0, 10 - daysSinceDelivery),
        returnDeadline: toDateOnly(returnDeadline),
        refund: {
          estimatedAmount: Math.round((Number(order.total_price_cents || 0) / 100) * 100) / 100,
          processingTime: "5-7 business days",
          method: "Original payment method",
        },
        createdAt: insertedReturn.created_at || new Date().toISOString(),
      },
    }

    // Cache response for idempotency (fire-and-forget)
    if (idempotencyKey) {
      ;(async () => {
        try {
          await supabase
            .from("request_cache")
            .insert({
              key: `returns-${idempotencyKey}`,
              user_id: user.id,
              response: JSON.stringify(responseBody),
              ttl_minutes: 10,
              created_at: new Date().toISOString(),
            })
        } catch {
          // Cache write failure; safe to ignore for this response
        }
      })()
    }

    return NextResponse.json(responseBody)
  } catch (_error) {
    return NextResponse.json({ error: "Failed to initiate return" }, { status: 500 })
  }
}
