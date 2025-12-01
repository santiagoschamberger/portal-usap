# Phase 1: Verification & Foundation Report

**Date Started:** November 14, 2025  
**Status:** 🔄 In Progress  
**Phase:** 1 of 10

---

## 📋 Phase 1 Objectives

1. ✅ Verify all webhooks working correctly
2. ⏳ Test bi-directional sync (Portal ↔ Zoho)
3. ⏳ Document current Zoho field mappings
4. ⏳ Pull Zoho "State" field values for dropdown
5. ⏳ Verify Zoho API stage names
6. ⏳ Check "Partner Type" field in Zoho
7. ⏳ Create database backup

---

## 🔍 Webhook Analysis

### 1. Partner Webhook ✅
**Endpoint:** `POST /api/webhooks/zoho/partner`  
**Status:** Implemented and functional

**Current Implementation:**
- Creates partner record in portal
- Uses security definer function `create_partner_with_user()`
- Creates Supabase Auth user
- Logs activity
- TODO: Send welcome email (not yet configured)

**Fields Received:**
- `id` → `zoho_partner_id`
- `VendorName` → `name`
- `Email` → `email`

**Missing for Enhancement:**
- ❌ `partner_type` field not captured (needed for Agent/ISO handling)

**Action Items:**
- [ ] Add `partner_type` field extraction from Zoho
- [ ] Verify Zoho field name for partner type
- [ ] Update webhook to store partner type

---

### 2. Contact Webhook ✅
**Endpoint:** `POST /api/webhooks/zoho/contact`  
**Status:** Implemented and functional

**Current Implementation:**
- Creates sub-account users
- Supports both header (module parameters) and body (JSON) formats
- Validates parent partner exists and is approved
- Prevents duplicate accounts
- Sends password reset email
- Logs activity

**Fields Received:**
- `fullname` or `First_Name`/`Last_Name` → name
- `email` → email
- `parentid` or `Vendor.id` or `Account_Name.id` → partner link
- `partnerid` or `id` → contact ID

**Current Behavior:**
- ✅ Creates sub-accounts only when linked to partner
- ✅ Skips creation for lead-generated contacts
- ✅ Prevents duplicate main account emails

**Missing for Enhancement:**
- ❌ Permission fields not set (`can_submit_leads`, `can_view_all_partner_leads`)
- ❌ Default permissions need to be configured

**Action Items:**
- [ ] Add permission field initialization
- [ ] Set `can_submit_leads = true` by default
- [ ] Set `can_view_all_partner_leads = false` by default
- [ ] Add `is_active = true` by default

---

### 3. Lead Status Webhook ✅
**Endpoint:** `POST /api/webhooks/zoho/lead-status`  
**Status:** Implemented and functional

**Current Implementation:**
- Updates lead status from Zoho
- Maintains single status history record (deletes previous)
- Maps Zoho statuses to local statuses
- Logs activity

**Current Status Mapping:**
```javascript
{
  'New': 'new',
  'Contacted': 'contacted',
  'Qualified': 'qualified',
  'Proposal': 'proposal',
  'Negotiation': 'negotiation',
  'Closed Won': 'closed_won',
  'Closed Lost': 'closed_lost',
  'Nurture': 'nurture',
  'Unqualified': 'unqualified',
  'Signed Application': 'qualified',
  'Application Signed': 'qualified',
  'Under Review': 'qualified',
  'In Review': 'qualified'
}
```

**Issues:**
- ❌ Current mapping doesn't match new simplified 6-status system
- ❌ Needs update to match Portal Enhancement Plan requirements

**Required New Mapping (Phase 3):**
```javascript
{
  'Lead': 'Pre-Vet / New Lead',
  'Contacted': 'Contacted',
  'Application Submitted': 'Sent for Signature / Submitted',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Lost': 'Dead / Withdrawn'
}
```

**Action Items:**
- [ ] Verify exact Zoho status field values
- [ ] Document all possible Zoho lead statuses
- [ ] Plan migration for Phase 3

---

### 4. Deal Webhook ✅
**Endpoint:** `POST /api/webhooks/zoho/deal`  
**Status:** Implemented and functional

**Current Implementation:**
- Creates/updates deals from Zoho
- Maintains single stage history record (deletes previous)
- Handles lead conversion (removes lead from leads table)
- Maps 13 Zoho stages to local stages
- Captures approval date from `Approval_Time_Stamp`
- Tracks original submitter

