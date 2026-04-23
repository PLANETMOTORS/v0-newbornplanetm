# Testing Planet Motors — AI Agents & E2E Suite

## Overview
Planet Motors has 3 AI agents that need security testing:
- **Anna** (`/api/anna`) — Chat assistant (already had rate limiting + CSRF)
- **Price Negotiator** (`/api/negotiate`) — GPT-4o-mini price negotiation
- **Vehicle Valuator** (`/api/vehicle-valuation`) — GPT-4o-mini trade-in appraisal

Security layers: CSRF origin validation (`lib/csrf.ts`), IP-based rate limiting (`lib/redis.ts`), server-side verification codes (`/api/verify/send-code` + `/api/verify/check-code`).

## Admin Vehicle Management Testing

### Overview
The admin vehicle management page (`/admin/inventory`) provides full CRUD operations, VIN decoding via NHTSA, HomeNet sync, CSV export, and debounced search. Login as `admin@planetmotors.ca` with password stored in Devin secrets.

### Test Login
```bash
# Navigate to localhost:3000/admin/inventory
# Login: admin@planetmotors.ca / TestAdmin2024!
```

### CRUD Test Flow (recommended order)
1. **Page Load**: Verify vehicle count in subtitle, 4 status cards (Available/Reserved/Pending/Sold) sum to total
2. **Create via VIN Decoder**: Click "Add Vehicle" → enter 17-char VIN → click "Decode" → verify NHTSA auto-fills Year/Make/Model → fill Stock#/Price/Mileage → Save → count increments
3. **Edit Status**: Click ⋮ menu on test row → "Edit Vehicle" → change Status dropdown → "Save Changes" → verify badge color changes and status card counts update
4. **Delete**: Click ⋮ → "Delete" → confirm dialog → verify vehicle removed and count decrements
5. **Clean up**: Always delete test vehicles after testing to avoid polluting production data

### VIN Decoder Testing
- Test VIN: `1N4BL4BV4KC123456` → 2019 NISSAN Altima
- The NHTSA API is free and doesn't require keys
- Decode button is disabled unless VIN is exactly 17 characters
- Auto-fills: Year, Make, Model, Trim, Body Style, Drivetrain, Engine, Fuel Type

### Search Debounce Verification
Use Playwright to monitor network requests while typing rapidly:
```javascript
const apiCalls = [];
page.on('request', req => {
  if (req.url().includes('/api/v1/admin/vehicles') && req.method() === 'GET') {
    apiCalls.push({ url: req.url(), time: Date.now() });
  }
});
await searchInput.pressSequentially('Tesla', { delay: 50 });
await page.waitForTimeout(1500); // 300ms debounce + buffer
console.log('API calls:', apiCalls.length); // Should be 1, not 5
```

### HomeNet Sync Testing
- Click "Sync HomeNet" button
- Without SFTP env vars configured, expect: red error banner "Sync failed: Database not configured"
- Page should remain fully interactive (no crash, no blank screen)
- The error banner has a dismiss (×) button
- Status banner shows "HomeNet SFTP: Not configured"

### Price Storage
Prices are stored in **cents** in the database. The form accepts dollars (e.g., enter 25000 for $25,000). The API multiplies by 100 before storing.

### Playwright CDP Tips for Admin Pages
- Connect via: `chromium.connectOverCDP('http://localhost:29229')`
- Dialog overlays block clicks on table rows — always close dialogs (press Escape) before interacting with the table
- The ⋮ menu uses Radix dropdown: `button[aria-expanded]` selector, items are `[role=menuitem]`
- Edit dialog has a `select` for status (index 1, after the page-level filter select at index 0)
- Save button text is "Save Changes" (not "Update Vehicle")
- After creating a vehicle, it appears at the top of the table
- Use `{ force: true }` on click when elements might be partially obscured

### Common Pitfalls
- If a dialog is open from a previous failed test, it blocks all table interactions. Press Escape first.
- The status filter dropdown ("All Status") is the first `<select>` on the page; the edit dialog status is the second `<select>`
- Prices display with comma formatting ($25,000) but are entered as plain numbers (25000)
- Mileage displays with "km" suffix (50,000 km)

## AI Agent Knowledge & Training Testing

### Overview
The Knowledge & Training panel (`/admin/ai-agents` → "Knowledge" button on any agent card) lets admins teach AI agents custom Q&A responses. Entries are stored in the `ai_agent_knowledge` Supabase table (created by `scripts/019_create_ai_agent_knowledge.sql`).

