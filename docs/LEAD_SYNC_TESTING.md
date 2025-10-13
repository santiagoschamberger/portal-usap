# Lead Sync Testing Checklist

## Pre-Testing Setup

### Verify Deployment Status
- [ ] Check Railway dashboard - both services deployed successfully
- [ ] Frontend service is running: `https://your-frontend.railway.app`
- [ ] Backend service is running: `https://your-backend.railway.app`
- [ ] Check deployment logs for any errors

### Verify Environment Variables
- [ ] Backend has all Zoho credentials set
- [ ] Frontend has correct `NEXT_PUBLIC_API_URL` pointing to backend
- [ ] Supabase credentials are configured
- [ ] JWT secrets are set

### Database Verification
- [ ] Partner exists in database with `zoho_partner_id`
- [ ] Partner is approved (`approved = true`)
- [ ] Test leads exist in Zoho CRM with that vendor ID

## Test Scenarios

### 1. Manual Sync Button - First Time Sync

**Setup:**
- Partner has leads in Zoho CRM
- Partner has never synced before
- No leads in portal database

**Steps:**
1. [ ] Log in as partner
2. [ ] Navigate to Leads page
3. [ ] Click "Sync from Zoho" button
4. [ ] Observe loading state (spinning icon, "Syncing..." text)

**Expected Results:**
- [ ] Loading indicator appears
- [ ] Toast notification shows "Syncing leads from Zoho CRM..."
- [ ] After completion, success toast shows: "Sync complete! X created, 0 updated, Y skipped"
- [ ] Leads table automatically refreshes
- [ ] Historical leads from Zoho appear in the table
- [ ] Lead statuses are correctly mapped
- [ ] Lead details are accurate (name, email, company, phone)

**Database Verification:**
```sql
-- Check synced leads
SELECT id, first_name, last_name, email, company, status, zoho_lead_id, zoho_sync_status
FROM leads
WHERE partner_id = 'your-partner-id'
ORDER BY created_at DESC;

-- Check status history was created
SELECT * FROM lead_status_history
WHERE lead_id IN (SELECT id FROM leads WHERE partner_id = 'your-partner-id')
ORDER BY created_at DESC;

-- Check activity log
SELECT * FROM activity_log
WHERE partner_id = 'your-partner-id'
AND action = 'leads_synced'
ORDER BY created_at DESC;
```

### 2. Manual Sync Button - Update Existing Leads

**Setup:**
- Partner has already synced once
- Some lead statuses changed in Zoho CRM
- Some new leads added in Zoho CRM

**Steps:**
1. [ ] Change status of a lead in Zoho CRM
2. [ ] Add a new lead in Zoho CRM with partner's vendor ID
3. [ ] Log in to portal as partner
4. [ ] Click "Sync from Zoho" button

**Expected Results:**
- [ ] Success toast shows: "Sync complete! X created, Y updated, Z skipped"
- [ ] Existing leads are updated with new statuses
- [ ] New leads from Zoho appear in portal
- [ ] No duplicate leads created
- [ ] Updated leads show new status
- [ ] `last_sync_at` timestamp updated on partner record

### 3. Status Mapping Verification

**Test each Zoho status maps correctly:**

| Zoho Status | Expected Portal Status | Test Result |
|-------------|----------------------|-------------|
| New | new | [ ] |
| Contacted | contacted | [ ] |
| Qualified | qualified | [ ] |
| Proposal | proposal | [ ] |
| Negotiation | negotiation | [ ] |
| Closed Won | closed_won | [ ] |
| Closed Lost | closed_lost | [ ] |
| Nurture | nurture | [ ] |
| Unqualified | unqualified | [ ] |

**Steps:**
1. [ ] Create test leads in Zoho with each status
2. [ ] Run sync in portal
3. [ ] Verify each status maps correctly

### 4. Error Handling - No Zoho Partner ID

**Setup:**
- Partner record has `zoho_partner_id = NULL`

**Steps:**
1. [ ] Log in as partner without zoho_partner_id
2. [ ] Click "Sync from Zoho" button

**Expected Results:**
- [ ] Error toast appears: "Failed to sync leads from Zoho CRM"
- [ ] Backend returns 400 error
- [ ] Error message: "Partner not linked to Zoho"
- [ ] No database changes made

### 5. Error Handling - No Leads in Zoho

**Setup:**
- Partner has valid zoho_partner_id
- No leads in Zoho CRM for this vendor

**Steps:**
1. [ ] Log in as partner
2. [ ] Click "Sync from Zoho" button

**Expected Results:**
- [ ] Success toast shows: "Sync complete! 0 created, 0 updated, 0 skipped"
- [ ] No errors occur
- [ ] Graceful handling of empty result

### 6. Error Handling - Missing Required Fields

**Setup:**
- Lead in Zoho missing first_name or last_name or email

**Steps:**
1. [ ] Create lead in Zoho with missing required fields
2. [ ] Run sync in portal

**Expected Results:**
- [ ] Lead is skipped (not created)
- [ ] Sync continues for other leads
- [ ] Success message shows skipped count
- [ ] Backend logs reason for skip

### 7. Performance Test - Large Dataset

**Setup:**
- Partner has 50+ leads in Zoho CRM

**Steps:**
1. [ ] Log in as partner
2. [ ] Click "Sync from Zoho" button
3. [ ] Monitor sync time

**Expected Results:**
- [ ] Sync completes in under 30 seconds for 50 leads
- [ ] Loading indicator remains visible throughout
- [ ] No timeout errors
- [ ] All leads sync successfully
- [ ] UI remains responsive

### 8. Concurrent Sync Prevention

**Steps:**
1. [ ] Click "Sync from Zoho" button
2. [ ] While syncing, try to click button again

