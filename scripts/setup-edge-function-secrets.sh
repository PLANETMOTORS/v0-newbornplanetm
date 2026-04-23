#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# Setup Supabase Edge Function Secrets
# ──────────────────────────────────────────────────────────────────────
# Run this script once to configure the secrets required by the
# capture-lead, finance-prequalify, and price-drop-alert Edge Functions.
#
# Prerequisites:
#   - Supabase CLI installed: brew install supabase/tap/supabase
#   - Logged in: supabase login
#   - Project linked: supabase link --project-ref <project-ref>
#
# Usage:
#   ./scripts/setup-edge-function-secrets.sh
# ──────────────────────────────────────────────────────────────────────

set -euo pipefail

echo "=== Supabase Edge Function Secrets Setup ==="
echo ""
echo "This will set the following secrets in your Supabase project:"
echo "  - AUTORAPTOR_ADF_ENDPOINT"
echo "  - AUTORAPTOR_DEALER_ID"
echo "  - AUTORAPTOR_DEALER_NAME"
echo "  - RESEND_API_KEY"
echo "  - ADMIN_EMAIL"
echo "  - FROM_EMAIL"
echo "  - SITE_URL (for price-drop-alert email links)"
echo ""
echo "Note: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are auto-injected"
echo "by Supabase and do not need to be set manually."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
  echo "Error: supabase CLI not found. Install it first:"
  echo "  brew install supabase/tap/supabase"
  exit 1
fi

# Prompt for secrets
read -rp "AUTORAPTOR_ADF_ENDPOINT (URL): " AUTORAPTOR_ADF_ENDPOINT
read -rp "AUTORAPTOR_DEALER_ID: " AUTORAPTOR_DEALER_ID
read -rp "AUTORAPTOR_DEALER_NAME [Planet Motors]: " AUTORAPTOR_DEALER_NAME
AUTORAPTOR_DEALER_NAME=${AUTORAPTOR_DEALER_NAME:-"Planet Motors"}
read -rp "RESEND_API_KEY: " RESEND_API_KEY
read -rp "ADMIN_EMAIL [toni@planetmotors.ca]: " ADMIN_EMAIL
ADMIN_EMAIL=${ADMIN_EMAIL:-"toni@planetmotors.ca"}
read -rp "FROM_EMAIL [Planet Motors <notifications@planetmotors.ca>]: " FROM_EMAIL
FROM_EMAIL=${FROM_EMAIL:-"Planet Motors <notifications@planetmotors.ca>"}
read -rp "SITE_URL [https://planetmotors.ca]: " SITE_URL
SITE_URL=${SITE_URL:-"https://planetmotors.ca"}

echo ""
echo "Setting secrets..."

supabase secrets set \
  AUTORAPTOR_ADF_ENDPOINT="$AUTORAPTOR_ADF_ENDPOINT" \
  AUTORAPTOR_DEALER_ID="$AUTORAPTOR_DEALER_ID" \
  AUTORAPTOR_DEALER_NAME="$AUTORAPTOR_DEALER_NAME" \
  RESEND_API_KEY="$RESEND_API_KEY" \
  ADMIN_EMAIL="$ADMIN_EMAIL" \
  FROM_EMAIL="$FROM_EMAIL" \
  SITE_URL="$SITE_URL"

echo ""
echo "Secrets set successfully."
echo ""
echo "To deploy the Edge Functions:"
echo "  supabase functions deploy capture-lead"
echo "  supabase functions deploy finance-prequalify"
echo "  supabase functions deploy price-drop-alert"