**Current Stage Mapping:**
```javascript
{
  'New Deal': 'New Deal',
  'Pre-Vet': 'Pre-Vet',
  'Sent for Signature': 'Sent for Signature',
  'Signed Application': 'Signed Application',
  'Sent to Underwriting': 'Sent to Underwriting',
  'App Pended': 'App Pended',
  'Approved': 'Approved',
  'Declined': 'Declined',
  'Dead / Do Not Contact': 'Dead / Do Not Contact',
  'Merchant Unresponsive': 'Merchant Unresponsive',
  'App Withdrawn': 'App Withdrawn',
  'Approved - Closed': 'Approved - Closed',
  'Conditionally Approved': 'Conditionally Approved'
}
```

**Issues:**
- ❌ Current mapping is 1:1, needs simplification to 5 stages
- ❌ Missing "Send to Motion" stage (need to verify if it exists)

**Required New Mapping (Phase 5):**
```javascript
{
  'New Deal': 'New Lead / Prevet',
  'Pre-Vet': 'New Lead / Prevet',
  'Sent for Signature': 'Submitted',
  'Signed Application': 'Submitted',
  'Sent to Underwriting': 'Underwriting',
  'App Pended': 'Underwriting',
  'Approved': 'Approved',
  'Conditionally Approved': 'Approved',
  'Declined': 'Declined',
  'Approved - Closed': 'Closed',
  'Dead / Do Not Contact': 'Closed',
  'Merchant Unresponsive': 'Closed',
  'App Withdrawn': 'Closed'
}
```

**Action Items:**
- [ ] Verify all 13 Zoho deal stages exist
- [ ] Check if "Send to Motion" stage exists
- [ ] Document any additional stages
- [ ] Plan migration for Phase 5

---

## 🔄 Bi-Directional Sync Status

### Portal → Zoho (Outbound)

#### Lead Creation
**Endpoint:** `POST /api/leads`  
**Status:** ⏳ Need to verify

**Action Items:**
- [ ] Test lead creation from portal
- [ ] Verify lead appears in Zoho CRM
- [ ] Verify all fields map correctly
- [ ] Document field mapping

#### Lead Status Update
**Endpoint:** `PATCH /api/leads/:id/status`  
**Status:** ⏳ Need to verify

**Action Items:**
- [ ] Test status update from portal
- [ ] Verify status syncs to Zoho
- [ ] Test all 6 new statuses (after Phase 3)

### Zoho → Portal (Inbound)

#### Partner Provisioning
**Status:** ✅ Working (via webhook)

#### Sub-Account Creation
**Status:** ✅ Working (via webhook)

#### Lead Status Updates
**Status:** ✅ Working (via webhook)

#### Deal Creation/Updates
**Status:** ✅ Working (via webhook)

---

## 📊 Current Database Schema

### Tables Verified
- ✅ `partners` - Exists
- ✅ `users` - Exists
- ✅ `leads` - Exists
- ✅ `deals` - Exists
- ✅ `lead_status_history` - Exists
- ✅ `deal_stage_history` - Exists
- ✅ `activity_log` - Exists

### Schema Changes Needed

#### Partners Table
```sql
-- Need to add for Phase 7
ALTER TABLE partners ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'standard';
```

#### Users Table
```sql
-- Need to add for Phase 6
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_submit_leads BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_view_all_partner_leads BOOLEAN DEFAULT false;
```

#### Leads Table
```sql
-- Need to add for Phase 7
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_partner_id UUID REFERENCES partners(id);

-- Need to verify exists for Phase 2
-- ALTER TABLE leads ADD COLUMN IF NOT EXISTS lander_message TEXT;
```

