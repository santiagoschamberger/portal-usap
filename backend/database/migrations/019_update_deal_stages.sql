-- =====================================================
-- Update Deal Stages to Portal Simplified Stages
-- Phase 5: Deal Management
-- =====================================================

-- 1. Drop the existing CHECK constraint on stage column
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- 2. Migrate existing deals to new stages (MUST be done before adding new constraint)
UPDATE deals 
SET stage = CASE 
  WHEN stage = 'Closed Won' THEN 'Approved'
  WHEN stage = 'Closed Lost' THEN 'Declined'
  WHEN stage IN ('Needs Analysis', 'Value Proposition', 'Proposal', 'Negotiation') THEN 'New Lead / Prevet'
  -- If it's already one of the new stages, keep it
  WHEN stage IN ('New Lead / Prevet', 'Submitted', 'Underwriting', 'Approved', 'Declined', 'Closed') THEN stage
  -- Default fallback for any other legacy values
  ELSE 'New Lead / Prevet' 
END;

-- 3. Add new CHECK constraint with Portal simplified stages
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN (
    'New Lead / Prevet',
    'Submitted',
    'Underwriting',
    'Approved',
    'Declined',
    'Closed'
));

-- 4. Update the default stage
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'New Lead / Prevet';
