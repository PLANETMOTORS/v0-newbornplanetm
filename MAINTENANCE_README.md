# Planet Motors — Operations & Maintenance Guide

> **Audience:** Developers, DevOps, and on-call engineers.  
> **Last updated:** 2026-04-23  
> **Production URL:** https://v0-newbornplanetm.vercel.app  
> **Repository:** https://github.com/PLANETMOTORS/v0-newbornplanetm

---

## Table of Contents

1. [System Health Dashboard](#1-system-health-dashboard)
2. [Emergency Procedures](#2-emergency-procedures)
3. [Sanity CMS Backup Status](#3-sanity-cms-backup-status)
4. [Infrastructure Secrets Reference](#4-infrastructure-secrets-reference)
5. [Key Services & Dependencies](#5-key-services--dependencies)
6. [Runbook: Common Issues](#6-runbook-common-issues)

---

## 1. System Health Dashboard

### Endpoint

```
GET /api/admin/system-health
```

**Authentication:** Supabase session cookie required. The requesting user's email must be in the `ADMIN_EMAILS` allowlist (`lib/admin.ts`). Returns `401 Unauthorized` for all other callers.

### What It Returns

```jsonc
{
  "generatedAt": "2026-04-23T12:00:00.000Z",
  "sanityWebhook": {
    "lastTriggeredAt": "2026-04-23T11:45:00.000Z",  // ISO timestamp from Redis
    "documentType": "vehicle",                         // Sanity document type that triggered
    "tagsRevalidated": ["vehicles", "homepage"],       // Next.js cache tags purged
    "status": "ok"                                     // "ok" | "unknown"
  },
  "homenetSync": {
    "configured": true,
    "lastSyncAt": "2026-04-23T11:30:00.000Z",         // From Supabase vehicles table
    "status": "ok",                                    // "ok" | "stale" | "unconfigured"
    "staleThresholdMinutes": 30
  },
  "typesense": {
    "configured": true,
    "status": "ok"                                     // "ok" | "unconfigured"
  }
}
```

### Status Values

| Field | Status | Meaning |
|-------|--------|---------|
| `sanityWebhook.status` | `ok` | Webhook has fired and Redis record exists |
| `sanityWebhook.status` | `unknown` | Redis unavailable or webhook has never fired |
| `homenetSync.status` | `ok` | Last sync < 30 minutes ago |
| `homenetSync.status` | `stale` | Last sync > 30 minutes ago — investigate SFTP |
| `homenetSync.status` | `unconfigured` | SFTP env vars missing |
| `typesense.status` | `ok` | All Typesense env vars present |
| `typesense.status` | `unconfigured` | Missing `TYPESENSE_HOST` or API key |

### How to Call It (curl)

```bash
# 1. Get your Supabase session token from the browser (DevTools → Application → Cookies → sb-*-auth-token)
# 2. Pass it as a cookie:
curl -s \
  -H "Cookie: sb-<project-ref>-auth-token=<your-session-token>" \
  https://v0-newbornplanetm.vercel.app/api/admin/system-health | jq .
```

> **Tip:** The easiest way is to open the URL directly in a browser while logged in as an admin user.

---

## 2. Emergency Procedures

### 2a. Manual Cache Purge

Use this when content published in Sanity is not appearing on the live site (stale Next.js cache).

**Endpoint:**

```
POST /api/admin/system-health
Content-Type: application/json

{ "action": "purge-cache" }
```

**What it does:** Calls `revalidatePath('/', 'layout')` which invalidates the entire Next.js ISR/RSC cache tree from the root layout down — equivalent to a full site cache flush.

**curl example:**

```bash
curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Cookie: sb-<project-ref>-auth-token=<your-session-token>" \
  -d '{"action":"purge-cache"}' \
  https://v0-newbornplanetm.vercel.app/api/admin/system-health | jq .
```

**Expected response:**

```json
{
  "success": true,
  "action": "purge-cache",
  "purgedAt": "2026-04-23T12:05:00.000Z",
  "message": "Full cache purge triggered via revalidatePath('/')"
}
```

**When to use:**
- A vehicle listing was updated in Sanity but the old version is still showing on the site.
- The Sanity webhook fired but the page didn't update (check `sanityWebhook.status` first).
- After a bulk content migration or import.

> **Note:** Cache purge only affects the Next.js edge/ISR cache. It does **not** affect Vercel's CDN layer. If content is still stale after a purge, trigger a new Vercel deployment from the dashboard.

### 2b. Force Vercel Redeploy

If a cache purge doesn't resolve the issue:

1. Go to https://vercel.com/tonys-projects-974dbc26/v0-newbornplanetm
2. Click **Deployments** → select the latest successful deployment
3. Click **⋯ → Redeploy** (with "Use existing Build Cache" **unchecked**)

### 2c. Sanity Webhook Not Firing

1. Check `sanityWebhook.status` via the health endpoint.
2. If `unknown`, go to https://www.sanity.io/manage → your project → **API** → **Webhooks**.
3. Verify the webhook URL is `https://v0-newbornplanetm.vercel.app/api/sanity-webhook`.
4. Check the webhook delivery log for failures.
5. If the secret is wrong, update `SANITY_WEBHOOK_SECRET` in Vercel environment variables.

---

## 3. Sanity CMS Backup Status

### How Backups Work

The GitHub Actions workflow `.github/workflows/sanity-backup.yml` runs **daily at 02:00 UTC** and:

1. Exports the full `production` dataset from Sanity to an `.ndjson` file.
2. Commits the file to the **`backups` branch** (orphan — no shared history with `main`).
3. Prunes backups older than the last **30** files automatically.

### Checking Backup Status

**Option 1 — GitHub UI:**

```
https://github.com/PLANETMOTORS/v0-newbornplanetm/tree/backups
```

You should see `.ndjson` files named `sanity-production-YYYY-MM-DDTHH-MM-SS.ndjson`.

**Option 2 — GitHub Actions log:**

```
https://github.com/PLANETMOTORS/v0-newbornplanetm/actions/workflows/sanity-backup.yml
```

Each run shows the document count exported and the file size.

**Option 3 — API:**

```bash
# List the 5 most recent backup files on the backups branch
curl -s \
  -H "Authorization: Bearer <GITHUB_PAT>" \
  "https://api.github.com/repos/PLANETMOTORS/v0-newbornplanetm/contents/?ref=backups" \
  | jq '[.[] | select(.name | endswith(".ndjson")) | {name, size, sha}] | sort_by(.name) | reverse | .[0:5]'
```

### Triggering a Manual Backup

1. Go to https://github.com/PLANETMOTORS/v0-newbornplanetm/actions/workflows/sanity-backup.yml
2. Click **Run workflow** → optionally enter a reason → **Run workflow**.

### Restoring from a Backup

```bash
# 1. Download the backup file
git clone --branch backups --depth=1 \
  https://github.com/PLANETMOTORS/v0-newbornplanetm.git sanity-backups

# 2. Find the file you want to restore
ls -lt sanity-backups/sanity-production-*.ndjson | head -5

# 3. Import into Sanity (requires Sanity CLI + Editor/Admin token)
npx @sanity/cli dataset import \
  sanity-backups/sanity-production-2026-04-23T02-00-00.ndjson \
  production \
  --replace \
  --project wlxj8olw \
  --token <SANITY_ADMIN_TOKEN>
```

> **Warning:** `--replace` overwrites existing documents. Always confirm the target dataset before running.

---

## 4. Infrastructure Secrets Reference

All secrets are stored in two places:
- **Vercel** — used at runtime by the Next.js application
- **GitHub Actions** — used by CI/CD workflows

### Vercel Environment Variables

| Variable | Purpose | Where to Update |
|----------|---------|-----------------|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Sanity project ID (`wlxj8olw`) | Vercel → Settings → Environment Variables |
| `NEXT_PUBLIC_SANITY_DATASET` | Sanity dataset (`production`) | Vercel → Settings → Environment Variables |
| `SANITY_WEBHOOK_SECRET` | Validates incoming Sanity webhook payloads | Vercel → Settings → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Vercel → Settings → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public anon key | Vercel → Settings → Environment Variables |
| `KV_REST_API_URL` | Vercel KV (Redis) endpoint | Vercel → Storage → KV → Connect |
| `KV_REST_API_TOKEN` | Vercel KV auth token | Vercel → Storage → KV → Connect |
| `TYPESENSE_HOST` | Typesense server hostname | Vercel → Settings → Environment Variables |
| `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` | Typesense public search-only key | Vercel → Settings → Environment Variables |
| `HOMENET_SFTP_HOST` | HomenetIOL SFTP server | Vercel → Settings → Environment Variables |
| `HOMENET_SFTP_USERNAME` | HomenetIOL SFTP username | Vercel → Settings → Environment Variables |
| `HOMENET_SFTP_PASSWORD` | HomenetIOL SFTP password | Vercel → Settings → Environment Variables |
| `HOMENET_SFTP_PORT` | HomenetIOL SFTP port (default: 22) | Vercel → Settings → Environment Variables |
| `API_KEY_RESEND` | Resend email API key | Vercel → Settings → Environment Variables |
| `CLERK_SECRET_KEY` | Clerk auth secret | Vercel → Settings → Environment Variables |

### GitHub Actions Secrets

| Secret | Purpose | Where to Update |
|--------|---------|-----------------|
| `SANITY_API_TOKEN` | Sanity Viewer token for daily backup export | GitHub → Settings → Secrets → Actions |
| `KV_REST_API_TOKEN` | Redis access for CI health checks | GitHub → Settings → Secrets → Actions |
| `KV_REST_API_URL` | Redis URL for CI health checks | GitHub → Settings → Secrets → Actions |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL for CI | GitHub → Settings → Secrets → Actions |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key for CI | GitHub → Settings → Secrets → Actions |
| `HOMENET_SFTP_*` | SFTP credentials for inventory sync CI | GitHub → Settings → Secrets → Actions |

> **Rotating a secret:** Update it in **both** Vercel and GitHub Actions. After updating in Vercel, trigger a new deployment for the change to take effect.

### Generating a New Sanity API Token

1. Go to https://www.sanity.io/manage → project `wlxj8olw` → **API** → **Tokens**
2. Click **Add API token**
3. Name: `GitHub Actions Backup (read-only)`
4. Role: **Viewer**
5. Copy the token and update `SANITY_API_TOKEN` in GitHub Actions secrets.

---

## 5. Key Services & Dependencies

| Service | Role | Dashboard |
|---------|------|-----------|
| **Vercel** | Hosting, edge functions, ISR cache | https://vercel.com/tonys-projects-974dbc26/v0-newbornplanetm |
| **Sanity** | CMS (vehicles, pages, blog) | https://www.sanity.io/manage |
| **Supabase** | Database (users, leads, vehicles mirror) | https://supabase.com/dashboard |
| **Vercel KV (Redis)** | Webhook timestamps, rate limiting | Vercel → Storage → KV |
| **Typesense** | Vehicle search index | Your Typesense Cloud dashboard |
| **HomenetIOL** | Inventory feed via SFTP | Automated — check SFTP credentials if stale |
| **Resend** | Transactional email (leads, alerts) | https://resend.com/dashboard |
| **Clerk** | Authentication | https://dashboard.clerk.com |
| **GitHub Actions** | CI/CD, daily Sanity backup | https://github.com/PLANETMOTORS/v0-newbornplanetm/actions |

---

## 6. Runbook: Common Issues

### Content not updating after Sanity publish

1. Check `GET /api/admin/system-health` → `sanityWebhook.status`
2. If `unknown` → webhook hasn't fired. Check Sanity webhook config.
3. If `ok` but content still stale → run `POST /api/admin/system-health` with `{"action":"purge-cache"}`
4. If still stale → force redeploy in Vercel dashboard.

### Inventory not updating (HomenetIOL)

1. Check `GET /api/admin/system-health` → `homenetSync.status`
2. If `stale` → SFTP sync hasn't run in >30 min. Check GitHub Actions → `homenet-sync` workflow.
3. If `unconfigured` → `HOMENET_SFTP_*` env vars are missing in Vercel.
4. Manually trigger the sync workflow from GitHub Actions UI.

### Search returning no results

1. Check `GET /api/admin/system-health` → `typesense.status`
2. If `unconfigured` → `TYPESENSE_HOST` or `NEXT_PUBLIC_TYPESENSE_SEARCH_KEY` missing in Vercel.
3. If `ok` but no results → check Typesense Cloud dashboard for collection status.
4. Re-index: trigger the `typesense-sync` cron job manually via `GET /api/cron/typesense-sync` (requires `CRON_SECRET` header).

### Backup workflow failing

1. Go to https://github.com/PLANETMOTORS/v0-newbornplanetm/actions/workflows/sanity-backup.yml
2. Check the failed run log for the error.
3. Common causes:
   - `SANITY_API_TOKEN` expired or revoked → generate a new token (see §4).
   - Sanity dataset export returned 0 documents → check Sanity project status.
   - `backups` branch protection → the workflow uses `GITHUB_TOKEN` with `contents: write`.

### 401 on /api/admin/system-health

- You are not logged in as an admin user.
- Your email is not in `ADMIN_EMAILS` (`lib/admin.ts`).
- Your Supabase session has expired — log out and log back in.

---

*This document is maintained in the repository root. To update it, edit `MAINTENANCE_README.md` and open a PR against `main`.*
