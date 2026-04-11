import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { recordAdminAuditEvent, requireAdminUser } from "@/lib/auth/admin"

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending: ["quoted", "cancelled", "expired"],
  quoted: ["accepted", "expired", "cancelled"],
  accepted: ["completed", "cancelled"],
  completed: [],
  expired: [],
  cancelled: [],
}

// PATCH /api/v1/admin/trade-ins/[id]/status - Update trade-in quote status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const adminCheck = await requireAdminUser(supabase)
    if (!adminCheck.ok) {
      return adminCheck.response
    }
    const { user } = adminCheck

    const body = await request.json()
    const { status } = body
    
    const validStatuses = ["pending", "quoted", "accepted", "completed", "expired", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }
    
    const { data: currentQuote, error: currentQuoteError } = await supabase
      .from("trade_in_quotes")
      .select("id, status")
      .eq("id", id)
      .single()

    if (currentQuoteError || !currentQuote) {
      return NextResponse.json(
        { error: "Trade-in quote not found" },
        { status: 404 }
      )
    }

    const currentStatus = String(currentQuote.status || "")
    const allowedNextStatuses = ALLOWED_TRANSITIONS[currentStatus] || []
    if (!allowedNextStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid transition from ${currentStatus} to ${status}` },
        { status: 409 }
      )
    }

    const updateData: Record<string, unknown> = {
      status,
      updated_at: new Date().toISOString()
    }
    
    if (status === "completed") {
      updateData.completed_at = new Date().toISOString()
    }
    
    const { data: quote, error } = await supabase
      .from("trade_in_quotes")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()
    
    if (error) {
      console.error("Error updating trade-in status:", error)
      return NextResponse.json(
        { error: "Failed to update status" },
        { status: 500 }
      )
    }

    await recordAdminAuditEvent({
      actorId: user.id,
      action: "tradein.quote.status.update",
      entityType: "trade_in_quote",
      entityId: id,
      beforeState: currentStatus,
      afterState: status,
    })
    
    return NextResponse.json({
      success: true,
      data: quote
    })
    
  } catch (error) {
    console.error("Trade-in status update error:", error)
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    )
  }
}
