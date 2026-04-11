import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/redis"

// GET /api/v1/financing/offers - Get offers from multiple lenders
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  const limiter = await rateLimit(`finance-offers:${user.id}:${ip}`, 10, 3600)

  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many offer retrieval requests. Please try again later.' }, { status: 429 })
  }

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

  ;(async () => {
    try {
      await supabase.from('offer_access_audits').insert({
        user_id: user.id,
        application_id: application.id,
        action: 'offers_retrieved',
        offer_count: offers.length,
        client_ip: ip,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Do not block read flow if optional audit table is absent.
    }
  })()

  return NextResponse.json({
    success: true,
    data: {
      applicationId: application.id,
      applicationNumber: application.application_number,
      applicationStatus: application.status,
      offers,
      source: 'pending_lender_integration',
      sourceType: 'interim_stub',
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
