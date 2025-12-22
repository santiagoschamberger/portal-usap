# Phase 7: Agent/ISO Handling - Database Migration

**Date Created:** December 10, 2025  
**Status:** ⏳ Ready to Apply  
**Migration File:** `backend/database/migrations/022_agent_iso_handling.sql`

---

## Overview

Phase 7 implements support for Agent/ISO partner types who have different permissions than regular partners:
- **Regular Partners**: Can submit leads, manage sub-accounts, view all partner leads
- **Agent/ISO Partners**: Cannot submit leads, view only assigned leads (read-only)

---

## Migration 022: Agent/ISO Handling

### What This Migration Does

1. **Adds `partner_type` column to partners table**
   - Values: `'partner'` (default), `'agent'`, `'iso'`
   - Existing partners automatically set to `'partner'`

2. **Adds `assigned_agent_id` to leads and deals tables**
   - Links leads/deals to specific agents
   - Allows agents to view only their assigned records

3. **Creates 4 performance indexes**
   - `idx_partners_partner_type` - Fast partner type lookups
   - `idx_leads_assigned_agent` - Fast agent lead queries
   - `idx_deals_assigned_agent` - Fast agent deal queries
   - `idx_leads_partner_assigned_agent` - Composite index for optimization

4. **Updates 7 RLS policies**
   - Recreates existing SELECT policies with agent support
   - Adds new "Agents can view only assigned leads" policy
   - Prevents agents from creating/updating leads
   - Adds deal viewing policies for agents

5. **Creates 3 helper functions**
   - `is_agent_or_iso(user_uuid)` - Check if user is agent/ISO
   - `get_agent_assigned_leads(user_uuid)` - Get agent's assigned leads
   - `get_agent_assigned_deals(user_uuid)` - Get agent's assigned deals

6. **Creates 2 triggers**
   - `log_lead_agent_assignment` - Log when lead assigned to agent
   - `log_deal_agent_assignment` - Log when deal assigned to agent

---

## How to Apply the Migration

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - URL: https://supabase.com/dashboard
   - Project: `cvzadrvtncnjanoehzhj`

2. **Navigate to SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy Migration SQL**
   ```bash
   cat backend/database/migrations/022_agent_iso_handling.sql
   ```

4. **Paste and Execute**
   - Paste the entire SQL content into the editor
   - Click "Run" button
   - Wait for completion message

5. **Verify Success**
   - Check for "Migration 022: Agent/ISO Handling - COMPLETE" notice
   - No error messages should appear

### Option 2: Command Line (If DATABASE_URL is configured)

```bash
cd backend
node scripts/apply-migration-022-direct.js
```

**Note:** Requires `DATABASE_URL` in `.env` file with direct PostgreSQL connection string.

---

## Database Schema Changes

### Partners Table
```sql
-- New column
partner_type TEXT DEFAULT 'partner' 
  CHECK (partner_type IN ('partner', 'agent', 'iso'))
```

### Leads Table
```sql
-- New column
assigned_agent_id UUID REFERENCES partners(id) ON DELETE SET NULL
```

### Deals Table
```sql
-- New column
assigned_agent_id UUID REFERENCES partners(id) ON DELETE SET NULL
```

---

## RLS Policy Changes

### Leads Table Policies

**SELECT Policies (4 total):**
1. ✅ Admins can view all partner leads (updated)
2. ✅ Sub-accounts with full access can view all partner leads (updated)
3. ✅ Sub-accounts can view only their own leads (updated)
4. 🆕 Agents can view only assigned leads (new)

**INSERT Policy:**
- ✅ Users with permission can create leads (updated - prevents agents)

**UPDATE Policies (2 total):**
1. ✅ Admins can update all partner leads (updated - only regular partners)
2. ✅ Sub-accounts can update only their own leads (updated - only regular partners)

**DELETE Policy:**
- ✅ Only admins can delete leads (unchanged)

### Deals Table Policies

**SELECT Policies (3 total):**
1. 🆕 Admins can view all partner deals (new)
2. 🆕 Sub-accounts can view partner deals (new)
3. 🆕 Agents can view only assigned deals (new)

---

## Helper Functions

### 1. is_agent_or_iso(user_uuid UUID)
```sql
-- Returns: BOOLEAN
-- Purpose: Check if a user belongs to an agent or ISO partner type
-- Usage: SELECT is_agent_or_iso(auth.uid());
```

### 2. get_agent_assigned_leads(user_uuid UUID)
```sql
-- Returns: TABLE (lead columns)
-- Purpose: Get all leads assigned to an agent/ISO user
-- Usage: SELECT * FROM get_agent_assigned_leads(auth.uid());
```

### 3. get_agent_assigned_deals(user_uuid UUID)
```sql
-- Returns: TABLE (deal columns)
-- Purpose: Get all deals assigned to an agent/ISO user
-- Usage: SELECT * FROM get_agent_assigned_deals(auth.uid());
```

---

## Testing the Migration

### 1. Verify Schema Changes

```sql
-- Check partner_type column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'partners' AND column_name = 'partner_type';

-- Check assigned_agent_id in leads
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'leads' AND column_name = 'assigned_agent_id';

-- Check assigned_agent_id in deals
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'deals' AND column_name = 'assigned_agent_id';
```

### 2. Verify Indexes

```sql
SELECT indexname, tablename
FROM pg_indexes
WHERE tablename IN ('partners', 'leads', 'deals')
AND indexname LIKE '%agent%';
```

