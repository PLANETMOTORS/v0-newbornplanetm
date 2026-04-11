# Agent S1: Admin Authorization Hardening

## Mission
Remove static admin-email trust and enforce role-based authorization in admin finance/trade-in APIs.

## Branch and sync
1. git fetch origin --prune
2. git switch agent-a-launch-hardening
3. git pull --ff-only
4. git switch -c hardening/admin-authz

## Scope
- app/api/v1/admin/finance/applications/route.ts
- app/api/v1/admin/finance/applications/[id]/status/route.ts
- app/api/v1/admin/trade-ins/route.ts
- app/api/v1/admin/trade-ins/[id]/status/route.ts

## Required outcomes
1. Remove all static email allowlist checks.
2. Enforce admin access through authoritative role/claims lookup.
3. Return 403 for authenticated non-admin users.
4. Ensure state transitions are constrained and validated.
5. Add minimal audit trail event write per admin status change.

## Acceptance checks
1. pnpm lint
2. pnpm exec tsc --noEmit
3. pnpm build

## PR format
Title: fix(admin-api): replace email trust with role-based authorization
Body must include:
- changed trust boundaries
- transition constraints added
- residual policy decisions for human signoff
