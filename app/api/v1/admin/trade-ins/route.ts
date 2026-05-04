import { NextRequest, NextResponse } from "next/server"
import { requireAdmin } from "@/lib/security/admin-route-helpers"
import { createAdminClient } from "@/lib/supabase/admin"

// GET /api/v1/admin/trade-ins - Get all trade-in quotes for admin
export async function GET(request: NextRequest) {
  try {
    const auth = await requireAdmin()
    if (!auth.ok) return auth.error

    const adminClient = createAdminClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const rawLimit = Number.parseInt(searchParams.get("limit") || "100")
    const limit = Math.min(Math.max(1, Number.isNaN(rawLimit) ? 100 : rawLimit), 500)
    const rawOffset = Number.parseInt(searchParams.get("offset") || "0")
    const offset = Math.max(0, Number.isNaN(rawOffset) ? 0 : rawOffset)

    let query = adminClient
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
