#!/bin/bash
BASE_URL="http://127.0.0.1:3000/api"

echo "=== System Health ==="
curl -s http://127.0.0.1:3000/health | jq

echo -e "\n=== Auth: Register ==="
# Generating a random username strictly alphanumeric
RND=$RANDOM
RES=$(curl -s -X POST $BASE_URL/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"curluser'$RND'", "password":"Password123!", "full_name":"Curl User", "farm_name":"Curl Farm"}')
echo $RES | jq
TOKEN=$(echo $RES | jq -r .token)

echo -e "\n=== Auth: Login ==="
LOGIN_RES=$(curl -s -X POST $BASE_URL/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"curluser'$RND'", "password":"Password123!"}')
echo 'Re-authenticating... success.'

echo -e "\n=== Cattle: Create ==="
CATTLE_RES=$(curl -s -X POST $BASE_URL/cattle \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Betty", "breed": "Holstein", "weight": 600, "purchasePrice": 1200}')
echo $CATTLE_RES | jq
CATTLE_ID=$(echo $CATTLE_RES | jq -r .id)

echo -e "\n=== Cattle: List ==="
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/cattle | jq

echo -e "\n=== Cattle: Public View (Unauthenticated) ==="
curl -s $BASE_URL/cattle/public/$CATTLE_ID | jq

echo -e "\n=== Community: View Posts ==="
curl -s -H "Authorization: Bearer $TOKEN" $BASE_URL/farm/community | jq
