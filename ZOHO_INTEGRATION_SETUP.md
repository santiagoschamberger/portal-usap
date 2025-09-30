# Zoho CRM Integration Setup Guide

This guide will help you set up and configure the Zoho CRM integration for the Partner Portal.

## ✅ What's Already Implemented

The system now has full Zoho CRM integration with the following components:

### Backend (Node.js/Express)
- ✅ Zoho service with OAuth 2.0 authentication
- ✅ Lead creation and sync to Zoho CRM
- ✅ Partner provisioning via webhooks
- ✅ Lead status update webhooks
- ✅ Sub-account creation webhooks
- ✅ Local database sync with Supabase

### Frontend (Next.js/React)
- ✅ Lead service layer for API calls
- ✅ Zoho service integration
- ✅ Dashboard with real Zoho data
- ✅ Lead listing page with Zoho sync
- ✅ Lead creation form syncing to Zoho
- ✅ Toast notifications for user feedback

## 📋 Environment Configuration

### Frontend Environment Variables

Create a `.env.local` file in the `frontend` directory:

```bash
# Backend API URL
NEXT_PUBLIC_API_URL=http://localhost:3001

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here

# Zoho CRM Configuration
ZOHO_CLIENT_ID=your_zoho_client_id_here
ZOHO_CLIENT_SECRET=your_zoho_client_secret_here
ZOHO_REFRESH_TOKEN=your_zoho_refresh_token_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3001
NODE_ENV=development

# Email Configuration (Optional - for SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_FROM_EMAIL=noreply@usapayments.com
ADMIN_EMAIL=admin@usapayments.com
```

## 🔑 Getting Zoho CRM Credentials

### Step 1: Create Zoho Developer Account

