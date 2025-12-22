# Status & Stage Mapping Update - December 2025

**Date:** December 22, 2025  
**Status:** ✅ Backend Updated | ⏳ Migration Ready | ⏳ Frontend Pending

---

## 📋 Overview

This document outlines the comprehensive update to lead status and deal stage mappings based on client requirements received in December 2025. The update simplifies and clarifies the mapping between Zoho CRM and the Partner Portal.

## 🎯 Objectives

1. **Simplify Status Names**: Use clearer, more intuitive status/stage names
2. **Improve Tracking**: Better differentiate between similar outcomes (e.g., "Lost" vs "Declined")
3. **Align with Workflow**: Match actual business process more accurately
4. **Maintain Data Integrity**: Preserve all existing data during migration

---

## 📊 Changes Summary

### Lead Status Mapping Changes

#### Old Mapping (Before December 2025)
| Portal Display | Zoho CRM Status |
|---------------|-----------------|
| Pre-Vet / New Lead | Lead |
| Contacted | Contacted |
| Sent for Signature / Submitted | Application Submitted |
| Approved | Approved |
| Declined | Declined |
| Dead / Withdrawn | Lost |

#### New Mapping (December 2025)
| Portal Display | Zoho CRM Statuses | Notes |
|---------------|-------------------|-------|
| New | New | Initial status |
| Contact Attempt | Contact Attempt 1-5 | All 5 variations map here |
| Contacted - In Progress | Interested - Needs Follow Up, Sent Pre-App, Pre-App Received | Active engagement |
| Sent for Signature | Awaiting Signature - No Motion.io, Send to Motion.io | Awaiting signature |
| Application Signed | Signed Application, Notify Apps Team, Convert | Ready for conversion |
| Lost | Lost, Junk | Closed/Lost leads |

**Key Changes:**
- More granular mapping from Zoho (16 statuses → 6 portal statuses)
- Separated "Contact Attempt" from general "Contacted"
- New "Contacted - In Progress" for active engagement
- "Application Signed" replaces "Approved" (more accurate)
- "Junk" now maps to "Lost"

### Deal Stage Mapping Changes

#### Old Mapping (Before December 2025)
| Portal Display | Zoho CRM Stages |
|---------------|-----------------|
| New Lead / Prevet | New Deal, Pre-Vet |
| Submitted | Sent for Signature, Signed Application |
| Underwriting | Sent to Underwriting, App Pended |
| Approved | Approved, Conditionally Approved |
| Declined | Declined |
| Closed | Approved - Closed, Dead / Do Not Contact, Merchant Unresponsive, App Withdrawn |

#### New Mapping (December 2025)
| Portal Display | Zoho CRM Stages | Notes |
|---------------|-----------------|-------|
| In Underwriting | Sent to Underwriting, App Pended | Under review |
| Conditionally Approved | Conditionally Approved | Separate from full approval |
| Approved | Approved | Full approval |
| Lost | App Withdrawn, Merchant Unresponsive, Dead/Do Not contact | Negative outcomes |
| Declined | Declined | Explicitly declined |
| Closed | Approved - Closed | Final positive outcome |

**Key Changes:**
- Removed "New Lead / Prevet" and "Submitted" stages (deals start at underwriting)
- Separated "Conditionally Approved" from "Approved"
- Separated "Lost" from "Declined" for better tracking
- Clearer progression through approval stages

---

## 🔧 Implementation Details

### Files Modified

#### Backend Services
1. **`backend/src/services/leadStatusMappingService.ts`**
   - Updated `zohoToPortal` mapping with 16 Zoho statuses
   - Updated `portalToZoho` mapping with 6 portal statuses
   - Updated `getStatusCategory()` for new status names
   - Updated `isConvertedStatus()` to include "Convert"

2. **`backend/src/services/stageMappingService.ts`**
   - Updated `zohoToPortal` mapping with 9 Zoho stages
   - Updated `getAllPortalStages()` to return 6 new stages
   - Added `getStageCategory()` for UI styling

