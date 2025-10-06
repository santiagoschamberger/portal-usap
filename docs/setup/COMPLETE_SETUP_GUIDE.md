# 🚀 Complete Setup & Testing Guide

## Overview

Since your environment variables are configured locally and in Railway, here's how to test everything and configure Zoho webhooks in production.

---

## Part 1: Test Webhooks Locally 🧪

### 1.1 Start Your Backend

```bash
cd backend
npm run dev
```

**Expected output:**
```
🚀 Server running on port 5001 in development mode
📊 Health check: http://localhost:5001/health
✅ Zoho CRM configuration validated
```

### 1.2 Test Health Endpoint

```bash
curl http://localhost:5001/health
```

**Expected response:**
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T...",
  "services": {
    "api": "running",
    "database": "connected",
    "zoho_crm": "connected"
  }
}
```

✅ If `zoho_crm: "connected"` → Your Zoho credentials are working!

### 1.3 Test Partner Creation Webhook

**Test command:**
```bash
curl -X POST http://localhost:5001/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ZOHO_TEST_001",
    "VendorName": "Test Partner Company",
    "Email": "testpartner@example.com"
  }'
```

**Expected success response:**
```json
{
  "success": true,
  "message": "Partner and user created successfully",
  "data": {
    "partner_id": "550e8400-e29b-41d4-a716-446655440000",
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "email": "testpartner@example.com"
  }
}
```

✅ **Verify in Supabase:**
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project → Table Editor
3. Check `partners` table → Should see "Test Partner Company"
4. Check `auth.users` table → Should see testpartner@example.com
5. Check `users` table → Should see the user record

### 1.4 Test Lead Status Webhook

First, create a test lead in your database, then:

```bash
curl -X POST http://localhost:5001/api/webhooks/zoho/lead-status \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ZOHO_LEAD_123",
    "Lead_Status": "Qualified",
    "StrategicPartnerId": "partner-uuid-from-step-1.3"
  }'
```

**Note:** This will only work if the lead exists in your database with that `zoho_lead_id`.

---

## Part 2: Configure Zoho Webhooks (Production) 🔗

### 2.1 Get Your Railway Backend URL

1. Go to [Railway Dashboard](https://railway.app/)
2. Select your `usapayments-portal-2.0-backend` project
3. Click on "Settings" → "Networking"
4. Copy your public domain (e.g., `usapayments-backend.up.railway.app`)

Your webhook URL will be:
```
https://usapayments-backend.up.railway.app/api/webhooks/zoho/partner
https://usapayments-backend.up.railway.app/api/webhooks/zoho/lead-status
```

### 2.2 Partner Creation Webhook in Zoho

**Step-by-step:**

1. **Login to Zoho CRM** → [https://crm.zoho.com](https://crm.zoho.com)

2. **Navigate to Automation:**
   - Click ⚙️ (gear icon) in top right
   - Go to **Setup** → **Automation** → **Workflows**

3. **Create New Workflow:**
   - Click **"+ Create Rule"**
   - **Module**: Select `Vendors`
   - **Rule Name**: `Partner Portal Auto-Provision`
   - **Description**: `Automatically creates portal accounts when vendors are approved`

4. **Configure Trigger:**
   - **When**: `On Create` or `On Update` (choose based on your flow)
   - **Condition**: Add condition:
     ```
     Vendor_Type equals "Strategic Partner (Referral)"
     AND
     [Your approval field] equals "Approved"
     ```
     *(Adjust based on your actual field names)*

5. **Add Webhook Action:**
   - Click **"Actions"** → **"Webhooks"**
   - Click **"+ Configure Webhooks"**
   - **Webhook Name**: `Portal Partner Creation`
   - **URL**: `https://YOUR-RAILWAY-URL.up.railway.app/api/webhooks/zoho/partner`
   - **Method**: `POST`
   - **Content Type**: `application/json`

6. **Configure Request Body:**
   ```json
   {
     "id": "${Vendor.id}",
     "VendorName": "${Vendor.Vendor_Name}",
     "Email": "${Vendor.Email}"
   }
   ```

7. **Save & Activate**

