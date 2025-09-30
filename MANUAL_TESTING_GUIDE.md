# Manual Testing Guide - Zoho CRM Integration

## Prerequisites

Before testing, you need to set up your environment variables with valid Zoho credentials.

## Step 1: Set Up Environment Variables

### Backend Environment

Create `/backend/.env` file:

```bash
cd backend
cat > .env << 'EOF'
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Zoho CRM Configuration
ZOHO_CLIENT_ID=your_zoho_client_id
ZOHO_CLIENT_SECRET=your_zoho_client_secret
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration (Optional)
SENDGRID_API_KEY=your_sendgrid_key
SENDGRID_FROM_EMAIL=noreply@usapayments.com
ADMIN_EMAIL=admin@usapayments.com
EOF
```

### Frontend Environment

Create `/frontend/.env.local` file:

```bash
cd frontend
cat > .env.local << 'EOF'
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
EOF
```

## Step 2: Run Automated Backend Tests

### Test 1: Health Check (Quick Connectivity Test)

```bash
cd backend
npm run test:zoho:health
```

**Expected Output:**
```
🔍 Zoho CRM Health Check
========================================
✅ Environment Variables: All required environment variables are set
✅ Authentication: Successfully obtained access token
✅ API Connectivity: Successfully connected to Zoho CRM API
========================================
🎉 All health checks passed! Zoho CRM is ready.
```

**If it fails:**
- ❌ Missing environment variables → Check your `.env` file
- ❌ Authentication failed → Regenerate your refresh token
- ❌ API connectivity failed → Check internet connection

### Test 2: Comprehensive Integration Test

```bash
npm run test:zoho:comprehensive
```

**Expected Output:**
```
🧪 Comprehensive Zoho CRM Integration Test Suite
============================================================
✅ Environment Configuration: All required variables set
✅ Authentication: Successfully obtained access token
✅ API Connectivity: Successfully connected to Zoho CRM API
✅ Vendor Creation: Successfully created test vendor
✅ Lead Creation: Successfully created test lead
✅ Lead Update: Successfully updated test lead
✅ Lead Search: Successfully searched for partner leads
✅ Note Creation: Successfully created test note
✅ Error Handling: Properly handled invalid lead ID error
⏭️ Test Cleanup: Cleanup skipped - verify data in Zoho CRM
============================================================
📊 TEST RESULTS SUMMARY
Total Tests: 10
✅ Passed: 9
❌ Failed: 0
⏭️ Skipped: 1
Success Rate: 90.0%
```

**This test creates real data in Zoho CRM:**
- Creates a test vendor/partner
- Creates a test lead
- Updates the lead
- Adds a note
- Searches for leads

**Verify in Zoho CRM:**
1. Log into your Zoho CRM
2. Go to **Vendors** → You should see "Test Vendor"
3. Go to **Leads** → You should see "Test Lead"

## Step 3: Manual API Testing with Curl

### Test 3: Test Lead Creation Endpoint

First, you need a valid JWT token. Let's get one by logging in:

```bash
# Login to get token (replace with your test user credentials)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@usapayments.com",
    "password": "testpassword123"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "...",
      "email": "test@usapayments.com"
    }
  }
}
```

Copy the `token` value and use it in the next requests.

### Test 4: Create a Lead via API

```bash
# Replace YOUR_JWT_TOKEN with the token from Step 3
curl -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "phone": "+1234567890",
    "company": "Test Company",
    "business_type": "Restaurant",
    "description": "Test lead from manual API testing"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "zoho_lead_id": "5725767000001234567",
    "local_lead": {
      "id": "uuid-here",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john.doe@example.com",
      "status": "new",
      "zoho_sync_status": "synced"
    },
    "zoho_response": {
      "code": "SUCCESS",
      "message": "record added"
    }
  }
}
```

**Verify:**
1. Check Zoho CRM → Leads → You should see "John Doe"
2. Check the lead has a note with the description

### Test 5: Get All Leads

```bash
curl -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "zoho_leads": [
      {
        "id": "5725767000001234567",
        "Full_Name": "John Doe",
        "Email": "john.doe@example.com",
        "Company": "Test Company",
        "Lead_Status": "New",
        "Created_Time": "2025-09-30T12:00:00Z"
      }
    ],
    "local_leads": [
      {
        "id": "uuid-here",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "status": "new"
      }
    ],
    "total": 2
  }
}
```