### Prerequisites
- **Migration must be run first**: Run `scripts/019_create_ai_agent_knowledge.sql` in Supabase SQL Editor or via Supabase Management API. Without it, the panel shows an amber "Knowledge Table Not Set Up" fallback.
- **Running migration via API** (when SQL Editor is not available):
  ```bash
  source /run/repo_secrets/PLANETMOTORS/v0-newbornplanetm/.env.secrets
  curl -s -X POST "https://api.supabase.com/v1/projects/ldervbcvkoawwknsemuz/database/query" \
    -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$(jq -Rs '{query: .}' < scripts/019_create_ai_agent_knowledge.sql)"
  ```
- **After running migration**: Refresh the page before opening the Knowledge panel (cached state may still show the fallback alert).

### CRUD Test Flow (recommended order)
1. **Empty State**: Click "Knowledge" on Anna's card → verify panel header "Knowledge & Training — Anna", 5 category cards all at 0, "No knowledge entries yet" message, "Add Knowledge" button
2. **Create Q&A Entry**: Click "Add Knowledge" → Q&A category is default → enter trigger phrase + response + priority (0-100) + tags (comma-separated) → click "Save" → entry appears, Q&A count increments
3. **Create Different Category**: Click "Add Knowledge" → select category pill in the **form** (not the filter card above!) → fill fields → Save → verify correct category count updates
4. **Priority Ordering**: Higher priority entries appear above lower ones in the list (API sorts by `priority DESC, created_at DESC`)
5. **Category Filter**: Click a category quick-stat card to filter → only entries of that category shown. Click again to deselect → all entries shown.
6. **Search**: Type in search box → client-side filter on `trigger_phrase` and `response` (case-insensitive includes)
7. **Edit**: Click chevron to expand entry → click "Edit" → form pre-fills → change fields → click "Update" (not "Save") → verify changes persist
8. **Toggle Active/Inactive**: Expand entry → click "Disable" → entry becomes inactive. "Active Only" button hides inactive entries. Toggle off to see them.
9. **Form Validation**: Try saving with empty trigger phrase → error "Both trigger phrase and response are required"
10. **Delete**: Expand entry → click trash icon → confirm dialog → entry removed
11. **Clean up**: Always delete test entries to avoid polluting the knowledge base

### API Endpoints
- `GET /api/v1/admin/ai-knowledge?agent_type=anna` — all entries
- `GET /api/v1/admin/ai-knowledge?agent_type=anna&active_only=true` — active entries only
- `GET /api/v1/admin/ai-knowledge?agent_type=anna&category=qa` — filter by category
- `POST /api/v1/admin/ai-knowledge` — create entry (body: `{ agent_type, category, trigger_phrase, response, priority, tags }`)
- `PUT /api/v1/admin/ai-knowledge` — update entry (body: `{ id, ...fields }`)
- `DELETE /api/v1/admin/ai-knowledge?id={uuid}` — delete entry
- All endpoints require admin auth (checks `ADMIN_EMAILS` list)
- Response includes `tableExists: boolean` — false if migration not run

### Anna Integration
- `lib/anna/knowledge.ts` → `buildKnowledgePrompt('anna')` fetches active entries and formats as:
  ```
  IF customer asks: "trigger phrase"
  THEN respond: response text
  ```
- Injected into Anna's system prompt in `/api/anna/route.ts` before "RESPONSE GUIDELINES" section
- **Cannot be tested locally** without AI Gateway API key (only in Vercel production). Verify via API that entries are returned correctly.

### Playwright CDP Tips for Knowledge Panel
- **Category confusion**: The form has category pills (Q&A, Instructions, Policies, Scripts, Objection Handling) AND the filter area has identical-looking category cards. When selecting a category for a new entry, you must click the **form pill** (second occurrence), not the **filter card** (first occurrence). Use `page.locator('button:has-text("Policies")').all()` and click index 1 for the form pill.
- **Save vs Update**: New entries use "Save" button. Editing existing entries uses "Update" button.
- **Expand to see actions**: Edit, Disable, and Delete buttons are only visible when an entry is expanded (click the chevron icon).
- **Confirm dialog on delete**: Use `page.on('dialog', d => d.accept())` before clicking delete.
- **Active Only toggle**: This is a button, not a checkbox. It toggles between showing all entries and active-only entries. The button text stays "Active Only" regardless of state.

