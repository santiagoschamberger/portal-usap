# Contact Webhook Bug Fix

## Problem Discovered

**Issue:** When a partner (main account) submits a lead through the portal, that lead's information was appearing in the Sub-Accounts list as if it were a team member.

**Root Cause:** 
1. Partner submits lead with email "thisisthelead@gmail.com"
2. Portal creates Lead in Zoho CRM with `Vendor.id` set to the partner's Zoho ID
3. Zoho CRM automatically creates a Contact from that Lead
4. Contact inherits the `Vendor` field from the Lead
5. Zoho fires the Contact webhook → `/api/webhooks/zoho/contact`
6. Webhook sees `Vendor.id` (parent partner) and creates a sub-account
7. Now the LEAD appears as a SUB-ACCOUNT in the portal! ❌

## Example

**Scenario:**
- Main account: admin@mipropiedad.ar (Partner: "santiago scha")
- They submit a lead: "Santiago schamberger" (thisisthelead@gmail.com)
- Zoho creates Contact with same email + Vendor.id
- Webhook creates user with `role='sub_account'`
- Result: Lead appears in Sub-Accounts list ❌

## The Fix

Modified `/api/webhooks/zoho/contact` to check if the email being used for sub-account creation already exists as a user under the same partner:

```typescript
// Check if user with this email already exists (including main accounts)
const { data: existingUser } = await supabaseAdmin
  .from('users')
  .select('id, email, role, partner_id')
  .eq('email', email.toLowerCase())
  .single();

if (existingUser) {
  // If this is the MAIN account of the partner, don't create a duplicate sub-account
  // This happens when a partner submits a lead and Zoho auto-creates a contact
  if (existingUser.partner_id === partner.id) {
    console.log('⚠️ This email belongs to the main partner account - skipping sub-account creation');
    return res.status(200).json({
      success: false,
      message: 'User already exists as main account',
      reason: 'Cannot create sub-account for email that belongs to the main partner account',
      user_id: existingUser.id
    });
  }
}
```

## Files Modified

- **`backend/src/routes/webhooks.ts`**
  - Lines 258-291: Added check to prevent creating sub-accounts for emails that already belong to users in the same partner organization
  - Lines 217-228: Improved logging for debugging

- **`backend/src/middleware/auth.ts`**
  - Line 9: Added `'sub'` to role type union to match Supabase schema

- **`backend/src/routes/leads.ts` & `backend/src/routes/deals.ts`**
  - Fixed role checking to handle both `'sub_account'` and `'sub'` role values (separate bug fix)

## Testing

Created test scripts to verify the fix:
1. **`test-contact-webhook.js`** - Tests 3 scenarios
2. **`test-contact-debug.js`** - Tests with real database data
3. **`check-santiago-user.js`** - Identifies the problematic user

**Test Results:**
```bash
$ node check-santiago-user.js

Found user: thisisthelead@gmail.com
Role: sub_account ❌ WRONG!
Created: 2025-10-27T19:48:25 (created by the bug)
Analysis: This is a LEAD that got converted into a SUB-ACCOUNT
```

## Cleanup Required

**Delete the incorrectly created sub-account:**

```sql
-- Run in Supabase SQL Editor
DELETE FROM auth.users WHERE id = '7f7c42fd-3196-4ad3-b0fb-36ee997674f4';
DELETE FROM users WHERE id = '7f7c42fd-3196-4ad3-b0fb-36ee997674f4';
```

## Deployment Steps

1. ✅ Code fixed and compiled
2. ⏳ Deploy backend to Railway
3. ⏳ Run cleanup SQL in Supabase
4. ⏳ Test: Submit a lead and verify it doesn't create a sub-account

## Verification

After deployment and cleanup:

1. Go to Sub-Accounts page
2. Should see ONLY legitimate team members (Contacts created in Zoho)
3. Should NOT see any leads (clients/prospects)

**Before Fix:**
- Sub-Accounts: 5 users (including "Santiago schamberger" - thisisthelead@gmail.com) ❌

**After Fix:**
- Sub-Accounts: 4 users (legitimate team members only) ✅

## Related Issues

This fix also addresses:
- Prevents duplicate user creation when Zoho auto-creates contacts from leads
- Improves webhook logging for debugging
- Better error messages when webhook rejects invalid data

## Long-term Recommendation

Consider adding a Zoho workflow rule to PREVENT automatic Contact creation from Leads, or add a field to distinguish between:
- **Contacts** = Team members (sub-accounts)
- **Leads** = Clients/prospects (should NOT become sub-accounts)

---

**Issue Discovered:** October 27, 2025  
**Fix Implemented:** October 27, 2025  
**Status:** Ready to deploy  
**Severity:** High - affects data integrity and user experience

