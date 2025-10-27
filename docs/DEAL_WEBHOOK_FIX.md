# Deal Webhook Fix - Lead to Deal Conversion

## Problem Identified

When a lead was converted to a deal in Zoho CRM, the deal was NOT showing up in the partner portal's "Deals" screen.

### Root Cause

The system was **missing a webhook endpoint** to listen for deal creation/update events from Zoho CRM. 

**What was working:**
- ✅ `/api/webhooks/zoho/partner` - Partner creation
- ✅ `/api/webhooks/zoho/lead-status` - Lead status updates
- ✅ `/api/webhooks/zoho/contact` - Sub-account creation

**What was missing:**
- ❌ `/api/webhooks/zoho/deal` - Deal creation/update webhook

When you converted a lead in Zoho CRM, the deal was created in Zoho but **nothing notified the portal**, so it never appeared in the Deals screen.

## Solution Implemented

### 1. New Webhook Endpoint Created

Added `/api/webhooks/zoho/deal` endpoint that:
- Listens for deal creation and update events from Zoho CRM
- Links deals back to the correct partner using `Vendor.id` field
- Links deals to the sub-account who created the original lead using `StrategicPartnerId`
- Stores the deal in the local database
- Creates stage history for audit trail
- Logs activity for tracking

### 2. How It Works

```
Lead Conversion Flow:
1. Sub-account creates lead in portal
2. Lead syncs to Zoho CRM with StrategicPartnerId (user ID)
3. Lead is converted to Deal in Zoho CRM
4. Zoho fires webhook → /api/webhooks/zoho/deal
5. Portal receives deal data
6. Portal finds partner via Vendor.id or StrategicPartnerId
7. Portal saves deal to database
8. Deal appears in portal's Deals screen
```

### 3. Key Features

**Partner Linking:**
- Primary: Uses `Vendor.id` to find partner in portal
- Fallback: Uses `StrategicPartnerId` (user ID) to find partner via user's partner_id

**Sub-Account Attribution:**
- Preserves `created_by` field so sub-accounts see "their" deals
- Uses `StrategicPartnerId` from the original lead

**Data Sync:**
- Maps Zoho deal stages to portal stages
- Extracts contact information
- Tracks deal amount, probability, close date
- Creates stage history for tracking changes

## Configuration Required in Zoho CRM

To make this work, you need to configure a webhook in Zoho CRM:

### Step 1: Access Zoho Webhooks

1. Log into Zoho CRM as admin
2. Go to **Setup** → **Automation** → **Actions** → **Webhooks**
3. Click **+ Configure Webhook**

### Step 2: Create Deal Webhook

**Webhook Configuration:**
- **Name:** `Portal Deal Sync`
- **Description:** `Syncs deals to partner portal when created or updated`
- **Module:** `Deals`
- **URL to notify:** `https://your-backend.up.railway.app/api/webhooks/zoho/deal`
- **Method:** `POST`
- **Content Type:** `JSON`

### Step 3: Configure Webhook Payload

Make sure these fields are included in the webhook payload:

**Required Fields:**
- `id` - Deal ID in Zoho
- `Deal_Name` - Name of the deal
- `Stage` - Current deal stage
- `Amount` - Deal value
- `Closing_Date` - Expected close date
- `Probability` - Win probability
- `Lead_Source` - Where the lead came from
- `StrategicPartnerId` - **CRITICAL** - Links to the user who created the lead
- `Vendor` - Partner/Account information
- `Account_Name` - Company name
- `Contact_Name` - Contact person details

**Example Payload Structure:**
```json
{
  "id": "5725767000001234567",
  "Deal_Name": "ABC Corp - Merchant Services",
  "Stage": "Qualification",
  "Amount": "50000",
  "Closing_Date": "2025-12-31",
  "Probability": 75,
  "Lead_Source": "Strategic Partner",
  "StrategicPartnerId": "user-uuid-here",
  "Vendor": {
    "id": "5725767000000987654",
    "name": "Partner Company Name"
  },
  "Account_Name": {
    "name": "ABC Corp",
    "id": "5725767000000111222"
  },
  "Contact_Name": {
    "name": "John Doe",
    "email": "john@abccorp.com",
    "phone": "555-1234"
  }
}
```

