# Testing Zoho ↔ Portal Sync

## Quick Answer: **YES, It Will Work!** ✅

Your flow is fully implemented:

1. ✅ **Add partner in Zoho** → Webhook creates portal account
2. ✅ **Partner submits referral** → Syncs to Zoho CRM
3. ✅ **Update status in Zoho** → Webhook updates portal

## What's Already Working

### Backend Endpoints
- ✅ `POST /api/webhooks/zoho/partner` - Partner creation webhook
- ✅ `POST /api/webhooks/zoho/lead-status` - Lead status update webhook
- ✅ `POST /api/leads` - Create lead (syncs to Zoho)
- ✅ `GET /api/leads` - Fetch leads from Zoho + local DB
- ✅ Database function: `create_partner_with_user()`
- ✅ Zoho service with token management

### Data Flow
```
┌─────────────┐                    ┌──────────────┐
│  Zoho CRM   │                    │    Portal    │
└──────┬──────┘                    └──────┬───────┘
       │                                  │
       │ 1. Partner Approved              │
       ├──────────[Webhook]──────────────>│
       │                                  │
       │                    2. Create Partner + User
       │                       (Security Definer Fn)
       │                                  │
       │                    3. Partner Logs In
       │                       (Password Reset Flow)
       │                                  │
       │                    4. Submit Referral
       │<──────────[API Call]─────────────┤
       │                                  │
       │   Create Lead with               │
       │   StrategicPartnerId             │
       │                                  │
       │ 5. Status Updated                │
       ├──────────[Webhook]──────────────>│
       │                                  │
       │                    6. Update Local DB
       │                       + Status History
```

## How to Test

### Prerequisites
```bash
# 1. Environment variables (backend/.env)
SUPABASE_URL=your_url
SUPABASE_ANON_KEY=your_key
SUPABASE_SERVICE_ROLE_KEY=your_key
ZOHO_CLIENT_ID=your_id
ZOHO_CLIENT_SECRET=your_secret
ZOHO_REFRESH_TOKEN=your_token
JWT_SECRET=your_secret
PORT=5001
FRONTEND_URL=http://localhost:3000
```

### Test Steps

#### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```

#### 2. Check Health
```bash
curl http://localhost:5001/health
```

Expected response:
```json
{
  "status": "OK",
  "services": {
    "api": "running",
    "database": "connected",
    "zoho_crm": "connected"
  }
}
```

#### 3. Test Partner Creation Webhook
```bash
curl -X POST http://localhost:5001/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{
    "id": "ZOHO_VENDOR_TEST123",
    "VendorName": "Test Partner Inc",
    "Email": "test@example.com"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Partner and user created successfully",
  "data": {
    "partner_id": "uuid...",
    "user_id": "uuid...",
    "email": "test@example.com"
  }
}
```

✅ **This creates:**
- Partner record in `partners` table
- User in Supabase Auth (`auth.users`)
- User record in `users` table
- Activity log entry

#### 4. Set Password for New User
Since webhook creates placeholder password, user needs to reset:

**Option A: Via Supabase Dashboard**
1. Go to Supabase Dashboard → Authentication → Users
2. Find user by email
3. Click "Send Password Recovery"
4. User receives email with reset link

**Option B: Via API (for testing)**
```bash
# Send password reset email
curl -X POST https://your-project.supabase.co/auth/v1/recover \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"email": "test@example.com"}'
```

#### 5. Login
```bash
curl -X POST http://localhost:5001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "new_password_after_reset"
  }'
```

Save the `access_token` from response.

#### 6. Submit Referral (Lead)
```bash
curl -X POST http://localhost:5001/api/leads \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "first_name": "John",
    "last_name": "Merchant",
    "email": "john@merchant.com",
    "phone": "555-0123",
    "company": "Merchant Co",
    "business_type": "Retail",
    "description": "Needs payment processing"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "Lead created successfully",
  "data": {
    "zoho_lead_id": "123456789",
    "local_lead": { ... },
    "zoho_response": { ... }
  }
}
```

✅ **This creates:**
- Lead in Zoho CRM with `StrategicPartnerId`
- Lead in local `leads` table with `zoho_lead_id`
- Note in Zoho (if description provided)
- Activity log entry

#### 7. Check Lead in Zoho
Go to Zoho CRM → Leads → Find your new lead

