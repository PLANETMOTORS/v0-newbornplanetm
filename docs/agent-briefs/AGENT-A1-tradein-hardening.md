# Agent A1: Trade-In Valuation Hardening

## Mission
Replace fabricated trade-in valuation outputs with production-safe behavior and auditable quote metadata.

## Branch and sync
1. git fetch origin --prune
2. git switch agent-a-launch-hardening
3. git pull --ff-only
4. git switch -c hardening/tradein-valuation

## Scope
- app/api/v1/trade-in/route.ts
- app/api/trade-in/quote/route.ts

## Required outcomes
1. Remove mock valuation payloads and hardcoded offer numbers.
2. Ensure response clearly declares estimate source (heuristic vs provider).
3. Persist request/quote metadata sufficient for audit and replay analysis.
4. Validate request inputs and reject malformed payloads with explicit 4xx.
5. No raw sensitive personal data in logs.

## Acceptance checks
1. pnpm lint
2. pnpm exec tsc --noEmit
3. pnpm build

## PR format
Title: fix(trade-in): remove mock valuation and add auditable quote source
Body must include:
- trust boundary checks added
- remaining business-policy decisions
- test/build evidence