### Step 4: Set Webhook Trigger

**When to trigger:**
- ✅ **Create** - When a new deal is created (including lead conversion)
- ✅ **Edit** - When a deal is updated (stage changes, amount changes, etc.)

### Step 5: Test the Webhook

1. In Zoho CRM, convert a test lead to a deal
2. Check Railway logs for: `Deal webhook received:`
3. Verify the deal appears in the portal's Deals screen
4. Verify the deal is attributed to the correct sub-account

## Testing Checklist

### Test 1: Lead Conversion
- [ ] Sub-account creates a lead in portal
- [ ] Lead appears in Zoho CRM
- [ ] Convert lead to deal in Zoho
- [ ] Deal appears in portal Deals screen
- [ ] Deal is attributed to correct sub-account
- [ ] Main account can see the deal
- [ ] Sub-account can see the deal

### Test 2: Deal Update
- [ ] Update deal stage in Zoho CRM
- [ ] Webhook fires to portal
- [ ] Deal stage updates in portal
- [ ] Stage history is recorded

### Test 3: Sub-Account Permissions
- [ ] Sub-account A creates lead
- [ ] Lead converts to deal
- [ ] Sub-account A can see their deal
- [ ] Sub-account B CANNOT see the deal (unless main account)
- [ ] Main account can see all deals

## Troubleshooting

### Deal Not Appearing

**Check 1: Webhook Configuration**
```bash
# In Railway backend logs, look for:
"Deal webhook received:"
```

If you don't see this, webhook isn't firing from Zoho.

**Check 2: Partner Linking**
```bash
# Look for this error in logs:
"No partner found for deal"
```

This means `Vendor.id` or `StrategicPartnerId` isn't matching a partner in the portal.

**Check 3: Database Permissions**
```sql
-- Check if deal was created in database
SELECT * FROM deals WHERE zoho_deal_id = 'your-zoho-deal-id';
```

### Common Issues

**Issue:** "Partner not found"
- **Cause:** Vendor.id from Zoho doesn't match any partner's zoho_partner_id
- **Fix:** Verify partner exists and is approved in portal
- **Fix:** Check that Vendor field is populated in Zoho deal

**Issue:** Deal appears for wrong partner
- **Cause:** StrategicPartnerId pointing to different user's partner
- **Fix:** Ensure StrategicPartnerId is carried over from lead to deal in Zoho

**Issue:** Sub-account can't see their deal
- **Cause:** `created_by` field not set correctly
- **Fix:** Verify StrategicPartnerId is the sub-account's user ID

## Backend Code Changes

**File Modified:** `backend/src/routes/webhooks.ts`

**Changes Made:**
- Added new `/api/webhooks/zoho/deal` POST endpoint
- Implements partner lookup via Vendor.id and StrategicPartnerId
- Maps Zoho deal stages to portal stages
- Creates or updates deals in local database
- Records stage history for audit trail
- Logs all activity

**Lines Added:** ~230 lines of code

## Database Schema

The deals table was already created in migration `013_create_deals_table.sql`. No database changes needed.

**Deals Table Structure:**
- `id` - UUID primary key
- `partner_id` - Links to partner
- `created_by` - Links to user who created (sub-account)
- `zoho_deal_id` - Zoho CRM deal ID
- `deal_name` - Name of deal
- `amount` - Deal value
- `stage` - Current sales stage
- `close_date` - Expected close date
- RLS policies for partner isolation

## Next Steps

1. ✅ **Deploy Backend** - Push code to Railway
2. ⏳ **Configure Zoho Webhook** - Set up webhook in Zoho CRM pointing to Railway URL
3. ⏳ **Test End-to-End** - Create lead → Convert to deal → Verify appears in portal
4. ⏳ **Monitor Logs** - Watch Railway logs for webhook events

## Support

If issues persist after configuration:
1. Check Railway logs for webhook reception
2. Verify Zoho webhook is configured correctly
3. Test with Zoho webhook test feature
4. Check database for orphaned deals: `SELECT * FROM deals WHERE partner_id IS NULL`

---

**Last Updated:** October 27, 2025  
**Issue Fixed:** Deals not appearing after lead conversion  
**Solution:** Added missing webhook endpoint for deal sync

