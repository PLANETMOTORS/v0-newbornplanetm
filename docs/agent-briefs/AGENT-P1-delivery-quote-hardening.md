# Agent P1: Delivery Quote Integrity Hardening

## Mission
Harden delivery quote endpoint for deterministic monetary output, provenance tagging, and request idempotency.

## Branch and sync
1. git fetch origin --prune
2. git switch agent-a-launch-hardening
3. git pull --ff-only
4. git switch -c hardening/delivery-quote-integrity

## Scope
- app/api/v1/deliveries/quote/route.ts
- any shared helper touched by this route

## Required outcomes
1. Include explicit source in response (heuristic/provider).
2. Normalize all amount fields with currency and precision.
3. Add idempotency handling for repeated quote requests.
4. Keep current pricing policy behavior unless explicitly broken.
5. Add clear failure semantics when provider data is unavailable.

## Acceptance checks
1. pnpm lint
2. pnpm exec tsc --noEmit
3. pnpm build

## PR format
Title: fix(delivery-quote): add provenance, precision, and idempotent quoting
Body must include:
- monetary precision choices
- idempotency behavior
- any latency tradeoffs
