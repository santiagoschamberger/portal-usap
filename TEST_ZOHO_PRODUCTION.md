# 🧪 Test Zoho CRM Connection (Production)

## Quick Test - Health Check Endpoint

The easiest way to test Zoho connection on Railway:

### 1. Visit Your Backend Health Endpoint

Open this URL in your browser:
```
https://backend-production-67e9.up.railway.app/health
```

You should see a JSON response like:
```json
{
  "status": "OK",
  "timestamp": "2025-10-02T19:09:00.000Z",
  "environment": "production",
  "version": "1.0.0",
  "services": {
    "api": "running",
    "socketio": "running",
    "database": "connected",
    "zoho_crm": "connected"  // ← This should say "connected"
  }
}
```

**✅ If `zoho_crm` says "connected"** - Your Zoho integration is working!

**❌ If `zoho_crm` says "disconnected"** - Check environment variables in Railway

---

## Detailed Test - Create a Test Lead

### 2. Test Lead Creation via Zoho

Use this curl command (or Postman):

```bash
# First, you need to login and get a JWT token
# For now, let's use a direct test endpoint

curl -X POST https://backend-production-67e9.up.railway.app/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "firstName": "Test",
    "lastName": "Lead",
    "email": "test.lead@example.com",
    "phone": "+1234567890",
    "company": "Test Company",
    "businessType": "Restaurant",
    "notes": "Test lead from Railway production"
  }'
```

**Note**: You'll need a valid JWT token. To get one:
1. Login through your frontend
2. Open browser DevTools → Application → Local Storage
3. Find the auth token

---

## Check Zoho Environment Variables

### 3. Verify Railway Backend Has Zoho Credentials

Go to Railway Dashboard → Backend Service → Variables

Make sure these are set:
- ✅ `ZOHO_CLIENT_ID`
- ✅ `ZOHO_CLIENT_SECRET`
- ✅ `ZOHO_REFRESH_TOKEN`

If any are missing, add them and redeploy.

---

## Test Results Interpretation

### ✅ Success Indicators:
- Health endpoint shows `zoho_crm: "connected"`
- Lead creation returns 200/201 status
- Lead appears in your Zoho CRM
- No authentication errors in logs

### ❌ Failure Indicators:
- Health endpoint shows `zoho_crm: "disconnected"`
- Lead creation returns 401/403 errors
- "Authentication failed" in Railway logs
- Missing Zoho credentials error

---

## Quick Troubleshooting

### If Zoho is disconnected:

1. **Check Railway Logs**:
   ```
   Railway Dashboard → Backend Service → Deployments → Latest → View Logs
   ```
   Look for Zoho errors during startup

2. **Verify Environment Variables**:
   - Go to Settings → Variables
   - Confirm all three Zoho variables are set
   - Values should NOT have quotes or extra spaces

3. **Check Zoho Refresh Token**:
   - Refresh tokens can expire
   - Generate a new one if needed (see Zoho docs)

4. **Test Zoho API Directly**:
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "refresh_token=YOUR_REFRESH_TOKEN" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "grant_type=refresh_token"
   ```
   Should return an access token

---

## Advanced Testing (Optional)

### Test via Frontend Dashboard

Once you login to the frontend:

1. **Navigate to Dashboard**
2. **Click "Create New Lead"**
3. **Fill in lead details**
4. **Submit**

The lead should:
- ✅ Save to Supabase database
- ✅ Sync to Zoho CRM
- ✅ Show in your dashboard
- ✅ Appear in Zoho CRM within seconds

---

## Monitoring Zoho Integration

### Real-time Logs
Watch Railway logs in real-time:
```
Railway Dashboard → Backend → Deployments → View Logs (keep open)
```

Then create a lead and watch for:
```
✅ Zoho CRM configuration validated
✅ Successfully obtained Zoho access token
✅ Lead created in Zoho: [Lead ID]
```

### Common Log Messages

**Success**:
```
✅ Zoho CRM configuration validated
Lead created successfully in Zoho
```

**Errors**:
```
❌ Zoho CRM configuration error: Missing refresh token
Failed to get Zoho access token
```

---

## Quick Action Steps

**Right Now, Test This:**

1. Open: https://backend-production-67e9.up.railway.app/health
2. Check if `zoho_crm: "connected"`
3. If yes ✅ - You're good!
4. If no ❌ - Check Railway environment variables

---

## Local Testing (If You Want)

If you want to test locally before production:

```bash
cd backend
npm run test:zoho:health
```

This will test:
- Environment variables
- Authentication
- API connectivity

---

## Need Help?

If tests fail:
1. Check `server.log` or Railway logs
2. Verify all Zoho credentials in Railway
3. Test Zoho API directly with curl
4. Check that refresh token hasn't expired

**Most Common Issue**: Missing or incorrect `ZOHO_REFRESH_TOKEN` in Railway environment variables.

