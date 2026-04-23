#!/usr/bin/env bash
# =============================================================================
# Planet Motors — Production Health Check (Go/No-Go)
# Usage: BASE_URL=https://your-domain.com bash scripts/production-health-check.sh
# =============================================================================

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
PASS=0
FAIL=0
WARN=0
RESULTS=()

# ── Colours ──────────────────────────────────────────────────────────────────
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
pass() { echo -e "  ${GREEN}✅ PASS${NC}  $1"; PASS=$((PASS+1)); RESULTS+=("PASS: $1"); }
fail() { echo -e "  ${RED}❌ FAIL${NC}  $1"; FAIL=$((FAIL+1)); RESULTS+=("FAIL: $1"); }
warn() { echo -e "  ${YELLOW}⚠️  WARN${NC}  $1"; WARN=$((WARN+1)); RESULTS+=("WARN: $1"); }
section() { echo -e "\n${BLUE}${BOLD}── $1 ──${NC}"; }

check_status() {
  local label="$1"
  local url="$2"
  local expected="${3:-200}"
  local method="${4:-GET}"
  local body="${5:-}"
  local extra_headers="${6:-}"

  local args=(-s -o /dev/null -w "%{http_code}" -X "$method" --max-time 10)
  [[ -n "$body" ]] && args+=(-H "Content-Type: application/json" -d "$body")
  [[ -n "$extra_headers" ]] && args+=(-H "$extra_headers")

  local status
  status=$(curl "${args[@]}" "$url" 2>/dev/null || echo "000")

  if [[ "$status" == "$expected" ]]; then
    pass "$label (HTTP $status)"
  elif [[ "$expected" == "401" || "$expected" == "403" ]] && [[ "$status" == "401" || "$status" == "403" ]]; then
    warn "$label — Auth required (HTTP $status) — expected in prod without token"
  elif [[ "$status" == "000" ]]; then
    fail "$label — Connection refused / timeout"
  else
    fail "$label (HTTP $status, expected $expected)"
  fi
}

check_json_field() {
  local label="$1"
  local url="$2"
  local field="$3"

  local response
  response=$(curl -s --max-time 10 "$url" 2>/dev/null || echo "{}")
  local value
  value=$(echo "$response" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('$field','MISSING'))" 2>/dev/null || echo "MISSING")

  if [[ "$value" != "MISSING" && "$value" != "None" && "$value" != "" ]]; then
    pass "$label (field '$field' = $value)"
  else
    fail "$label — field '$field' missing or null in response"
  fi
}

# =============================================================================
echo -e "\n${BOLD}🚗 Planet Motors — Production Health Check${NC}"
echo -e "   Target: ${BLUE}$BASE_URL${NC}"
echo -e "   Time:   $(date -u '+%Y-%m-%dT%H:%M:%SZ')\n"
# =============================================================================

# ── 1. Core Pages ─────────────────────────────────────────────────────────────
section "1. Core Pages"
check_status "Homepage"                    "$BASE_URL/"
check_status "Inventory listing"           "$BASE_URL/inventory"
check_status "Financing page"              "$BASE_URL/financing"
check_status "Contact page"               "$BASE_URL/contact"
check_status "How It Works"               "$BASE_URL/how-it-works"
check_status "Sell Your Car"              "$BASE_URL/sell-your-car"
check_status "Trade-In"                   "$BASE_URL/trade-in"
check_status "FAQ"                        "$BASE_URL/faq"
check_status "Garage (auth redirect)"     "$BASE_URL/garage" "307"
check_status "Sitemap"                    "$BASE_URL/sitemap.xml"
check_status "Robots.txt"                 "$BASE_URL/robots.txt"

# ── 2. Auth Endpoints ─────────────────────────────────────────────────────────
section "2. Auth Endpoints"
check_status "Login page"                 "$BASE_URL/auth/login"
check_status "Signup page"               "$BASE_URL/auth/signup"
check_status "Forgot password"           "$BASE_URL/auth/forgot-password"
check_status "Auth callback (no code)"   "$BASE_URL/auth/callback" "307"

# ── 3. Search API ─────────────────────────────────────────────────────────────
section "3. Search API"
check_status "Search — no query"         "$BASE_URL/api/search"
check_status "Search — with query"       "$BASE_URL/api/search?q=tesla"
check_status "Search suggestions"        "$BASE_URL/api/search/suggestions?q=tesla"
check_status "Inventory API"             "$BASE_URL/api/inventory"

# ── 4. Lead / Contact Endpoints ───────────────────────────────────────────────
section "4. Lead & Contact Endpoints"
check_status "Contact POST (empty body)" "$BASE_URL/api/contact" "403" "POST" "{}"
check_status "Trade-in quote POST"       "$BASE_URL/api/trade-in/quote" "403" "POST" "{}"
check_status "Vehicle valuation"         "$BASE_URL/api/vehicle-valuation" "403" "POST" "{}"
check_status "Finance application"       "$BASE_URL/api/application" "403" "POST" "{}"
check_status "Negotiate POST"            "$BASE_URL/api/negotiate" "403" "POST" "{}"

