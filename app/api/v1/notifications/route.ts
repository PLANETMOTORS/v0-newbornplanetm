import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/notifications - Get user notifications
export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: rows, error } = await supabase
      .from("notifications")
      .select("id, type, title, message, vehicle_id, order_id, read, action_url, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
    }

    const notifications = (rows ?? []).map((n) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      message: n.message,
      vehicleId: n.vehicle_id,
      orderId: n.order_id,
      read: n.read,
      actionUrl: n.action_url,
      createdAt: n.created_at,
    }))

    return NextResponse.json({
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
    })
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

// PATCH /api/v1/notifications - Mark notification(s) as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { ids, markAllRead } = body

    if (markAllRead) {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", user.id)
        .eq("read", false)
      if (error) {
        return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "ids array is required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", user.id)
      .in("id", ids)

    if (error) {
      return NextResponse.json({ error: "Failed to mark notifications read" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 })
  }
}

// POST /api/v1/notifications - Update notification preferences
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { preferences } = body

    const { error } = await supabase
      .from("profiles")
      .upsert({
        id: user.id,
        notification_preferences: preferences ?? { email: true, sms: false, push: true },
        updated_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}

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
