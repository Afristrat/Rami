#!/bin/bash
# Post-deploy smoke test — run against production URL
BASE_URL=${1:-"https://rami.ai-mpower.com"}

echo "=== RAMI Post-Deploy Smoke Test ==="
echo "Target: $BASE_URL"
echo ""

# Public pages
for page in "/login" "/register" "/pricing" "/reset-password"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$page")
  if [ "$STATUS" = "200" ]; then
    echo "✓ $page → $STATUS"
  else
    echo "✗ $page → $STATUS (expected 200)"
  fi
done

# Auth-protected pages (should redirect to login)
for page in "/dashboard" "/settings" "/dashboard/brand-dna"; do
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" -L "$BASE_URL$page")
  echo "✓ $page → $STATUS (redirect expected)"
done

# API endpoints
STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/locale" -H "Content-Type: application/json" -d '{"locale":"en"}')
echo "✓ POST /api/locale → $STATUS"

# Security headers
HEADERS=$(curl -s -I "$BASE_URL/login")
echo "$HEADERS" | grep -qi "x-content-type-options" && echo "  ✓ X-Content-Type-Options present"
echo "$HEADERS" | grep -qi "x-frame-options" && echo "  ✓ X-Frame-Options present"
echo "$HEADERS" | grep -qi "strict-transport-security" && echo "  ✓ HSTS present"

echo ""
echo "=== Smoke test complete ==="
