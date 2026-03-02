# Impersonation Sync Debug - March 2, 2026

## Issue
When admin impersonates a partner user (e.g., Sibert Ventures LLC) and clicks "Sync from Zoho", the sync fails with error:
```
params: { criteria: '(Vendor.id:equals:null)' }
```

This indicates that the `zoho_partner_id` is being passed as `null` to the Zoho API during impersonation.

## Root Cause Analysis

### Database Verification ✅
Ran `backend/scripts/test-impersonation.js` to verify database state:
- ✅ Partner exists: Sibert Ventures LLC (ID: `46d1ba03-5da3-4cf8-92c1-2f4f7c83d8ec`)
- ✅ Partner has valid `zoho_partner_id`: `5577028000014101165`
- ✅ User exists: matt@mattsibert.com (ID: `20efa01e-bd85-46f7-8f37-9f9670ffcdcf`)
- ✅ User is linked to partner via `partner_id`
- ✅ Partner lookup via `user.partner_id` works correctly

### Code Flow Verification ✅
1. **Frontend** (`frontend/src/lib/api.ts`):
   - Axios interceptor reads `auth-store` from localStorage
   - If `isImpersonating === true`, sets `X-Impersonate-User-Id` header
   - Header value is the impersonated user's ID

2. **Backend Middleware** (`backend/src/middleware/auth.ts`):
   - Reads `X-Impersonate-User-Id` header
   - Verifies actor is admin
   - Fetches target user from database
   - Swaps `req.user` to target user (with correct `partner_id`)
   - Preserves original admin in `req.actorUser`

3. **Sync Endpoints** (`backend/src/routes/leads.ts`, `deals.ts`, `partners.ts`):
   - Uses `req.user.partner_id` to lookup partner
   - Retrieves `partner.zoho_partner_id`
   - Calls Zoho API with this ID

### Hypothesis
The code flow appears correct. The issue might be:
1. **Frontend state not persisting**: The `auth-store` in localStorage might not be properly updated during impersonation
2. **Header not being sent**: The axios interceptor might not be reading the state correctly
3. **Race condition**: The state might not be fully persisted before the sync call is made
4. **Production-specific issue**: Something in the production environment is different

## Debug Changes Deployed

### Backend Debug Logging
Added comprehensive logging to all sync endpoints:
- `POST /api/leads/sync`
- `POST /api/deals/sync`
- `POST /api/partners/sync-contacts`

Logs will show:
```javascript
{
  userId: req.user.id,
  userEmail: req.user.email,
  partnerId: req.user.partner_id,
  isImpersonating: !!req.impersonation,
  impersonationTarget: req.impersonation?.target_user_id,
  actorUserId: req.actorUser?.id,
  actorEmail: req.actorUser?.email
}
```

Plus partner lookup results:
```javascript
{
  partnerId: partner?.id,
  partnerName: partner?.name,
  zohoPartnerId: partner?.zoho_partner_id,
  error: partnerError
}
```

### Frontend Debug Logging
Added console logging in sync methods:
- `leadService.syncLeadsFromZoho()`
- `dealsService.syncFromZoho()`

Logs will show:
```javascript
{
  isImpersonating: parsed?.state?.isImpersonating,
  impersonatedUserId: parsed?.state?.user?.id,
  impersonatedUserEmail: parsed?.state?.user?.email,
  impersonatedParterId: parsed?.state?.user?.partner_id,
  originalUserId: parsed?.state?.originalUser?.id,
  originalUserEmail: parsed?.state?.originalUser?.email
}
```

## Testing Instructions

### Step 1: Wait for Railway Deployment
Check Railway dashboard to ensure latest commit is deployed:
- Commit: `debug: Add frontend impersonation state logging to sync`
- SHA: `2e48d2b`

### Step 2: Open Production Portal
1. Go to production URL
2. Open browser DevTools Console (F12 → Console tab)
3. Log in as admin user

### Step 3: Impersonate Sibert Ventures
1. Navigate to Admin → User Management
2. Search for "Sibert Ventures LLC"
3. Click "Impersonate" on matt@mattsibert.com
4. Verify you're redirected to dashboard
5. Check browser console for any errors

