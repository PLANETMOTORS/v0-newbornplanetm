/**
 * lib/cms/backup.ts
 *
 * Sanity CMS Backup Utility
 *
 * Exports the full Sanity dataset to a timestamped NDJSON file in the
 * local backups/ directory by shelling out to the Sanity CLI
 * (`npx @sanity/cli dataset export`).
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

import { execSync } from "node:child_process"
import { mkdirSync, statSync, existsSync, readFileSync } from "node:fs"
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
  return new Date().toISOString().replaceAll(/:/g, "-").replace(/\.\d{3}Z$/, "")
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
 * Uses `npx @sanity/cli dataset export` (Sanity CLI v3) via child_process.
 * The CLI streams all documents as newline-delimited JSON directly to disk.
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
    // Shell out to the Sanity CLI — this is the officially supported export method.
    // --no-compress keeps the output as plain NDJSON (not .tar.gz).
    // --overwrite allows re-running without manual cleanup.
    const cmd = [
      `npx --yes @sanity/cli@latest`,
      `dataset export "${DATASET}" "${filePath}"`,
      `--project "${PROJECT_ID}"`,
      `--token "${token}"`,
      `--no-compress`,
      `--overwrite`,
    ].join(" ")

    execSync(cmd, {
      stdio: "pipe",
      env: { ...process.env, SANITY_AUTH_TOKEN: token },
      timeout: 120_000, // 2 minute timeout
    })

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

const isMain =
  typeof require !== "undefined" &&
  require.main === module

if (isMain) {
  backupSanityDataset().then((result) => {
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
  })
}
