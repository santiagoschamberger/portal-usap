# Sub-Account Permissions & Management

**Phase 6 Implementation**  
**Date Completed:** December 1, 2025  
**Status:** ✅ Complete

---

## Overview

Sub-account permissions provide granular access control for partner organizations. Main partners (admins) can view and manage all leads, while sub-accounts can only view and manage leads they personally submitted.

### Key Features

1. **Lead Isolation**: Sub-accounts only see their own submitted leads
2. **Permission-Based Access**: Configurable permissions via database fields
3. **Sub-Account Management**: Main partners can activate, deactivate, and manage sub-accounts
4. **Zoho CRM Integration**: Sub-accounts created from Zoho Contacts
5. **Activity Tracking**: All sub-account actions logged

---

## Permission Model

### User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| `admin` | Main partner account | - View all partner leads<br>- Create/edit/delete any lead<br>- Manage sub-accounts<br>- Access all features |
| `sub_account` / `sub` | Sub-account user | - View only own submitted leads<br>- Create new leads<br>- Edit only own leads<br>- Cannot manage sub-accounts |

### Permission Fields

Added to `users` table:

```sql
-- Whether user can submit leads via portal (false for Agent/ISO types)
can_submit_leads BOOLEAN DEFAULT true

-- Whether user can view all partner leads (true for admins, false for sub-accounts)
can_view_all_partner_leads BOOLEAN DEFAULT false
```

---

## Database Schema Changes

### Migration 021: Sub-Account Permissions

**File:** `backend/database/migrations/021_sub_account_permissions.sql`

#### Changes Made:

1. **Added Permission Columns**
   - `can_submit_leads` - Controls lead submission access
   - `can_view_all_partner_leads` - Controls lead visibility scope

2. **Updated Existing Users**
   - Admin users: `can_view_all_partner_leads = true`
   - Sub-accounts: `can_view_all_partner_leads = false`

3. **New RLS Policies**
   - `Admins can view all partner leads` - Admins see all leads in their organization
   - `Sub-accounts with full access can view all partner leads` - For special sub-accounts
   - `Sub-accounts can view only their own leads` - Default sub-account isolation
   - `Users with permission can create leads` - Permission-based lead creation
   - `Admins can update all partner leads` - Admin update access
   - `Sub-accounts can update only their own leads` - Sub-account update isolation
   - `Only admins can delete leads` - Delete restricted to admins

4. **Performance Indexes**
   - `idx_leads_created_by_user_id` - Fast sub-account lead lookups
   - `idx_leads_partner_created_by` - Combined partner + creator lookups

5. **Auto-Permission Trigger**
   - `set_user_permissions()` - Automatically sets permissions based on role

---

## API Endpoints

### Sub-Account Management

All endpoints require `admin` role (main partner).

#### GET /api/partners/sub-accounts
Fetch all sub-accounts (contacts from Zoho CRM with activation status).

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "zoho_contact_id": "123456789",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com",
      "phone": "+1234567890",
      "title": "Sales Representative",
      "is_activated": true,
      "portal_user_id": "uuid",
      "is_active": true,
      "created_at": "2025-01-01T00:00:00Z",
      "activated_at": "2025-01-02T00:00:00Z"
    }
  ],
  "total": 5,
  "stats": {
    "total_contacts": 5,
    "activated": 3,
    "not_activated": 2
  }
}
```

#### POST /api/partners/sub-accounts/:zohoContactId/activate
Activate a Zoho contact as a portal sub-account.

**Parameters:**
- `zohoContactId` - Zoho Contact ID

**Actions:**
1. Fetches contact details from Zoho CRM
2. Creates Supabase Auth user
3. Creates portal user record with `role = 'sub_account'`
4. Sends password reset email
5. Logs activation activity

**Response:**
```json
{
  "success": true,
  "message": "Sub-account activated and email sent to john@example.com",
  "user_id": "uuid"
}
```

#### PUT /api/partners/sub-accounts/:id
Update sub-account information.

**Body:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true
}
```

#### DELETE /api/partners/sub-accounts/:id
Deactivate a sub-account (soft delete - sets `is_active = false`).

---

### Lead Access Control

#### GET /api/leads
Automatically filters leads based on user role:

**Admin Users:**
- See all leads for their partner organization
- Includes `creator` information in response

**Sub-Account Users:**
- See only leads where `created_by = user.id`
- Filtered at database level via RLS policies

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `search` - Search in name, company, email
- `status` - Filter by status
- `date_range` - Filter by date ('today', 'week', 'month', etc.)

