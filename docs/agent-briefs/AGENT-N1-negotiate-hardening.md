# AGENT-N1: Price Negotiation Endpoint Hardening

**Urgency:** CRITICAL (financial + LLM boundary)  
**Complexity:** High  
**Estimated Time:** 60–90 min  
**Branch:** `agent-a-launch-hardening`

## Objective
Harden `/api/negotiate/route.ts` to prevent client-supplied vehicle price manipulation and constrain unbounded AI/LLM outputs that could commit pricing decisions.

## Current State
- ❌ **No authentication** – anyone can call negotiate endpoint
- ❌ **Client-supplied vehicle price** – used for min acceptable price calculation (attackers can lower listed price on wire to lower min acceptable)
- ❌ **Unconstrained AI outputs** – LLM can output counterOffers outside bounds or violate schema
- ❌ **No audit trail** – no log of who negotiated what offer
- ❌ **No rate limiting** – spam/bot risk on LLM endpoint (expensive)
- ❌ **No idempotency** – duplicate requests trigger duplicate LLM calls

## Critical Findings
See `/app/api/negotiate/route.ts` lines 1–85:
- `vehiclePrice` extracted from `req.body` directly
- No Supabase authentication check
- No DB lookup to verify vehicle exists or fetch authoritative listing_price_cents
- LLM `counterOffer` schema allows any number; no min/max bounds enforcement

## Solution Path

### Step 1: Add Authentication + Rate Limiting
```typescript
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/redis"

// At start of POST handler:
const supabase = await createClient()
const { data: { user }, error: authError } = await supabase.auth.getUser()
if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

// Rate limit: 5 negotiations per hour per user + IP
const clientIp = req.headers.get("x-forwarded-for") || "unknown"
const rateLimitResult = await rateLimit(`negotiate:${user.id}:${clientIp}`, 5, 3600)
if (!rateLimitResult.success) return NextResponse.json({ error: "Rate limited" }, { status: 429 })
```

### Step 2: Load Vehicle from DB, Replace Client-Supplied Price
```typescript
// Validate vehicleId provided
if (!vehicleId) return NextResponse.json({ error: "Vehicle ID required" }, { status: 400 })

// Load AUTHORITATIVE vehicle data from DB
const { data: vehicle, error: vehicleError } = await supabase
  .from("vehicles")
  .select("id, listing_price_cents, year, make, model, status, days_listed")
  .eq("id", vehicleId)
  .single()

if (vehicleError || !vehicle) return NextResponse.json({ error: "Vehicle not found" }, { status: 404 })

// Ensure vehicle is active
if (vehicle.status !== "active" && vehicle.status !== "available") 
  return NextResponse.json({ error: "Not available for sale" }, { status: 400 })

// Use DB price, never client-supplied
const dbVehiclePrice = vehicle.listing_price_cents / 100
```

### Step 3: Validate Customer Offer
```typescript
if (!Number.isFinite(customerOffer) || customerOffer <= 0) 
  return NextResponse.json({ error: "Offer must be positive" }, { status: 400 })

// Sanity bound: offer can't exceed vehicle list price by 50% or be negative
if (customerOffer > dbVehiclePrice * 1.5 || customerOffer < 100)
  return NextResponse.json({ error: "Offer out of bounds" }, { status: 400 })
```

### Step 4: Add Idempotency Check
```typescript
const idempotencyKey = body.idempotencyKey
if (idempotencyKey) {
  const { data: cached } = await supabase
    .from("request_cache")
    .select("response")
    .eq("key", `negotiate-${idempotencyKey}`)
    .eq("user_id", user.id)
    .single()
  if (cached?.response) return NextResponse.json(JSON.parse(cached.response))
}
```

### Step 5: Replace AI Schema Constraints
**Before:** Unbounded `z.number()` for counterOffer
**After:** Bounded zone with explicit min/max based on dbVehiclePrice:

```typescript
const maxCounterOffer = Math.round(dbVehiclePrice * 1.05)  // Never > list price + 5%
const minCounterOffer = Math.round(customerOffer * 0.95)   // Never < customer's offer - 5%

// In schema:
counterOffer: z.number()
  .nullable()
  .refine(
    (val) => val === null || (val >= minCounterOffer && val <= maxCounterOffer),
    { message: `Counter offer must be null or $${minCounterOffer}–$${maxCounterOffer}` }
  )
```

### Step 6: Add Audit Trail (Fire-and-Forget)
```typescript
// After successful LLM response, log negotiation
;(async () => {
  try {
    await supabase.from("negotiation_audits").insert({
      user_id: user.id,
      vehicle_id: vehicleId,
      listing_price: dbVehiclePrice,
      customer_offer: customerOffer,
      ai_response: result.value?.response,  // LLM output
      ai_counter: result.value?.counterOffer,
      ai_status: result.value?.status,
      client_ip: clientIp,
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.warn("[audit] Failed to log negotiation", err)
  }
})()
```

### Step 7: Cache Response for Idempotency
```typescript
const responseBody = result.toUIMessageStreamResponse()
if (idempotencyKey) {
  ;(async () => {
    try {
      await supabase.from("request_cache").insert({
        key: `negotiate-${idempotencyKey}`,
        user_id: user.id,
        response: JSON.stringify(await responseBody.json()),
        ttl_minutes: 5,
        created_at: new Date().toISOString(),
      })
    } catch {
      // Fire-and-forget
    }
  })()
}
return responseBody
```

## Validation Checklist
- [ ] `pnpm lint` passes (no ESLint errors)
- [ ] `pnpm exec tsc --noEmit` passes (no TypeScript errors)
- [ ] `pnpm build` completes successfully (full Next.js build)
- [ ] No regressions in existing tests or functionality
- [ ] Unauthenticated requests return 401
- [ ] Rate-limited requests return 429
- [ ] Non-existent vehicle returns 404
- [ ] Out-of-bound offers return 400
- [ ] LLM counter offer respects min/max bounds
- [ ] Audit table records all negotiations

## Deliverable
Commit message:
```
fix(negotiate): add authentication, db-backed pricing, ai output bounds, rate limiting + audit trail
```

---

**NOTES:**
- Do NOT deploy without testing rate limits against real LLM latency (streaming adds delay).
- Audit table must exist: `CREATE TABLE negotiation_audits (...)` with user_id, vehicle_id, pricing fields, ai_response, client_ip, created_at.
- Update frontend to send `Idempotency-Key` header and `idempotencyKey` in request body for replay protection.
