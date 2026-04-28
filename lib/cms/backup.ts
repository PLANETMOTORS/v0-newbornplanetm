/**
 * lib/cms/backup.ts
 *
 * Sanity CMS Backup Utility
 *
 * Exports the full Sanity dataset to a timestamped NDJSON file in the
 * local backups/ directory using the Sanity HTTP Export API.
 *
 * Usage (run directly with tsx):
 *   SANITY_API_TOKEN=<token> npx tsx lib/cms/backup.ts
 *
 * Or via the npm script (after setting SANITY_API_TOKEN in .env.local):
 *   pnpm backup:sanity
 *
 * Output:
 *   backups/sanity-production-YYYY-MM-DDTHH-MM-SS.ndjson
 *
 * The backups/ directory is in .gitignore — files are never committed to main.
 * For automated daily backups, see .github/workflows/sanity-backup.yml which
 * commits to the orphan `backups` branch instead.
 *
 * Environment variables required:
 *   SANITY_API_TOKEN  — a Sanity token with "Viewer" role or higher
 *   NEXT_PUBLIC_SANITY_PROJECT_ID — project ID (falls back to hardcoded value)
 */

import { mkdirSync, statSync, existsSync, readFileSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { logger } from "@/lib/logger"

// ── Config ─────────────────────────────────────────────────────────────────

const PROJECT_ID =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ||
  process.env.SANITY_PROJECT_ID ||
  "wlxj8olw"

const DATASET = process.env.NEXT_PUBLIC_SANITY_DATASET || "production"

const BACKUPS_DIR = join(process.cwd(), "backups")

// ── Helpers ────────────────────────────────────────────────────────────────

/** Returns a filesystem-safe ISO timestamp: 2025-04-23T08-30-00 */
function safeTimestamp(): string {
  return new Date().toISOString().replaceAll(":", "-").replace(/\.\d{3}Z$/, "")
}

/** Ensures the backups/ directory exists */
function ensureBackupsDir(): void {
  mkdirSync(BACKUPS_DIR, { recursive: true })
}

/**
 * Validate that the exported file is non-empty and contains valid NDJSON.
 * Reads the first line and attempts JSON.parse — fast and sufficient.
 */
function validateNdjson(filePath: string): { valid: boolean; lineCount: number; error?: string } {
  if (!existsSync(filePath)) {
    return { valid: false, lineCount: 0, error: "File does not exist" }
  }

  const content = readFileSync(filePath, "utf8")
  const lines = content.split("\n").filter((l) => l.trim().length > 0)

  if (lines.length === 0) {
    return { valid: false, lineCount: 0, error: "File is empty" }
  }

  try {
    JSON.parse(lines[0])
    return { valid: true, lineCount: lines.length }
  } catch {
    return { valid: false, lineCount: lines.length, error: "First line is not valid JSON" }
  }
}

// ── Types ──────────────────────────────────────────────────────────────────

export interface BackupResult {
  success: boolean
  filePath?: string
  sizeBytes?: number
  lineCount?: number
  durationMs?: number
  error?: string
}

// ── Main export ────────────────────────────────────────────────────────────

/**
 * Export the full Sanity dataset to a local NDJSON file.
 *
 * Uses the Sanity HTTP Export API (no shell commands required):
 * GET https://<projectId>.api.sanity.io/v2021-06-07/data/export/<dataset>
 *
 * @returns BackupResult — never throws; errors are captured in the result object
 */
export async function backupSanityDataset(): Promise<BackupResult> {
  const startedAt = Date.now()

  const token = process.env.SANITY_API_TOKEN
  if (!token) {
    const error = "SANITY_API_TOKEN is not set — cannot export dataset"
    logger.error(`[Sanity Backup] ${error}`)
    return { success: false, error }
  }

  ensureBackupsDir()

  const fileName = `sanity-${DATASET}-${safeTimestamp()}.ndjson`
  const filePath = join(BACKUPS_DIR, fileName)

  logger.info(`[Sanity Backup] Starting export: project=${PROJECT_ID} dataset=${DATASET}`)
  logger.info(`[Sanity Backup] Output: ${filePath}`)

  try {
    // Use the Sanity HTTP Export API — no shell commands needed.
    // This is the officially supported programmatic export method.
    const exportUrl = `https://${PROJECT_ID}.api.sanity.io/v2021-06-07/data/export/${DATASET}`

    const response = await fetch(exportUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: AbortSignal.timeout(120_000), // 2 minute timeout
    })

    if (!response.ok) {
      throw new Error(`Sanity Export API returned ${response.status}: ${response.statusText}`)
    }

    const ndjsonText = await response.text()
    writeFileSync(filePath, ndjsonText, "utf8")

    // ── Validate the output ──────────────────────────────────────────────
    const validation = validateNdjson(filePath)
    if (!validation.valid) {
      return {
        success: false,
        error: `Validation failed: ${validation.error}`,
        durationMs: Date.now() - startedAt,
      }
    }

    const { size: sizeBytes } = statSync(filePath)
    const durationMs = Date.now() - startedAt

    logger.info(
      `[Sanity Backup] Export complete: ${fileName} ` +
      `(${(sizeBytes / 1024).toFixed(1)} KB, ${validation.lineCount} docs, ${durationMs}ms)`
    )

    return {
      success: true,
      filePath,
      sizeBytes,
      lineCount: validation.lineCount,
      durationMs,
    }
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err)
    logger.error(`[Sanity Backup] Export failed:`, error)
    return { success: false, error, durationMs: Date.now() - startedAt }
  }
}

// ── CLI entry point ────────────────────────────────────────────────────────
// Runs when executed directly: npx tsx lib/cms/backup.ts

// S7785: top-level await is unavailable here — tsconfig's `target` is ES6
// to keep Next.js Turbopack output compatible with the broadest browser
// matrix, and ESnext top-level await requires target ES2017+. We therefore
// keep the explicit `main()` invocation guarded by the CommonJS marker.
const isMain =
  typeof require !== "undefined" &&
  require.main === module

async function main() {
  const result = await backupSanityDataset()
  if (result.success) {
    console.log(`\nBackup saved to: ${result.filePath}`)
    console.log(`  Size:      ${((result.sizeBytes ?? 0) / 1024).toFixed(1)} KB`)
    console.log(`  Documents: ${result.lineCount}`)
    console.log(`  Duration:  ${result.durationMs}ms`)
    process.exit(0)
  } else {
    console.error(`\nBackup failed: ${result.error}`)
    process.exit(1)
  }
}

if (isMain) {
  // NOSONAR S7785 — top-level await requires `target: ES2017+`; see comment above.
  void main()
}