**Response includes creator info:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "first_name": "Jane",
      "last_name": "Smith",
      "company": "Acme Corp",
      "status": "Pre-Vet / New Lead",
      "creator": {
        "id": "uuid",
        "email": "john@example.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "sub_account"
      },
      "created_at": "2025-12-01T00:00:00Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

#### POST /api/leads
Create a new lead.

**Permission Check:**
- User must have `can_submit_leads = true`
- Enforced by RLS policy

**Automatic Fields:**
- `created_by` - Set to authenticated user ID
- `partner_id` - Set to user's partner ID
- `lead_source` - Auto-populated with partner name

#### PATCH /api/leads/:id
Update a lead.

**Permission Check:**
- Admins: Can update any partner lead
- Sub-accounts: Can only update leads they created
- Enforced by RLS policy

---

## Frontend Implementation

### Sub-Accounts Management Page

**Route:** `/sub-accounts`  
**Access:** Admin only  
**File:** `frontend/src/app/sub-accounts/page.tsx`

#### Features:

1. **Stats Dashboard**
   - Total contacts from Zoho
   - Activated sub-accounts
   - Not activated contacts

2. **Sub-Account List**
   - Shows all Zoho contacts linked to partner
   - Displays activation status
   - Shows active/inactive status

3. **Actions**
   - **Activate Portal Access** - Creates portal account + sends email
   - **Resend Email** - Sends password reset email
   - **Activate/Deactivate** - Toggle sub-account active status
   - **Refresh** - Sync latest data from Zoho

4. **Info Banner**
   - Explains that sub-accounts are managed in Zoho CRM
   - Guides users to create Contacts in Zoho

### Leads List Updates

**File:** `frontend/src/app/leads/page.tsx`

#### "Submitted By" Column

Shows creator information for each lead:

**For Admins:**
- Displays creator's full name
- Shows creator's role (Admin / Sub Account)
- Helps track which sub-account submitted which lead

**For Sub-Accounts:**
- Column still visible but only shows their own name
- Since they only see their own leads, all entries show their name

**Display Logic:**
```tsx
{lead.creator ? (
  <div>
    <div className="text-sm font-medium text-gray-900">
      {lead.creator.first_name} {lead.creator.last_name}
    </div>
    <div className="text-xs text-gray-500 capitalize">
      {lead.creator.role.replace('_', ' ')}
    </div>
  </div>
) : (
  <span className="text-sm text-gray-400">System</span>
)}
```

---

## Security Implementation

### Row Level Security (RLS)

All lead access is controlled at the database level through RLS policies. This ensures that even direct database queries respect permission boundaries.

#### Lead SELECT Policies

```sql
-- Policy 1: Admins see all partner leads
CREATE POLICY "Admins can view all partner leads" ON leads
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      WHERE u.role = 'admin' 
      AND u.partner_id = leads.partner_id
    )
  );

-- Policy 2: Sub-accounts with special permission see all
CREATE POLICY "Sub-accounts with full access can view all partner leads" ON leads
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      WHERE u.can_view_all_partner_leads = true
      AND u.partner_id = leads.partner_id
    )
  );

-- Policy 3: Default sub-accounts only see their own leads
CREATE POLICY "Sub-accounts can view only their own leads" ON leads
  FOR SELECT USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      WHERE u.can_view_all_partner_leads = false
      AND u.partner_id = leads.partner_id
    )
    AND leads.created_by_user_id = auth.uid()
  );
```

#### Lead INSERT Policy

```sql
CREATE POLICY "Users with permission can create leads" ON leads
  FOR INSERT WITH CHECK (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      WHERE u.partner_id = leads.partner_id
      AND u.can_submit_leads = true
      AND u.is_active = true
    )
  );
```

#### Lead UPDATE Policies

```sql
-- Admins can update all partner leads
CREATE POLICY "Admins can update all partner leads" ON leads
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      WHERE u.role = 'admin'
      AND u.partner_id = leads.partner_id
    )
  );

-- Sub-accounts can only update their own leads
CREATE POLICY "Sub-accounts can update only their own leads" ON leads
  FOR UPDATE USING (
    auth.uid()::text IN (
      SELECT u.id::text FROM users u 
      WHERE u.role IN ('sub', 'sub_account')
      AND u.partner_id = leads.partner_id
    )
    AND leads.created_by_user_id = auth.uid()
  );
```

### API-Level Security

Additional security layers in the API:

1. **Authentication Middleware** (`authenticateToken`)
   - Verifies JWT token
   - Loads user data from database
   - Checks `is_active` status

