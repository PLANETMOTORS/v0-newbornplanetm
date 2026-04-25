import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { logger } from "@/lib/logger"

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
    logger.error("[v1/notifications GET]", error)
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
    logger.error("[v1/notifications PATCH]", error)
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
    logger.error("[v1/notifications subscription]", error)
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 })
  }
}
