-- Migration 017: Add zoho_status column to leads table
-- Purpose: Store original Zoho status for debugging and reference while displaying mapped Portal status

-- Add zoho_status column to store original Zoho status value
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS zoho_status VARCHAR(100);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_leads_zoho_status ON leads(zoho_status);

-- Add comment for documentation
COMMENT ON COLUMN leads.zoho_status IS 'Original Zoho CRM status value before mapping to Portal display status';

-- Migration complete

