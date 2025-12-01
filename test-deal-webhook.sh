#!/bin/bash

# Test deal webhook against Railway production
# Usage: ./test-deal-webhook.sh

RAILWAY_URL="https://backend-production-67e9.up.railway.app"

echo "🧪 Testing Deal Webhook"
echo "📡 URL: $RAILWAY_URL/api/webhooks/zoho/deal"
echo ""

curl -X POST "$RAILWAY_URL/api/webhooks/zoho/deal" \
  -H "Content-Type: application/json" \
  -d '{
  "zohoDealId": "5577028000048531900",
  "Deal_Name": "Test Deal from curl",
  "Stage": "Sent to Underwriting",
  "Email": "",
  "Phone": "",
  "First_Name": "",
  "Last_Name": "",
  "Account_Name": "Test Company",
  "StrategicPartnerId": "5577028000042584326",
  "Approval_Time_Stamp": ""
}' | jq '.'

echo ""
echo "✅ Check Railway logs to see the processing"
