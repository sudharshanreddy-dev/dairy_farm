#!/bin/bash

# Configuration
API_URL="http://localhost:3000/api"
USERNAME="ravi_farmer"
PASSWORD="Farm@1234"

echo "🚀 Starting API Integrity Check..."

# 1. Login
echo -n "🔑 Authenticating... "
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\": \"$USERNAME\", \"password\": \"$PASSWORD\"}")

TOKEN=$(echo $LOGIN_RESPONSE | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "❌ Login Failed!"
  echo $LOGIN_RESPONSE
  exit 1
fi
echo "✅ Success"

AUTH_H="Authorization: Bearer $TOKEN"

# 2. Check Cattle List
echo -n "🐄 Testing Cattle List... "
CATTLE_RES=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/cattle" -H "$AUTH_H")
if [ "$CATTLE_RES" == "200" ]; then echo "✅ 200 OK"; else echo "❌ $CATTLE_RES"; fi

# 3. Check Dashboard
echo -n "📊 Testing Dashboard Stats... "
DASH_RES=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/farm/dashboard" -H "$AUTH_H")
if [ "$DASH_RES" == "200" ]; then echo "✅ 200 OK"; else echo "❌ $DASH_RES"; fi

# 4. Check Bulk Feeding (New Feature)
echo -n "🌾 Testing Bulk Feeding... "
# First list
FEED_L_RES=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/farm/feeding" -H "$AUTH_H")
# Then post (requires inventory item - assuming ID 1 from seed)
FEED_P_RES=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/farm/feeding" \
  -H "$AUTH_H" -H "Content-Type: application/json" \
  -d '{"inventoryId": 1, "totalQuantity": 10, "cattleCount": 2, "notes": "Test curl feed"}')

if [[ "$FEED_L_RES" == "200" && "$FEED_P_RES" == "201" ]]; then 
  echo "✅ Success (List: $FEED_L_RES, Create: $FEED_P_RES)"
else 
  echo "❌ Failed (List: $FEED_L_RES, Create: $FEED_P_RES)"
fi

# 5. Check Analytics (New Metrics)
echo -n "📈 Testing Pro Analytics... "
ANALYTICS_JSON=$(curl -s -X GET "$API_URL/farm/analytics" -H "$AUTH_H")
# Check for key new fields: costPerLiter, expenseBreakdown
if echo "$ANALYTICS_JSON" | grep -q 'costPerLiter' && echo "$ANALYTICS_JSON" | grep -q 'expenseBreakdown'; then
  CPL=$(echo "$ANALYTICS_JSON" | grep -o '"costPerLiter":[0-9.]*' | cut -d: -f2)
  echo "✅ Success (CPL: ₹$CPL)"
else
  echo "❌ Missing Keys in Analytics"
  echo $ANALYTICS_JSON
fi

# 6. Check Reports
echo -n "📄 Testing Report Export... "
REPORT_RES=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/reports/financials" -H "$AUTH_H")
if [ "$REPORT_RES" == "200" ]; then echo "✅ 200 OK"; else echo "❌ $REPORT_RES"; fi

echo "🎯 All checks completed."
