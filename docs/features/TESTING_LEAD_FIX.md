# Quick Testing Guide for Lead Database Fix

## ✅ What Was Fixed

Leads are now properly saved to both Supabase and Zoho CRM. Previously, leads were only being created in Zoho CRM and NOT saved to the Supabase database.

## 🧪 How to Test

### Step 1: Restart the Backend Server

The TypeScript changes need to be compiled and the server restarted:

```bash
cd backend
npm run dev
# Or if running in production:
npm run build
npm start
```

### Step 2: Create a Test Lead

1. Log into the partner portal at `http://localhost:3000` (or your production URL)
2. Navigate to the "Submit Referral" or "Create Lead" page
3. Fill out the form with test data:
   ```
   First Name: John
   Last Name: Doe
   Email: john.test@example.com
   Company: Test Company Inc.
   Phone: (555) 123-4567
   Business Type: Business
   Description: This is a test lead to verify database saves
   ```
4. Click "Submit"

### Step 3: Check the Backend Console

You should now see **enhanced logging** with emoji indicators:

**Successful creation:**
```
✅ Lead saved to local database: abc-123-def-456
✅ Lead synced to Zoho CRM: 123456789
✅ Note added to Zoho lead
```

**Or if Zoho fails:**
```
✅ Lead saved to local database: abc-123-def-456
❌ Failed to sync lead to Zoho CRM: [error details]
⚠️ Lead saved locally but Zoho sync failed. Will retry later.
```

### Step 4: Verify in Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **leads** table
3. You should see your newly created lead with:
   - ✅ `first_name`: "John"
   - ✅ `last_name`: "Doe"  
   - ✅ `email`: "john.test@example.com"
   - ✅ `partner_id`: Your partner UUID
   - ✅ `created_by`: Your user UUID
   - ✅ `zoho_lead_id`: Zoho CRM lead ID (if sync succeeded)
   - ✅ `zoho_sync_status`: "synced" or "error"
   - ✅ `created_at`: Current timestamp

### Step 5: Verify in Portal "Leads" Page

1. Navigate to the "Leads" or "My Referrals" page in the portal
2. You should see your new lead in the `local_leads` section
3. The lead should show proper sync status

### Step 6: Verify in Zoho CRM

1. Log into your Zoho CRM account
2. Navigate to **Leads** module
3. Search for "john.test@example.com"
4. Verify the lead exists with correct data
5. Check that the note/description was added (if provided)

## 🔍 Verification Checklist

- [ ] Backend console shows "✅ Lead saved to local database"
- [ ] Backend console shows "✅ Lead synced to Zoho CRM"
- [ ] Lead appears in Supabase `leads` table
- [ ] Lead has proper `zoho_sync_status` value
- [ ] Lead has `zoho_lead_id` populated
- [ ] Lead appears in portal "Leads" page (local_leads section)
- [ ] Lead appears in Zoho CRM
- [ ] Activity log entry created in Supabase `activity_log` table

## 🐛 Troubleshooting

### If lead doesn't appear in Supabase:

Check the backend console for error messages:
```
❌ CRITICAL: Failed to save lead to local database: {
  error: ...,
  code: ...,
  message: ...,
}
```

Common issues:
- **Missing required fields**: Ensure first_name, last_name, and email are provided
- **Invalid partner_id**: Ensure you're logged in with a valid partner account
- **Database connection**: Check Supabase credentials in `.env` or `mcp.json`

### If lead doesn't sync to Zoho:

Check for:
```
❌ Failed to sync lead to Zoho CRM: [error message]
```

Common issues:
- **Zoho API credentials**: Check `ZOHO_CLIENT_ID`, `ZOHO_CLIENT_SECRET`, etc.
- **Zoho token expired**: May need to refresh OAuth tokens
- **Zoho API rate limits**: Wait and retry
- **Invalid data format**: Check Zoho field requirements

**Note:** Even if Zoho sync fails, the lead WILL be saved to Supabase with `zoho_sync_status: 'error'`

### If activity log is not created:

Check the backend console for activity log errors. The activity log should always be created after a successful lead save.

## 📊 SQL Queries for Verification

### Check recent leads:
```sql
SELECT 
  id, 
  first_name, 
  last_name, 
  email, 
  zoho_lead_id,
  zoho_sync_status,
  created_at
FROM leads
ORDER BY created_at DESC
LIMIT 10;
```

### Check sync status breakdown:
```sql
SELECT 
  zoho_sync_status,
  COUNT(*) as count
FROM leads
GROUP BY zoho_sync_status;
```

### Check activity logs:
```sql
SELECT 
  activity_type,
  description,
  metadata,
  created_at
FROM activity_log
WHERE activity_type = 'lead_created'
ORDER BY created_at DESC
LIMIT 10;
```

### Find failed syncs:
```sql
SELECT 
  id,
  first_name,
  last_name,
  email,
  notes,
  created_at
FROM leads
WHERE zoho_sync_status = 'error'
ORDER BY created_at DESC;
```

## ✅ Success Criteria

The fix is working correctly if:

1. ✅ **Local Save**: Lead appears in Supabase `leads` table immediately
2. ✅ **Zoho Sync**: Lead appears in Zoho CRM (or marked as 'error' if sync fails)
3. ✅ **Status Tracking**: `zoho_sync_status` accurately reflects sync state
4. ✅ **Activity Log**: Entry created in `activity_log` table
5. ✅ **Portal Display**: Lead visible in portal "Leads" page under `local_leads`
6. ✅ **Error Handling**: Clear error messages if something fails
7. ✅ **Console Logging**: Enhanced emoji-based logging for easy debugging

## 🎯 Expected Behavior Changes

### Before Fix:
- ❌ Lead created in Zoho only
- ❌ No local database record
- ❌ Silent failure with console.error only
- ❌ No activity log entry
- ❌ local_leads array always empty

### After Fix:
- ✅ Lead created in Supabase FIRST
- ✅ Then synced to Zoho
- ✅ Explicit error returned if Supabase save fails
- ✅ Activity log properly created
- ✅ local_leads array populated with actual data
- ✅ Clear sync status tracking

## 📝 Notes

- The fix does NOT require any database schema changes
- Existing leads in Zoho will still be fetched and displayed
- The fix only affects NEW lead creation going forward
- Old leads will not be backfilled into Supabase automatically
- If you want to backfill old leads, you'll need a separate migration script

## 🚀 Next Steps

After confirming the fix works:

1. Monitor the `zoho_sync_status` field for any 'error' entries
2. Consider implementing a retry mechanism for failed Zoho syncs
3. Set up alerts for persistent sync failures
4. Update any documentation that referenced the old behavior

## 📚 Related Documentation

- Full details: `docs/LEAD_DATABASE_FIX.md`
- System patterns: `memory-bank/systemPatterns.md`
- Product context: `memory-bank/productContext.md`
- PRD: `docs/prd.txt`

