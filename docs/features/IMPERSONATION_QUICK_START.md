# Admin Impersonation - Quick Start Guide

## 🚀 Quick Setup (5 minutes)

### Step 1: Apply Database Migration
```bash
cd backend
psql $DATABASE_URL -f database/migrations/025_add_impersonation_audit_log.sql
```

### Step 2: Restart Backend Server
```bash
npm run dev
```

### Step 3: Restart Frontend Server
```bash
cd ../frontend
npm run dev
```

## ✅ Verify Installation

### Test Database Setup
```sql
-- Connect to your database
psql $DATABASE_URL

-- Check audit_logs table exists
\d audit_logs

-- Check function exists
\df log_impersonation

-- Check view exists
\dv recent_impersonations
```

### Test API Endpoints
```bash
# Get your admin token first
TOKEN="your-admin-jwt-token"

# Test user search
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/partners/users/search?query=test"

# Test impersonation (replace USER_ID)
curl -X POST \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/partners/impersonate-any/USER_ID"
```

## 🎯 How to Use

### For Admins:

1. **Login as Admin**
   - Navigate to your portal
   - Login with admin credentials

2. **Go to User Management**
   - Click "Admin" in sidebar
   - Select "Users"
   - Or go directly to `/admin/users`

3. **Search for User**
   - Type email or name in search box
   - Press Enter or click Search

4. **Start Impersonation**
   - Click "Impersonate" button next to user
   - You'll see yellow banner at top
   - Navigate portal as that user

5. **Exit Impersonation**
   - Click "Exit Impersonation" in yellow banner
   - Returns you to admin view

## 🔒 Security Notes

- ✅ All impersonation actions are logged
- ✅ Cannot impersonate inactive users
- ✅ Cannot impersonate yourself
- ✅ Only admins can impersonate
- ✅ Audit trail includes IP and timestamp

## 📊 View Audit Logs

### Via Database:
```sql
-- View recent impersonations
SELECT * FROM recent_impersonations 
ORDER BY created_at DESC 
LIMIT 10;

-- View all audit logs
SELECT 
  admin_email,
  target_email,
  target_partner_name,
  created_at,
  ip_address
FROM audit_logs
WHERE action = 'impersonate_user'
ORDER BY created_at DESC;
```

### Via Application:
- Future feature: Admin dashboard for audit logs
- Currently: Check database directly

## 🐛 Troubleshooting

### "User not found" error
- Check user exists: `SELECT * FROM users WHERE email = 'user@example.com';`
- Verify user is active: `is_active = true`

### "Admin access required" error
- Verify your role: `SELECT role FROM users WHERE id = 'your-id';`
- Should be `'admin'`

### Impersonation button disabled
- User might be inactive
- You might be trying to impersonate yourself
- Check browser console for errors

### Yellow banner not showing
- Check browser console for errors
- Verify `ImpersonationBanner` component is in layout
- Clear browser cache and reload

## 📝 Common Use Cases

### Support Ticket
```
1. Customer reports issue with lead submission
2. Admin searches for customer by email
3. Admin impersonates customer
4. Admin reproduces issue
5. Admin exits impersonation
6. Admin fixes issue
```

### Testing Permissions
```
1. Admin wants to test sub-account view
2. Admin impersonates sub-account user
3. Admin verifies limited permissions
4. Admin exits impersonation
```

### Debugging Agent/ISO View
```
1. Agent reports incorrect lead visibility
2. Admin impersonates agent
3. Admin sees what agent sees
4. Admin identifies RLS policy issue
5. Admin exits impersonation
```

## 🎨 UI Components

### Search Interface
- Clean, modern design
- Real-time search
- User badges (role, status, partner type)
- Partner information display

### Impersonation Banner
- Prominent yellow warning banner
- Shows both admin and impersonated user
- Always visible at top of page
- Easy exit button

## 🔄 What's Next?

After setup, you can:
1. Test impersonation with different user types
2. Review audit logs to verify logging
3. Train support team on feature usage
4. Set up monitoring for impersonation activity

## 📚 Full Documentation

For complete details, see:
- [ADMIN_IMPERSONATION.md](./ADMIN_IMPERSONATION.md) - Complete feature documentation
- API endpoints, security details, troubleshooting

## ⚡ Quick Reference

### Key Files
```
Backend:
- backend/src/routes/partners.ts (API endpoints)
- backend/database/migrations/025_add_impersonation_audit_log.sql

Frontend:
- frontend/src/components/admin/UserImpersonation.tsx
- frontend/src/components/admin/ImpersonationBanner.tsx
- frontend/src/app/admin/users/page.tsx
- frontend/src/services/partnerService.ts
- frontend/src/lib/auth-store.ts
```

### Key Endpoints
```
GET  /api/partners/users/search
POST /api/partners/impersonate-any/:userId
POST /api/partners/impersonate/:subAccountId (legacy)
```

### Key Database Objects
```
TABLE: audit_logs
FUNCTION: log_impersonation()
VIEW: recent_impersonations
```

---

**Need Help?** Check the full documentation or contact the development team.
