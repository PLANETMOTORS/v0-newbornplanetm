/**
 * scripts/setup-betterstack-monitors.ts
 *
 * Thin CLI shim. All logic lives in lib/monitoring/betterstack-sync.ts so it
 * can be unit-tested and reused from a future cron / Inngest job.
 *
 * Usage:
 *   BETTER_STACK_API_TOKEN=<token> npx tsx scripts/setup-betterstack-monitors.ts
 *
 * Optional env:
 *   BASE_URL=https://www.planetmotors.ca   (defaults to www.planetmotors.ca)
 *   DRY_RUN=1                              (print actions, no writes)
 *
 * Notes:
 *   - Uses a relative import (`../lib/...`) rather than the `@/` alias so the
 *     script runs reliably under `tsx` even if path-alias resolution is not
 *     wired up for CLI execution. Matches the convention used by other files
 *     in this directory.
 *   - `runCli` returns a numeric exit code; we still attach a defensive
 *     `.catch` so any unexpected synchronous throw inside the shim itself
 *     (e.g. stdout pipe broken) is surfaced and the process exits non-zero
 *     instead of dangling as an unhandled rejection.
 */

import { runCli } from "../lib/monitoring/betterstack-sync"

void runCli({
  env: process.env,
  fetchImpl: fetch,
  stdout: (chunk) => process.stdout.write(chunk),
  stderr: (chunk) => process.stderr.write(chunk),
})
  .then((code) => {
    if (code !== 0) process.exit(code)
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : "unknown error"
    process.stderr.write(`Better Stack sync crashed: ${message}\n`)
    process.exit(1)
  })