### Test 6: Update Lead Status

```bash
# Replace LEAD_ID with the local lead ID from Step 5
curl -X PATCH http://localhost:3001/api/leads/LEAD_ID/status \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "status": "contacted",
    "notes": "Called the prospect, interested in services"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lead status updated successfully",
  "data": {
    "id": "uuid-here",
    "status": "contacted",
    "updated_at": "2025-09-30T12:30:00Z"
  }
}
```

### Test 7: Test Webhook (Partner Creation)

```bash
curl -X POST http://localhost:3001/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{
    "id": "5725767000009876543",
    "VendorName": "Test Partner Inc",
    "Email": "partner@testcompany.com"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Partner and user created successfully",
  "data": {
    "partner_id": "uuid-here",
    "user_id": "uuid-here",
    "email": "partner@testcompany.com"
  }
}
```

**Verify:**
1. Check Supabase → `partners` table → Should see "Test Partner Inc"
2. Check Supabase → `users` table → Should see user with email "partner@testcompany.com"

## Step 4: Frontend Manual Testing

### Start Both Servers

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### Test 8: Dashboard Statistics

1. **Navigate to:** http://localhost:3000
2. **Login** with test credentials
3. **Go to Dashboard**

**Expected to See:**
- ✅ Total Leads count (matches Zoho + local)
- ✅ Active Leads count
- ✅ Conversion Rate percentage
- ✅ Monthly Leads count
- ✅ Recent Activity list (last 5 leads)

**Test Actions:**
- Refresh the page → Stats should reload
- Check browser console → No errors
- Check Network tab → `/api/leads` should return 200

### Test 9: Leads Listing Page

1. **Navigate to:** http://localhost:3000/leads

**Expected to See:**
- ✅ List of all leads (Zoho + local combined)
- ✅ Search bar functional
- ✅ Status filter dropdown
- ✅ Date range filter
- ✅ Pagination controls
- ✅ Status badges with colors

**Test Actions:**
- **Search:** Type a lead name → Should filter results
- **Filter Status:** Select "New" → Should show only new leads
- **Filter Date:** Select "This Week" → Should filter by date
- **Pagination:** Click "Next" → Should show next page
- **View Lead:** Click "View" button → Should show lead details (coming soon)

### Test 10: Lead Creation

1. **Navigate to:** http://localhost:3000/leads/new

**Expected to See:**
- ✅ Lead creation form
- ✅ All required fields marked
- ✅ Validation on submit

**Test Actions:**

**Test 10a: Validation**
- Click "Create Lead" without filling anything
- Should see validation errors under each field

**Test 10b: Successful Creation**
1. Fill in the form:
   - First Name: "Sarah"
   - Last Name: "Johnson"
   - Email: "sarah.johnson@example.com"
   - Phone: "5551234567"
   - Company: "Johnson Enterprises"
   - Business Type: "Retail"
   - Notes: "Interested in payment processing for their 5 locations"

2. Click "Create Lead"

**Expected:**
- ✅ Success toast notification appears (top-right)
- ✅ Redirects to `/leads` page
- ✅ New lead appears in the list

**Verify in Zoho:**
1. Go to Zoho CRM → Leads
2. Find "Sarah Johnson"
3. Should have all the details
4. Should have a note with the description

**Test 10c: Duplicate Email**
- Try creating another lead with the same email
- Should get error toast: "A referral with this email already exists"

### Test 11: Real-time Updates (Webhook)

**Simulate Zoho Status Update:**

1. In Zoho CRM, change a lead's status from "New" to "Contacted"
2. This should trigger a webhook to your backend

**Manual Webhook Test:**
```bash
# Get a lead ID from your database
curl -X POST http://localhost:3001/api/webhooks/zoho/lead-status \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ZOHO_LEAD_ID",
    "Lead_Status": "Contacted",
    "StrategicPartnerId": "YOUR_USER_ID"
  }'
```

**Expected:**
- ✅ Lead status updated in database
- ✅ Status history record created
- ✅ Activity log entry created

**Note:** Real-time UI updates via WebSocket are planned for future implementation.