#### Documentation
3. **`docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md`**
   - Complete rewrite with new mappings
   - Updated all code examples
   - Updated frontend component examples
   - Added migration scripts
   - Added testing scenarios

#### Database Migrations
4. **`backend/database/migrations/023_update_status_stage_mappings.sql`**
   - Comprehensive migration script
   - Creates backup tables automatically
   - Updates leads, deals, and history tables
   - Includes verification queries

5. **`backend/scripts/apply-migration-023.js`**
   - Node.js script to apply migration
   - Includes pre/post verification
   - Provides rollback information

---

## 🚀 Deployment Steps

### 1. Backend Code Deployment

✅ **COMPLETED** - Backend services have been updated with new mappings.

**Files Updated:**
- `backend/src/services/leadStatusMappingService.ts`
- `backend/src/services/stageMappingService.ts`

**What This Means:**
- Webhooks from Zoho will now use the new mapping logic
- Any new leads/deals will use the new status/stage names

### 2. Database Migration

⏳ **READY TO EXECUTE** - Migration script is ready but not yet applied.

**Before Running Migration:**
```bash
# 1. Backup database (Supabase does this automatically, but verify)
# 2. Review current status/stage distribution
psql $DATABASE_URL -c "SELECT status, COUNT(*) FROM leads GROUP BY status;"
psql $DATABASE_URL -c "SELECT stage, COUNT(*) FROM deals GROUP BY stage;"
```

**Run Migration:**
```bash
cd backend
node scripts/apply-migration-023.js
```

**What This Does:**
- Creates backup tables: `leads_backup_pre_migration_023`, `deals_backup_pre_migration_023`
- Updates all existing lead statuses to new format
- Updates all existing deal stages to new format
- Updates history tables (if they exist)
- Provides verification output

**Rollback (if needed):**
```sql
-- Rollback leads
DROP TABLE leads;
ALTER TABLE leads_backup_pre_migration_023 RENAME TO leads;

-- Rollback deals
DROP TABLE deals;
ALTER TABLE deals_backup_pre_migration_023 RENAME TO deals;
```

### 3. Frontend Updates

⏳ **PENDING** - Frontend components need to be updated to display new status/stage names.

**Components to Update:**

1. **Status Badge Component** (`frontend/src/components/leads/LeadStatusBadge.tsx` or similar)
   ```typescript
   const statusColors = {
     'New': 'bg-blue-100 text-blue-800',
     'Contact Attempt': 'bg-purple-100 text-purple-800',
     'Contacted - In Progress': 'bg-indigo-100 text-indigo-800',
     'Sent for Signature': 'bg-yellow-100 text-yellow-800',
     'Application Signed': 'bg-green-100 text-green-800',
     'Lost': 'bg-gray-100 text-gray-800'
   };
   ```

2. **Stage Badge Component** (`frontend/src/components/deals/DealStageBadge.tsx` or similar)
   ```typescript
   const stageColors = {
     'In Underwriting': 'bg-yellow-100 text-yellow-800',
     'Conditionally Approved': 'bg-orange-100 text-orange-800',
     'Approved': 'bg-green-100 text-green-800',
     'Lost': 'bg-gray-100 text-gray-800',
     'Declined': 'bg-red-100 text-red-800',
     'Closed': 'bg-blue-100 text-blue-800'
   };
   ```

3. **Filter Dropdowns** - Update any status/stage filter dropdowns to use new values

4. **Dashboard Stats** - Update any dashboard components that display status/stage counts

**Search for Components:**
```bash
cd frontend
grep -r "Pre-Vet / New Lead" src/
grep -r "Underwriting" src/
grep -r "Dead / Withdrawn" src/
```

### 4. Testing

⏳ **PENDING** - Comprehensive testing after migration and frontend updates.

**Test Checklist:**