### 5 Categories
| Value | Label | Description |
|-------|-------|-------------|
| `qa` | Q&A | When customer asks X, answer Y |
| `instruction` | Instructions | Step-by-step guidance for agents |
| `policy` | Policies | Business rules and policies |
| `script` | Scripts | Conversation scripts/templates |
| `objection` | Objection Handling | Counter-arguments for common objections |

### Common Pitfalls
- If the page was loaded before running the migration, you'll see the amber fallback alert even though the table now exists. **Refresh the page** after running the migration.
- The "Active Only" toggle state persists across form operations but resets on page refresh.
- Tags are comma-separated in the input field but displayed as individual badges in the entry.
- Priority is a number 0-100. The form accepts any number but the API doesn't enforce the range.
- Entries are sorted by `priority DESC, created_at DESC` — so entries with the same priority are ordered by creation date (newest first).

## E2E Test Suite (human-click-timing-debug.spec.ts)

### Overview
The main E2E spec has 40 tests across 3 sections:
- **Section A** — Human Click Simulation (15 tests)
- **Section B** — Tab & Keyboard Navigation (13 tests)
- **Section C** — Page Load Timing (12 tests)

### CRITICAL: BASE_URL Configuration
The spec defaults to `BASE_URL=https://ev.planetmotors.ca` (live production). However, `data-testid` attributes were added in PR #226 and may not exist on the live site yet. **Always run against the branch that has the data-testid attributes:**

```bash
# Run against local dev server (recommended)
BASE_URL=http://localhost:3000 npx playwright test e2e/human-click-timing-debug.spec.ts --reporter=list

# Run against Vercel preview (if accessible)
BASE_URL=https://your-preview-url.vercel.app npx playwright test e2e/human-click-timing-debug.spec.ts --reporter=list
```

If you run against the live site without the data-testid attributes, you will get 34+ timeout failures — this is NOT a code bug, it's a targeting issue.

### Playwright Config WebServer
The `playwright.config.ts` starts a dev server on `localhost:3000` via `webServer`. If a dev server is already running on port 3000, playwright reuses it (`reuseExistingServer: !process.env.CI`). Start the dev server before running tests:

```bash
pnpm dev &  # Start dev server in background
# Wait for it to be ready, then run tests
BASE_URL=http://localhost:3000 npx playwright test e2e/human-click-timing-debug.spec.ts
```

### Known Credential-Dependent Failures
4 tests require real Supabase inventory data and will fail without credentials:

| Test | Reason |
|------|--------|
| A03 — inventory card click → VDP | No `inventory-card` elements without Supabase data |
| A04 — VDP "Start Purchase" | Depends on A03 |
| A13 — right-click vehicle image | No `vdp-hero-image` without vehicle data |
| B12 — VDP gallery arrow keys | No `vdp-image-gallery` without vehicle data |

With placeholder `.env.local` values, expect **36/40 passed**. With real Supabase credentials, expect **40/40**.

### Key Test Assertions
- **A15** (`line 333`): `expect(clickLog.length).toBe(4)` — there are exactly 4 `logClick()` calls in the checkout walkthrough
- **C09** (`line 648`): `test.skip(!fs.existsSync(DL_FRONT))` — requires `e2e/fixtures/dl-front.jpg` to exist (valid JFIF JPEG)

### CI E2E Job
The CI e2e job runs ALL spec files (not just human-click-timing-debug.spec.ts). Other specs (contact, homepage, inventory, vehicle-detail, etc.) run against `localhost:3000` and need real Supabase/Typesense data to pass. Without credentials in CI secrets, these specs will fail. This is a pre-existing issue and not caused by PR changes.

The CI workflow (`.github/workflows/ci.yml`) must include a `pnpm build` step before e2e tests, since `pnpm test:e2e` starts a production server that needs `.next/` build output.

## Local Production Build for CSRF Testing

CSRF validation is **bypassed in development mode** (`NODE_ENV=development`). To test CSRF:

1. Create minimal `.env.local`:
   ```
   NEXT_PUBLIC_BASE_URL=http://localhost:3001
   NEXT_PUBLIC_SUPABASE_URL=https://placeholder.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder
   NEXT_PUBLIC_SANITY_PROJECT_ID=placeholder
   NEXT_PUBLIC_SANITY_DATASET=production
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
   ```
2. Build: `pnpm build`
3. Start on a free port: `NODE_ENV=production npx next start -p 3001`
4. CSRF allowlist in production includes: `NEXT_PUBLIC_BASE_URL` + `localhost:3000` + `localhost:3001` + `127.0.0.1:3000` + `127.0.0.1:3001`

**Important:** Port 3000 may be auto-occupied by other processes. Use port 3001 and include `http://localhost:3001` as the Origin header.

