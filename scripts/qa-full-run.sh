#!/bin/bash
# Planet Motors — Full QA Runner
# Runs: 12x local (unit + E2E + typecheck + lint) then 7x BrowserStack
# Usage: bash scripts/qa-full-run.sh

set -euo pipefail

REPORT_FILE="QA_MASTER_REPORT.md"
LOG_DIR="qa-logs"
mkdir -p "$LOG_DIR"

PASS=0
FAIL=0
TOTAL_RUNS=12
BS_RUNS=7

BROWSERSTACK_USERNAME="${BROWSERSTACK_USERNAME:?BROWSERSTACK_USERNAME env var is required}"
BROWSERSTACK_ACCESS_KEY="${BROWSERSTACK_ACCESS_KEY:?BROWSERSTACK_ACCESS_KEY env var is required}"

echo "# Planet Motors — Full QA Master Report" > "$REPORT_FILE"
echo "**Started:** $(date)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

run_local() {
  local RUN=$1
  local LOG="$LOG_DIR/run-${RUN}.log"
  echo "=== LOCAL QA RUN $RUN/$TOTAL_RUNS — $(date) ===" | tee -a "$LOG"

  # Unit tests
  echo "--- Vitest Unit Tests ---" | tee -a "$LOG"
  pnpm test 2>&1 | tee -a "$LOG" | grep -E "Tests|passed|failed|✓|✗" | tail -3

  # E2E
  echo "--- Playwright E2E (chromium) ---" | tee -a "$LOG"
  pnpm test:e2e --project=chromium 2>&1 | tee -a "$LOG" | grep -E "passed|failed|skipped" | tail -3

  # TypeScript
  echo "--- TypeScript ---" | tee -a "$LOG"
  pnpm typecheck 2>&1 | tee -a "$LOG" | tail -3

  # Lint
  echo "--- ESLint ---" | tee -a "$LOG"
  pnpm lint 2>&1 | tee -a "$LOG" | tail -5

  echo "=== RUN $RUN COMPLETE ===" | tee -a "$LOG"
}

for run in $(seq 1 $TOTAL_RUNS); do
  run_local $run
done

echo "" >> "$REPORT_FILE"
echo "## BrowserStack Runs" >> "$REPORT_FILE"

for bs_run in $(seq 1 $BS_RUNS); do
  echo "=== BROWSERSTACK RUN $bs_run/$BS_RUNS — $(date) ===" | tee -a "$LOG_DIR/bs-run-${bs_run}.log"
  BROWSERSTACK_USERNAME="$BROWSERSTACK_USERNAME" \
  BROWSERSTACK_ACCESS_KEY="$BROWSERSTACK_ACCESS_KEY" \
  pnpm playwright test --config=playwright.browserstack.config.ts --project=bs-chrome-win11 2>&1 \
    | tee -a "$LOG_DIR/bs-run-${bs_run}.log" \
    | grep -E "passed|failed|skipped" | tail -3
  echo "=== BS RUN $bs_run COMPLETE ===" | tee -a "$LOG_DIR/bs-run-${bs_run}.log"
done

echo "ALL RUNS COMPLETE — $(date)"
