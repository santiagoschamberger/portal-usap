-- =====================================================
-- Update Deal Stages with Actual Zoho CRM Stages
-- Replace incorrect stages with actual ones from Zoho API
-- =====================================================

-- Drop the existing CHECK constraint on stage column
ALTER TABLE deals DROP CONSTRAINT IF EXISTS deals_stage_check;

-- Add new CHECK constraint with actual Zoho CRM stages
ALTER TABLE deals ADD CONSTRAINT deals_stage_check CHECK (stage IN (
    'New Deal',
    'Pre-Vet',
    'Sent for Signature',
    'Signed Application',
    'Sent to Underwriting',
    'App Pended',
    'Approved',
    'Declined',
    'Dead / Do Not Contact',
    'Merchant Unresponsive',
    'App Withdrawn',
    'Approved - Closed',
    'Conditionally Approved'
));

-- Update the default stage to the first stage in Zoho CRM
ALTER TABLE deals ALTER COLUMN stage SET DEFAULT 'New Deal';

-- Update any existing deals with incorrect stages to the default
UPDATE deals SET stage = 'New Deal' WHERE stage NOT IN (
    'New Deal',
    'Pre-Vet',
    'Sent for Signature',
    'Signed Application',
    'Sent to Underwriting',
    'App Pended',
    'Approved',
    'Declined',
    'Dead / Do Not Contact',
    'Merchant Unresponsive',
    'App Withdrawn',
    'Approved - Closed',
    'Conditionally Approved'
);

-- Add comment to track this change
COMMENT ON COLUMN deals.stage IS 'Deal stage from Zoho CRM - updated with actual stages from API';