### 3. Verify Functions

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'is_agent_or_iso',
  'get_agent_assigned_leads',
  'get_agent_assigned_deals'
);
```

### 4. Verify Triggers

```sql
SELECT trigger_name, event_object_table, action_statement
FROM information_schema.triggers
WHERE trigger_name LIKE '%agent%';
```

### 5. Test RLS Policies

```sql
-- Create a test agent partner
INSERT INTO partners (id, name, email, partner_type, approved)
VALUES (
  gen_random_uuid(),
  'Test Agent',
  'agent@test.com',
  'agent',
  true
);

-- Verify agent can only see assigned leads (should return empty)
-- (Test after creating agent user and logging in)
```

---

## Next Steps After Migration

### 1. Backend API Updates

**Files to Update:**
- `backend/src/routes/partners.ts` - Add partner type handling
- `backend/src/routes/leads.ts` - Add agent filtering
- `backend/src/routes/deals.ts` - Add agent filtering
- `backend/src/middleware/permissions.ts` - Add agent checks
- `backend/src/routes/webhooks.ts` - Handle agent assignments from Zoho

**New Endpoints Needed:**
```javascript
// Get partner type for current user
GET /api/partners/me/type

// Get assigned leads for agent
GET /api/leads/assigned

// Get assigned deals for agent
GET /api/deals/assigned
```

### 2. Frontend UI Updates

**Files to Update:**
- `frontend/src/app/dashboard/page.tsx` - Conditional UI based on partner type
- `frontend/src/app/leads/page.tsx` - Hide "New Lead" for agents
- `frontend/src/app/deals/page.tsx` - Show only assigned deals
- `frontend/src/components/layout/DashboardLayout.tsx` - Hide sub-accounts menu for agents

**New Components Needed:**
- Agent dashboard view (read-only)
- Assigned leads list view
- Agent restrictions banner

### 3. Zoho CRM Integration

**Webhook Updates:**
- Update partner webhook to capture `partner_type` from Zoho
- Update lead webhook to capture `assigned_agent_id`
- Update deal webhook to capture `assigned_agent_id`

**Field Mapping:**
- Map Zoho "Type" field → `partner_type`
- Map Zoho "Assigned Agent" field → `assigned_agent_id`

### 4. Testing Checklist

- [ ] Create agent partner in Zoho CRM
- [ ] Verify agent user created in portal
- [ ] Verify agent cannot submit leads
- [ ] Assign lead to agent in Zoho
- [ ] Verify agent can see assigned lead
- [ ] Verify agent cannot see unassigned leads
- [ ] Verify agent cannot access sub-accounts page
- [ ] Verify regular partners unaffected

---

## Rollback Plan

If issues occur, rollback by executing:

```sql
-- Remove agent-related columns
ALTER TABLE partners DROP COLUMN IF EXISTS partner_type;
ALTER TABLE leads DROP COLUMN IF EXISTS assigned_agent_id;
ALTER TABLE deals DROP COLUMN IF EXISTS assigned_agent_id;

-- Drop agent-related indexes
DROP INDEX IF EXISTS idx_partners_partner_type;
DROP INDEX IF EXISTS idx_leads_assigned_agent;
DROP INDEX IF EXISTS idx_deals_assigned_agent;
DROP INDEX IF EXISTS idx_leads_partner_assigned_agent;

-- Drop agent-related functions
DROP FUNCTION IF EXISTS is_agent_or_iso(UUID);
DROP FUNCTION IF EXISTS get_agent_assigned_leads(UUID);
DROP FUNCTION IF EXISTS get_agent_assigned_deals(UUID);

-- Drop agent-related triggers
DROP TRIGGER IF EXISTS log_lead_agent_assignment ON leads;
DROP TRIGGER IF EXISTS log_deal_agent_assignment ON deals;
DROP FUNCTION IF EXISTS log_agent_assignment();

-- Restore original RLS policies (see Migration 021 for original policies)
```

---

## Migration File Location

📁 **Full Path:**
```
/Users/santiago/Desktop/DEV/USA Payments/usapayments-portal-2.0/backend/database/migrations/022_agent_iso_handling.sql
```

📋 **View Migration SQL:**
```bash
cat backend/database/migrations/022_agent_iso_handling.sql
```

---

## Support & Troubleshooting

### Common Issues

**Issue: Column already exists**
- **Solution:** Migration is idempotent, but if partial migration occurred, drop the column and re-run

**Issue: RLS policy conflicts**
- **Solution:** Drop all lead/deal policies and re-run migration

**Issue: Function already exists**
- **Solution:** Migration uses `CREATE OR REPLACE`, should not cause issues

### Verification Queries

```sql
-- Check all partner types
SELECT partner_type, COUNT(*) 
FROM partners 
GROUP BY partner_type;

-- Check leads with assigned agents
SELECT COUNT(*) 
FROM leads 
WHERE assigned_agent_id IS NOT NULL;

-- Check deals with assigned agents
SELECT COUNT(*) 
FROM deals 
WHERE assigned_agent_id IS NOT NULL;
```

---

**Migration Status:** ⏳ Ready to Apply  
**Estimated Time:** 2-3 minutes  
**Risk Level:** Low (adds new columns, doesn't modify existing data)  
**Rollback Available:** Yes

---

*Created: December 10, 2025*  
*Phase 7: Agent/ISO Handling*




