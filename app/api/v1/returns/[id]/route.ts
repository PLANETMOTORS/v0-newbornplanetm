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

  // Destructure params to satisfy Next.js dynamic route contract.
  await params

  // The returns table is intentionally not yet wired — this endpoint exists
  // so the front-end can ask for a return record by ID and get a stable 404
  // contract until the dedicated returns service ships. Tracked separately
  // in the product backlog rather than in code.
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

  // Not yet implemented — returns 501 so clients know it's unbuilt, not broken.
  return NextResponse.json(
    {
      error: "Not implemented",
      message: `Online pickup scheduling is not yet available. Please call us at ${PHONE_TOLL_FREE} to arrange a vehicle pickup.`,
    },
    { status: 501 }
  )
}
