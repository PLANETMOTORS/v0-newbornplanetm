# Technical Debt Register — Planet Motors

> Generated: 2026-04-23 | Clean Sweep Phase  
> Maintained by: Engineering team  
> Format: `[PRIORITY]` `[CATEGORY]` — Description → File(s)

---

## Summary

| Category | Open Items |
|----------|-----------|
| API / Backend | 2 |
| Logging / Observability | 0 ✅ (resolved this sprint) |
| Error Handling | 0 ✅ (resolved this sprint) |

---

## Open Items

### API / Backend

#### TD-001 — Returns database table not yet implemented
- **Priority:** Medium
- **File:** `app/api/v1/returns/[id]/route.ts` (lines 18, 41)
- **Description:** The `GET /api/v1/returns/:id` and `POST /api/v1/returns/:id/schedule-pickup` endpoints are stubs. They return 404/503 placeholder responses because the `returns` database table and pickup scheduling system have not been built yet.
- **Impact:** Customers cannot track return status or schedule pickups via the API. They must call the dealership directly.
- **Resolution:** 
  1. Create a `returns` table in Supabase (schema: `id`, `order_id`, `user_id`, `status`, `reason`, `created_at`, `scheduled_pickup_at`, `notes`).
  2. Implement `GET` to query the table by return ID.
  3. Implement `POST` to create/update a pickup appointment (integrate with calendar or scheduling service).
  4. Remove the TODO comments once implemented.

#### TD-002 — SMS notifications not integrated (Twilio placeholder)
- **Priority:** Low
- **File:** `lib/liveVideoTour/notifications.ts` (line ~210)
- **Description:** SMS reminders for live video tour bookings log a placeholder message instead of actually sending via Twilio or another SMS provider.
- **Impact:** Customers do not receive SMS reminders for their video tour appointments.
- **Resolution:**
  1. Add Twilio (or similar) SDK to the project.
  2. Implement `sendSmsReminder()` in `lib/liveVideoTour/notifications.ts`.
  3. Set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER` in environment variables.

---

## Resolved This Sprint ✅

### Logging / Observability (Task 1 — Clean Sweep)
- **Resolved:** 2026-04-23
- **What was done:** All `console.log`, `console.warn`, `console.error`, and `console.info` calls across **113 production files** were replaced with the new structured `logger` utility (`lib/logger.ts`).
- **Logger behaviour:** `info` and `debug` are suppressed in `NODE_ENV=production`; `warn` and `error` always emit with ISO timestamps.

### Error Handling — Silent Catch Blocks (Task 2 — Clean Sweep)
- **Resolved:** 2026-04-23
- **What was done:** **67 silent `} catch {` blocks** across **44 files** were refactored to log the error with a descriptive context message via `logger.error()` or `logger.warn()`.
- **Intentionally silent catches preserved** (with explanatory comments):
  - `localStorage` / `sessionStorage` access (browser API unavailability)
  - URL parsing utilities (`lib/csrf.ts`, `lib/site-url.ts`) — pure functions returning null/default
  - JSON body parse errors in edge functions — already return HTTP 400
  - `createAdminClient()` failures — already return HTTP 500
  - Typesense collection-not-found check — expected during first-time setup

---

## Guidelines for New Debt

When adding a TODO or FIXME to the codebase:
1. Add a corresponding entry to this file in the appropriate category.
2. Include: priority, file path, description, and resolution steps.
3. Trivial TODOs (< 30 min to fix) should be resolved immediately, not deferred.
4. Run `grep -rn "TODO\|FIXME" --include="*.ts" --include="*.tsx" app/ lib/ components/` before each sprint to audit.
