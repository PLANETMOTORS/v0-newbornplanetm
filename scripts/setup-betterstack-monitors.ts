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
 */

import { runCli } from "@/lib/monitoring/betterstack-sync"

void runCli({
  env: process.env,
  fetchImpl: fetch,
  stdout: (chunk) => process.stdout.write(chunk),
  stderr: (chunk) => process.stderr.write(chunk),
}).then((code) => {
  if (code !== 0) process.exit(code)
})
