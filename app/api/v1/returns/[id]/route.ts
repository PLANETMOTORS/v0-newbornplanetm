import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { PHONE_TOLL_FREE } from "@/lib/constants/dealership"

// GET /api/v1/returns/:id - Get return status
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await params

  // TODO: Connect to real returns database table once available.
  // Until then, return a placeholder indicating no return record was found.
  return NextResponse.json(
    {
      error: "Return not found",
      message: `No return record exists for this ID. If you believe this is an error, please contact support at ${PHONE_TOLL_FREE}.`,
      _disclaimer: "Returns tracking is not yet available. Please contact our team directly for return status.",
    },
    { status: 404 }
  )
}

// POST /api/v1/returns/:id/schedule-pickup - Schedule vehicle pickup
export async function POST(
  _request: NextRequest,
  _context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // TODO: Connect to real pickup scheduling system once available.
  return NextResponse.json(
    {
      error: "Pickup scheduling unavailable",
      message: `Online pickup scheduling is not yet available. Please call us at ${PHONE_TOLL_FREE} to arrange a vehicle pickup.`,
      _disclaimer: "This feature is coming soon.",
    },
    { status: 503 }
  )
}