**Test in Zoho:**
- Create or update a Vendor record that matches your conditions
- Check Zoho workflow execution logs
- Check Railway logs to see if webhook was received

### 2.3 Lead Status Update Webhook

**Repeat similar steps for lead status changes:**

1. **Create New Workflow:**
   - **Module**: `Leads`
   - **Rule Name**: `Portal Lead Status Sync`
   - **Description**: `Syncs lead status changes to partner portal`

2. **Configure Trigger:**
   - **When**: `On Update`
   - **Condition**: `Lead_Status is changed` (field update trigger)

3. **Add Webhook:**
   - **URL**: `https://YOUR-RAILWAY-URL.up.railway.app/api/webhooks/zoho/lead-status`
   - **Method**: `POST`
   - **Body**:
   ```json
   {
     "id": "${Lead.id}",
     "Lead_Status": "${Lead.Lead_Status}",
     "StrategicPartnerId": "${Lead.StrategicPartnerId}"
   }
   ```

4. **Save & Activate**

---

## Part 3: Test Complete Flow End-to-End 🔄

### 3.1 Production Test Scenario

**Scenario**: Add a new partner in Zoho, have them submit a referral, update status

#### Step 1: Add Partner in Zoho CRM
1. Go to Zoho CRM → **Vendors** → **Create Vendor**
2. Fill in:
   - Vendor Name: "Test Partner LLC"
   - Email: yourtest@email.com
   - Vendor Type: "Strategic Partner (Referral)"
   - [Set approval field to "Approved"]
3. **Save**

✅ **Expected**:
- Webhook fires to Railway backend
- Partner created in Supabase
- User created in Supabase Auth
- *(Future: Welcome email sent)*

#### Step 2: Partner Logs Into Portal
1. **Password Reset Flow** (since webhook creates placeholder password):
   - Go to your portal: `https://your-portal.vercel.app/auth/forgot-password`
   - Enter: yourtest@email.com
   - Check email for reset link
   - Set new password

2. **Login**:
   - Go to: `https://your-portal.vercel.app/auth/login`
   - Login with new credentials

#### Step 3: Partner Submits Referral
1. Navigate to "New Lead" or "Submit Referral"
2. Fill in form:
   - First Name: John
   - Last Name: Merchant
   - Email: john@merchantco.com
   - Company: Merchant Co
   - Phone: 555-0123
   - Business Type: Retail
   - Description: "Needs payment processing"
3. **Submit**

✅ **Expected**:
- Lead created in Zoho CRM with `StrategicPartnerId`
- Lead saved in Supabase with `zoho_lead_id`
- Note added to lead in Zoho
- Activity logged

#### Step 4: Update Status in Zoho
1. Go to Zoho CRM → **Leads**
2. Find the lead you just created
3. Change **Lead Status** to "Qualified"
4. **Save**

✅ **Expected**:
- Webhook fires to Railway backend
- Portal database updated with new status
- Status history record created
- Activity logged
- *(Future: Partner sees real-time update)*

#### Step 5: Partner Sees Update
1. Portal → Dashboard or Leads page
2. Refresh
3. Should see lead status = "Qualified"

---

## Part 4: Monitoring & Debugging 🔍

### 4.1 Railway Logs

**View backend logs:**
1. Go to Railway dashboard
2. Select backend service
3. Click "Deployments" → Latest deployment
4. Click "View Logs"

**Look for:**
```
Partner webhook received: { id: 'ZOHO_...', VendorName: '...', Email: '...' }
✅ Partner created successfully
```

### 4.2 Zoho Workflow Logs

**Check webhook execution:**
1. Zoho CRM → Setup → Automation → Workflows
2. Click on your workflow
3. Go to "Execution History" tab
4. Check status and response codes

**Successful webhook:**
- Status: 200 or 201
- Response: Shows success message

**Failed webhook:**
- Status: 4xx or 5xx
- Check error message
- Verify URL is correct
- Check Railway logs for details

### 4.3 Supabase Logs

**Check database operations:**
1. Supabase Dashboard → Logs
2. Filter by:
   - API logs
   - Database logs
   - Auth logs

