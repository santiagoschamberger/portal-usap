# Backend Scripts

This directory contains utility scripts for testing, investigation, and maintenance of the Partner Portal backend.

---

## 🔍 Phase 1: Investigation & Testing Scripts

### 1. Zoho Field Investigation

**Script:** `investigate-zoho-fields.js`

**Purpose:** Automatically investigates Zoho CRM fields to document field names, types, and picklist values.

**What it checks:**
- Partner/Vendor fields (Partner Type)
- Lead fields (State, Lead Status, Lander Message)
- Deal fields (Stage, Approval Time Stamp, Partners_Id)

**Usage:**
```bash
cd backend
node scripts/investigate-zoho-fields.js
```

**Requirements:**
- `.env` file with Zoho credentials:
  - `ZOHO_CLIENT_ID`
  - `ZOHO_CLIENT_SECRET`
  - `ZOHO_REFRESH_TOKEN`

**Output:**
- Formatted console output with all field information
- Lists all picklist values for dropdown fields
- Checks for specific fields like "Send to Motion" stage

---

### 2. Webhook Testing

**Script:** `test-webhooks.js`

**Purpose:** Tests all 4 Zoho CRM webhooks with sample payloads.

**Webhooks tested:**
1. Partner webhook (`/api/webhooks/zoho/partner`)
2. Contact webhook (`/api/webhooks/zoho/contact`)
3. Lead Status webhook (`/api/webhooks/zoho/lead-status`)
4. Deal webhook (`/api/webhooks/zoho/deal`)

**Usage:**

Test all webhooks:
```bash
cd backend
node scripts/test-webhooks.js all
```

Test individual webhooks:
```bash
node scripts/test-webhooks.js partner
node scripts/test-webhooks.js contact
node scripts/test-webhooks.js lead-status
node scripts/test-webhooks.js deal
```

**Requirements:**
- Backend server running (locally or on Railway)
- `.env` file with `BACKEND_URL` (defaults to `http://localhost:5001`)

**Output:**
- Color-coded test results
- Success/failure status for each webhook
- Response data from each test
- Summary of all tests

**Notes:**
- Creates test data in the database
- Lead Status test requires an existing lead
- Partner webhook must succeed before Contact/Deal webhooks

---

## 🧪 Existing Test Scripts

### Zoho Integration Tests

Located in `backend/tests/` directory:

- `test-zoho-health.ts` - Health check for Zoho connection
- `test-zoho-simple.js` - Simple Zoho API test
- `test-zoho.ts` - Basic Zoho integration test
- `test-zoho-comprehensive.ts` - Comprehensive integration test

**Run via package.json scripts:**
```bash
npm run test:zoho:health
npm run test:zoho:simple
npm run test:zoho:basic
npm run test:zoho:comprehensive
npm run test:zoho:all
```

---

## 🔧 Migration Scripts

### Apply Migrations

**Scripts:**
- `apply-migration-014.js`
- `apply-migration-015.js`
- `apply-migration-015-manual.js`

**Purpose:** Apply database migrations to Supabase.

**Usage:**
```bash
node scripts/apply-migration-014.js
```

---

## 📊 Data Verification Scripts

### Check Partner Data

**Script:** `check-partner-data.js`

**Purpose:** Verify partner data integrity in the database.

### Verify Single Records

**Script:** `verify-single-records.sql`

**Purpose:** SQL queries to verify single record requirement (leads/deals).

---

## 🔄 Webhook Testing Scripts

### Deal Webhook Tests

**Scripts:**
- `test-deal-webhook-debug.js`
- `test-lead-deal-conversion.js`
- `test-webhook-simple.js`

**Purpose:** Test deal webhook functionality and lead conversion logic.

---

## 📝 Script Development Guidelines

When creating new scripts:

1. **Add documentation** at the top of the file
2. **Include usage examples** in comments
3. **Handle errors gracefully** with clear messages
4. **Use environment variables** for configuration
5. **Add to this README** with description and usage
6. **Test thoroughly** before committing

---

## 🚀 Quick Start for Phase 1

To complete Phase 1 verification:

1. **Investigate Zoho fields:**
   ```bash
   node scripts/investigate-zoho-fields.js > field-investigation-results.txt
   ```

2. **Test all webhooks:**
   ```bash
   node scripts/test-webhooks.js all
   ```

3. **Review results** and document findings in:
   - `docs/PHASE_1_VERIFICATION_REPORT.md`

4. **Update planning documents** with actual field names and values

---

## 🔐 Environment Variables

Required for scripts:

```env
# Zoho CRM
ZOHO_CLIENT_ID=your_client_id
ZOHO_CLIENT_SECRET=your_client_secret
ZOHO_REFRESH_TOKEN=your_refresh_token

# Backend
BACKEND_URL=http://localhost:5001  # or Railway URL

# Database
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key
```

---

## 📞 Troubleshooting

### "Failed to get Zoho access token"
- Check your Zoho credentials in `.env`
- Verify refresh token is still valid
- Check Zoho API rate limits

### "Connection refused" (webhook tests)
- Ensure backend server is running
- Check `BACKEND_URL` in `.env`
- Verify port is correct (default: 5001)

### "Lead not found" (lead-status test)
- Expected if no leads exist in database
- Create a lead via portal UI first
- Or skip this test

---

**Last Updated:** November 14, 2025  
**Phase:** 1 - Verification & Foundation
