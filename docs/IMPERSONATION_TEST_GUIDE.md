# Impersonation Testing Quick Guide

## 🚀 Quick Test (5 minutes)

### Setup
1. Open production portal with DevTools Console (F12)
2. Log in as admin: `santiago@usapayments.com`

### Test Flow
```
1. Admin Panel → User Management
2. Search: "Sibert Ventures LLC"
3. Click: "Impersonate" on matt@mattsibert.com
4. ✅ Check: Banner shows "Viewing as: Sibert Ventures LLC"
5. ✅ Check: Console shows impersonation logs
6. Navigate to: Leads page
7. ✅ Check: See 79 leads (not all partners' leads)
8. Click: "Sync from Zoho" button
9. ✅ Check: Console shows impersonation header being added
10. ✅ Check: Railway logs show correct partner_id and zoho_partner_id
11. ✅ Check: No "Vendor.id:equals:null" errors
12. Navigate to: Deals page
13. ✅ Check: See 37 deals
14. Click: "Stop Impersonation"
15. ✅ Check: Back to admin view (all partners' data)
```

## 🔍 What to Look For

### Browser Console (Frontend)
```javascript
// When impersonation starts:
[AUTH STORE] Starting impersonation: { impersonatedUser: {...}, originalUser: {...} }
[AUTH STORE] Impersonation state after set: { isImpersonating: true, ... }

// When any API call is made:
[API INTERCEPTOR] Adding impersonation header: {
  url: '/api/leads',
  impersonatedUserId: '20efa01e-...',
  impersonatedPartnerId: '46d1ba03-...'
}

// When sync button is clicked:
[LEADS SYNC] Frontend impersonation state: { isImpersonating: true, ... }
```

### Railway Logs (Backend)
```javascript
// When sync endpoint is hit:
[LEADS SYNC] Request details: {
  userId: '20efa01e-...',
  userEmail: 'matt@mattsibert.com',
  partnerId: '46d1ba03-...',  // ← Should be Sibert's partner ID
  isImpersonating: true,
  actorEmail: 'santiago@usapayments.com'
}

[LEADS SYNC] Partner lookup result: {
  partnerId: '46d1ba03-...',
  partnerName: 'Sibert Ventures LLC',
  zohoPartnerId: '5577028000014101165',  // ← Should NOT be null
  error: null
}
```

## ✅ Success Indicators

| Check | Expected Result |
|-------|----------------|
| Banner shows impersonated user | ✅ "Viewing as: Sibert Ventures LLC" |
| Dashboard stats | ✅ Shows Sibert's data (79 leads, 37 deals) |
| Leads page | ✅ Shows only Sibert's 79 leads |
| Deals page | ✅ Shows only Sibert's 37 deals |
| Console logs | ✅ Shows `isImpersonating: true` |
| API interceptor | ✅ Adds `X-Impersonate-User-Id` header |
| Backend logs | ✅ Shows correct `partnerId` and `zohoPartnerId` |
| Sync button | ✅ Works without `Vendor.id:equals:null` error |
| Create lead | ✅ Lead associated with Sibert (not admin) |
| Page refresh | ✅ Impersonation persists |
| Stop impersonation | ✅ Returns to admin view |

## ❌ Failure Indicators

| Issue | What It Means | Where to Look |
|-------|--------------|---------------|
| No console logs | Frontend logging not working | Check browser console settings |
| `isImpersonating: false` in console | State not set correctly | Check auth-store logs |
| No `X-Impersonate-User-Id` in interceptor | Header not being added | Check API interceptor logs |
| `partnerId: null` in Railway logs | Backend not receiving user context | Check auth middleware |
| `zohoPartnerId: null` in Railway logs | Partner lookup failing | Check database |
| `Vendor.id:equals:null` error | Zoho API called with null | Check partner lookup logs |
| Sees all partners' data | Not filtering by partner | Check backend queries |
| Lead created under admin | Impersonation header missing | Check create lead logs |

## 🐛 Troubleshooting

### Issue: No impersonation logs in console
**Fix**: Make sure console is set to show "Verbose" or "All levels"

### Issue: Impersonation lost after page refresh
**Fix**: Check if localStorage is being cleared or blocked

### Issue: Backend shows `isImpersonating: false`
**Fix**: Header not being sent - check axios interceptor logs

### Issue: `zohoPartnerId: null` in logs
**Fix**: Database issue - run `backend/scripts/test-impersonation.js`

## 📊 Database Verification

Run this script to verify database state:
```bash
cd backend
node scripts/test-impersonation.js
```

Expected output:
```
✅ Partner found: Sibert Ventures LLC
✅ zoho_partner_id: 5577028000014101165
✅ User found: matt@mattsibert.com
✅ User linked to partner
✅ Partner lookup via user.partner_id works
```

## 🎯 Key Files

### Frontend
- `frontend/src/lib/api.ts` - Axios interceptor (adds header)
- `frontend/src/lib/auth-store.ts` - State management
- `frontend/src/app/leads/new/page.tsx` - Create lead (fixed)
- `frontend/src/app/submit/page.tsx` - Referral form (fixed)

### Backend
- `backend/src/middleware/auth.ts` - Impersonation middleware
- `backend/src/routes/leads.ts` - Leads endpoints
- `backend/src/routes/deals.ts` - Deals endpoints
- `backend/src/routes/partners.ts` - Partner endpoints

## 📝 Notes

- All logging is prefixed with `[COMPONENT]` for easy filtering
- Frontend logs appear in browser console
- Backend logs appear in Railway console
- Logs include timestamps automatically
- Can filter Railway logs by searching for `[LEADS SYNC]`, `[DEALS SYNC]`, etc.