## Step 5: Error Handling Tests

### Test 12: Invalid Zoho Credentials

1. Temporarily change `ZOHO_REFRESH_TOKEN` to an invalid value
2. Restart backend: `npm run dev`
3. Try to create a lead in the UI

**Expected:**
- ❌ Error toast: "Failed to create lead"
- ✅ User-friendly error message
- ✅ Form doesn't clear (user can fix and retry)

### Test 13: Backend Offline

1. Stop the backend server
2. Try to view leads in the UI

**Expected:**
- ❌ Error toast: "Failed to load leads"
- ✅ Empty state or cached data shown
- ✅ No console errors that crash the app

### Test 14: Network Timeout

1. Disconnect internet temporarily
2. Try to create a lead

**Expected:**
- ❌ Error toast with timeout message
- ✅ Graceful error handling
- ✅ Data not lost in form

## Troubleshooting Common Issues

### Issue 1: "Authentication failed"
**Cause:** Invalid or expired Zoho refresh token

**Fix:**
1. Go to Zoho API Console
2. Regenerate refresh token (see ZOHO_INTEGRATION_SETUP.md)
3. Update `.env` file
4. Restart backend

### Issue 2: "Partner not found"
**Cause:** User doesn't have a linked partner with zoho_partner_id

**Fix:**
1. Check Supabase `users` table → Find user's `partner_id`
2. Check Supabase `partners` table → Ensure `zoho_partner_id` is set
3. If missing, create partner via webhook or manually set it

### Issue 3: "Failed to fetch leads"
**Cause:** Backend not running or CORS issue

**Fix:**
1. Verify backend is running: `curl http://localhost:3001/api/health`
2. Check CORS settings in backend
3. Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

### Issue 4: Toast notifications not showing
**Cause:** Toaster component not in layout

**Fix:**
1. Check `frontend/src/app/layout.tsx`
2. Should have `<Toaster />` component
3. Restart frontend dev server

## Success Checklist

After completing all tests, you should have:

- ✅ Backend health check passes
- ✅ Comprehensive test suite passes
- ✅ Lead creation via API works
- ✅ Lead creation via UI works
- ✅ Leads appear in both Portal and Zoho CRM
- ✅ Dashboard shows correct statistics
- ✅ Filtering and search work correctly
- ✅ Webhooks update local database
- ✅ Toast notifications appear
- ✅ Error handling works gracefully

## Next Steps

Once manual testing is complete:

1. **Configure Production Webhooks** in Zoho CRM
2. **Deploy to Staging** environment
3. **Run E2E tests** in staging
4. **Document any issues** found
5. **Train team** on using the portal
6. **Deploy to Production**

## Quick Test Script

Here's a quick bash script to test all API endpoints:

```bash
#!/bin/bash

# Save as test-api.sh and run: bash test-api.sh

echo "🧪 Testing Zoho Integration API"
echo "================================"

# Get token
echo "\n1. Getting auth token..."
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@usapayments.com","password":"testpassword123"}' | \
  jq -r '.data.token')

if [ "$TOKEN" != "null" ]; then
  echo "✅ Token received"
else
  echo "❌ Login failed"
  exit 1
fi

# Create lead
echo "\n2. Creating test lead..."
LEAD_RESPONSE=$(curl -s -X POST http://localhost:3001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "first_name": "Test",
    "last_name": "Lead",
    "email": "test.lead@example.com",
    "phone": "1234567890",
    "company": "Test Co",
    "business_type": "Retail"
  }')

echo $LEAD_RESPONSE | jq '.'

if [ $(echo $LEAD_RESPONSE | jq -r '.success') = "true" ]; then
  echo "✅ Lead created successfully"
  LEAD_ID=$(echo $LEAD_RESPONSE | jq -r '.data.local_lead.id')
else
  echo "❌ Lead creation failed"
fi

# Get all leads
echo "\n3. Fetching all leads..."
curl -s -X GET http://localhost:3001/api/leads \
  -H "Authorization: Bearer $TOKEN" | jq '.data.total'

echo "\n✅ All tests completed!"
```

---

**Happy Testing! 🚀**

If you encounter any issues, check the troubleshooting section or review the full documentation in `ZOHO_INTEGRATION_SETUP.md`.

