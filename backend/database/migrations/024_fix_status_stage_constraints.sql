-- Migration 024: Fix Status and Stage CHECK Constraints
-- Date: January 22, 2026
-- Purpose: Update database constraints to match new status/stage mappings
-- Related to: Migration 023 (STATUS_STAGE_MAPPING_REFERENCE.md)

-- ============================================================================
-- PART 1: DROP OLD CONSTRAINTS
-- ============================================================================

-- Drop existing lead status constraint if it exists
ALTER TABLE IF EXISTS leads 
DROP CONSTRAINT IF EXISTS leads_status_check;

-- Drop existing deal stage constraint if it exists  
ALTER TABLE IF EXISTS deals
DROP CONSTRAINT IF EXISTS deals_stage_check;

-- ============================================================================
-- PART 2: ADD NEW CONSTRAINTS WITH CORRECT VALUES
-- ============================================================================

-- Add lead status constraint with new portal statuses
-- Reference: docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md (Lead Status Mapping)
ALTER TABLE leads
ADD CONSTRAINT leads_status_check 
CHECK (status IN (
  'New',
  'Contact Attempt',
  'Contacted - In Progress',
  'Sent for Signature',
  'Application Signed',
  'Lost',
  'Converted'  -- For converted leads (before deletion)
));

-- Add deal stage constraint with new portal stages
-- Reference: docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md (Deal Stage Mapping)
ALTER TABLE deals
ADD CONSTRAINT deals_stage_check 
CHECK (stage IN (
  'In Underwriting',
  'Conditionally Approved',
  'Approved',
  'Lost',
  'Declined',
  'Closed'
));

-- ============================================================================
-- PART 3: VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== CONSTRAINT UPDATE COMPLETE ===';
    RAISE NOTICE 'Lead status constraint updated with: New, Contact Attempt, Contacted - In Progress, Sent for Signature, Application Signed, Lost, Converted';
    RAISE NOTICE 'Deal stage constraint updated with: In Underwriting, Conditionally Approved, Approved, Lost, Declined, Closed';
END $$;

-- Verify no existing data violates new constraints
SELECT 'Lead Statuses' as check_type, status, COUNT(*) as count
FROM leads
WHERE status NOT IN ('New', 'Contact Attempt', 'Contacted - In Progress', 'Sent for Signature', 'Application Signed', 'Lost', 'Converted')
GROUP BY status

UNION ALL

SELECT 'Deal Stages' as check_type, stage, COUNT(*) as count
FROM deals
WHERE stage NOT IN ('In Underwriting', 'Conditionally Approved', 'Approved', 'Lost', 'Declined', 'Closed')
GROUP BY stage;

-- If above query returns rows, those are invalid values that need to be migrated
