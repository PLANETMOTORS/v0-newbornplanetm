import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

const RETURN_WINDOW_DAYS = 10
const MAX_RETURN_KM = 750

// POST /api/v1/returns - Initiate a return for an eligible order
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { orderId, reason, additionalComments, preferredPickupDate } = body

    if (!orderId || !reason) {
      return NextResponse.json(
        { error: "Order ID and reason are required" },
        { status: 400 }
      )
    }

    // Fetch the real order and verify ownership.
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, order_number, customer_id, status, total_price_cents, created_at")
      .eq("id", orderId)
      .eq("customer_id", user.id)
      .maybeSingle()

    if (orderError) {
      console.error("[returns] DB error fetching order:", orderError)
      return NextResponse.json({ error: "Failed to look up order" }, { status: 500 })
    }

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      )
    }

    // Only delivered orders are eligible for return.
    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Only delivered orders are eligible for return" },
        { status: 400 }
      )
    }

    // Check the real return window based on order creation date.
    const orderDate = new Date(order.created_at)
    const daysSincePurchase = Math.floor(
      (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
    )

    if (daysSincePurchase > RETURN_WINDOW_DAYS) {
      return NextResponse.json(
        {
          error: `Return window has expired. Returns must be initiated within ${RETURN_WINDOW_DAYS} days of delivery.`,
        },
        { status: 400 }
      )
    }

    const daysRemaining = RETURN_WINDOW_DAYS - daysSincePurchase
    const estimatedRefundDollars =
      Math.round((Number(order.total_price_cents || 0) / 100) * 100) / 100
    const now = new Date().toISOString()

    const returnRecord = {
      orderId: order.id,
      orderNumber: order.order_number,
      reason,
      additionalComments: additionalComments || null,
      status: "pending",
      statusLabel: "Return Requested",
      daysSincePurchase,
      daysRemaining,
      eligibleForReturn: true,
      returnPolicy: {
        maxDays: RETURN_WINDOW_DAYS,
        maxKilometers: MAX_RETURN_KM,
        conditions: [
          "Vehicle must be in same condition as delivered",
          "No modifications or aftermarket additions",
          "All original documentation must be returned",
          `Maximum ${MAX_RETURN_KM} km driven since delivery`,
        ],
      },
      refund: {
        estimatedAmount: estimatedRefundDollars,
        processingTime: "5-7 business days",
        method: "Original payment method",
      },
      pickup: {
        preferredDate: preferredPickupDate || null,
        status: "pending_schedule",
        address: null,
      },
      timeline: [
        {
          step: "Return requested",
          status: "completed",
          timestamp: now,
        },
        {
          step: "Review & approval",
          status: "pending",
          estimatedTime: "1-2 business days",
        },
        {
          step: "Pickup scheduled",
          status: "upcoming",
        },
        {
          step: "Vehicle inspection",
          status: "upcoming",
        },
        {
          step: "Refund processed",
          status: "upcoming",
        },
      ],
      createdAt: now,
    }

    // Persist the return record when the table exists.
    // The table is created by scripts/006_create_returns_schema.sql.
    const { data: insertedReturn, error: insertError } = await supabase
      .from("returns")
      .insert({
        order_id: order.id,
        customer_id: user.id,
        reason,
        additional_comments: additionalComments || null,
        preferred_pickup_date: preferredPickupDate || null,
        status: "pending",
        estimated_refund_cents: order.total_price_cents,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .maybeSingle()

    if (insertError) {
      // Distinguish between "table not yet migrated" (42P01) and other DB errors.
      // 42P01 = undefined_table; allow phased rollout without breaking the UI.
      // Any other DB error is a real failure and should be surfaced to the caller.
      if (insertError.code !== '42P01') {
        console.error("[returns] Failed to persist return record:", insertError)
        return NextResponse.json(
          { error: "Failed to create return record. Please try again." },
          { status: 500 }
        )
      }
      console.warn(
        "[returns] 'returns' table not found (42P01). Run scripts/006_create_returns_schema.sql to enable persistence."
      )
    }

    return NextResponse.json({
      success: true,
      persisted: !insertError,
      return: {
        id: insertedReturn?.id ?? `ret_${Date.now()}`,
        ...returnRecord,
      },
    })
  } catch (error) {
    console.error("[returns] Unexpected error:", error)
    return NextResponse.json(
      { error: "Failed to initiate return" },
      { status: 500 }
    )
  }
}
