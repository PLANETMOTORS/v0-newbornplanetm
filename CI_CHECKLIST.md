# CI Checklist — Planet Motors (`v0.3.0`)

Use this checklist to verify production-readiness before any deployment or merge to `main`.
All commands must be run from the **root of this repository**.

---

## Prerequisites

- [ ] Node.js ≥ 20 installed (`node --version`)
- [ ] pnpm installed (`pnpm --version`)
- [ ] All environment variables set (copy `.env.example` → `.env.local` and fill in values)
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Any other secrets listed in `.env.example`

---

## 1. Install Dependencies

```bash
pnpm install --frozen-lockfile
```

> **Why `--frozen-lockfile`?** Ensures the exact dependency tree from `pnpm-lock.yaml` is used — no silent upgrades.

---

## 2. Type-Check

```bash
pnpm typecheck
# Runs: tsc --noEmit
```

✅ **Pass criteria:** Zero TypeScript errors. Any error is a blocker.

---

## 3. Lint

```bash
pnpm lint
# Runs: eslint .
```

✅ **Pass criteria:** Zero ESLint errors. Warnings are acceptable but should be reviewed.

---

## 4. Unit Tests

```bash
pnpm test
# Runs: vitest run
```

✅ **Pass criteria:** All tests pass. Zero failures.

---

## 5. Production Build

```bash
pnpm build
# Runs: next build && serwist build
```

✅ **Pass criteria:**
- `next build` completes with no errors.
- `serwist build` (PWA service worker) completes with no errors.
- No `Type error` or `Build failed` messages in output.

---

## 6. Security Scan — No Hardcoded Secrets

```bash
grep -rn \
  --include="*.ts" --include="*.tsx" --include="*.js" \
  -E "(\.supabase\.co|sk_live_|sk_test_|AKIA[0-9A-Z]{16})" \
  app/ lib/ components/ \
  | grep -v "node_modules" \
  | grep -v "\.env" \
  | grep -v "^\s*//"
```

✅ **Pass criteria:** Zero matches in executable code. Any match is a **critical blocker** — move the value to an environment variable immediately.

> **Note:** JSDoc `* e.g. "..."` example comments are exempt, but should be reviewed to ensure they don't contain real project credentials.

---

## 7. End-to-End Tests (Optional / Pre-Release)

```bash
pnpm test:e2e
# Runs: playwright test
```

> Requires a running dev server or staging environment. Set `PLAYWRIGHT_BASE_URL` as needed.

✅ **Pass criteria:** All Playwright tests pass.

---

## 8. Bundle Analysis (Optional)

```bash
pnpm analyze
# Runs: ANALYZE=true next build
```

> Opens a bundle visualizer. Use to catch unexpectedly large dependencies before shipping.

---

## Quick Full-Check (Steps 1–5)

```bash
pnpm install --frozen-lockfile && \
pnpm typecheck && \
pnpm lint && \
pnpm test && \
pnpm build
```

---

## CI Environment Variables (GitHub Actions / Vercel / etc.)

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SENTRY_DSN` | Recommended | Error tracking |
| `SENTRY_AUTH_TOKEN` | Recommended | Source map upload |

---

## Definition of "Ship Ready"

A build is considered **ship-ready** when:

1. ✅ `pnpm typecheck` — 0 errors
2. ✅ `pnpm lint` — 0 errors
3. ✅ `pnpm test` — 0 failures
4. ✅ `pnpm build` — exits 0
5. ✅ Security scan — 0 hardcoded secrets/URLs in executable code
6. ✅ No `TODO`, `FIXME`, or `TEMP` comments without a JIRA issue ID in `app/api/v1/`

> **TODO format standard:** `// TODO: [JIRA-ISSUE-ID] - <description of pending work>`
> Example: `// TODO: [PM-412] - Add rate limiting to login endpoint`