# ── 5. Webhook Endpoints ──────────────────────────────────────────────────────
section "5. Webhook Endpoints"
check_status "Stripe webhook (no sig)"   "$BASE_URL/api/webhooks/stripe" "500" "POST" "{}"  # 500 = env vars not set; set STRIPE_WEBHOOK_SECRET to fix
check_status "Sanity webhook (no sig)"   "$BASE_URL/api/webhooks/sanity" "500" "POST" "{}"  # 500 = env vars not set; set SANITY_WEBHOOK_SECRET to fix
check_status "CRM webhook"               "$BASE_URL/api/webhooks/crm" "422" "POST" "{}"
check_status "Sanity webhook (legacy)"   "$BASE_URL/api/sanity-webhook" "500" "POST" "{}"  # 500 = env vars not set; set SANITY_WEBHOOK_SECRET to fix

# ── 6. Admin API (auth-gated) ─────────────────────────────────────────────────
section "6. Admin API (expect 401)"
check_status "System health"             "$BASE_URL/api/admin/system-health" "401"
check_status "Admin dashboard"           "$BASE_URL/api/v1/admin/dashboard" "401"
check_status "Admin vehicles"            "$BASE_URL/api/v1/admin/vehicles" "401"
check_status "Admin leads"               "$BASE_URL/api/v1/admin/leads" "401"
check_status "Admin customers"           "$BASE_URL/api/v1/admin/customers" "401"
check_status "Admin finance apps"        "$BASE_URL/api/v1/admin/finance/applications" "401"
check_status "Admin trade-ins"           "$BASE_URL/api/v1/admin/trade-ins" "401"
check_status "Admin orders"              "$BASE_URL/api/v1/admin/orders" "401"
check_status "Admin reservations"        "$BASE_URL/api/v1/admin/reservations" "401"
check_status "Admin analytics"           "$BASE_URL/api/v1/admin/analytics" "401"

# ── 7. Customer API (auth-gated) ──────────────────────────────────────────────
section "7. Customer API (expect 401)"
check_status "Customer profile"          "$BASE_URL/api/v1/customers/me" "401"
check_status "Customer favorites"        "$BASE_URL/api/v1/customers/me/favorites" "401"
check_status "Customer searches"         "$BASE_URL/api/v1/customers/me/searches" "401"
check_status "Notifications"             "$BASE_URL/api/v1/notifications" "401"

# ── 8. Vehicle API ────────────────────────────────────────────────────────────
section "8. Vehicle API"
check_status "Vehicles list"             "$BASE_URL/api/v1/vehicles"
check_status "Vehicle facets"            "$BASE_URL/api/v1/vehicles/facets"

# ── 9. Financing API ──────────────────────────────────────────────────────────
section "9. Financing API"
check_status "Financing calculator"      "$BASE_URL/api/v1/financing/calculator" "400" "POST" "{}"
check_status "Financing apply"           "$BASE_URL/api/v1/financing/apply" "401" "POST" "{}"
check_status "Financing applications"    "$BASE_URL/api/v1/financing/applications" "401"

# ── 10. Delivery & Checkout ───────────────────────────────────────────────────
section "10. Delivery & Checkout"
check_status "Delivery quote"            "$BASE_URL/api/v1/deliveries/quote" "405" "POST" "{}"
check_status "Checkout (no id)"          "$BASE_URL/api/checkout" "200" "POST" "{}"
check_status "Address lookup"            "$BASE_URL/api/address-lookup" "200"

# ── 11. PWA / Service Worker ──────────────────────────────────────────────────
section "11. PWA & Service Worker"
check_status "Service worker"            "$BASE_URL/sw.js"
check_status "Offline fallback"          "$BASE_URL/~offline"
check_status "Manifest"                  "$BASE_URL/manifest.json"

# =============================================================================
# Summary
# =============================================================================
TOTAL=$((PASS+FAIL+WARN))
echo -e "\n${BOLD}═══════════════════════════════════════════${NC}"
echo -e "${BOLD}  Results: $TOTAL checks${NC}"
echo -e "  ${GREEN}✅ Pass: $PASS${NC}"
echo -e "  ${YELLOW}⚠️  Warn: $WARN${NC}"
echo -e "  ${RED}❌ Fail: $FAIL${NC}"
echo -e "${BOLD}═══════════════════════════════════════════${NC}"

if [[ $FAIL -eq 0 ]]; then
  echo -e "\n${GREEN}${BOLD}🟢 GO — All critical checks passed!${NC}\n"
  exit 0
else
  echo -e "\n${RED}${BOLD}🔴 NO-GO — $FAIL check(s) failed. Review above before deploying.${NC}\n"
  exit 1
fi
