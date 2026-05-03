#!/usr/bin/env bash
# =============================================================================
# Planet Motors — Project Health Check
# =============================================================================
# Combines: env audit, Next.js config check, TypeScript, security scan,
# and dependency audit into one CI-friendly command.
#
# Usage:
#   ./scripts/health-check.sh            # Run all checks
#   ./scripts/health-check.sh --env      # Environment variable audit only
#   ./scripts/health-check.sh --types    # TypeScript check only
#   ./scripts/health-check.sh --security # Security scan only
#   ./scripts/health-check.sh --deps     # Dependency audit only
#   ./scripts/health-check.sh --config   # Next.js config validation only
#
# Exit codes:
#   0 — All checks passed
#   1 — One or more checks failed (see report)
# =============================================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS="${GREEN}✔${NC}"; FAIL="${RED}✘${NC}"; WARN="${YELLOW}⚠${NC}"
EXIT_CODE=0
REPORT=""

log()  { echo -e "${CYAN}▶${NC} $1"; }
pass() { REPORT+="  ${PASS} $1\n"; }
warn() { REPORT+="  ${WARN} $1\n"; }
fail() { REPORT+="  ${FAIL} $1\n"; EXIT_CODE=1; }

# ── Selective run ────────────────────────────────────────────────────────
RUN_ALL=true; RUN_ENV=false; RUN_TYPES=false; RUN_SEC=false; RUN_DEPS=false; RUN_CFG=false
for arg in "$@"; do
  case "$arg" in
    --env)      RUN_ALL=false; RUN_ENV=true ;;
    --types)    RUN_ALL=false; RUN_TYPES=true ;;
    --security) RUN_ALL=false; RUN_SEC=true ;;
    --deps)     RUN_ALL=false; RUN_DEPS=true ;;
    --config)   RUN_ALL=false; RUN_CFG=true ;;
    --help|-h)  head -17 "$0" | tail -11; exit 0 ;;
  esac
done

# ── 1. Environment Variable Audit ───────────────────────────────────────
run_env_audit() {
  log "Environment Variable Audit"
  # Extract all process.env.* references from source (excluding tests/scripts/node_modules)
  USED=$(grep -roh --include='*.ts' --include='*.tsx' --include='*.mjs' \
    'process\.env\.[A-Z_a-z0-9]*' \
    app/ lib/ components/ middleware.ts sentry.*.ts next.config.mjs 2>/dev/null \
    | sed 's/process\.env\.//' | sort -u)

  # Extract vars declared in lib/env.ts validation schema
  DECLARED=$(grep -oE '[A-Z_]{2,}:' lib/env.ts 2>/dev/null | tr -d ':' | sort -u)
  # Also include carfax env
  DECLARED+=$'\n'$(grep -oE '[A-Z_]{2,}:' lib/carfax/env.ts 2>/dev/null | tr -d ':' | sort -u)
  DECLARED=$(echo "$DECLARED" | sort -u)

  UNVALIDATED=$(comm -23 <(echo "$USED") <(echo "$DECLARED") \
    | grep -v '^CI$' | grep -v '^NEXT_RUNTIME$' | grep -v '^VERCEL_URL$' \
    | grep -v '^NEXT_PUBLIC_VERCEL_URL$' | grep -v '^ANALYZE$' || true)

  COUNT=$(echo "$UNVALIDATED" | grep -c '[A-Z]' || true)
  if [ "$COUNT" -gt 0 ]; then
    warn "${COUNT} env vars used in source but missing from lib/env.ts validation:"
    while read -r v; do [ -n "$v" ] && REPORT+="      → $v\n" && echo -e "      → $v"; done <<< "$UNVALIDATED"
  else
    pass "All env vars are validated in lib/env.ts"
  fi
}

# ── 2. Next.js Config Validation ────────────────────────────────────────
run_config_check() {
  log "Next.js Config Validation"
  # Check for deprecated options
  if grep -q 'swcMinify' next.config.mjs 2>/dev/null; then
    fail "next.config.mjs uses deprecated 'swcMinify' (default in Next 15+)"
  else
    pass "No deprecated config options found"
  fi
  # Check for sitemap rewrite conflict
  if grep -q 'sitemap\.xml.*api/sitemap' next.config.mjs 2>/dev/null; then
    fail "Sitemap rewrite to /api/sitemap still present — conflicts with app/sitemap.ts"
  else
    pass "No sitemap rewrite conflict"
  fi
  # Verify Next.js version is current
  NEXT_VER=$(node -e "console.log(require('./node_modules/next/package.json').version)" 2>/dev/null || echo "unknown")
  pass "Next.js version: ${NEXT_VER}"
}

# ── 3. TypeScript Strict Mode ───────────────────────────────────────────
run_typecheck() {
  log "TypeScript Strict Mode Check"
  if npx tsc --noEmit 2>&1; then
    pass "TypeScript compilation: zero errors"
  else
    fail "TypeScript compilation failed (run 'npx tsc --noEmit' for details)"
  fi
}

# ── 4. Security Scan ────────────────────────────────────────────────────
run_security_scan() {
  log "Security Scan — hardcoded secrets"
  HITS=$(grep -rn --include='*.ts' --include='*.tsx' --include='*.mjs' --include='*.js' \
    -E '(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{36}|AKIA[0-9A-Z]{16}|-----BEGIN (RSA |EC )?PRIVATE KEY)' \
    --exclude-dir=node_modules --exclude-dir=.next --exclude-dir=.git \
    --exclude-dir=__tests__ --exclude-dir=e2e 2>/dev/null || true)
  if [ -n "$HITS" ]; then
    fail "Hardcoded secrets detected:\n$HITS"
  else
    pass "No hardcoded API keys or private keys in source"
  fi
  # Check for .env files that shouldn't be committed
  COMMITTED_ENV=$(git ls-files '*.env' '.env.*' 2>/dev/null | grep -v '.env.example' || true)
  if [ -n "$COMMITTED_ENV" ]; then
    warn "Committed .env files (should these be in .gitignore?):\n      ${COMMITTED_ENV//$'\n'/\\n      }"
  else
    pass "No .env files committed to git"
  fi
}

# ── 5. Dependency Audit ─────────────────────────────────────────────────
run_dep_audit() {
  log "Dependency Audit"
  AUDIT_OUT=$(pnpm audit 2>&1 || true)
  VULN_COUNT=$(echo "$AUDIT_OUT" | grep -c 'vulnerabilit' || true)
  if echo "$AUDIT_OUT" | grep -q '0 vulnerabilities'; then
    pass "No known vulnerabilities"
  else
    SUMMARY=$(echo "$AUDIT_OUT" | tail -2)
    fail "Vulnerabilities found: ${SUMMARY}"
  fi
}

# ── Run checks ──────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}━━━ Planet Motors Health Check ━━━${NC}"
echo ""

if $RUN_ALL || $RUN_ENV;   then run_env_audit;     echo ""; fi
if $RUN_ALL || $RUN_CFG;   then run_config_check;  echo ""; fi
if $RUN_ALL || $RUN_TYPES; then run_typecheck;      echo ""; fi
if $RUN_ALL || $RUN_SEC;   then run_security_scan;  echo ""; fi
if $RUN_ALL || $RUN_DEPS;  then run_dep_audit;      echo ""; fi

# ── Summary ─────────────────────────────────────────────────────────────
echo -e "${CYAN}━━━ Summary ━━━${NC}"
echo -e "$REPORT"
if [ $EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}All checks passed.${NC}"
else
  echo -e "${RED}Some checks need attention (exit code $EXIT_CODE).${NC}"
fi
exit $EXIT_CODE
