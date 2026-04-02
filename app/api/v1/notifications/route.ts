import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

  // TODO: fetch real notifications from DB for user.id
  const notifications = [
    {
      id: "notif_001",
      type: "price_drop",
      title: "Price Drop Alert",
      message: "The 2023 Tesla Model Y you saved just dropped by $2,000!",
      vehicleId: "veh_tesla_001",
      read: false,
      actionUrl: "/vehicles/veh_tesla_001",
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: "notif_002",
      type: "order_update",
      title: "Delivery Update",
      message: "Your vehicle is on its way! Expected arrival: Today 2-4 PM",
      orderId: "ord_001",
      read: false,
      actionUrl: "/account/orders/ord_001",
      createdAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
      id: "notif_003",
      type: "financing",
      title: "Financing Pre-Approval",
      message: "Great news! You're pre-approved for up to $55,000",
      read: true,
      actionUrl: "/financing",
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
  ]

  return NextResponse.json({ 
    notifications,
    unreadCount: notifications.filter(n => !n.read).length 
  })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// POST /api/v1/notifications - Create notification subscription
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { type, vehicleId, email, phone, preferences } = body

    const subscription = {
      id: "sub_" + Date.now(),
      type,
      vehicleId,
      email,
      phone,
      preferences: preferences || { email: true, sms: false, push: true },
      active: true,
      createdAt: new Date().toISOString(),
    }

    return NextResponse.json({ success: true, subscription })
  } catch (error) {
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 })
  }
}