- [ ] **Lead Status Webhooks**
  - [ ] Test "New" status
  - [ ] Test "Contact Attempt 1-5" → "Contact Attempt"
  - [ ] Test "Interested - Needs Follow Up" → "Contacted - In Progress"
  - [ ] Test "Send to Motion.io" → "Sent for Signature"
  - [ ] Test "Signed Application" → "Application Signed"
  - [ ] Test "Convert" → Lead deletion + Deal creation

- [ ] **Deal Stage Webhooks**
  - [ ] Test "Sent to Underwriting" → "In Underwriting"
  - [ ] Test "Conditionally Approved" → "Conditionally Approved"
  - [ ] Test "Approved" → "Approved"
  - [ ] Test "App Withdrawn" → "Lost"
  - [ ] Test "Declined" → "Declined"
  - [ ] Test "Approved - Closed" → "Closed"

- [ ] **Frontend Display**
  - [ ] Verify status badges show correct colors
  - [ ] Verify stage badges show correct colors
  - [ ] Verify filter dropdowns work
  - [ ] Verify dashboard stats display correctly

- [ ] **Data Integrity**
  - [ ] Verify no NULL statuses/stages
  - [ ] Verify all records migrated correctly
  - [ ] Verify history tables updated

---

## 📝 Rollback Plan

If issues are discovered after deployment:

### 1. Rollback Database (Immediate)
```sql
-- Restore from backup tables
DROP TABLE leads;
ALTER TABLE leads_backup_pre_migration_023 RENAME TO leads;

DROP TABLE deals;
ALTER TABLE deals_backup_pre_migration_023 RENAME TO deals;
```

### 2. Rollback Backend Code (if needed)
```bash
# Revert the commits for the mapping service updates
git revert <commit-hash>
git push
```

### 3. Rollback Frontend (if needed)
```bash
# Revert frontend component changes
git revert <commit-hash>
git push
```

---

## 🔍 Verification Queries

After migration, run these queries to verify success:

```sql
-- Check lead status distribution
SELECT status, COUNT(*) as count 
FROM leads 
GROUP BY status 
ORDER BY count DESC;

-- Expected results:
-- New, Contact Attempt, Contacted - In Progress, 
-- Sent for Signature, Application Signed, Lost

-- Check deal stage distribution
SELECT stage, COUNT(*) as count 
FROM deals 
GROUP BY stage 
ORDER BY count DESC;

-- Expected results:
-- In Underwriting, Conditionally Approved, Approved,
-- Lost, Declined, Closed

-- Check for any NULL values (should be 0)
SELECT COUNT(*) FROM leads WHERE status IS NULL;
SELECT COUNT(*) FROM deals WHERE stage IS NULL;

-- Check for any unexpected values
SELECT DISTINCT status FROM leads 
WHERE status NOT IN ('New', 'Contact Attempt', 'Contacted - In Progress', 
                     'Sent for Signature', 'Application Signed', 'Lost');

SELECT DISTINCT stage FROM deals 
WHERE stage NOT IN ('In Underwriting', 'Conditionally Approved', 'Approved', 
                    'Lost', 'Declined', 'Closed');
```

---

## 📚 Reference

- **Detailed Mapping Reference:** `docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md`
- **Migration SQL:** `backend/database/migrations/023_update_status_stage_mappings.sql`
- **Migration Script:** `backend/scripts/apply-migration-023.js`
- **Lead Status Service:** `backend/src/services/leadStatusMappingService.ts`
- **Stage Mapping Service:** `backend/src/services/stageMappingService.ts`

---

## ✅ Completion Checklist

- [x] Update backend mapping services
- [x] Create migration SQL script
- [x] Create migration application script
- [x] Update reference documentation
- [x] Create deployment guide (this document)
- [ ] Run database migration
- [ ] Update frontend components
- [ ] Test webhooks with new mappings
- [ ] Deploy to production
- [ ] Verify in production
- [ ] Clean up backup tables (after 30 days)

---

**Questions or Issues?**  
Contact: Development Team  
Reference: This document and `docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md`

