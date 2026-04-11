import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const orderId = searchParams.get("orderId")
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  if (!orderId) {
    return NextResponse.json(
      { error: "Order ID is required" },
      { status: 400 }
    )
  }

  const { data: order, error } = await supabase
    .from("orders")
    .select("id, order_number, status, delivery_type, preferred_date, preferred_time_slot")
    .eq("customer_id", user.id)
    .or(`id.eq.${orderId},order_number.eq.${orderId}`)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Unable to fetch delivery status" }, { status: 500 })
  }

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 })
  }

  if (order.delivery_type !== "delivery") {
    return NextResponse.json({
      error: "This order is not scheduled for home delivery",
    })
  }

  return NextResponse.json({
    success: true,
    data: {
      orderId: order.order_number || order.id,
      status: order.status,
      estimatedArrival: order.preferred_date || null,
      scheduledWindow: order.preferred_time_slot || null,
    },
  })
}
