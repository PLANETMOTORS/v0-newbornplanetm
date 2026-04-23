# Stress Testing — Planet Motors Backend

## Overview
Procedures for validating system resilience under high-load and edge-case scenarios across the Supabase + Sanity v5 + Edge Functions stack.

## Devin Secrets Needed
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key for REST API access
- `SUPABASE_ACCESS_TOKEN` — (optional) for Supabase CLI operations like deploying Edge Functions

## Prerequisites
- Deno installed (for local Edge Function testing)
- `tc` (traffic control) available for network simulation (may not work in all containerized environments)
- `curl` for REST API stress testing
- Python 3 for data processing scripts

## Test 1: Concurrent Request Handling

### Supabase REST API
Fire 10+ simultaneous `curl` requests against the Supabase REST API using background processes (`&`) and `wait`.

```bash
# Pattern: fire N parallel requests, capture timing + HTTP codes
for i in $(seq 0 9); do
  (curl -s -o "response_$i.json" -w "%{http_code}|%{time_total}" \
    "${SUPABASE_URL}/rest/v1/vehicles?select=id,make,model&limit=10" \
    -H "apikey: ${SUPABASE_KEY}" \
    -H "Authorization: Bearer ${SUPABASE_KEY}") &
done
wait
```

**Pass criteria**: All responses HTTP 200, no 5xx, all < 5s, deterministic results.

### Edge Function Logic (Local Deno)
Extract the business logic (DTI calculation, lender matching) into a standalone `.ts` file and run via `deno run`. Use `Promise.all` with varied payloads to test concurrency.

**Key insight**: The `finance-prequalify` function requires a valid Supabase user JWT (`getUser()` verification). For stress testing the calculation logic without auth, extract the pure functions and test them directly.

**Pass criteria**: Identical results on re-run (deterministic), no cross-request state contamination, varied DTI values across different payloads.

## Test 2: Network Interruption Simulation

Use `tc netem` to inject network impairment:

```bash
# 50% packet loss
sudo tc qdisc add dev eth0 root netem loss 50%

# 2000ms added latency  
sudo tc qdisc add dev eth0 root netem delay 2000ms

# Remove impairment
sudo tc qdisc del dev eth0 root
```

**Important notes**:
- `tc netem` might not be available in all containerized/VM environments
- Always clean up with `tc qdisc del` after testing
- Use `curl --max-time` to simulate AbortController-style client timeouts
- Run recovery requests after removing impairment to confirm the system bounces back

**Fallback**: If `tc` is unavailable, use `curl --max-time 0.05` (50ms) to simulate tight client-side timeouts. This validates AbortController behavior without needing kernel-level network manipulation.

**Expected behavior under 50% packet loss**: Most requests will timeout (this is expected). The key assertion is that failures are clean timeouts — not crashes, hangs, or corrupted responses.

## Test 3: Data Integrity Audit

Cross-reference Supabase `vehicles` table with Sanity CMS references:

1. Query Supabase: `GET /rest/v1/vehicles?select=id,year,make,model,price,status,mileage`
2. Query Sanity: `*[_type=="homepage"][0]{featuredVehicles[]{vehicleId}}`
3. Validate:
   - No null/zero prices
   - No negative mileage
   - All required fields present (make, model, year)
   - Valid status values (available, sold, pending, reserved, checkout_in_progress)
   - Every Sanity vehicle_id exists in Supabase
   - Referenced vehicles have status = 'available'

**Run this before AND after stress tests** to detect data corruption.

**Note**: The Sanity `featuredVehicles` array may be empty if admins haven't curated featured vehicles yet. This is valid — the frontend falls back to auto-selection.

## Test 4: Logs Review

Aggregate all test output and scan for error patterns:

**Critical patterns** (should be zero): `unhandled`, `FATAL`, `panic`, `TypeError`, `ReferenceError`, `ECONNREFUSED`, `segfault`, `OOM`, `out of memory`, `stack overflow`

**Expected patterns** (from network tests): `TIMEOUT`, `degraded`, `timed out`, `packet loss`

**Resource exhaustion** (should be zero): `pool exhausted`, `too many connections`, `connection limit`, `ENOMEM`, `EMFILE`

**Tip**: When writing log scanning scripts, exclude the scanner's own log file from the scan to avoid false positives (e.g., the word "critical" appearing in your own scan pattern description).

## Known Issues

- **Edge Functions might not be deployed**: The functions may exist in the repo but return 404 from the Supabase endpoint. Check with a quick `curl` before testing. If 404, either deploy with `supabase functions deploy <name>` or test locally with Deno.
- **Supabase CLI auth**: `supabase functions list` may return 401 even with a valid access token if the token lacks sufficient permissions. The REST API (with anon key) works independently of CLI auth.
- **Prices are stored in cents**: Vehicle prices in Supabase are in cents (e.g., 8995000 = $89,950). Account for this when validating price ranges.

## Execution Order
1. Data Integrity (pre-stress baseline)
2. Concurrent Requests (stress)
3. Network Interruption (extreme stress)
4. Data Integrity (post-stress — compare with baseline)
5. Logs Review (aggregate analysis)
