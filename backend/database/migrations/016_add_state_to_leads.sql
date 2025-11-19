-- Migration 016: Add state column to leads table
-- This supports the simplified lead form that collects US state information

-- Add state column to leads table
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS state VARCHAR(100);

-- Add index for state column (useful for filtering/reporting)
CREATE INDEX IF NOT EXISTS idx_leads_state ON leads(state);

-- Add comment for documentation
COMMENT ON COLUMN leads.state IS 'US state or territory where the business is located';