## CSRF Test Commands

```bash
# Should return 403 "Forbidden: invalid origin"
curl -s -X POST http://localhost:3001/api/negotiate \
  -H "Content-Type: application/json" \
  -d '{"vehiclePrice":30000,"customerOffer":28000}' \
  -w "\nHTTP_STATUS: %{http_code}"

# Should return 403
curl -s -X POST http://localhost:3001/api/negotiate \
  -H "Content-Type: application/json" \
  -H "Origin: https://evil-attacker.com" \
  -d '{"vehiclePrice":30000,"customerOffer":28000}' \
  -w "\nHTTP_STATUS: %{http_code}"

# Should NOT return 403 (passes CSRF, may fail on missing OpenAI key)
curl -s -X POST http://localhost:3001/api/negotiate \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{"vehiclePrice":30000,"customerOffer":28000}' \
  -w "\nHTTP_STATUS: %{http_code}"
```

Repeat for `/api/vehicle-valuation`, `/api/verify/send-code`, `/api/verify/check-code`.

## Rate Limiting

Rate limiting uses Upstash Redis (`lib/redis.ts`). Without Redis env vars (`KV_REST_API_URL`, `KV_REST_API_TOKEN`), `rateLimit()` gracefully degrades — returns `{success: true}` and allows all requests. **Rate limiting cannot be tested locally without Redis.** Test in Vercel preview or production.

## Verification Code Testing

Server-side code generation uses `crypto.randomInt(100000, 999999)` and stores in Redis with 10-min TTL. To verify the client no longer supplies codes:

```bash
curl -s -X POST http://localhost:3001/api/verify/send-code \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:3001" \
  -d '{"method":"email","destination":"test@test.com","code":"999999"}' \
  -w "\nHTTP_STATUS: %{http_code}"
```

Expected: `{"success":true,"method":"email"}` — the `code` field is ignored.

## Performance Testing

### Netlify Preview Limitations
Netlify preview deploys (`https://deploy-preview-{PR}--planetnewborn-v0-newbornplanetm.netlify.app`) have important limitations:
- **No Typesense/Supabase data** — The `/inventory` page will show "Error loading inventory" because Typesense search credentials may not be configured on the preview. This means vehicle grid rendering, `content-visibility` virtualization, and filter state cannot be visually tested on preview.

## Admin Panel Testing (General)

### Test Login
- URL: `localhost:3000/auth/login`
- Email: `admin@planetmotors.ca`
- Session may persist from previous testing — check if already logged in before navigating to login page

### Admin Pages Available
| Page | Path | Key Features |
|------|------|--------------|
| Dashboard | `/admin` | Stats cards, recent activity |
| Vehicles | `/admin/inventory` | CRUD, VIN decoder, HomeNet sync |
| Customers | `/admin/customers` | Customer list |
| Leads | `/admin/leads` | Aggregated leads from all sources |
| Reservations | `/admin/reservations` | Deposit tracking, status filters |
| Orders | `/admin/orders` | Order management |
| Finance Apps | `/admin/finance` | Finance application review |
| AI Agents | `/admin/ai-agents` | Configure + Knowledge panels |
| Workflows | `/admin/workflows` | Email notification rules |
| 360° Photos | `/admin/360-upload` | Frame upload to Supabase |
| Analytics | `/admin/analytics` | Traffic/conversion data |
| Settings | `/admin/settings` | Site configuration |

### Supabase Migration Scripts
Migration scripts are in `scripts/` directory. Run them in order via Supabase SQL Editor or Management API. Key migrations:
- `018_create_leads_conversations_ai_config.sql` — leads, chat_conversations, chat_messages, ai_agent_config tables
- `019_create_ai_agent_knowledge.sql` — ai_agent_knowledge table for Knowledge & Training feature

## Devin Secrets Needed

| Secret Name | Purpose | Scope |
|-------------|---------|-------|
| `SUPABASE_ACCESS_TOKEN` | Run migrations via Supabase Management API | repo |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side Supabase queries | repo |
| `SUPABASE_ANON_KEY` | Client-side Supabase queries | repo |
| `RESEND_API_KEY` | Email sending (workflows) | repo |
| `STRIPE_SECRET_KEY` | Payment processing | repo |

These are available at `/run/repo_secrets/PLANETMOTORS/v0-newbornplanetm/.env.secrets`. Source them with:
```bash
source /run/repo_secrets/PLANETMOTORS/v0-newbornplanetm/.env.secrets
```