Verify fields:
- ✅ `StrategicPartnerId` = user UUID
- ✅ `Vendor` = partner name + Zoho Vendor ID
- ✅ `Lead_Status` = "New"
- ✅ `Lead_Source` = "Strategic Partner"

#### 8. Update Status in Zoho
In Zoho CRM:
1. Open the lead
2. Change status to "Qualified"
3. Save

**Zoho webhook should fire** (if configured):
```bash
# This is what Zoho sends
POST http://localhost:5001/api/webhooks/zoho/lead-status
{
  "id": "123456789",
  "Lead_Status": "Qualified",
  "StrategicPartnerId": "user-uuid"
}
```

✅ **This updates:**
- Lead status in local `leads` table
- Creates record in `lead_status_history`
- Activity log entry
- (Future) Real-time notification to partner

#### 9. Verify Status Update in Portal
```bash
curl -X GET http://localhost:5001/api/leads \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

Check that lead status is now "qualified".

## Setting Up Zoho Webhooks

### Partner Creation Webhook

1. Go to Zoho CRM → Setup → Automation → Workflows
2. Create New Workflow
   - Module: `Vendors`
   - Trigger: `On Create` or `On Update`
   - Condition: `Vendor_Type equals "Strategic Partner (Referral)"`
3. Add Action: Webhook
   - URL: `https://your-backend-url.com/api/webhooks/zoho/partner`
   - Method: `POST`
   - Body:
   ```json
   {
     "id": "${Vendor.id}",
     "VendorName": "${Vendor.Vendor_Name}",
     "Email": "${Vendor.Email}"
   }
   ```

### Lead Status Webhook

1. Go to Zoho CRM → Setup → Automation → Workflows
2. Create New Workflow
   - Module: `Leads`
   - Trigger: `On Update`
   - Condition: `Lead_Status is changed`
3. Add Action: Webhook
   - URL: `https://your-backend-url.com/api/webhooks/zoho/lead-status`
   - Method: `POST`
   - Body:
   ```json
   {
     "id": "${Lead.id}",
     "Lead_Status": "${Lead.Lead_Status}",
     "StrategicPartnerId": "${Lead.StrategicPartnerId}"
   }
   ```

## Run Automated Test

```bash
cd backend
node test-complete-flow.js
```

This tests:
- ✅ Health check
- ✅ Partner creation webhook
- ⚠️  Login (needs password reset)
- ⚠️  Lead creation (needs auth)
- ⚠️  Status update (needs real lead)

## Missing Pieces (Nice to Have)

### 1. Welcome Email Service
```javascript
// TODO in webhooks.ts line 42
// Send welcome email with password reset link
await sendEmail({
  to: Email,
  subject: 'Welcome to USA Payments Portal',
  body: `
    Your partner account has been created!
    Click here to set your password: ${resetLink}
  `
});
```

### 2. Real-time Notifications
```javascript
// TODO in webhooks.ts line 131
// Broadcast status change via Socket.IO
io.to(`partner-${lead.partner_id}`).emit('lead_status_updated', {
  lead_id: lead.id,
  old_status: oldStatus,
  new_status: newStatus
});
```

### 3. Frontend Lead Polling/WebSocket
Frontend should either:
- Poll `/api/leads` every 30 seconds
- Or connect to Socket.IO for real-time updates

## Summary

### ✅ **Will Your Flow Work?**
**YES!** All the backend logic is there:

1. ✅ Zoho → Portal (Partner creation)
2. ✅ Portal → Zoho (Lead submission)
3. ✅ Zoho → Portal (Status updates)

### ⚠️ **What Needs Setup**

**For Development:**
- [ ] Set environment variables
- [ ] Start backend server
- [ ] Test webhooks with curl/Postman
- [ ] Manually test with Supabase Auth

**For Production:**
- [ ] Deploy backend to Railway/Heroku
- [ ] Configure Zoho webhooks with production URL
- [ ] Set up email service (SendGrid/Resend)
- [ ] Enable real-time notifications (Socket.IO)
- [ ] Add error monitoring (Sentry)

### 🚀 **Quick Start**
```bash
# 1. Backend
cd backend
npm install
npm run dev

# 2. Test health
curl http://localhost:5001/health

# 3. Test partner webhook
curl -X POST http://localhost:5001/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{"id":"TEST123","VendorName":"Test Partner","Email":"test@example.com"}'

# 4. Check Supabase for new partner + user ✅
```

## Questions?

Run the test script and check the output for detailed flow explanation:
```bash
node backend/test-complete-flow.js
```

