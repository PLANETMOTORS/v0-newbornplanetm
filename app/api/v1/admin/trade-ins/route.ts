import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/admin/trade-ins - Get all trade-in quotes for admin
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = parseInt(searchParams.get("limit") || "100")
    const offset = parseInt(searchParams.get("offset") || "0")
    
    let query = supabase
      .from("trade_in_quotes")
      .select("*")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)
    
    if (status && status !== "all") {
      query = query.eq("status", status)
    }
    
    const { data: quotes, error, count } = await query
    
    if (error) {
      console.error("Error fetching trade-in quotes:", error)
      return NextResponse.json(
        { error: "Failed to fetch quotes" },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: quotes,
      count,
      limit,
      offset
    })
    
  } catch (error) {
    console.error("Admin trade-ins error:", error)
    return NextResponse.json(
      { error: "Failed to fetch trade-in quotes" },
      { status: 500 }
    )
  }
}