### Step 4: Trigger Sync
1. Navigate to Leads page
2. Open browser console (keep it visible)
3. Click "Sync from Zoho" button
4. **Observe frontend console logs** - should show:
   - `[LEADS SYNC] Frontend impersonation state:`
   - Verify `isImpersonating: true`
   - Verify `impersonatedParterId` is not null/undefined

### Step 5: Check Railway Logs
1. Open Railway dashboard
2. Go to backend service logs
3. Look for `[LEADS SYNC] Request details:`
4. **Verify the following**:
   - `partnerId` should be `46d1ba03-5da3-4cf8-92c1-2f4f7c83d8ec`
   - `isImpersonating` should be `true`
   - `actorEmail` should be your admin email
5. Look for `[LEADS SYNC] Partner lookup result:`
6. **Verify**:
   - `zohoPartnerId` should be `5577028000014101165` (NOT null)

## Expected Outcomes

### If Impersonation Works Correctly ✅
- Frontend logs show `isImpersonating: true` with correct user data
- Backend logs show correct `partnerId` and `zohoPartnerId`
- Sync completes successfully
- Leads/deals appear in the portal

### If Impersonation Fails ❌
Check these scenarios:

#### Scenario A: Frontend State Not Set
- Frontend logs show `isImpersonating: false` or `impersonatedParterId: undefined`
- **Fix**: Issue with `startImpersonation()` in auth store or impersonation endpoint response

#### Scenario B: Header Not Sent
- Frontend logs show correct state, but backend logs show `isImpersonating: false`
- **Fix**: Axios interceptor not reading state correctly or header not being sent

#### Scenario C: Partner Lookup Fails
- Backend logs show `isImpersonating: true` but `zohoPartnerId: null`
- **Fix**: Database issue or query problem in partner lookup

## Potential Fixes

### Fix 1: Ensure State Persistence
If frontend state is not persisting, modify `startImpersonation` to explicitly save:

```typescript
startImpersonation: (impersonatedUser: User, originalUser: User) => {
  set({ user: impersonatedUser, originalUser, isImpersonating: true })
  
  // Force persist to localStorage
  const state = get();
  localStorage.setItem('auth-store', JSON.stringify({ state }));
  
  void get().fetchPartnerType()
},
```

### Fix 2: Add Delay Before Sync
If there's a race condition, add a small delay in the sync button handler:

```typescript
const handleSync = async () => {
  // Wait for state to persist
  await new Promise(resolve => setTimeout(resolve, 100));
  await syncLeadsFromZoho();
};
```

### Fix 3: Explicit Header in Sync Call
If axios interceptor is not working, explicitly pass the header:

```typescript
async syncLeadsFromZoho(): Promise<...> {
  const authStore = localStorage.getItem('auth-store');
  const parsed = authStore ? JSON.parse(authStore) : null;
  const headers: any = {};
  
  if (parsed?.state?.isImpersonating && parsed?.state?.user?.id) {
    headers['X-Impersonate-User-Id'] = parsed.state.user.id;
  }
  
  const response = await api.post('/api/leads/sync', {}, { headers });
  return response.data!;
}
```

## Status
- [x] Added debug logging to backend sync endpoints
- [x] Added debug logging to frontend sync methods
- [x] Verified database structure is correct
- [x] Committed and pushed changes
- [ ] Waiting for Railway deployment
- [ ] Test impersonation + sync in production
- [ ] Analyze logs to identify root cause
- [ ] Apply appropriate fix based on findings

## Related Files
- `backend/src/middleware/auth.ts` - Impersonation middleware
- `backend/src/routes/leads.ts` - Leads sync endpoint
- `backend/src/routes/deals.ts` - Deals sync endpoint
- `backend/src/routes/partners.ts` - Contacts sync endpoint, impersonation endpoints
- `frontend/src/lib/api.ts` - Axios interceptor that sets X-Impersonate-User-Id header
- `frontend/src/lib/auth-store.ts` - Auth state management with impersonation
- `frontend/src/services/leadService.ts` - Lead sync frontend service
- `frontend/src/services/dealsService.ts` - Deal sync frontend service
- `backend/scripts/test-impersonation.js` - Database verification script
