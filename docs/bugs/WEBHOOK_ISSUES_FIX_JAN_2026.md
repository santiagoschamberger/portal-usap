# Webhook Issues Fix - January 22, 2026

## Issues Identified

### 1. Database CHECK Constraint Violations ❌ CRITICAL

**Error Messages:**
```
new row for relation "deals" violates check constraint "deals_stage_check"
new row for relation "leads" violates check constraint "leads_status_check"
```

**Root Cause:**
- Migration 023 updated the data but did NOT update the CHECK constraints
- The constraints still reference old status/stage values
- New webhook data using correct mappings is being rejected by outdated constraints

**Impact:**
- All deal webhooks fail with 500 error when stage is "In Underwriting"
- All lead status webhooks fail with 500 error when status is "Application Signed"
- Data sync is completely broken

**Solution:**
Created Migration 024 to:
1. Drop old CHECK constraints
2. Add new CHECK constraints with correct values matching STATUS_STAGE_MAPPING_REFERENCE.md

---

### 2. Missing Contact Information in Deal Webhooks ⚠️ MEDIUM

**Error Symptoms:**
```javascript
Contact details from webhook: {
  firstName: null,
  lastName: null,
  email: null,
  phone: null,
  accountName: 'acjja'
}
```

**Root Cause:**
Zoho webhook payload doesn't always include complete contact information. The deal webhook attempts to fetch from Zoho API but the response also has incomplete data:

```javascript
Fetched full deal from Zoho: {
  id: '5577028000053758035',
  Deal_Name: 'acjja',
  Contact_Name: { name: 'sadsdas asdasd', id: '5577028000053760001' },
  Email: null  // ❌ Missing!
}
```

**Impact:**
- Deals are created without contact information
- Lead conversion matching fails (relies on email/name)
- Notifications can't be sent to the right users

**Solution:**
Enhanced the deal webhook handler to:
1. Parse Contact_Name object structure properly
2. Fetch the full contact record from Zoho if deal doesn't have email
3. Use contact lookup as fallback: `GET /Contacts/{contactId}`

---

### 3. Lead Conversion Matching Failure ⚠️ MEDIUM

**Error Message:**
```
⚠️ No matching lead found for conversion
   This might be a direct deal creation (not from lead conversion)
```

