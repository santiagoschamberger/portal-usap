-- Migration 023: Update Status and Stage Mappings
-- Date: December 22, 2025
-- Purpose: Update lead statuses and deal stages to match new client requirements
-- Reference: docs/reference/STATUS_STAGE_MAPPING_REFERENCE.md

-- ============================================================================
-- PART 1: BACKUP CURRENT DATA (for rollback if needed)
-- ============================================================================

-- Create backup tables
CREATE TABLE IF NOT EXISTS leads_backup_pre_migration_023 AS 
SELECT * FROM leads;

CREATE TABLE IF NOT EXISTS deals_backup_pre_migration_023 AS 
SELECT * FROM deals;

-- ============================================================================
-- PART 2: MIGRATE LEAD STATUSES
-- ============================================================================

-- Show current lead status distribution
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT LEAD STATUS DISTRIBUTION ===';
END $$;

SELECT status, COUNT(*) as count 
FROM leads 
GROUP BY status 
ORDER BY count DESC;

-- Update lead statuses to new format
UPDATE leads 
SET 
  status = CASE 
    -- Old mappings to new mappings
    WHEN status = 'Pre-Vet / New Lead' OR status = 'Lead' THEN 'New'
    WHEN status = 'Contacted' THEN 'Contact Attempt'
    WHEN status = 'Sent for Signature / Submitted' OR status = 'Application Submitted' THEN 'Sent for Signature'
    WHEN status = 'Approved' THEN 'Application Signed'
    WHEN status = 'Declined' THEN 'Lost'
    WHEN status = 'Dead / Withdrawn' OR status = 'Lost' THEN 'Lost'
    -- New statuses (if already using new format, keep as is)
    WHEN status IN ('New', 'Contact Attempt', 'Contacted - In Progress', 'Sent for Signature', 'Application Signed', 'Lost') THEN status
    ELSE 'New' -- Default fallback
  END,
  updated_at = NOW()
WHERE status IS NOT NULL;

-- Show new lead status distribution
DO $$
BEGIN
    RAISE NOTICE '=== NEW LEAD STATUS DISTRIBUTION ===';
END $$;

SELECT status, COUNT(*) as count 
FROM leads 
GROUP BY status 
ORDER BY count DESC;

-- ============================================================================
-- PART 3: MIGRATE DEAL STAGES
-- ============================================================================

-- Show current deal stage distribution
DO $$
BEGIN
    RAISE NOTICE '=== CURRENT DEAL STAGE DISTRIBUTION ===';
END $$;

SELECT stage, COUNT(*) as count 
FROM deals 
GROUP BY stage 
ORDER BY count DESC;

-- Update deal stages to new format
UPDATE deals 
SET 
  stage = CASE 
    -- Old mappings to new mappings
    WHEN stage IN ('New Lead / Prevet', 'New Deal', 'Pre-Vet', 'Submitted', 'Underwriting') THEN 'In Underwriting'
    WHEN stage = 'Conditionally Approved' THEN 'Conditionally Approved'
    WHEN stage = 'Approved' THEN 'Approved'
    WHEN stage IN ('Dead / Withdrawn', 'Dead / Do Not Contact', 'Merchant Unresponsive', 'App Withdrawn') THEN 'Lost'
    WHEN stage = 'Declined' THEN 'Declined'
    WHEN stage IN ('Closed', 'Approved - Closed') THEN 'Closed'
    -- New stages (if already using new format, keep as is)
    WHEN stage IN ('In Underwriting', 'Conditionally Approved', 'Approved', 'Lost', 'Declined', 'Closed') THEN stage
    ELSE 'In Underwriting' -- Default fallback
  END,
  updated_at = NOW()
WHERE stage IS NOT NULL;

-- Show new deal stage distribution
DO $$
BEGIN
    RAISE NOTICE '=== NEW DEAL STAGE DISTRIBUTION ===';
END $$;

SELECT stage, COUNT(*) as count 
FROM deals 
GROUP BY stage 
ORDER BY count DESC;

-- ============================================================================
-- PART 4: UPDATE HISTORY TABLES (if they exist)
-- ============================================================================