2. **Permission Middleware** (`permissions.ts`)
   - `requireMainPartner` - Ensures admin role
   - `requireCanSubmitLeads` - Validates lead submission permission
   - `requireCanViewAllPartnerLeads` - Validates full access permission

3. **Route-Level Checks**
   - Sub-account management endpoints require admin role
   - Lead queries automatically filter by user permissions

---

## Testing Guide

### Test Scenarios

#### Scenario 1: Admin Can See All Leads

**Setup:**
1. Login as main partner (admin role)
2. Navigate to Leads page

**Expected:**
- See all leads from partner organization
- See leads from all sub-accounts
- "Submitted By" column shows different users

**Verification:**
```sql
-- Check admin can see all partner leads
SELECT * FROM leads WHERE partner_id = '<partner_id>';
```

#### Scenario 2: Sub-Account Sees Only Own Leads

**Setup:**
1. Login as sub-account user
2. Navigate to Leads page

**Expected:**
- See only leads created by this sub-account
- "Submitted By" column shows only their name
- No leads from other sub-accounts visible

**Verification:**
```sql
-- Check sub-account only sees own leads
SELECT * FROM leads 
WHERE partner_id = '<partner_id>' 
AND created_by = '<sub_account_user_id>';
```

#### Scenario 3: Sub-Account Cannot Access Sub-Accounts Page

**Setup:**
1. Login as sub-account user
2. Try to navigate to `/sub-accounts`

**Expected:**
- Redirected to dashboard
- Error toast: "Only main partners can manage sub-accounts"

#### Scenario 4: Activate Sub-Account

**Setup:**
1. Login as main partner
2. Navigate to Sub-Accounts page
3. Click "Activate Portal Access" on a non-activated contact

**Expected:**
- Success toast: "Sub-account activated!"
- Email sent to sub-account
- Sub-account appears as "Activated" in list
- Sub-account can login with password reset link

#### Scenario 5: Deactivate Sub-Account

**Setup:**
1. Login as main partner
2. Navigate to Sub-Accounts page
3. Click "Deactivate" on an active sub-account

**Expected:**
- Success toast: "Sub-account deactivated"
- Sub-account status changes to "Inactive"
- Sub-account cannot login
- Existing leads remain visible to admin

#### Scenario 6: Sub-Account Creates Lead

**Setup:**
1. Login as sub-account
2. Create a new lead

**Expected:**
- Lead created successfully
- `created_by` field set to sub-account user ID
- Lead appears in sub-account's lead list
- Lead appears in admin's lead list with sub-account as creator

#### Scenario 7: Sub-Account Cannot Edit Other's Leads

**Setup:**
1. Login as sub-account A
2. Try to edit a lead created by sub-account B (via API)

**Expected:**
- 403 Forbidden error
- RLS policy blocks the update
- Lead remains unchanged

---

## Migration Instructions

### Applying Migration 021

**Prerequisites:**
- Database backup created
- Supabase connection configured
- Service role key available

**Steps:**

1. **Run Migration Script:**
   ```bash
   cd backend
   node scripts/apply-migration-021.js
   ```

2. **Verify Migration:**
   ```sql
   -- Check new columns exist
   SELECT column_name, data_type, column_default 
   FROM information_schema.columns 
   WHERE table_name = 'users' 
   AND column_name IN ('can_submit_leads', 'can_view_all_partner_leads');

   -- Check admin permissions
   SELECT id, email, role, can_view_all_partner_leads 
   FROM users 
   WHERE role = 'admin';

   -- Check sub-account permissions
   SELECT id, email, role, can_view_all_partner_leads 
   FROM users 
   WHERE role IN ('sub', 'sub_account');
   ```

3. **Test RLS Policies:**
   ```sql
   -- Test as admin (should see all leads)
   SET LOCAL role TO authenticated;
   SET LOCAL request.jwt.claims TO '{"sub": "<admin_user_id>"}';
   SELECT COUNT(*) FROM leads WHERE partner_id = '<partner_id>';

   -- Test as sub-account (should see only own leads)
   SET LOCAL request.jwt.claims TO '{"sub": "<sub_account_user_id>"}';
   SELECT COUNT(*) FROM leads WHERE partner_id = '<partner_id>';
   ```

### Rollback Plan

If issues occur, rollback by:

