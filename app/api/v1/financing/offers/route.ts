import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/v1/financing/offers - Get offers from multiple lenders
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const prequalificationId = searchParams.get("prequalificationId")
  const applicationId = searchParams.get("applicationId")

  if (!prequalificationId && !applicationId) {
    return NextResponse.json(
      { error: "Prequalification ID or Application ID required" },
      { status: 400 }
    )
  }

  const id = applicationId || prequalificationId

  const { data: application, error } = await supabase
    .from("finance_applications_v2")
    .select("id, application_number, status")
    .eq("user_id", user.id)
    .or(`id.eq.${id},application_number.eq.${id}`)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: "Failed to fetch financing application" }, { status: 500 })
  }

  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 })
  }

  const offers: Array<Record<string, unknown>> = []

  return NextResponse.json({
    success: true,
    data: {
      applicationId: application.id,
      applicationNumber: application.application_number,
      applicationStatus: application.status,
      offers,
      summary: {
        totalOffers: 0,
        bestRate: null,
        lowestPayment: null,
        recommendedOfferId: null,
      },
      message: "No lender offers available yet. Your application is still being reviewed.",
    },
  })
}
