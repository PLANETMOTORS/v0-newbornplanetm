# AGENT-C1: Comprehensive Admin & Test Endpoint Security Sweep

**Urgency:** LOW-MEDIUM (cleanup + completeness)  
**Complexity:** Low  
**Estimated Time:** 30–45 min  
**Branch:** `agent-a-launch-hardening`

## Objective
Systematically audit remaining admin and test endpoints for missed authorization, hardcoded credentials, mock data, and compliance gaps. This is a final "sweep" to ensure 100% coverage of trust boundaries.

## Scope
All remaining endpoints in:
- `/app/api/**/*test*.ts`
- `/app/api/**/admin/**/*.ts` (already partially hardened)
- `/app/api/**/debug*.ts`
- `/app/api/sanity/**/*.ts` (except already-hardened webhooks)

## Pre-Sweep Findings

Run this search in your workspace:
```bash
grep -r "ADMIN_EMAIL\|process\.env\.ADMIN\|hardcoded.*email\|TODO.*auth\|FIXME.*security" app/api --include="*.ts" | head -20
```

Known issues to verify:
1. **Test endpoints** – May still have `ADMIN_EMAILS` allowlist instead of `requireAdminUser()`
2. **Sanity webhooks** – May lack signature verification
3. **Admin endpoints** – Any new routes added since last hardening pass
4. **Mock data endpoints** – Any remaining fabricated responses

## Solution Framework

### Pattern 1: Test/Debug Endpoints → Require Admin
**Apply to:** Any route with "test", "debug", "mock" in path

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const email = request.headers.get("authorization")?.split(" ")[1]
  if (email !== process.env.ADMIN_EMAIL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }
  // ... test logic ...
}
```

**After:**
```typescript
import { requireAdminUser } from "@/lib/auth/admin"

export async function POST(request: NextRequest) {
  const adminResult = await requireAdminUser(request)
  if (!adminResult.success) {
    return NextResponse.json({ error: adminResult.error }, { status: adminResult.statusCode })
  }
  // ... test logic ...
}
```

### Pattern 2: Sanity Webhooks → Verify Signature
**Apply to:** `/app/api/sanity/**/*.ts` (POST webhooks)

**Before:**
```typescript
export async function POST(request: NextRequest) {
  const body = await request.json()
  // Process webhook directly; no signature check
}
```

**After:**
```typescript
import { verifyWebhookSignature } from "@/lib/sanity/webhook"

export async function POST(request: NextRequest) {
  const signature = request.headers.get("X-Sanity-Webhook-Signature")
  const rawBody = await request.text()

  // Verify signature
  const isValid = verifyWebhookSignature(signature, rawBody, process.env.SANITY_WEBHOOK_SECRET!)
  if (!isValid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = JSON.parse(rawBody)
  // Process webhook
}
```

*Note:* If `verifyWebhookSignature` doesn't exist, create it:
```typescript
// lib/sanity/webhook.ts
import { createHmac } from "crypto"

export function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string
): boolean {
  if (!signature) return false
  
  const hash = createHmac("sha256", secret)
    .update(body)
    .digest("base64")
  
  return signature === `sha256=${hash}`
}
```

### Pattern 3: Admin-Only Database Modifications
**Apply to:** Any POST/PUT/DELETE to admin tables

**Before:**
```typescript
export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  await supabase.from("admin_settings").delete().eq("id", id)
  return NextResponse.json({ success: true })
}
```

**After:**
```typescript
import { requireAdminUser } from "@/lib/auth/admin"

export async function DELETE(request: NextRequest) {
  const adminResult = await requireAdminUser(request)
  if (!adminResult.success) {
    return NextResponse.json({ error: adminResult.error }, { status: adminResult.statusCode })
  }

  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 })

  // Audit + delete
  ;(async () => {
    try {
      const supabase = await createClient()
      await supabase.from("admin_audit_events").insert({
        admin_id: adminResult.admin.id,
        action: "admin_settings_deleted",
        entity_id: id,
        details: { deleted_at: new Date().toISOString() },
        created_at: new Date().toISOString(),
      })
    } catch {
      // Fire-and-forget
    }
  })()

  const { error } = await supabase.from("admin_settings").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
```

### Pattern 4: Remove Mock Data Responses
**Apply to:** Any endpoint returning fabricated data

**Checklist:**
- [ ] Search codebase for `Math.random()`, `fake`, `mock`, `dummy` in response builders
- [ ] Replace with DB queries or 404
- [ ] Add audit trail if data access is sensitive

### Pattern 5: Rate-Limit Sensitive Admin Operations
**Apply to:** Admin operations that trigger external actions (webhooks, emails, exports)

**Template:**
```typescript
const rateLimitResult = await rateLimit(
  `admin-action:${admin.id}:${action}`,
  3, // max requests
  3600 // per hour
)
if (!rateLimitResult.success) {
  return NextResponse.json({ error: "Rate limited" }, { status: 429 })
}
```

## Systematic Sweep Procedure

### 1. List All API Routes
```bash
cd /Users/tonisultzberg@icloud.com/v0-newbornplanetm-1
find app/api -name "route.ts" -type f | sort
```

### 2. For Each Route, Ask:
- [ ] **Is this admin-only?** If yes, does it use `requireAdminUser()`?
- [ ] **Does this accept webhooks?** If yes, does it verify signatures?
- [ ] **Does this return data?** If yes, is it from DB or hardcoded?
- [ ] **Does this modify state?** If yes, is it audit-logged?
- [ ] **Can this be DOS'd?** If yes, is it rate-limited?
- [ ] **Is there user input?** If yes, is it validated?

### 3. Fix Any Findings
Apply patterns from above.

### 4. Batch Patterns
Group similar fixes and apply in one commit (e.g., "all test endpoints now require admin auth").

## Quick Search Commands

Copy these into your terminal to find patterns needing hardening:

```bash
# Find hardcoded ADMIN_EMAILS
grep -r "ADMIN_EMAIL" app/api --include="*.ts"

# Find unauthenticated webhook handlers
grep -B5 "POST.*webhook" app/api --include="*.ts" | grep -v "verify\|signature\|auth"

# Find mock/fake data responses
grep -r "fake\|mock\|dummy\|\\[\\]" app/api --include="*.ts" | grep "return.*Json"

# Find unvalidated input
grep -r "req.json()\|body\[" app/api --include="*.ts" | grep -v "validate\|schema\|zod"
```

## Validation Checklist
- [ ] All test endpoints require `requireAdminUser()`
- [ ] All webhook POST handlers verify signatures
- [ ] No hardcoded `ADMIN_EMAILS` allowlists remain
- [ ] Admin mutations are rate-limited
- [ ] Admin mutations are audit-logged
- [ ] No fabricated data in responses (all DB-backed or 404)
- [ ] `pnpm lint` passes
- [ ] `pnpm exec tsc --noEmit` passes
- [ ] `pnpm build` succeeds

## Deliverable
Commit message:
```
fix(admin-sweep): unified test endpoints, verified webhook signatures, removed mock responses, added rate limits + audit trails
```

---

**NOTES:**
- This is a **cleanup pass**; may not find any new issues (previous commits may have covered these already).
- Prioritize: test endpoints > webhooks > admin operations > data responses.
- If you hit a blocker (missing function, schema issue), document it in a BLOCKERS.md for later human review.
- Consider adding a pre-deployment checklist script that auto-validates these patterns.