**Root Cause:**
Lead matching logic depends on email/name, but if these are null (issue #2), the matching fails completely.

**Impact:**
- Converted leads are not removed from leads table
- Duplicate records exist in both leads and deals
- User sees same entity in both sections

**Solution:**
Improve matching strategies:
1. Try by Zoho Lead ID (most reliable if available)
2. Try by email
3. Try by firstName + lastName + company
4. Try by firstName + lastName only
5. Log when match fails for debugging

---

## Implementation Plan

### Step 1: Apply Database Migration (CRITICAL - DO FIRST)

```bash
cd backend
psql $DATABASE_URL -f database/migrations/024_fix_status_stage_constraints.sql
```

**Verification:**
```sql
-- Check constraints are updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'leads'::regclass AND contype = 'c';

SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'deals'::regclass AND contype = 'c';
```

Expected output:
- `leads_status_check` includes: New, Contact Attempt, Contacted - In Progress, Sent for Signature, Application Signed, Lost, Converted
- `deals_stage_check` includes: In Underwriting, Conditionally Approved, Approved, Lost, Declined, Closed

---

### Step 2: Update Deal Webhook Handler

**File:** `backend/src/routes/webhooks.ts`

**Changes:**

1. **Enhanced Contact Fetching:**

```typescript
// After fetching deal, if email is missing, fetch contact separately
if (!email && Contact_Name?.id) {
  console.log(`⚠️  Email missing, fetching contact ${Contact_Name.id} from Zoho...`);
  try {
    const contactResponse = await zohoService.getContactById(Contact_Name.id);
    const contact = contactResponse?.data?.[0];
    
    if (contact) {
      email = contact.Email || null;
      phone = phone || contact.Phone || null;
      firstName = firstName || contact.First_Name || null;
      lastName = lastName || contact.Last_Name || null;
      
      console.log('✅ Contact fetched successfully:', { firstName, lastName, email });
    }
  } catch (contactError) {
    console.error('Failed to fetch contact from Zoho:', contactError);
  }
}
```

2. **Improved Contact_Name Parsing:**

```typescript
// Parse Contact_Name object if it's present
if (Contact_Name) {
  if (typeof Contact_Name === 'object') {
    contactName = Contact_Name.name || '';
    email = email || Contact_Name.email || null;
    phone = phone || Contact_Name.phone || null;
    
    // Extract first/last name from contact name
    const nameParts = contactName.split(' ');
    firstName = firstName || Contact_Name.First_Name || nameParts[0] || null;
    lastName = lastName || Contact_Name.Last_Name || nameParts.slice(1).join(' ') || null;
  } else if (typeof Contact_Name === 'string') {
    contactName = Contact_Name;
  }
}
```

---

### Step 3: Add Missing Zoho Service Method

**File:** `backend/src/services/zohoService.ts`

Add method to fetch contacts:

```typescript
/**
 * Get a contact by ID from Zoho CRM
 */
async getContactById(contactId: string): Promise<any> {
  try {
    const headers = await this.getAuthHeaders();
    const response = await axios.get(`${this.baseUrl}/Contacts/${contactId}`, {
      headers
    });
    return response.data;
  } catch (error) {
    console.error('Error getting contact from Zoho:', error);
    throw error;
  }
}
```

---

### Step 4: Enhanced Lead Matching Logic

**File:** `backend/src/routes/webhooks.ts`

Already implemented but verify these strategies exist:

```typescript
// Strategy 1: Try by Zoho Lead ID (if available in webhook)
// Strategy 2: Try by email (most reliable)
// Strategy 3: Try by name + company
// Strategy 4: Try by name only (fallback)
```

---

## Testing Plan

### Test 1: Database Constraints

```sql
-- Should succeed (valid statuses)
INSERT INTO leads (id, partner_id, first_name, last_name, email, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM partners LIMIT 1), 'Test', 'User', 'test@test.com', 'Application Signed', NOW(), NOW());

-- Should succeed (valid stages)
INSERT INTO deals (id, partner_id, deal_name, stage, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM partners LIMIT 1), 'Test Deal', 'In Underwriting', NOW(), NOW());

-- Should FAIL (invalid status)
INSERT INTO leads (id, partner_id, first_name, last_name, email, status, created_at, updated_at)
VALUES (gen_random_uuid(), (SELECT id FROM partners LIMIT 1), 'Bad', 'Status', 'bad@test.com', 'Invalid Status', NOW(), NOW());
```

### Test 2: Deal Webhook with Missing Email

1. Create a deal in Zoho with contact but no email in deal fields
2. Watch logs for:
   - `⚠️  Email missing, fetching contact...`
   - `✅ Contact fetched successfully`
3. Verify deal is created with email from contact

### Test 3: Lead Status Webhook

1. Update lead in Zoho to "Signed Application"
2. Verify:
   - Webhook returns 200 OK (not 500)
   - Lead status in database is "Application Signed"
   - No constraint violation errors

### Test 4: Deal Stage Webhook

1. Create deal in Zoho with stage "Sent to Underwriting"
2. Verify:
   - Webhook returns 201 Created (not 500)
   - Deal stage in database is "In Underwriting"
   - No constraint violation errors

### Test 5: Lead Conversion

1. Create lead in Zoho
2. Convert lead to deal in Zoho
3. Verify:
   - Lead is removed from leads table
   - Deal is created in deals table
   - Deal has correct contact info from original lead
   - No constraint violation errors

---

## Deployment Steps

1. **Backup Database** (CRITICAL)
   ```bash
   cd backend/database/backups
   ./backup.sh
   ```

2. **Apply Migration 024**
   ```bash
   cd backend
   psql $DATABASE_URL -f database/migrations/024_fix_status_stage_constraints.sql
   ```

3. **Deploy Backend Code**
   ```bash
   cd backend
   npm run build
   # Deploy to Railway or your hosting platform
   ```

4. **Verify Webhooks**
   - Check Railway logs for any constraint errors
   - Test a few webhooks manually
   - Monitor for 500 errors

---

## Rollback Plan

If issues occur after deployment:

1. **Rollback Code:**
   ```bash
   git revert <commit-hash>
   # Redeploy
   ```

2. **Rollback Database (if needed):**
   ```sql
   -- Drop new constraints
   ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
   ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;
   
   -- Add old constraints (you'll need to check what the old ones were)
   -- Or restore from backup
   ```

---

## Monitoring

After deployment, monitor:

1. **Webhook Success Rate:**
   - Check Railway logs for 500 errors
   - Look for constraint violation messages

2. **Data Integrity:**
   ```sql
   -- Check for orphaned leads (should be 0)
   SELECT COUNT(*) FROM leads l
   WHERE EXISTS (
     SELECT 1 FROM deals d 
     WHERE d.first_name = l.first_name 
       AND d.last_name = l.last_name
       AND d.partner_id = l.partner_id
   );
   
   -- Check for deals without contact info
   SELECT COUNT(*) FROM deals 
   WHERE email IS NULL OR first_name IS NULL OR last_name IS NULL;
   ```

3. **Lead Conversion Rate:**
   - Monitor activity_log for 'lead_converted' events
   - Verify converted leads are removed

---

## Related Files

- `docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md` - Status/stage mappings
- `backend/database/migrations/023_update_status_stage_mappings.sql` - Data migration
- `backend/database/migrations/024_fix_status_stage_constraints.sql` - Constraint fix (NEW)
- `backend/src/services/leadStatusMappingService.ts` - Lead status mapping logic
- `backend/src/services/stageMappingService.ts` - Deal stage mapping logic
- `backend/src/routes/webhooks.ts` - Webhook handlers

---

**Status:** Ready for deployment
**Priority:** CRITICAL (webhooks completely broken)
**Estimated Fix Time:** 30 minutes
**Estimated Testing Time:** 1 hour
