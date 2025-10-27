# Critical Bug: Sub-Account Role Mismatch

## Problem Discovered

**Issue:** Sub-accounts can see ALL leads and deals from their partner organization, not just their own submissions.

**Expected Behavior:**
- Sub-accounts should ONLY see leads/deals they personally submitted
- Main accounts (partners) should see ALL leads/deals from their organization

**Actual Behavior:**
- Sub-accounts see EVERYONE'S leads/deals from their partner
- No filtering is applied
- **Major privacy/security issue**

## Root Cause

**Database Schema Inconsistency:**

The Supabase schema (`backend/database/supabase_schema.sql`) defines role as:
```sql
role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'sub'))
```

But the backend code (`backend/src/routes/leads.ts` and `deals.ts`) checks for:
```typescript
if (req.user.role === 'sub_account') {
  query = query.eq('created_by', req.user.id);
}
```

**The role values don't match:**
- Database uses: `'sub'`
- Code checks for: `'sub_account'`

**Result:** The condition NEVER matches, so the filter `created_by = user.id` is never applied, and sub-accounts see ALL partner data.

## Impact

**Security:** Sub-accounts can view sensitive information from other team members
**Privacy:** Salespeople see each other's leads and deals
**Business Logic:** Completely breaks the intended multi-user isolation

## Solution Implemented

Updated both `leads.ts` and `deals.ts` to check for BOTH role values until schema is standardized:

```typescript
// If user is a sub-account, only show their own leads
// Note: Supabase schema uses 'sub' not 'sub_account'
if (req.user.role === 'sub_account' || req.user.role === 'sub') {
  query = query.eq('created_by', req.user.id);
}
```

This handles both:
- Legacy/other schemas that might use `'sub_account'`
- Current Supabase schema using `'sub'`

## Files Modified

1. **backend/src/routes/leads.ts**
   - Line 40-42: Added role check for both 'sub_account' AND 'sub'
   - Line 57: Updated is_sub_account check

2. **backend/src/routes/deals.ts**
   - Line 62-64: Added role check for both 'sub_account' AND 'sub'
   - Line 79: Updated is_sub_account check

## Schema Inconsistency Details

**Multiple Schema Files Exist:**

1. **Supabase Schema** (`backend/database/supabase_schema.sql`):
   ```sql
   role VARCHAR(50) DEFAULT 'admin' CHECK (role IN ('admin', 'sub'))
   ```

2. **Migration Schema** (`backend/database/migrations/001_initial_schema.sql`):
   ```sql
   role VARCHAR(50) DEFAULT 'partner' CHECK (role IN ('admin', 'partner', 'sub_account'))
   ```

3. **TypeScript Interface** (`backend/src/config/database.ts`):
   ```typescript
   role: 'admin' | 'partner' | 'sub_account';
   ```

**Recommendation:** Standardize on ONE role system across all files.

## Testing

### Before Fix
```
Login as sub-account → View Leads → See ALL partner leads ❌
Login as sub-account → View Deals → See ALL partner deals ❌
```

### After Fix
```
Login as sub-account → View Leads → See ONLY own leads ✅
Login as sub-account → View Deals → See ONLY own deals ✅
Login as main account → View Leads → See ALL leads ✅
Login as main account → View Deals → See ALL deals ✅
```

## Deployment Priority

**CRITICAL - DEPLOY IMMEDIATELY**

This is a major security/privacy bug that allows users to see data they shouldn't have access to.

## Long-term Fix Recommendation

Choose ONE role system and standardize across:
1. Database schema
2. Database migrations  
3. TypeScript interfaces
4. All backend code
5. Documentation

**Suggested standard:**
```typescript
type UserRole = 'admin' | 'partner' | 'sub';
```

Where:
- `admin` = System administrators (full access)
- `partner` = Main partner accounts (see all their org's data)
- `sub` = Sub-accounts (see only their own data)

Then update:
- All schemas to use these exact values
- All code to check against these values
- Add TypeScript enums for type safety

## Summary

**Bug:** Sub-accounts seeing all partner data instead of just their own
**Cause:** Role value mismatch ('sub' vs 'sub_account')
**Fix:** Code now checks for both values
**Priority:** Critical - privacy/security issue
**Status:** Fixed and ready to deploy

---

**Discovered:** October 27, 2025  
**Fixed:** October 27, 2025  
**Impact:** High - affects all sub-account users  
**Severity:** Critical - security vulnerability

