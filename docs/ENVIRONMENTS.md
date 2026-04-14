# Environment Strategy

Planet Motors uses three deployment tiers managed through Vercel and GitHub.

## Environments

| Environment | Branch    | URL                          | Purpose                        |
| ----------- | --------- | ---------------------------- | ------------------------------ |
| Production  | `main`    | `planetmotors.ca`            | Live customer-facing site      |
| Staging     | `staging` | `staging.planetmotors.ca`    | Pre-release validation         |
| Preview     | PR branch | `*.vercel.app` (auto-generated) | Per-PR review & QA          |

### Production

- Deployed automatically when commits land on `main`.
- Vercel assigns the production domain (`planetmotors.ca`).
- All third-party keys (Stripe, lenders, credit bureaus) use **live/production** credentials.

### Staging

- Deployed automatically when commits land on `staging`.
- Vercel deploys this as a preview deployment; the custom domain `staging.planetmotors.ca` is aliased to the latest `staging` build in the Vercel dashboard.
- Uses **sandbox/test** credentials for payment, credit, and lender APIs.
- Feature flags may differ from production to gate unreleased features.

### Preview

- Vercel creates a unique deployment URL for every push to a pull request branch.
- Shares the same environment variable set as staging (Vercel "Preview" environment).
- Useful for design review, QA, and automated E2E tests against isolated builds.

## Promotion Flow

```
feature branch ──► PR (preview deploy) ──► staging branch ──► main branch
                     │                        │                  │
                   review &                 QA &              production
                   CI checks             integration           release
                                          testing
```

1. **Feature branch → Pull Request**: Developer opens a PR. CI runs lint, test, and build. Vercel creates a preview deployment.
2. **PR → Staging**: After review approval, merge the PR into `staging`. The staging deployment updates automatically.
3. **Staging → Production**: Once validated on staging, merge `staging` into `main` (or fast-forward). Production deploys automatically.

## Environment Variables That Differ

| Variable / Group              | Production          | Staging / Preview        |
| ----------------------------- | ------------------- | ------------------------ |
| `NODE_ENV`                    | `production`        | `production`             |
| `NEXT_PUBLIC_SITE_URL`        | `https://planetmotors.ca` | `https://staging.planetmotors.ca` |
| `NEXT_PUBLIC_BASE_URL`        | `https://planetmotors.ca` | `https://staging.planetmotors.ca` |
| Stripe keys                   | `pk_live_` / `sk_live_` | `pk_test_` / `sk_test_` |
| Credit bureau API URLs        | Production endpoints | Sandbox endpoints        |
| Lender API URLs               | Production endpoints | Sandbox endpoints        |
| S3 bucket suffixes            | `-prod`             | `-dev` / `-staging`      |
| `DATABASE_URL`                | Production Neon     | Staging Neon branch      |
| `REDIS_URL` / Upstash         | Production instance | Staging instance         |
| Analytics IDs (GA4, GTM, Pixel) | Real IDs          | Test/empty IDs           |
| Feature flags                 | Stable flags only   | May enable unreleased    |

> **Tip**: In Vercel, set production-only values under the "Production" environment and staging/preview values under the "Preview" environment. The `staging` branch deploys as a Vercel preview, so it inherits Preview environment variables automatically.

## Vercel Configuration

Vercel automatically deploys all branches. No special `vercel.json` configuration is needed for staging — the `staging` branch just needs a domain alias configured in the Vercel dashboard:

1. Go to **Project Settings → Domains** in Vercel.
2. Add `staging.planetmotors.ca`.
3. Set the **Git Branch** to `staging`.

This ensures the staging domain always points to the latest `staging` branch deployment.

## Setting Up the Staging Branch

When ready to create the staging environment:

```bash
git checkout main
git checkout -b staging
git push -u origin staging
```

Vercel will automatically detect the new branch and create deployments for it. Then configure the domain alias as described above.