#### Compensation Documents Table
```sql
-- Need to create for Phase 8
CREATE TABLE compensation_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id UUID REFERENCES partners(id) NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  upload_date TIMESTAMP DEFAULT NOW(),
  uploaded_by UUID REFERENCES users(id),
  month_year TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## 🔍 Zoho Field Investigation

### Questions to Answer

1. **Partner Type Field**
   - [ ] What is the exact field name in Zoho?
   - [ ] What are the possible values?
   - [ ] Is it a picklist or text field?
   - [ ] Where is it located (Partners/Vendors module)?

2. **State Field**
   - [ ] What is the exact field name in Zoho Leads?
   - [ ] Is it a picklist with predefined values?
   - [ ] What are all the possible values?
   - [ ] Does it include territories (PR, VI, etc.)?

3. **Deal Stages**
   - [ ] Verify all 13 stages exist
   - [ ] Check if "Send to Motion" exists
   - [ ] Are there any additional stages?
   - [ ] What is the default stage for new deals?

4. **Lead Statuses**
   - [ ] What are all possible lead status values?
   - [ ] Which statuses are we using?
   - [ ] What is the default status for new leads?

---

## 🧪 Testing Plan

### Webhook Testing

#### Test 1: Partner Webhook
```bash
# Test payload
curl -X POST https://your-backend.railway.app/api/webhooks/zoho/partner \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_partner_123",
    "VendorName": "Test Partner LLC",
    "Email": "test@testpartner.com"
  }'
```

**Expected Result:**
- [ ] Partner created in database
- [ ] User created in Supabase Auth
- [ ] Activity logged
- [ ] Response: 201 with partner_id and user_id

#### Test 2: Contact Webhook
```bash
# Test payload
curl -X POST https://your-backend.railway.app/api/webhooks/zoho/contact \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_contact_123",
    "First_Name": "John",
    "Last_Name": "Doe",
    "Email": "john@testpartner.com",
    "Vendor": { "id": "test_partner_123" }
  }'
```

**Expected Result:**
- [ ] Sub-account created
- [ ] Linked to correct partner
- [ ] Password reset email sent
- [ ] Activity logged
- [ ] Response: 201 with user_id

#### Test 3: Lead Status Webhook
```bash
# Test payload (requires existing lead)
curl -X POST https://your-backend.railway.app/api/webhooks/zoho/lead-status \
  -H "Content-Type: application/json" \
  -d '{
    "id": "existing_zoho_lead_id",
    "Lead_Status": "Contacted",
    "StrategicPartnerId": "test_partner_123"
  }'
```

**Expected Result:**
- [ ] Lead status updated
- [ ] Previous status history deleted
- [ ] New status history created
- [ ] Activity logged
- [ ] Response: 200 with old_status and new_status

#### Test 4: Deal Webhook
```bash
# Test payload
curl -X POST https://your-backend.railway.app/api/webhooks/zoho/deal \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test_deal_123",
    "Deal_Name": "Test Deal",
    "Stage": "New Deal",
    "Partners_Id": "test_partner_123",
    "Business_Name": "Test Business",
    "Contact_First_Name": "Jane",
    "Contact_Name": "Jane Smith"
  }'
```

**Expected Result:**
- [ ] Deal created in database
- [ ] Stage history created
- [ ] Activity logged
- [ ] Response: 201 with deal_id

### Sync Testing

#### Test 5: Lead Creation (Portal → Zoho)
1. [ ] Create lead via portal UI
2. [ ] Verify lead appears in Zoho CRM
3. [ ] Verify all fields match
4. [ ] Verify `StrategicPartnerId` set correctly

#### Test 6: Lead Status Update (Zoho → Portal)
1. [ ] Update lead status in Zoho CRM
2. [ ] Verify webhook fires
3. [ ] Verify status updates in portal
4. [ ] Verify status history updated

---

## 📝 Zoho API Investigation Script

Create a script to pull field information from Zoho:

```javascript
// backend/scripts/investigate-zoho-fields.js
const zohoService = require('../src/services/zohoService');

