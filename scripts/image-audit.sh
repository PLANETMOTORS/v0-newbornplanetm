#!/usr/bin/env bash
# scripts/image-audit.sh
#
# Image Pipeline Stress Test
# Fetches all blogPost and vehicle documents from Sanity, extracts their
# image URLs, and validates that lib/sanity/image.ts transformation params
# (auto=format, q=80, fit=max) are correctly appended.
#
# Usage:
#   chmod +x scripts/image-audit.sh
#   SANITY_API_TOKEN=<read-token> ./scripts/image-audit.sh
#
# Requirements: curl, jq

set -euo pipefail

PROJECT_ID="${NEXT_PUBLIC_SANITY_PROJECT_ID:-wlxj8olw}"
DATASET="production"
API_VERSION="2025-04-01"
TOKEN="${SANITY_API_TOKEN:-}"

if [[ -z "$TOKEN" ]]; then
  echo "❌  SANITY_API_TOKEN is required (read access is sufficient)"
  echo "    Get one at: https://www.sanity.io/manage/project/${PROJECT_ID}/api"
  exit 1
fi

BASE_URL="https://${PROJECT_ID}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}"

echo ""
echo "🔍  Planet Motors — Sanity Image Pipeline Audit"
echo "    Project: ${PROJECT_ID} / Dataset: ${DATASET}"
echo ""

# ─── Fetch image URLs from Sanity ────────────────────────────────────────────

QUERY='*[_type in ["blogPost","vehicle"]] {
  _type,
  _id,
  "mainImage": mainImage.asset->url,
  "coverImage": coverImage.asset->url,
  "images": images[].asset->url
}'

ENCODED_QUERY=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")

RESPONSE=$(curl -sf \
  -H "Authorization: Bearer ${TOKEN}" \
  "${BASE_URL}?query=${ENCODED_QUERY}" 2>&1) || {
  echo "❌  Sanity API request failed:"
  echo "    $RESPONSE"
  exit 1
}

TOTAL_DOCS=$(echo "$RESPONSE" | jq '.result | length')
echo "📦  Found ${TOTAL_DOCS} documents (blogPost + vehicle)"
echo ""

# ─── Extract and validate image URLs ─────────────────────────────────────────

PASS=0
FAIL=0
SKIP=0

# Collect all image URLs into a flat list
ALL_URLS=$(echo "$RESPONSE" | jq -r '
  .result[] |
  [.mainImage, .coverImage] + (.images // []) |
  .[] |
  select(. != null and . != "")
')

TOTAL_URLS=$(echo "$ALL_URLS" | grep -c "cdn.sanity.io" || true)
echo "🖼️   Found ${TOTAL_URLS} Sanity CDN image URLs to validate"
echo ""

# Validate each URL
while IFS= read -r url; do
  [[ -z "$url" ]] && continue

  if [[ "$url" != *"cdn.sanity.io"* ]]; then
    echo "  ⏭️  SKIP (external): ${url:0:80}"
    ((SKIP++)) || true
    continue
  fi

  # Check for required transformation params
  MISSING=()
  [[ "$url" != *"auto=format"* ]] && MISSING+=("auto=format")
  [[ "$url" != *"q=80"* ]] && MISSING+=("q=80")
  [[ "$url" != *"fit=max"* && "$url" != *"fit=crop"* ]] && MISSING+=("fit=max|crop")

  if [[ ${#MISSING[@]} -eq 0 ]]; then
    echo "  ✅  OK: ${url:0:100}"
    ((PASS++)) || true
  else
    echo "  ❌  MISSING [${MISSING[*]}]: ${url:0:100}"
    ((FAIL++)) || true
  fi
done <<< "$ALL_URLS"

echo ""
echo "─────────────────────────────────────────────────────"
echo "📊  Results: ${PASS} ✅ pass · ${FAIL} ❌ fail · ${SKIP} ⏭️ skipped"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "⚠️  ACTION REQUIRED:"
  echo "   Wrap raw Sanity CDN URLs with sanityImage() from lib/sanity/image.ts"
  echo "   before passing them to <img> or <Image> components."
  echo ""
  echo "   Example:"
  echo "   import { inventoryCardImage } from '@/lib/sanity/image'"
  echo "   <img src={inventoryCardImage(vehicle.mainImage)} />"
  echo ""
  exit 1
else
  echo "✨  All Sanity images are correctly optimized!"
  echo ""
fi
