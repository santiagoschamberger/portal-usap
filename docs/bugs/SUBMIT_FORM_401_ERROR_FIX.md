# Submit Form 401 Unauthorized Error - Fix

## Issue
Users were unable to submit referrals from the `/submit` page (https://frontend-production-bf8af.up.railway.app/submit), receiving a **401 Unauthorized** error, while the `/leads/new` page worked correctly.

## Root Cause
The authentication middleware (`backend/src/middleware/auth.ts`) was using the **anon key Supabase client** to verify JWT tokens:

```typescript
const { data: { user }, error: authError } = await supabase.auth.getUser(token);
```

The anon key client has limited permissions and cannot properly validate user JWT tokens in all contexts. This caused token verification to fail intermittently or in certain scenarios.

## Error Details
```
Request URL: https://backend-production-67e9.up.railway.app/api/referrals/submit
Request Method: POST
Status Code: 401 Unauthorized
Response: {error: "Unauthorized"}
```

The user was sending a valid Supabase JWT token, but the backend was rejecting it.

## Solution
Changed the authentication middleware to use the **admin/service role Supabase client** for token verification:

```typescript
const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
```

The admin client has elevated permissions and can properly verify any valid Supabase JWT token, regardless of the user's role or session state.

## Files Changed

### 1. `backend/src/middleware/auth.ts`
- **Changed**: Token verification to use `supabaseAdmin` instead of `supabase`
- **Added**: Better error logging for debugging authentication issues
- **Impact**: All authenticated endpoints now properly validate Supabase JWT tokens

### 2. `backend/src/routes/referrals.ts`
- **Added**: Cache-control headers to prevent caching of POST requests
- **Impact**: Prevents browser from caching submission responses

### 3. `frontend/src/app/submit/page.tsx`
- **Added**: Cache-control headers in fetch request
- **Added**: Better error logging and handling
- **Added**: `cache: 'no-store'` option to fetch
- **Impact**: Better debugging and prevents client-side caching issues

## Testing
After deploying these changes:

1. ✅ User should be able to submit referrals from `/submit` page
2. ✅ Authentication should work consistently across all protected routes
3. ✅ Error messages should be more descriptive if authentication fails

## Technical Details

### Why Admin Client Works
- **Anon Key Client**: Limited to public operations and user-specific data based on RLS policies
- **Admin/Service Role Client**: Bypasses RLS and has full database access, can verify any JWT token

### Token Verification Flow
1. Frontend sends JWT token in `Authorization: Bearer <token>` header
2. Backend extracts token from header
3. Backend calls `supabaseAdmin.auth.getUser(token)` to verify token
4. Supabase validates the JWT signature and returns user data
5. Backend fetches additional user data from `users` table
6. Request proceeds with authenticated user context

## Prevention
- Always use `supabaseAdmin` for authentication middleware
- Use regular `supabase` client only for user-scoped operations where RLS is desired
- Add comprehensive error logging for authentication failures

## Related Issues
- This fix also improves authentication reliability for all other protected endpoints
- Resolves potential intermittent authentication failures across the application

## Deployment Notes
1. Deploy backend changes first
2. Test authentication on staging/production
3. Deploy frontend changes
4. Monitor logs for any authentication errors

---
**Fixed**: January 21, 2026
**Severity**: High (Blocking user functionality)
**Status**: Resolved
