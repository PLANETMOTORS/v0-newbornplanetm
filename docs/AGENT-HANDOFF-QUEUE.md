# Agent Handoff Queue

Last updated: 2026-04-11
Source branch baseline: agent-a-launch-hardening

## Mandatory sync procedure for any divergent workspace
Use this exact sequence before starting work in that workspace:
1. git fetch origin --prune
2. git switch -c rescue/b3a53c3 b3a53c3
3. git switch agent-a-launch-hardening
4. git reset --hard origin/agent-a-launch-hardening
5. git status --short
6. git --no-pager log --oneline -5

## Recovery path for rescued local-only commit
When needed later:
1. Create follow-up branch from current synced head.
2. Cherry-pick needed commit(s) from rescue/b3a53c3.
3. Run lint, typecheck, build.
4. Push and open separate PR.

## Work queue (pick one ticket per agent)

### Ticket A1: Replace trade-in mock valuation flow
Owner: Agent A
Scope:
- app/api/v1/trade-in/route.ts
- app/api/trade-in/quote/route.ts
Goal:
- Remove fabricated valuation data.
- Return deterministic, policy-safe estimate labels when external provider is unavailable.
- Persist request and quote metadata for auditability.
Acceptance:
- No hardcoded demo offer output.
- Request/response include explicit confidence/source fields.
- lint + tsc --noEmit + build all pass.

### Ticket A2: Replace mock inspection endpoint
Owner: Agent A
Scope:
- app/api/v1/vehicles/[id]/inspection/route.ts
Goal:
- Remove mock 210-point payload.
- Serve only persisted inspection report data; return 404 when missing.
- Include clear report timestamp and provenance.
Acceptance:
- No static checklist blob in handler.
- Ownership/public-read policy explicit.
- lint + tsc --noEmit + build all pass.

### Ticket S1: Fix admin trust boundary in finance/trade-in admin routes
Owner: Security Agent
Scope:
- app/api/v1/admin/finance/applications/route.ts
- app/api/v1/admin/finance/applications/[id]/status/route.ts
- app/api/v1/admin/trade-ins/route.ts
- app/api/v1/admin/trade-ins/[id]/status/route.ts
Goal:
- Remove email allowlist checks.
- Enforce role-based authorization from authoritative user/claims table.
- Add explicit 403 behavior and audit log events for admin actions.
Acceptance:
- No comment or logic based on static admin email list.
- Role check centralized and reusable.
- All state transitions validated and constrained.

### Ticket P1: Delivery quote provenance hardening
Owner: Payments/Platform Agent
Scope:
- app/api/v1/deliveries/quote/route.ts
Goal:
- Keep quote logic but mark when estimate source is heuristic.
- Add idempotency key support for quote requests from checkout to avoid duplicate load spikes.
- Ensure response includes currency and amount precision.
Acceptance:
- Response includes source field (heuristic or provider).
- Monetary fields are normalized and typed consistently.
- lint + tsc --noEmit + build all pass.

### Ticket O1: Video call request endpoint production-safe behavior
Owner: Ops Agent
Scope:
- app/api/video-call/request/route.ts
Goal:
- Remove placeholder production comments and define explicit integration failure behavior.
- Add request validation and abuse throttling signals.
- Persist request event for operator follow-up.
Acceptance:
- Endpoint no longer behaves as mock acceptance.
- Validation and failure paths deterministic.
- lint + tsc --noEmit + build all pass.

## Definition of done for each ticket
1. No fabricated customer-facing money, return, delivery, inspection, or valuation data.
2. Authentication + authorization at trust boundary.
3. Idempotent behavior for externally triggered writes where applicable.
4. Auditability: store enough metadata to reconstruct who did what and when.
5. Validation commands pass:
- pnpm lint
- pnpm exec tsc --noEmit
- pnpm build

## PR hygiene
1. One ticket per branch.
2. PR title format: fix(area): concise summary
3. Include risk notes and residual decisions needing human product/legal review.
