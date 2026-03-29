#!/bin/bash
# CloudFront Configuration for AVIF-First Image Delivery
# 
# This script creates the necessary Cache Policy and Origin Request Policy
# for proper Accept header forwarding to imgix.
#
# Prerequisites:
# - AWS CLI configured with appropriate IAM permissions
# - CloudFront distribution ID
#
# Usage: ./cloudfront-avif-config.sh <distribution-id>

set -e

DISTRIBUTION_ID=${1:-""}
CACHE_POLICY_NAME="PlanetMotors-AVIF-CachePolicy"
ORIGIN_REQUEST_POLICY_NAME="PlanetMotors-AVIF-OriginRequestPolicy"

if [ -z "$DISTRIBUTION_ID" ]; then
  echo "Usage: $0 <cloudfront-distribution-id>"
  echo ""
  echo "This script will:"
  echo "  1. Create a Cache Policy that includes Accept header in cache key"
  echo "  2. Create an Origin Request Policy that forwards Accept header to imgix"
  echo "  3. Output the policy IDs for manual attachment to your distribution"
  echo ""
  exit 1
fi

echo "Creating CloudFront policies for AVIF-first image delivery..."

# Create Cache Policy with Accept header in cache key
echo "Creating Cache Policy: $CACHE_POLICY_NAME"
CACHE_POLICY_CONFIG=$(cat <<EOF
{
  "CachePolicyConfig": {
    "Name": "$CACHE_POLICY_NAME",
    "Comment": "AVIF-first caching - includes Accept header in cache key for format variants",
    "DefaultTTL": 86400,
    "MaxTTL": 31536000,
    "MinTTL": 0,
    "ParametersInCacheKeyAndForwardedToOrigin": {
      "EnableAcceptEncodingBrotli": true,
      "EnableAcceptEncodingGzip": true,
      "HeadersConfig": {
        "HeaderBehavior": "whitelist",
        "Headers": {
          "Quantity": 1,
          "Items": ["Accept"]
        }
      },
      "CookiesConfig": {
        "CookieBehavior": "none"
      },
      "QueryStringsConfig": {
        "QueryStringBehavior": "all"
      }
    }
  }
}
EOF
)

CACHE_POLICY_ID=$(aws cloudfront create-cache-policy \
  --cli-input-json "$CACHE_POLICY_CONFIG" \
  --query 'CachePolicy.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$CACHE_POLICY_ID" ]; then
  echo "  Cache policy may already exist. Fetching existing policy..."
  CACHE_POLICY_ID=$(aws cloudfront list-cache-policies \
    --query "CachePolicyList.Items[?CachePolicy.CachePolicyConfig.Name=='$CACHE_POLICY_NAME'].CachePolicy.Id" \
    --output text)
fi

echo "  Cache Policy ID: $CACHE_POLICY_ID"

# Create Origin Request Policy to forward Accept header
echo "Creating Origin Request Policy: $ORIGIN_REQUEST_POLICY_NAME"
ORIGIN_REQUEST_POLICY_CONFIG=$(cat <<EOF
{
  "OriginRequestPolicyConfig": {
    "Name": "$ORIGIN_REQUEST_POLICY_NAME",
    "Comment": "Forward Accept header to imgix for AVIF/WebP/JPEG content negotiation",
    "HeadersConfig": {
      "HeaderBehavior": "whitelist",
      "Headers": {
        "Quantity": 1,
        "Items": ["Accept"]
      }
    },
    "CookiesConfig": {
      "CookieBehavior": "none"
    },
    "QueryStringsConfig": {
      "QueryStringBehavior": "all"
    }
  }
}
EOF
)

ORIGIN_REQUEST_POLICY_ID=$(aws cloudfront create-origin-request-policy \
  --cli-input-json "$ORIGIN_REQUEST_POLICY_CONFIG" \
  --query 'OriginRequestPolicy.Id' \
  --output text 2>/dev/null || echo "")

if [ -z "$ORIGIN_REQUEST_POLICY_ID" ]; then
  echo "  Origin request policy may already exist. Fetching existing policy..."
  ORIGIN_REQUEST_POLICY_ID=$(aws cloudfront list-origin-request-policies \
    --query "OriginRequestPolicyList.Items[?OriginRequestPolicy.OriginRequestPolicyConfig.Name=='$ORIGIN_REQUEST_POLICY_NAME'].OriginRequestPolicy.Id" \
    --output text)
fi

echo "  Origin Request Policy ID: $ORIGIN_REQUEST_POLICY_ID"

echo ""
echo "============================================================================"
echo "NEXT STEPS - Attach policies to your CloudFront distribution"
echo "============================================================================"
echo ""
echo "1. Go to AWS Console > CloudFront > Distributions > $DISTRIBUTION_ID"
echo "2. Click 'Behaviors' tab > Edit the default behavior (or imgix behavior)"
echo "3. Under 'Cache key and origin requests':"
echo "   - Cache policy: Select '$CACHE_POLICY_NAME' (ID: $CACHE_POLICY_ID)"
echo "   - Origin request policy: Select '$ORIGIN_REQUEST_POLICY_NAME' (ID: $ORIGIN_REQUEST_POLICY_ID)"
echo "4. Save changes and wait for deployment (usually 5-10 minutes)"
echo ""
echo "VERIFICATION:"
echo "  1. Open Chrome DevTools > Network tab"
echo "  2. Load an image from your site"
echo "  3. Check Response Headers:"
echo "     - content-type: image/avif (on Chrome/Edge/Firefox 93+/Safari 16+)"
echo "     - vary: Accept"
echo "  4. Test on older browser (Safari 15 or IE11 via BrowserStack):"
echo "     - content-type: image/webp or image/jpeg"
echo ""
echo "============================================================================"
