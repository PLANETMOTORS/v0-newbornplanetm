import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// POST /api/v1/financing/offers/:id/select - Select a lender offer
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id: offerId } = await params
  const body = await request.json()
  const { applicationId, customerId } = body

  if (customerId && customerId !== user.id) {
    return NextResponse.json({ error: "customerId must match authenticated user" }, { status: 403 })
  }

  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 })
  }

  const { data: application, error } = await supabase
    .from("finance_applications_v2")
    .select("id, application_number, status")
    .eq("user_id", user.id)
    .or(`id.eq.${applicationId},application_number.eq.${applicationId}`)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to validate application" }, { status: 500 })
  }

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  return NextResponse.json(
    {
      success: false,
      error: "Selected lender offer is not available yet",
      applicationId: application.id,
      applicationStatus: application.status,
      offerId,
    },
    { status: 409 }
  )
}