**Expected Results:**
- [ ] Button is disabled during sync
- [ ] Shows "Syncing..." text
- [ ] Cannot trigger multiple syncs simultaneously
- [ ] Button re-enables after sync completes

### 9. Authentication Required

**Steps:**
1. [ ] Log out of portal
2. [ ] Try to access `/api/leads/sync` directly via API

**Expected Results:**
- [ ] 401 Unauthorized error
- [ ] No sync occurs
- [ ] Redirected to login page

### 10. Webhook Integration (If Configured)

**Setup:**
- Zoho webhook is configured for lead status changes

**Steps:**
1. [ ] Sync leads manually first
2. [ ] Change lead status in Zoho CRM
3. [ ] Wait for webhook to fire (should be immediate)
4. [ ] Check portal lead status

**Expected Results:**
- [ ] Lead status updates automatically in portal
- [ ] No manual sync needed
- [ ] Status history entry created
- [ ] Activity log entry created

## Backend API Testing

### Direct API Tests (Using Postman/curl)

#### Test 1: Sync Endpoint with Valid Auth
```bash
curl -X POST https://your-backend.railway.app/api/leads/sync \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Leads synced successfully",
  "data": {
    "total": 10,
    "created": 5,
    "updated": 3,
    "skipped": 2,
    "details": [...]
  }
}
```

#### Test 2: Sync Endpoint without Auth
```bash
curl -X POST https://your-backend.railway.app/api/leads/sync \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "error": "Authentication required"
}
```
**Status Code:** 401

### Check Backend Logs

**In Railway Dashboard:**
1. [ ] Go to Backend Service → Logs
2. [ ] Filter for sync operations
3. [ ] Verify no errors during sync
4. [ ] Check Zoho API call logs
5. [ ] Verify database operations logged

**Look for:**
- [ ] "✅ Lead synced from Zoho CRM"
- [ ] "Synced X leads from Zoho CRM"
- [ ] No "❌ Failed to sync" errors
- [ ] No database constraint violations

## Database Integrity Checks

### After Sync, Verify:

```sql
-- 1. No duplicate zoho_lead_ids
SELECT zoho_lead_id, COUNT(*)
FROM leads
GROUP BY zoho_lead_id
HAVING COUNT(*) > 1;
-- Should return 0 rows

-- 2. All synced leads have zoho_lead_id
SELECT COUNT(*)
FROM leads
WHERE zoho_lead_id IS NULL
AND lead_source = 'zoho_sync';
-- Should return 0

-- 3. All synced leads have status history
SELECT l.id, l.first_name, l.last_name
FROM leads l
LEFT JOIN lead_status_history lsh ON l.id = lsh.lead_id
WHERE l.lead_source = 'zoho_sync'
AND lsh.id IS NULL;
-- Should return 0 rows

-- 4. Partner last_sync_at updated
SELECT id, name, last_sync_at, zoho_sync_status
FROM partners
WHERE id = 'your-partner-id';
-- last_sync_at should be recent, zoho_sync_status should be 'synced'

-- 5. Activity log entry exists
SELECT *
FROM activity_log
WHERE action = 'leads_synced'
AND partner_id = 'your-partner-id'
ORDER BY created_at DESC
LIMIT 1;
-- Should show recent sync activity
```

## UI/UX Verification

### Visual Checks:
- [ ] Sync button has refresh icon
- [ ] Loading state shows spinning animation
- [ ] Button text changes to "Syncing..." during sync
- [ ] Button is disabled during sync
- [ ] Toast notifications are clear and informative
- [ ] Leads table updates without page refresh
- [ ] No UI glitches or layout shifts
- [ ] Mobile responsive (test on mobile device)

### Accessibility:
- [ ] Button is keyboard accessible (Tab + Enter)
- [ ] Loading state announced to screen readers
- [ ] Toast notifications have proper ARIA labels
- [ ] Color contrast meets WCAG standards

## Production Readiness

### Final Checks Before Production:
- [ ] All tests pass
- [ ] No console errors in browser
- [ ] No backend errors in logs
- [ ] Performance is acceptable
- [ ] Error handling works correctly
- [ ] Documentation is complete
- [ ] Team is trained on feature
- [ ] Rollback plan is ready

### Monitoring Setup:
- [ ] Set up error tracking for sync failures
- [ ] Monitor sync success/failure rates
- [ ] Track sync duration metrics
- [ ] Alert on repeated failures
- [ ] Monitor Zoho API rate limits

## Rollback Plan

If issues are found in production:

1. **Immediate Actions:**
   - [ ] Disable sync button in UI (feature flag if available)
   - [ ] Monitor error rates
   - [ ] Check Railway logs for errors

2. **Rollback Steps:**
   ```bash
   # Rollback to previous deployment
   cd /Users/santiago/Desktop/DEV/USA\ Payments/usapayments-portal-2.0
   git revert HEAD
   git push origin main
   # Railway will auto-deploy previous version
   ```

3. **Communication:**
   - [ ] Notify partners of temporary issue
   - [ ] Provide ETA for fix
   - [ ] Document issue for post-mortem

## Sign-Off

### Tested By:
- Name: _______________
- Date: _______________
- Environment: [ ] Dev [ ] Staging [ ] Production

### Issues Found:
1. _______________
2. _______________
3. _______________

### Approved for Production:
- [ ] All critical tests pass
- [ ] Performance is acceptable
- [ ] Error handling works
- [ ] Documentation complete

**Approver:** _______________
**Date:** _______________

---

**Next Steps After Testing:**
1. Deploy to production via Railway
2. Monitor for 24 hours
3. Gather user feedback
4. Plan enhancements based on usage

