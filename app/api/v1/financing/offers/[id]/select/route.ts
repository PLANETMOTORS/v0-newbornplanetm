import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { cacheIdempotentResponse, getCachedIdempotentResponse, rateLimit } from "@/lib/redis"

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
  const idempotencyKey = request.headers.get('idempotency-key') || request.headers.get('x-idempotency-key')
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || 'unknown'
  const limiter = await rateLimit(`finance-offer-select:${user.id}:${ip}`, 5, 3600)

  if (!limiter.success) {
    return NextResponse.json({ error: 'Too many offer selection attempts. Please try again later.' }, { status: 429 })
  }

  if (customerId && customerId !== user.id) {
    return NextResponse.json({ error: "customerId must match authenticated user" }, { status: 403 })
  }

  if (!applicationId) {
    return NextResponse.json({ error: "applicationId is required" }, { status: 400 })
  }

  const replayCacheKey = idempotencyKey ? `finance-offer-select:${user.id}:${applicationId}:${offerId}:${idempotencyKey}` : null
  if (replayCacheKey) {
    const cached = await getCachedIdempotentResponse<Record<string, unknown>>(replayCacheKey)
    if (cached) {
      return NextResponse.json(
        {
          ...cached,
          idempotency: { key: idempotencyKey, replay: true },
        },
        { headers: { 'x-idempotent-replay': 'true' } }
      )
    }
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

  const allowedStatuses = new Set(["under_review", "approved", "pre_approved", "prequalified"])
  if (!allowedStatuses.has(String(application.status || ''))) {
    return NextResponse.json(
      { error: `Cannot select a lender offer while application is in status ${application.status}` },
      { status: 409 }
    )
  }

  const payload = {
    success: false,
    error: "Selected lender offer is not available yet",
    applicationId: application.id,
    applicationStatus: application.status,
    offerId,
    source: 'pending_lender_integration',
    sourceType: 'interim_stub',
  }

  if (replayCacheKey) {
    await cacheIdempotentResponse(replayCacheKey, payload, 300)
  }

  ;(async () => {
    try {
      await supabase.from('offer_selection_audits').insert({
        user_id: user.id,
        application_id: application.id,
        offer_id: offerId,
        action: 'selection_attempted_unavailable_offer',
        client_ip: ip,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Do not block while finance offer integration is still pending.
    }
  })()

  return NextResponse.json(
    payload,
    { status: 409 }
  )
}