-- Update lead_status_history table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_status_history') THEN
        UPDATE lead_status_history 
        SET 
          old_status = CASE 
            WHEN old_status = 'Pre-Vet / New Lead' OR old_status = 'Lead' THEN 'New'
            WHEN old_status = 'Contacted' THEN 'Contact Attempt'
            WHEN old_status = 'Sent for Signature / Submitted' OR old_status = 'Application Submitted' THEN 'Sent for Signature'
            WHEN old_status = 'Approved' THEN 'Application Signed'
            WHEN old_status IN ('Declined', 'Dead / Withdrawn', 'Lost') THEN 'Lost'
            WHEN old_status IN ('New', 'Contact Attempt', 'Contacted - In Progress', 'Sent for Signature', 'Application Signed', 'Lost') THEN old_status
            ELSE 'New'
          END,
          new_status = CASE 
            WHEN new_status = 'Pre-Vet / New Lead' OR new_status = 'Lead' THEN 'New'
            WHEN new_status = 'Contacted' THEN 'Contact Attempt'
            WHEN new_status = 'Sent for Signature / Submitted' OR new_status = 'Application Submitted' THEN 'Sent for Signature'
            WHEN new_status = 'Approved' THEN 'Application Signed'
            WHEN new_status IN ('Declined', 'Dead / Withdrawn', 'Lost') THEN 'Lost'
            WHEN new_status IN ('New', 'Contact Attempt', 'Contacted - In Progress', 'Sent for Signature', 'Application Signed', 'Lost') THEN new_status
            ELSE 'New'
          END;
        
        RAISE NOTICE 'Updated lead_status_history table';
    END IF;
END $$;

-- Update deal_stage_history table if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'deal_stage_history') THEN
        UPDATE deal_stage_history 
        SET 
          old_stage = CASE 
            WHEN old_stage IN ('New Lead / Prevet', 'New Deal', 'Pre-Vet', 'Submitted', 'Underwriting') THEN 'In Underwriting'
            WHEN old_stage = 'Conditionally Approved' THEN 'Conditionally Approved'
            WHEN old_stage = 'Approved' THEN 'Approved'
            WHEN old_stage IN ('Dead / Withdrawn', 'Dead / Do Not Contact', 'Merchant Unresponsive', 'App Withdrawn') THEN 'Lost'
            WHEN old_stage = 'Declined' THEN 'Declined'
            WHEN old_stage IN ('Closed', 'Approved - Closed') THEN 'Closed'
            WHEN old_stage IN ('In Underwriting', 'Conditionally Approved', 'Approved', 'Lost', 'Declined', 'Closed') THEN old_stage
            ELSE 'In Underwriting'
          END,
          new_stage = CASE 
            WHEN new_stage IN ('New Lead / Prevet', 'New Deal', 'Pre-Vet', 'Submitted', 'Underwriting') THEN 'In Underwriting'
            WHEN new_stage = 'Conditionally Approved' THEN 'Conditionally Approved'
            WHEN new_stage = 'Approved' THEN 'Approved'
            WHEN new_stage IN ('Dead / Withdrawn', 'Dead / Do Not Contact', 'Merchant Unresponsive', 'App Withdrawn') THEN 'Lost'
            WHEN new_stage = 'Declined' THEN 'Declined'
            WHEN new_stage IN ('Closed', 'Approved - Closed') THEN 'Closed'
            WHEN new_stage IN ('In Underwriting', 'Conditionally Approved', 'Approved', 'Lost', 'Declined', 'Closed') THEN new_stage
            ELSE 'In Underwriting'
          END;
        
        RAISE NOTICE 'Updated deal_stage_history table';
    END IF;
END $$;

-- ============================================================================
-- PART 5: VERIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '=== MIGRATION COMPLETE ===';
    RAISE NOTICE 'Backup tables created: leads_backup_pre_migration_023, deals_backup_pre_migration_023';
    RAISE NOTICE 'Review the status/stage distributions above to verify migration';
    RAISE NOTICE 'To rollback: DROP TABLE leads; ALTER TABLE leads_backup_pre_migration_023 RENAME TO leads;';
END $$;

-- Final verification queries
SELECT 'Lead Statuses' as table_name, status as value, COUNT(*) as count 
FROM leads 
GROUP BY status 
UNION ALL
SELECT 'Deal Stages' as table_name, stage as value, COUNT(*) as count 
FROM deals 
GROUP BY stage
ORDER BY table_name, count DESC;