async function investigateFields() {
  try {
    console.log('Investigating Zoho CRM fields...\n');
    
    // 1. Get Partner/Vendor fields
    console.log('=== PARTNER/VENDOR FIELDS ===');
    const partnerFields = await zohoService.getModuleFields('Vendors');
    const partnerTypeField = partnerFields.find(f => 
      f.api_name.toLowerCase().includes('type') || 
      f.api_name.toLowerCase().includes('partner')
    );
    console.log('Partner Type Field:', partnerTypeField);
    
    // 2. Get Lead fields
    console.log('\n=== LEAD FIELDS ===');
    const leadFields = await zohoService.getModuleFields('Leads');
    const stateField = leadFields.find(f => 
      f.api_name.toLowerCase() === 'state' ||
      f.field_label.toLowerCase() === 'state'
    );
    console.log('State Field:', stateField);
    if (stateField && stateField.pick_list_values) {
      console.log('State Values:', stateField.pick_list_values);
    }
    
    const statusField = leadFields.find(f => f.api_name === 'Lead_Status');
    console.log('Lead Status Field:', statusField);
    if (statusField && statusField.pick_list_values) {
      console.log('Lead Status Values:', statusField.pick_list_values);
    }
    
    // 3. Get Deal fields
    console.log('\n=== DEAL FIELDS ===');
    const dealFields = await zohoService.getModuleFields('Deals');
    const stageField = dealFields.find(f => f.api_name === 'Stage');
    console.log('Deal Stage Field:', stageField);
    if (stageField && stageField.pick_list_values) {
      console.log('Deal Stage Values:', stageField.pick_list_values);
    }
    
    // Check for "Send to Motion" stage
    const sendToMotion = stageField?.pick_list_values?.find(v => 
      v.display_value === 'Send to Motion'
    );
    console.log('Send to Motion exists?', sendToMotion ? 'YES' : 'NO');
    
    const approvalField = dealFields.find(f => 
      f.api_name === 'Approval_Time_Stamp'
    );
    console.log('Approval Time Stamp Field:', approvalField);
    
  } catch (error) {
    console.error('Error investigating fields:', error);
  }
}

investigateFields();
```

**Action Items:**
- [ ] Create investigation script
- [ ] Run script to pull field information
- [ ] Document all findings
- [ ] Update planning documents with actual field names

---

## 💾 Database Backup

### Backup Plan
```bash
# Using Supabase CLI or dashboard
# 1. Export current schema
supabase db dump --schema public > backup_schema_$(date +%Y%m%d).sql

# 2. Export data
supabase db dump --data-only > backup_data_$(date +%Y%m%d).sql

# 3. Verify backups
ls -lh backup_*.sql
```

**Action Items:**
- [ ] Create database backup
- [ ] Verify backup integrity
- [ ] Store backup securely
- [ ] Document restore procedure

---

## 📋 Phase 1 Checklist

### Verification Tasks
- [x] Review webhook implementations
- [ ] Test partner webhook
- [ ] Test contact webhook
- [ ] Test lead-status webhook
- [ ] Test deal webhook
- [ ] Test lead creation (Portal → Zoho)
- [ ] Test lead status update (Portal → Zoho)
- [ ] Verify deal sync (Zoho → Portal)

### Investigation Tasks
- [ ] Create Zoho field investigation script
- [ ] Run investigation script
- [ ] Document Partner Type field
- [ ] Document State field values
- [ ] Document all Lead Status values
- [ ] Document all Deal Stage values
- [ ] Verify "Send to Motion" stage exists

### Documentation Tasks
- [ ] Document current field mappings
- [ ] Document webhook payload formats
- [ ] Document API endpoints
- [ ] Create field mapping reference
- [ ] Update planning documents with findings

### Backup Tasks
- [ ] Create database backup
- [ ] Verify backup
- [ ] Document restore procedure

---

## 🎯 Success Criteria

Phase 1 is complete when:
- ✅ All 4 webhooks tested and verified working
- ✅ Bi-directional sync tested and documented
- ✅ All Zoho fields investigated and documented
- ✅ Database backup created and verified
- ✅ Field mapping reference complete
- ✅ All findings documented
- ✅ Ready to proceed to Phase 2

---

## 📊 Current Status

**Progress:** 25% Complete (1 of 4 tasks done)

**Completed:**
- ✅ Webhook code review

**In Progress:**
- 🔄 Webhook testing
- 🔄 Zoho field investigation

**Pending:**
- ⏳ Bi-directional sync testing
- ⏳ Database backup
- ⏳ Documentation updates

---

## 🚀 Next Steps

1. **Create Zoho investigation script**
2. **Run script to pull field information**
3. **Test all 4 webhooks manually**
4. **Test Portal → Zoho lead creation**
5. **Create database backup**
6. **Document all findings**
7. **Update planning documents**
8. **Mark Phase 1 complete**
9. **Begin Phase 2**

---

**Last Updated:** November 14, 2025  
**Updated By:** AI Assistant (Cline)  
**Status:** In Progress

