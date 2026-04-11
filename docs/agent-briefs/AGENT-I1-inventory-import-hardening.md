# AGENT-I1: Inventory Import & Sync Hardening

**Urgency:** MEDIUM (operational risk, bulk data)  
**Complexity:** Medium-High  
**Estimated Time:** 60–90 min  
**Branch:** `agent-a-launch-hardening`

## Objective
Harden `/api/v1/inventory/import` and `/api/v1/inventory/homenet` (or equivalent) endpoints to add admin authentication, rate limiting, schema validation, idempotency, and audit trails for bulk inventory operations.

## Current State
- ❌ **Admin auth** – need to verify uses `requireAdminUser()` guard
- ❌ **Schema validation** – missing; could accept malformed vehicle data
- ❌ **Rate limiting** – missing; bulk imports could be DOS'd
- ❌ **Idempotency** – missing; duplicate imports create duplicate vehicles
- ❌ **Audit trail** – missing; can't track who imported what or when
- ❌ **Rollback safety** – unknown; partial imports could leave DB in inconsistent state

## Critical Findings
Need to **inspect** these files:
- `/app/api/v1/inventory/import/route.ts`
- `/app/api/v1/inventory/homenet/route.ts` (or similar vendor sync)

Typical risks:
- POST endpoint accepts array of vehicle objects
- No validation on required fields (year, make, model, price, VIN (if applicable))
- No check that prices are positive, realistic bounds
- Batch inserts without transaction safety
- No audit log of bulk operation
- No idempotency key support

## Solution Path

### Step 1: Add Admin Authentication + Rate Limiting
```typescript
import { NextRequest, NextResponse } from "next/server"
import { requireAdminUser } from "@/lib/auth/admin"
import { rateLimit } from "@/lib/redis"
import { createClient } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  // Require admin user
  const adminResult = await requireAdminUser(request)
  if (!adminResult.success) {
    return NextResponse.json({ error: adminResult.error }, { status: adminResult.statusCode })
  }
  
  const admin = adminResult.admin
  const clientIp = request.headers.get("x-forwarded-for") || "unknown"

  // Rate limit: 2 imports per hour per admin (bulk operations are expensive)
  const rateLimitResult = await rateLimit(`inventory-import:${admin.id}:${clientIp}`, 2, 3600)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: "Inventory import rate limited. Max 2 imports per hour." },
      { status: 429 }
    )
  }

  const body = await request.json()
  const { vehicles = [], idempotencyKey, source = "manual" } = body

  if (!Array.isArray(vehicles) || vehicles.length === 0) {
    return NextResponse.json({ error: "Vehicles array required and non-empty" }, { status: 400 })
  }

  if (vehicles.length > 500) {
    return NextResponse.json(
      { error: "Batch size too large. Max 500 vehicles per import." },
      { status: 400 }
    )
  }
```

### Step 2: Schema Validation for Each Vehicle
```typescript
  // Define required fields and validation rules
  const validateVehicle = (v: Record<string, unknown>, index: number): string | null => {
    if (typeof v.year !== "number" || v.year < 1990 || v.year > new Date().getFullYear() + 1) {
      return `[${index}] Invalid year`
    }
    if (typeof v.make !== "string" || !v.make.trim()) {
      return `[${index}] Missing make`
    }
    if (typeof v.model !== "string" || !v.model.trim()) {
      return `[${index}] Missing model`
    }
    if (typeof v.listingPriceCents !== "number" || v.listingPriceCents < 50000 || v.listingPriceCents > 10_000_000_00) {
      return `[${index}] Price must be between $500 and $1M`
    }
    if (v.mileageKm && (typeof v.mileageKm !== "number" || v.mileageKm < 0 || v.mileageKm > 2_000_000)) {
      return `[${index}] Invalid mileage`
    }
    if (v.vin && typeof v.vin === "string" && !/^[A-HJ-NPR-Z0-9]{17}$/.test(v.vin)) {
      return `[${index}] Invalid VIN format`
    }
    return null
  }

  // Validate all vehicles before importing
  const validationErrors = vehicles.reduce((acc, v, idx) => {
    const err = validateVehicle(v, idx)
    if (err) acc.push(err)
    return acc
  }, [])

  if (validationErrors.length > 0) {
    return NextResponse.json(
      { 
        success: false, 
        error: "Validation failed",
        details: validationErrors.slice(0, 10), // Return first 10 errors
        totalErrors: validationErrors.length
      },
      { status: 400 }
    )
  }
```

### Step 3: Idempotency Check
```typescript
  // Prevent re-import of same batch
  if (idempotencyKey) {
    const supabase = await createClient()
    const { data: cached } = await supabase
      .from("request_cache")
      .select("response")
      .eq("key", `inventory-import-${idempotencyKey}`)
      .eq("user_id", admin.id)
      .single()

    if (cached?.response) {
      return NextResponse.json(JSON.parse(cached.response))
    }
  }
```

