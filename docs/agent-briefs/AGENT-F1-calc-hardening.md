# AGENT-F1: Finance Calculator Hardening

**Urgency:** HIGH (pricing calculations + customer-facing)  
**Complexity:** Medium  
**Estimated Time:** 45–60 min  
**Branch:** `agent-a-launch-hardening`

## Objective
Harden `/api/v1/financing/calculator/route.ts` to add rate limiting, audit logging, idempotency, and explicit heuristic source labeling for all estimated payments.

## Current State
- ❌ **No authentication required** – anyone can call (low risk, but inconsistent)
- ❌ **No rate limiting** – expensive calc can be DOS'd
- ❌ **No audit trail** – can't track who ran calculations for support/compliance
- ❌ **No idempotency** – duplicate requests trigger duplicate calc (minor risk, but not repeatable for frontend)
- ❌ **Implicit heuristic** – response presents calculated payment as if deterministic; no source labeling
- ⚠️ **Partial input validation** – validates numbers but doesn't check province/term bounds carefully enough

## Critical Findings
See `/app/api/v1/financing/calculator/route.ts` lines 20–100:
- POST endpoint accepts any numeric input without auth
- Line 50+: Tax rates hardcoded; no validation that province exists in taxRates map
- Line ~90: No rate limiting on repeated calculations
- Response returns `monthlyPayment`, `totalCost` as apparent facts; no `source`, `confidence`, or disclaimer
- No logging of calculations; if customer disputes result, no audit trail

## Solution Path

### Step 1: Add Optional Authentication + Rate Limiting
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from "@/lib/supabase/server"
import { rateLimit } from "@/lib/redis"

export async function POST(request: NextRequest) {
  // Auth is optional (public calc is OK), but rate limit by IP
  const clientIp = request.headers.get("x-forwarded-for") || "unknown"
  
  // Get user if authenticated, else use IP for rate limiting
  let userId = clientIp
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) userId = user.id
  } catch {
    // Auth client unavailable; continue with IP-based limiting
  }

  // Rate limit: 20 calc requests per hour per IP/user
  const rateLimitResult = await rateLimit(`finance-calc:${userId}`, 20, 3600)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: "Rate limit exceeded. Max 20 calculations per hour." }, { status: 429 })
  }
```

### Step 2: Stricter Province Validation
```typescript
const ALLOWED_PROVINCES = new Set(["ON", "QC", "BC", "AB", "MB", "SK", "NS", "NB", "PE", "NL", "NT", "NU", "YT"])
const provinceInput = (province || "ON").toUpperCase()

if (!ALLOWED_PROVINCES.has(provinceInput)) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_PROVINCE', message: 'Invalid province code' } },
    { status: 400 }
  )
}

const tax = taxRates[provinceInput]
```

### Step 3: Heuristic Source Labeling
```typescript
// After calculating monthlyPayment and all totals:

const response = {
  success: true,
  data: {
    monthlyPayment: Math.round(monthlyPayment * 100) / 100,
    totalCost: Math.round(totalCost * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    
    // NEW: Explicit source + confidence
    source: "finance_calculator_heuristic",
    sourceType: "heuristic",
    confidence: "medium",
    disclaimer: "This is an estimate based on standard amortization. Actual payments may vary based on credit approval, final APR, and dealer incentives.",
    
    breakdown: { /* existing fields */ },
    calculatedAt: new Date().toISOString(),
  }
}
```

### Step 4: Add Idempotency Support
```typescript
const idempotencyKey = request.headers.get("Idempotency-Key")

// Check cache (optional)
if (idempotencyKey) {
  try {
    const redis = await getRedis()
    if (redis) {
      const cached = await redis.get(`calc-${idempotencyKey}`)
      if (cached) return NextResponse.json(JSON.parse(cached))
    }
  } catch {
    // Redis unavailable; continue with fresh calc
  }
}

// After success:
const response = { /* calculation result */ }

// Cache for 10 minutes (fire-and-forget)
if (idempotencyKey) {
  try {
    const redis = await getRedis()
    if (redis) {
      await redis.set(`calc-${idempotencyKey}`, JSON.stringify(response), { ex: 600 })
    }
  } catch {
    // Cache failure; safe to ignore
  }
}

return NextResponse.json(response)
```

### Step 5: Add Audit Trail (Optional, Fire-and-Forget)
```typescript
// After successful calc, attempt audit log (non-blocking)
;(async () => {
  try {
    // Try to get supabase client
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase.from("finance_calc_audits").insert({
      user_id: user?.id || null,
      client_ip: clientIp,
      vehicle_price: numericVehiclePrice,
      term_months: numericTermMonths,
      rate: numericInterestRate,
      province: provinceInput,
      monthly_payment_cents: Math.round(monthlyPayment * 100),
      created_at: new Date().toISOString(),
    }).catch(() => {
      // Silently fail
    })
  } catch {
    // Supabase unavailable; that's OK
  }
})()
```

### Step 6: Add Input Bounds Validation
```typescript
// Add these checks after basic number validation:

if (numericTradeInValue > numericVehiclePrice * 1.5) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_TRADE_IN', message: 'Trade-in value cannot exceed 150% of vehicle price' } },
    { status: 400 }
  )
}

if (numericDownPayment > numericVehiclePrice) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_DOWN_PAYMENT', message: 'Down payment cannot exceed vehicle price' } },
    { status: 400 }
  )
}

const totalCredits = numericTradeInValue + numericDownPayment
if (totalCredits > numericVehiclePrice * 1.2) {
  return NextResponse.json(
    { success: false, error: { code: 'INVALID_CREDITS', message: 'Total trade-in + down payment too high' } },
    { status: 400 }
  )
}
```

## Validation Checklist
- [ ] `pnpm lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] No auth required (public calc remains public)
- [ ] Rate-limited requests return 429
- [ ] Invalid province returns 400
- [ ] Response includes `source`, `sourceType`, `confidence`, `disclaimer`
- [ ] Idempotency-Key header triggers cache read/write
- [ ] Out-of-bounds inputs (trade-in > 150%, down > principal) return 400

## Deliverable
Commit message:
```
fix(finance-calc): add rate limiting, heuristic source labeling, input bounds validation, optional audit trail
```

---

**NOTES:**
- Consumer of calculator endpoint should display `disclaimer` prominently to users.
- Rate limit can be tuned: currently 20/hour; adjust based on load testing.
- Audit table (`finance_calc_audits`) must exist if fire-and-forget audit is desired.
- No breaking changes to response schema (new fields are additive).
