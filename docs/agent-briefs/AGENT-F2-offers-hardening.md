# AGENT-F2: Finance Offers & Selection Hardening

**Urgency:** MEDIUM (currently stub, low risk)  
**Complexity:** Medium  
**Estimated Time:** 45–60 min  
**Branch:** `agent-a-launch-hardening`

## Objective
Harden `/api/v1/financing/offers/route.ts` and `/api/v1/financing/offers/[id]/select/route.ts` to add authentication, rate limiting, audit trails, and constrain state transitions.

## Current State
- ⚠️ **Offers endpoint** returns empty stub `{ offers: [] }` (acceptable interim)
- ⚠️ **Select endpoint** not yet reviewed; likely missing auth + audit
- ❌ **No audit trail** – can't track who selected which financing offer
- ❌ **No state machine** – unknown constraints on offer selection transitions
- ❌ **Rate limiting** – missing; prevents DoS on lender webhooks/integration points

## Critical Findings
See `/app/api/v1/financing/offers/route.ts` lines 1–50:
- GET endpoint checks auth (good)
- Returns empty offers array (stub state; acceptable for now)
- No audit log of access or offer retrieval
- No rate limiting

See `/app/api/v1/financing/offers/[id]/select/route.ts`) – **need to inspect**

## Solution Path

### For `/api/v1/financing/offers/route.ts` (GET)

#### Step 1: Add Rate Limiting
```typescript
import { rateLimit } from "@/lib/redis"

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  // Rate limit: 10 offer retrievals per hour per user
  const clientIp = request.headers.get("x-forwarded-for") || "unknown"
  const rateLimitResult = await rateLimit(`finance-offers:${user.id}:${clientIp}`, 10, 3600)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
  }

  // ... existing logic ...
```

#### Step 2: Add Audit Trail
```typescript
  // After fetching application:
  ;(async () => {
    try {
      await supabase.from("offer_access_audits").insert({
        user_id: user.id,
        application_id: id,
        action: "offers_retrieved",
        offer_count: offers.length,
        client_ip: clientIp,
        retrieved_at: new Date().toISOString(),
      })
    } catch {
      // Fire-and-forget
    }
  })()

  return NextResponse.json({ /* existing response */ })
```

### For `/api/v1/financing/offers/[id]/select/route.ts` (POST)

#### Step 1: Add Authentication + Rate Limiting
```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/redis"

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const offerId = params.id

    // Rate limit: 5 offer selections per hour per user
    const clientIp = request.headers.get("x-forwarded-for") || "unknown"
    const rateLimitResult = await rateLimit(`finance-select:${user.id}:${clientIp}`, 5, 3600)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const body = await request.json()
    const { applicationId, idempotencyKey } = body

    if (!applicationId) return NextResponse.json({ error: "Application ID required" }, { status: 400 })
    if (!offerId) return NextResponse.json({ error: "Offer ID required" }, { status: 400 })
```

#### Step 2: Idempotency Check
```typescript
    // Idempotency: prevent duplicate selections
    if (idempotencyKey) {
      const { data: cached } = await supabase
        .from("request_cache")
        .select("response")
        .eq("key", `offer-select-${idempotencyKey}`)
        .eq("user_id", user.id)
        .single()
      if (cached?.response) return NextResponse.json(JSON.parse(cached.response))
    }
```

#### Step 3: Validate Application & Offer Ownership
```typescript
    // Fetch application
    const { data: application, error: appError } = await supabase
      .from("finance_applications_v2")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("id", applicationId)
      .single()

    if (appError || !application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Fetch offer (ensure it belongs to this application)
    const { data: offer, error: offerError } = await supabase
      .from("financing_offers")
      .select("id, application_id, lender_name, rate, term_months, status")
      .eq("id", offerId)
      .eq("application_id", applicationId)
      .single()

    if (offerError || !offer) {
      return NextResponse.json({ error: "Offer not found for this application" }, { status: 404 })
    }
```

#### Step 4: Constrained State Transitions
```typescript
    // Enforce state machine: application must be approvable, offer must be available
    const ALLOWED_APP_STATUSES = ["under_review", "approved", "pre_approved"]
    if (!ALLOWED_APP_STATUSES.includes(application.status)) {
      return NextResponse.json(
        { error: `Cannot select offer for application in status: ${application.status}` },
        { status: 400 }
      )
    }

    const ALLOWED_OFFER_STATUSES = ["available", "pending_selection"]
    if (!ALLOWED_OFFER_STATUSES.includes(offer.status)) {
      return NextResponse.json(
        { error: `Offer is not available (status: ${offer.status})` },
        { status: 400 }
      )
    }

    // Mark offer as selected
    const { error: updateError } = await supabase
      .from("financing_offers")
      .update({ status: "selected", selected_at: new Date().toISOString() })
      .eq("id", offerId)
      .eq("application_id", applicationId)

    if (updateError) {
      return NextResponse.json({ error: "Failed to select offer" }, { status: 500 })
    }

    // Optionally update application status
    await supabase
      .from("finance_applications_v2")
      .update({ status: "offer_selected", offer_id: offerId })
      .eq("id", applicationId)
      .catch(() => {
        // Non-critical; don't fail request
      })
```

#### Step 5: Audit Trail
```typescript
    const responseBody = {
      success: true,
      offerId,
      applicationId,
      selectedAt: new Date().toISOString(),
      message: `Offer selected. You will receive next steps via email.`,
    }

    // Audit (fire-and-forget)
    ;(async () => {
      try {
        await supabase.from("offer_selection_audits").insert({
          user_id: user.id,
          application_id: applicationId,
          offer_id: offerId,
          lender_name: offer.lender_name,
          rate: offer.rate,
          term_months: offer.term_months,
          action: "offer_selected",
          client_ip: clientIp,
          created_at: new Date().toISOString(),
        })
      } catch {
        console.warn("[audit] Failed to log offer selection")
      }
    })()

    // Cache for idempotency
    if (idempotencyKey) {
      ;(async () => {
        try {
          await supabase.from("request_cache").insert({
            key: `offer-select-${idempotencyKey}`,
            user_id: user.id,
            response: JSON.stringify(responseBody),
            ttl_minutes: 5,
            created_at: new Date().toISOString(),
          })
        } catch {
          // Fire-and-forget
        }
      })()
    }

    return NextResponse.json(responseBody)
```

## Validation Checklist
- [ ] `pnpm lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] GET /offers: rate-limited requests return 429
- [ ] POST /offers/[id]/select: requires auth; returns 401 if missing
- [ ] POST /offers/[id]/select: validates offer ownership
- [ ] POST /offers/[id]/select: enforces state machine (application + offer status)
- [ ] Idempotency-Key prevents duplicate selections
- [ ] Audit trails recorded for both GET and POST
- [ ] No regressions in existing finance app flows

## Deliverable
Commit message:
```
fix(finance-offers): add authentication, rate limiting, state machine, idempotency + audit trails
```

---

**NOTES:**
- Audit tables required: `offer_access_audits`, `offer_selection_audits` (create if missing).
- State machine assumes DB schema with `status` enum; adjust if schema differs.
- Offer selection is a critical state change; audit trail is mandatory.
