-- Migration 022: Agent/ISO Handling
-- Phase 7: Add partner type field and agent assignment functionality
-- Date: December 10, 2025

-- ============================================================================
-- 1. Add partner_type to partners table
-- ============================================================================

ALTER TABLE partners 
ADD COLUMN partner_type TEXT DEFAULT 'partner' 
CHECK (partner_type IN ('partner', 'agent', 'iso'));

COMMENT ON COLUMN partners.partner_type IS 'Type of partner: partner (can submit leads), agent/iso (view assigned leads only)';

-- Update existing partners to 'partner' type (already default, but explicit)
UPDATE partners SET partner_type = 'partner' WHERE partner_type IS NULL;

-- ============================================================================
-- 2. Add assigned_agent_id to leads table
-- ============================================================================

ALTER TABLE leads 
ADD COLUMN assigned_agent_id UUID REFERENCES partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN leads.assigned_agent_id IS 'Agent/ISO assigned to this lead (for agent partner types)';

-- ============================================================================
-- 3. Add assigned_agent_id to deals table (for consistency)
-- ============================================================================

ALTER TABLE deals 
ADD COLUMN assigned_agent_id UUID REFERENCES partners(id) ON DELETE SET NULL;

COMMENT ON COLUMN deals.assigned_agent_id IS 'Agent/ISO assigned to this deal (for agent partner types)';

-- ============================================================================
-- 4. Create performance indexes
-- ============================================================================

CREATE INDEX idx_partners_partner_type ON partners(partner_type);
CREATE INDEX idx_leads_assigned_agent ON leads(assigned_agent_id);
CREATE INDEX idx_deals_assigned_agent ON deals(assigned_agent_id);
CREATE INDEX idx_leads_partner_assigned_agent ON leads(partner_id, assigned_agent_id);

-- ============================================================================
-- 5. Update RLS Policies for Agent/ISO Access
-- ============================================================================

-- Drop existing lead SELECT policies to recreate with agent logic
DROP POLICY IF EXISTS "Admins can view all partner leads" ON leads;
DROP POLICY IF EXISTS "Sub-accounts with full access can view all partner leads" ON leads;
DROP POLICY IF EXISTS "Sub-accounts can view only their own leads" ON leads;

-- Recreate SELECT policies with agent support
CREATE POLICY "Admins can view all partner leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND leads.partner_id = p.id
    )
  );

CREATE POLICY "Sub-accounts with full access can view all partner leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.role = 'sub_account'
      AND u.can_view_all_partner_leads = true
      AND leads.partner_id = p.id
    )
  );

CREATE POLICY "Sub-accounts can view only their own leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'sub_account'
      AND u.can_view_all_partner_leads = false
      AND leads.created_by = u.id
    )
  );

CREATE POLICY "Agents can view only assigned leads" ON leads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND p.partner_type IN ('agent', 'iso')
      AND leads.assigned_agent_id = p.id
    )
  );

-- ============================================================================
-- 6. Update RLS Policies for Lead INSERT (prevent agents from creating)
-- ============================================================================

DROP POLICY IF EXISTS "Users with permission can create leads" ON leads;

CREATE POLICY "Users with permission can create leads" ON leads
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.can_submit_leads = true
      AND u.is_active = true
      AND p.partner_type = 'partner' -- Only regular partners can submit
      AND leads.partner_id = p.id
    )
  );

-- ============================================================================
-- 7. Update RLS Policies for Lead UPDATE (agents cannot update)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can update all partner leads" ON leads;
DROP POLICY IF EXISTS "Sub-accounts can update only their own leads" ON leads;

CREATE POLICY "Admins can update all partner leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND p.partner_type = 'partner' -- Only regular partners
      AND leads.partner_id = p.id
    )
  );

CREATE POLICY "Sub-accounts can update only their own leads" ON leads
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.role = 'sub_account'
      AND p.partner_type = 'partner' -- Only regular partners
      AND leads.created_by = u.id
    )
  );

-- ============================================================================
-- 8. Add RLS Policies for Deals (Agent/ISO access)
-- ============================================================================

-- Drop existing deal SELECT policies if they exist
DROP POLICY IF EXISTS "Admins can view all partner deals" ON deals;
DROP POLICY IF EXISTS "Sub-accounts can view partner deals" ON deals;
DROP POLICY IF EXISTS "Agents can view only assigned deals" ON deals;

-- Admins can view all partner deals
CREATE POLICY "Admins can view all partner deals" ON deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
      AND deals.partner_id = p.id
    )
  );

-- Sub-accounts can view all partner deals
CREATE POLICY "Sub-accounts can view partner deals" ON deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND u.role = 'sub_account'
      AND deals.partner_id = p.id
    )
  );

-- Agents can view only assigned deals
CREATE POLICY "Agents can view only assigned deals" ON deals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      INNER JOIN partners p ON u.partner_id = p.id
      WHERE u.id = auth.uid()
      AND p.partner_type IN ('agent', 'iso')
      AND deals.assigned_agent_id = p.id
    )
  );

-- ============================================================================
-- 9. Create helper function to check if user is agent/ISO
-- ============================================================================