### Step 4: Transactional Batch Insert with Rollback Safety
```typescript
  const supabase = await createClient()
  const adminClient = supabase.admin // If available; otherwise use supabase directly

  // Map vehicles to DB schema
  const vehiclesToInsert = vehicles.map((v) => ({
    year: v.year,
    make: v.make,
    model: v.model,
    listing_price_cents: v.listingPriceCents,
    mileage_km: v.mileageKm || null,
    vin: v.vin || null,
    status: "active",
    import_source: source,
    imported_by: admin.id,
    imported_at: new Date().toISOString(),
  }))

  try {
    // Attempt batch insert
    const { data: inserted, error } = await supabase
      .from("vehicles")
      .insert(vehiclesToInsert)
      .select("id, year, make, model, listing_price_cents")

    if (error) {
      console.error("Inventory import failed:", error)
      return NextResponse.json(
        { error: "Batch insert failed", details: error.message },
        { status: 500 }
      )
    }

    const responseBody = {
      success: true,
      vehiclesImported: inserted?.length || vehicles.length,
      importId: `import-${Date.now()}`,
      source,
      importedAt: new Date().toISOString(),
      details: inserted?.slice(0, 5) || [], // Return first 5 inserted vehicles as sample
    }

    // Cache for idempotency
    if (idempotencyKey) {
      ;(async () => {
        try {
          await supabase.from("request_cache").insert({
            key: `inventory-import-${idempotencyKey}`,
            user_id: admin.id,
            response: JSON.stringify(responseBody),
            ttl_minutes: 60, // Long TTL for rare bulk ops
            created_at: new Date().toISOString(),
          })
        } catch {
          console.warn("[cache] Failed to cache import response")
        }
      })()
    }

    return NextResponse.json(responseBody)
  } catch (err) {
    return NextResponse.json(
      { error: "Unexpected error during inventory import" },
      { status: 500 }
    )
  }
```

### Step 5: Audit Trail
```typescript
  // After successful import, log operation (fire-and-forget)
  ;(async () => {
    try {
      await supabase.from("admin_audit_events").insert({
        admin_id: admin.id,
        action: "inventory_import",
        entity_type: "vehicles",
        entity_count: vehicles.length,
        details: {
          source,
          vehicleCount: vehicles.length,
          priceRange: {
            min: Math.min(...vehicles.map(v => v.listingPriceCents)),
            max: Math.max(...vehicles.map(v => v.listingPriceCents)),
          },
        },
        client_ip: clientIp,
        created_at: new Date().toISOString(),
      })
    } catch (err) {
      console.warn("[audit] Failed to log inventory import", err)
    }
  })()
```

### Step 6: Add Corresponding GET Endpoint for Import Status
```typescript
export async function GET(request: NextRequest) {
  const adminResult = await requireAdminUser(request)
  if (!adminResult.success) {
    return NextResponse.json({ error: adminResult.error }, { status: adminResult.statusCode })
  }

  const supabase = await createClient()
  const importId = request.nextUrl.searchParams.get("importId")

  if (!importId) {
    // List recent imports by this admin
    const { data: auditLogs } = await supabase
      .from("admin_audit_events")
      .select("*")
      .eq("admin_id", adminResult.admin.id)
      .eq("action", "inventory_import")
      .order("created_at", { ascending: false })
      .limit(10)

    return NextResponse.json({ imports: auditLogs || [] })
  }

  // Get details of specific import
  const { data: audit } = await supabase
    .from("admin_audit_events")
    .select("*")
    .eq("admin_id", adminResult.admin.id)
    .eq("action", "inventory_import")
    .ilike("details->>'key'", `%${importId}%`)
    .single()

  return NextResponse.json({ import: audit })
}
```

## Validation Checklist
- [ ] `pnpm lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` succeeds
- [ ] Unauthenticated requests return 401
- [ ] Non-admin users return 403
- [ ] Rate-limited imports return 429
- [ ] Invalid schema returns 400 with specific errors
- [ ] Oversized batches (> 500) return 400
- [ ] Valid imports succeed with vehicle count returned
- [ ] Idempotency-Key prevents duplicate imports
- [ ] Audit trail records all imports with admin ID, vehicle count, price range

## Deliverable
Commit message:
```
fix(inventory-import): add admin auth, schema validation, rate limiting, transactional safety, idempotency + audit trail
```

---

**NOTES:**
- Adjust batch size limit (500) based on DB performance testing.
- VIN validation regex assumes North American format; adjust if international VINs are needed.
- Consider adding "rollback on error" option for destructive operations.
- Coordinate with vendor sync (if separate endpoint) to use same pattern.
- Schema validation order: required fields first, then bounds checking.