**Common issues:**
- RLS policies blocking inserts
- Missing foreign keys
- Auth user creation failures

---

## Part 5: Common Issues & Solutions 🔧

### Issue 1: Webhook Returns 404

**Cause**: URL is wrong or route not registered

**Solution**:
```bash
# Test your Railway URL
curl https://YOUR-URL.up.railway.app/health

# Should return health status
```

### Issue 2: Webhook Returns 500

**Cause**: Environment variables missing or database error

**Solution**:
1. Check Railway environment variables
2. Verify Supabase credentials
3. Check Railway logs for error details

### Issue 3: Partner Created But No Email

**Cause**: Email service not configured yet

**Solution**:
- This is expected! Email feature is marked as "TODO"
- Partner needs manual password reset via Supabase dashboard
- **OR** implement email service (SendGrid/Resend)

### Issue 4: Lead Not Syncing to Zoho

**Cause**: Zoho API credentials invalid or partner info missing

**Solution**:
```bash
# Test Zoho connection
curl https://YOUR-URL.up.railway.app/health

# Check zoho_crm: "connected" in response
```

### Issue 5: Status Update Not Showing in Portal

**Cause**: Webhook not configured or lead not found

**Solution**:
1. Check if lead has `zoho_lead_id` in database
2. Verify webhook is configured in Zoho
3. Check Railway logs for webhook received message

---

## Part 6: Production Checklist ✅

Before going live, ensure:

### Backend (Railway)
- [ ] All environment variables set
- [ ] Health endpoint returns `zoho_crm: "connected"`
- [ ] Database migrations applied
- [ ] Backend accessible via HTTPS
- [ ] Logs are being collected

### Frontend (Vercel/Railway)
- [ ] Environment variables set
- [ ] Points to production backend URL
- [ ] Login/logout working
- [ ] Referral submission working
- [ ] Dashboard showing data

### Zoho CRM
- [ ] Partner webhook configured and active
- [ ] Lead status webhook configured and active
- [ ] Test webhooks with real data
- [ ] Workflow execution logs clean

### Security
- [ ] JWT_SECRET is strong (64+ random characters)
- [ ] Supabase RLS policies enabled
- [ ] Supabase service role key not exposed to frontend
- [ ] CORS configured to only allow your frontend domain

### Testing
- [ ] Partner creation tested end-to-end
- [ ] Lead submission tested
- [ ] Status update tested
- [ ] Password reset flow tested
- [ ] Sub-account creation tested (if using)

---

## Quick Commands Reference 📝

```bash
# Test local backend health
curl http://localhost:5001/health

# Test production backend health
curl https://YOUR-RAILWAY-URL.up.railway.app/health

# Test partner webhook locally
curl -X POST http://localhost:5001/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST","VendorName":"Test","Email":"test@example.com"}'

# Test partner webhook production
curl -X POST https://YOUR-RAILWAY-URL.up.railway.app/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST","VendorName":"Test","Email":"test@example.com"}'

# View Railway logs
railway logs

# Check Railway environment
railway variables

# Deploy to Railway
git push railway main
```

---

## Support & Documentation 📚

- **Backend API Docs**: See `backend/src/routes/` for all endpoints
- **Zoho Integration Details**: `zoho-integration-guide.md`
- **Testing Guide**: `TESTING_ZOHO_SYNC.md`
- **Test Results**: `TEST_RESULTS.md`

---

## Next Steps 🎯

After completing this setup:

1. **Implement Email Service** (optional but recommended):
   - SendGrid or Resend for welcome emails
   - Password reset emails
   - Lead status change notifications

2. **Add Real-Time Updates** (optional):
   - Socket.IO for live dashboard updates
   - Notify partners immediately when status changes

3. **Enhanced Monitoring** (recommended):
   - Sentry for error tracking
   - LogRocket for session replay
   - Railway metrics for performance

4. **Security Hardening**:
   - Rate limiting on webhooks
   - Webhook signature verification
   - IP allowlisting for Zoho webhooks

---

**You're ready to test! Start with Part 1 and work your way through.** 🚀