CREATE OR REPLACE FUNCTION is_agent_or_iso(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  partner_type_val TEXT;
BEGIN
  SELECT p.partner_type INTO partner_type_val
  FROM users u
  INNER JOIN partners p ON u.partner_id = p.id
  WHERE u.id = user_uuid;
  
  RETURN partner_type_val IN ('agent', 'iso');
END;
$$;

COMMENT ON FUNCTION is_agent_or_iso IS 'Check if a user belongs to an agent or ISO partner type';

-- ============================================================================
-- 10. Create helper function to get assigned leads for agent
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_assigned_leads(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  partner_id UUID,
  zoho_lead_id TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  company TEXT,
  status TEXT,
  lead_source TEXT,
  created_by UUID,
  assigned_agent_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_partner_id UUID;
BEGIN
  -- Get the partner_id for the user
  SELECT u.partner_id INTO agent_partner_id
  FROM users u
  INNER JOIN partners p ON u.partner_id = p.id
  WHERE u.id = user_uuid
  AND p.partner_type IN ('agent', 'iso');
  
  -- Return leads assigned to this agent
  RETURN QUERY
  SELECT 
    l.id,
    l.partner_id,
    l.zoho_lead_id,
    l.first_name,
    l.last_name,
    l.email,
    l.phone,
    l.company,
    l.status,
    l.lead_source,
    l.created_by,
    l.assigned_agent_id,
    l.created_at,
    l.updated_at
  FROM leads l
  WHERE l.assigned_agent_id = agent_partner_id;
END;
$$;

COMMENT ON FUNCTION get_agent_assigned_leads IS 'Get all leads assigned to an agent/ISO user';

-- ============================================================================
-- 11. Create helper function to get assigned deals for agent
-- ============================================================================

CREATE OR REPLACE FUNCTION get_agent_assigned_deals(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  partner_id UUID,
  zoho_deal_id TEXT,
  deal_name TEXT,
  amount NUMERIC,
  stage TEXT,
  close_date DATE,
  created_by UUID,
  assigned_agent_id UUID,
  lead_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_partner_id UUID;
BEGIN
  -- Get the partner_id for the user
  SELECT u.partner_id INTO agent_partner_id
  FROM users u
  INNER JOIN partners p ON u.partner_id = p.id
  WHERE u.id = user_uuid
  AND p.partner_type IN ('agent', 'iso');
  
  -- Return deals assigned to this agent
  RETURN QUERY
  SELECT 
    d.id,
    d.partner_id,
    d.zoho_deal_id,
    d.deal_name,
    d.amount,
    d.stage,
    d.close_date,
    d.created_by,
    d.assigned_agent_id,
    d.lead_id,
    d.created_at,
    d.updated_at
  FROM deals d
  WHERE d.assigned_agent_id = agent_partner_id;
END;
$$;

COMMENT ON FUNCTION get_agent_assigned_deals IS 'Get all deals assigned to an agent/ISO user';

-- ============================================================================
-- 12. Update activity_log trigger to track agent assignments
-- ============================================================================

-- This will automatically log when leads/deals are assigned to agents
CREATE OR REPLACE FUNCTION log_agent_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log when a lead is assigned to an agent
  IF TG_TABLE_NAME = 'leads' AND NEW.assigned_agent_id IS NOT NULL AND 
     (OLD.assigned_agent_id IS NULL OR OLD.assigned_agent_id != NEW.assigned_agent_id) THEN
    INSERT INTO activity_log (entity_type, entity_id, action, user_id, details)
    VALUES (
      'lead',
      NEW.id,
      'agent_assigned',
      auth.uid(),
      jsonb_build_object(
        'assigned_agent_id', NEW.assigned_agent_id,
        'previous_agent_id', OLD.assigned_agent_id
      )
    );
  END IF;
  
  -- Log when a deal is assigned to an agent
  IF TG_TABLE_NAME = 'deals' AND NEW.assigned_agent_id IS NOT NULL AND 
     (OLD.assigned_agent_id IS NULL OR OLD.assigned_agent_id != NEW.assigned_agent_id) THEN
    INSERT INTO activity_log (entity_type, entity_id, action, user_id, details)
    VALUES (
      'deal',
      NEW.id,
      'agent_assigned',
      auth.uid(),
      jsonb_build_object(
        'assigned_agent_id', NEW.assigned_agent_id,
        'previous_agent_id', OLD.assigned_agent_id
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create triggers for agent assignment logging
DROP TRIGGER IF EXISTS log_lead_agent_assignment ON leads;
CREATE TRIGGER log_lead_agent_assignment
  AFTER UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION log_agent_assignment();

DROP TRIGGER IF EXISTS log_deal_agent_assignment ON deals;
CREATE TRIGGER log_deal_agent_assignment
  AFTER UPDATE ON deals
  FOR EACH ROW
  EXECUTE FUNCTION log_agent_assignment();

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Verify migration
DO $$
BEGIN
  RAISE NOTICE 'Migration 022: Agent/ISO Handling - COMPLETE';
  RAISE NOTICE 'Added partner_type column to partners table';
  RAISE NOTICE 'Added assigned_agent_id to leads and deals tables';
  RAISE NOTICE 'Created 3 performance indexes';
  RAISE NOTICE 'Updated 7 RLS policies for agent access control';
  RAISE NOTICE 'Created 3 helper functions for agent operations';
  RAISE NOTICE 'Created 2 triggers for agent assignment logging';
END $$;




