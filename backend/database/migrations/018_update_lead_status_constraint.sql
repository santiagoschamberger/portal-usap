-- =====================================================
-- Migration 018: Update Lead Status Constraint
-- Purpose: Update valid lead statuses to match StatusMappingService
-- =====================================================

-- 1. Drop the existing constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;

-- 2. Update existing data to match new statuses
UPDATE leads SET status = 'Pre-Vet / New Lead' WHERE status = 'new';
UPDATE leads SET status = 'Contacted' WHERE status = 'contacted';
UPDATE leads SET status = 'Sent for Signature / Submitted' WHERE status IN ('qualified', 'proposal');
UPDATE leads SET status = 'Approved' WHERE status = 'closed_won';
UPDATE leads SET status = 'Dead / Withdrawn' WHERE status = 'closed_lost';

-- 3. Add new constraint with updated values from StatusMappingService
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN (
    'Pre-Vet / New Lead',
    'Contacted',
    'Sent for Signature / Submitted',
    'Approved',
    'Declined',
    'Dead / Withdrawn'
));

-- 4. Update default value
ALTER TABLE leads ALTER COLUMN status SET DEFAULT 'Pre-Vet / New Lead';

-- 5. Add comment for documentation
COMMENT ON COLUMN leads.status IS 'Lead status: Pre-Vet / New Lead, Contacted, Sent for Signature / Submitted, Approved, Declined, Dead / Withdrawn';

