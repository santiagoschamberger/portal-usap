-- =====================================================
-- Fix Deal Stages and Add Approval Date Field
-- Remove 'Qualification' stage and add approval_date field
-- =====================================================

-- First, let's add the approval_date column
ALTER TABLE deals ADD COLUMN IF NOT EXISTS approval_date TIMESTAMP WITH TIME ZONE;

-- Create index for the new approval_date column
CREATE INDEX IF NOT EXISTS idx_deals_approval_date ON deals(approval_date);

-- Update any existing deals with 'Qualification' stage to 'Needs Analysis' (temporary fix)
-- This will be updated when we know the correct first stage from Zoho
UPDATE deals SET stage = 'Needs Analysis' WHERE stage = 'Qualification';

-- Drop the existing CHECK constraint on stage column
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Add new CHECK constraint without 'Qualification' stage
-- Note: We'll need to update this with the correct stages from Zoho CRM
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN (
    'Needs Analysis', 
    'Value Proposition',
    'Proposal',
    'Negotiation',
    'Closed Won',
    'Closed Lost'
));

-- Update the default stage to 'Needs Analysis' (temporary - will need correct first stage)
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'Needs Analysis';

-- Add comment to track this change
COMMENT ON COLUMN deals.approval_date IS 'Approval date from Zoho CRM Approval Time Stamp field';
COMMENT ON COLUMN deals.close_date IS 'DEPRECATED: Use approval_date instead. This field maps to Zoho Closing_Date';