1. Go to [Zoho API Console](https://api-console.zoho.com/)
2. Sign in with your Zoho account
3. Click "Add Client" → "Server-based Applications"

### Step 2: Configure OAuth Application

1. **Client Name**: `USA Payments Partner Portal`
2. **Homepage URL**: Your application URL (e.g., `http://localhost:3000` for development)
3. **Authorized Redirect URIs**: `http://localhost:3000/auth/callback` (or your production URL)
4. Click "Create"

### Step 3: Get Client ID and Secret

After creating the app, you'll see:
- **Client ID**: Copy this to `ZOHO_CLIENT_ID`
- **Client Secret**: Copy this to `ZOHO_CLIENT_SECRET`

### Step 4: Generate Refresh Token

1. Go to this URL (replace with your Client ID):
   ```
   https://accounts.zoho.com/oauth/v2/auth?scope=ZohoCRM.modules.ALL,ZohoCRM.settings.ALL&client_id=YOUR_CLIENT_ID&response_type=code&access_type=offline&redirect_uri=http://localhost:3000/auth/callback
   ```

2. Authorize the application - you'll be redirected with a `code` parameter

3. Exchange the code for a refresh token using curl:
   ```bash
   curl -X POST https://accounts.zoho.com/oauth/v2/token \
     -d "code=YOUR_CODE" \
     -d "client_id=YOUR_CLIENT_ID" \
     -d "client_secret=YOUR_CLIENT_SECRET" \
     -d "redirect_uri=http://localhost:3000/auth/callback" \
     -d "grant_type=authorization_code"
   ```

4. Copy the `refresh_token` from the response to `ZOHO_REFRESH_TOKEN`

## 🧪 Testing the Integration

### 1. Test Zoho Connection

```bash
cd backend
npm run test:zoho:health
```

Expected output:
```
✅ Environment Variables: All required environment variables are set
✅ Authentication: Successfully obtained access token
✅ API Connectivity: Successfully connected to Zoho CRM API
🎉 All health checks passed! Zoho CRM is ready.
```

### 2. Test Lead Creation

```bash
npm run test:zoho:comprehensive
```

This will:
- Create a test vendor/partner in Zoho
- Create a test lead in Zoho
- Add a note to the lead
- Search for leads by partner

### 3. Start the Servers

Terminal 1 (Backend):
```bash
cd backend
npm run dev
```

Terminal 2 (Frontend):
```bash
cd frontend
npm run dev
```

### 4. Test the UI

1. Navigate to `http://localhost:3000`
2. Log in with your test credentials
3. Go to Dashboard - should show Zoho lead stats
4. Go to Leads - should display leads from Zoho
5. Create a new lead - should sync to Zoho CRM

## 🔄 Data Flow

### Lead Creation Flow
1. **User** submits lead form in Portal
2. **Frontend** calls `/api/leads` endpoint
3. **Backend** validates and creates lead in local database
4. **Backend** syncs lead to Zoho CRM via API
5. **Backend** stores Zoho Lead ID in local database
6. **Backend** adds note to lead in Zoho (if description provided)
7. **Response** sent back to frontend with success/failure

### Lead Status Update Flow (Webhook)
1. **Zoho CRM** lead status changes
2. **Zoho** sends webhook to `/api/webhooks/zoho/lead-status`
3. **Backend** updates local database with new status
4. **Backend** creates status history record
5. **Backend** logs activity
6. (Future) **Backend** sends real-time update to Portal via WebSocket

### Partner Provisioning Flow (Webhook)
1. **Zoho CRM** partner/vendor created
2. **Zoho** sends webhook to `/api/webhooks/zoho/partner`
3. **Backend** creates partner record in local database
4. **Backend** creates user account via Supabase
5. **Backend** sends welcome email with credentials

## 📊 Webhook Configuration in Zoho

### Setting up Webhooks

1. Go to **Zoho CRM** → **Setup** → **Automation** → **Actions** → **Webhooks**

2. **Partner Creation Webhook**:
   - Name: `Partner Portal - New Partner`
   - URL: `https://your-domain.com/api/webhooks/zoho/partner`
   - Method: `POST`
   - Module: `Vendors`
   - When: `On Create`
   - Body: 
     ```json
     {
       "id": "${Vendors.id}",
       "VendorName": "${Vendors.Vendor_Name}",
       "Email": "${Vendors.Email}"
     }
     ```

3. **Lead Status Update Webhook**:
   - Name: `Partner Portal - Lead Status Update`
   - URL: `https://your-domain.com/api/webhooks/zoho/lead-status`
   - Method: `POST`
   - Module: `Leads`
   - When: `On Update` (Field: `Lead_Status`)
   - Body:
     ```json
     {
       "id": "${Leads.id}",
       "Lead_Status": "${Leads.Lead_Status}",
       "StrategicPartnerId": "${Leads.StrategicPartnerId}"
     }
     ```

4. **Contact/Sub-Account Webhook**:
   - Name: `Partner Portal - New Contact`
   - URL: `https://your-domain.com/api/webhooks/zoho/contact`
   - Method: `POST`
   - Module: `Contacts`
   - When: `On Create`
   - Body:
     ```json
     {
       "contactId": "${Contacts.id}",
       "name": "${Contacts.Full_Name}",
       "email": "${Contacts.Email}",
       "partnerId": "${Contacts.Vendor.id}"
     }
     ```

## 🔍 Troubleshooting

### Common Issues

#### 1. "Authentication failed" error
- **Cause**: Invalid or expired refresh token
- **Solution**: Generate a new refresh token following Step 4 above

#### 2. "Failed to fetch leads" in UI
- **Cause**: Backend not running or CORS issue
- **Solution**: 
  - Ensure backend is running on port 3001
  - Check CORS configuration in backend
  - Verify `NEXT_PUBLIC_API_URL` in frontend

#### 3. Webhook not receiving data
- **Cause**: Webhook URL not accessible or incorrect
- **Solution**:
  - Use ngrok for local testing: `ngrok http 3001`
  - Update webhook URL in Zoho to ngrok URL
  - Check webhook logs in Zoho

#### 4. "Partner not found" when creating lead
- **Cause**: User's partner doesn't have zoho_partner_id
- **Solution**: Ensure partners are created via webhook or manually set zoho_partner_id

## 📝 API Endpoints Reference

### Leads
- `GET /api/leads` - Get all leads for authenticated partner
- `POST /api/leads` - Create new lead and sync to Zoho
- `GET /api/leads/:id` - Get specific lead details
- `PATCH /api/leads/:id/status` - Update lead status

### Webhooks
- `POST /api/webhooks/zoho/partner` - Partner creation webhook
- `POST /api/webhooks/zoho/lead-status` - Lead status update webhook
- `POST /api/webhooks/zoho/contact` - Contact/sub-account creation webhook

## 🎯 Next Steps

1. **Environment Setup**: Configure all environment variables
2. **Zoho Credentials**: Get Zoho API credentials and refresh token
3. **Test Connection**: Run health checks to verify Zoho connectivity
4. **Database Setup**: Ensure Supabase database is configured
5. **Start Servers**: Run both frontend and backend servers
6. **Configure Webhooks**: Set up webhooks in Zoho CRM
7. **Test End-to-End**: Create a lead and verify it appears in Zoho

## 📚 Additional Resources

- [Zoho CRM API Documentation](https://www.zoho.com/crm/developer/docs/api/)
- [Zoho OAuth 2.0 Guide](https://www.zoho.com/crm/developer/docs/api/v2/oauth-overview.html)
- [Supabase Documentation](https://supabase.com/docs)
- [Project Memory Bank](./memory-bank/) for architecture details

## ✨ Features Implemented

- ✅ Real-time lead statistics from Zoho
- ✅ Lead creation with automatic Zoho sync
- ✅ Lead listing with search and filtering
- ✅ Partner provisioning via webhooks
- ✅ Status tracking and history
- ✅ Toast notifications for user feedback
- ✅ Error handling and retry logic
- ✅ Activity logging

## 🚀 Ready to Go!

Your Partner Portal is now fully integrated with Zoho CRM! Follow the setup steps above to configure your credentials and start syncing data between the portal and Zoho CRM.

