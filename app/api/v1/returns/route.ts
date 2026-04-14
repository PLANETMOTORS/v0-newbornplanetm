import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/v1/returns - Initiate 10-day return
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

    // Check if within 10-day return window and validate eligibility
    const orderDate = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // Mock: 5 days ago
    const daysSincePurchase = Math.floor((Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSincePurchase > 10) {
      return NextResponse.json(
        { error: "Return window has expired. Returns must be initiated within 10 days of delivery." },
        { status: 400 }
      )
    }

    const returnRequest = {
      id: "ret_" + Date.now(),
      orderId,
      reason,
      additionalComments,
      status: "pending",
      statusLabel: "Return Requested",
      daysSincePurchase,
      daysRemaining: 10 - daysSincePurchase,
      eligibleForReturn: true,
      returnPolicy: {
        maxDays: 10,
        maxKilometers: 750,
        conditions: [
          "Vehicle must be in same condition as delivered",
          "No modifications or aftermarket additions",
          "All original documentation must be returned",
          "Maximum 750 km driven since delivery",
        ]
      },
      refund: {
        estimatedAmount: 45995, // Fetched from order
        processingTime: "5-7 business days",
        method: "Original payment method",
      },
      pickup: {
        preferredDate: preferredPickupDate,
        status: "pending_schedule",
        address: null, // Will be confirmed
      },
      timeline: [
        {
          step: "Return requested",
          status: "completed",
          timestamp: new Date().toISOString(),
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
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, return: returnRequest })
  } catch (_error) {
    return NextResponse.json(
      { error: "Failed to initiate return" },
      { status: 500 }
    )
  }
}
