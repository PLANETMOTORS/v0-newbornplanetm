import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// PATCH /api/v1/admin/trade-ins/[id]/status - Update trade-in quote status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    
    const body = await request.json()
    const { status } = body
    
    const validStatuses = ["pending", "quoted", "accepted", "completed", "expired", "cancelled"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      )
    }
    
    const updateData: Record<string, any> = {
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