1. **Drop New Policies:**
   ```sql
   DROP POLICY IF EXISTS "Admins can view all partner leads" ON leads;
   DROP POLICY IF EXISTS "Sub-accounts with full access can view all partner leads" ON leads;
   DROP POLICY IF EXISTS "Sub-accounts can view only their own leads" ON leads;
   DROP POLICY IF EXISTS "Users with permission can create leads" ON leads;
   DROP POLICY IF EXISTS "Admins can update all partner leads" ON leads;
   DROP POLICY IF EXISTS "Sub-accounts can update only their own leads" ON leads;
   DROP POLICY IF EXISTS "Only admins can delete leads" ON leads;
   ```

2. **Restore Old Policies:**
   ```sql
   -- Restore from backup or migration 002
   ```

3. **Remove New Columns:**
   ```sql
   ALTER TABLE users DROP COLUMN IF EXISTS can_submit_leads;
   ALTER TABLE users DROP COLUMN IF EXISTS can_view_all_partner_leads;
   ```

---

## Performance Considerations

### Indexes

Migration 021 adds two indexes for optimal query performance:

```sql
-- Index for sub-account lead filtering
CREATE INDEX idx_leads_created_by_user_id ON leads(created_by_user_id);

-- Composite index for partner + creator lookups
CREATE INDEX idx_leads_partner_created_by ON leads(partner_id, created_by_user_id);
```

### Query Optimization

**Admin Lead Query:**
- Uses `partner_id` index
- Returns all partner leads efficiently
- Includes creator join for "Submitted By" display

**Sub-Account Lead Query:**
- Uses composite `partner_id + created_by_user_id` index
- Highly optimized for single-user filtering
- Minimal overhead compared to admin query

### Expected Performance

- **Admin lead list (1000 leads):** < 100ms
- **Sub-account lead list (50 leads):** < 50ms
- **Sub-account activation:** < 2s (includes Zoho API call + email)
- **Permission check:** < 10ms (cached in JWT)

---

## Future Enhancements

### Potential Additions

1. **Custom Permissions**
   - Allow admins to grant specific sub-accounts full lead access
   - Implement via `can_view_all_partner_leads = true`

2. **Lead Assignment**
   - Assign leads to specific sub-accounts
   - Track lead ownership separately from creator

3. **Sub-Account Quotas**
   - Limit number of leads per sub-account
   - Track submission counts

4. **Advanced Reporting**
   - Sub-account performance metrics
   - Conversion rates by sub-account
   - Lead quality scoring

5. **Bulk Operations**
   - Bulk activate/deactivate sub-accounts
   - Bulk permission updates

---

## Troubleshooting

### Common Issues

#### Sub-Account Cannot See Any Leads

**Cause:** RLS policy blocking access or `created_by` not set correctly

**Solution:**
```sql
-- Check if leads have created_by set
SELECT id, first_name, last_name, created_by 
FROM leads 
WHERE partner_id = '<partner_id>' 
AND created_by IS NULL;

-- Update null created_by values
UPDATE leads 
SET created_by = '<user_id>' 
WHERE partner_id = '<partner_id>' 
AND created_by IS NULL;
```

#### Admin Cannot Manage Sub-Accounts

**Cause:** User role not set to 'admin'

**Solution:**
```sql
-- Check user role
SELECT id, email, role FROM users WHERE id = '<user_id>';

-- Update to admin if needed
UPDATE users SET role = 'admin' WHERE id = '<user_id>';
```

#### Sub-Account Activation Fails

**Cause:** Email already exists or Zoho contact not found

**Solution:**
1. Check if email already has a portal account
2. Verify contact exists in Zoho CRM
3. Check Zoho API credentials
4. Review backend logs for detailed error

#### RLS Policy Not Working

**Cause:** Policy order or conditions incorrect

**Solution:**
```sql
-- List all policies on leads table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'leads';

-- Test policy with specific user
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claims TO '{"sub": "<user_id>"}';
SELECT * FROM leads;
```

---

## Conclusion

Phase 6 implementation provides robust sub-account management with granular permission control. The system ensures data isolation at the database level while maintaining a seamless user experience for both admins and sub-accounts.

**Key Achievements:**
- ✅ Database-level security via RLS policies
- ✅ Automatic permission assignment based on role
- ✅ Sub-account management UI
- ✅ Lead isolation for sub-accounts
- ✅ "Submitted By" tracking for admins
- ✅ Zoho CRM integration for sub-account creation
- ✅ Comprehensive testing guide

**Next Steps:**
- Phase 7: Agent/ISO Handling
- Phase 8: Compensation Document Management
- Phase 9: Referral Form Logic
- Phase 10: Final Polish & Testing

---

*Last Updated: December 1, 2025*  
*Phase 6: Sub-Account Management - Complete*

