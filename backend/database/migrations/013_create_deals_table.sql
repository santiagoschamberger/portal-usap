-- =====================================================
-- Create Deals Table
-- Stores deals converted from leads in Zoho CRM
-- =====================================================

-- Create deals table (similar structure to leads)
CREATE TABLE IF NOT EXISTS deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
    created_by UUID REFERENCES users(id),
    zoho_deal_id VARCHAR(255) UNIQUE,
    deal_name VARCHAR(255) NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    company VARCHAR(255),
    amount DECIMAL(12, 2) DEFAULT 0,
    stage VARCHAR(100) DEFAULT 'Qualification' CHECK (stage IN (
        'Qualification',
        'Needs Analysis', 
        'Value Proposition',
        'Proposal',
        'Negotiation',
        'Closed Won',
        'Closed Lost'
    )),
    close_date DATE,
    probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100),
    lead_source VARCHAR(100),
    notes TEXT,
    metadata JSONB,
    zoho_sync_status VARCHAR(50) DEFAULT 'pending',
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deals_partner_id ON deals(partner_id);
CREATE INDEX IF NOT EXISTS idx_deals_zoho_id ON deals(zoho_deal_id);
CREATE INDEX IF NOT EXISTS idx_deals_stage ON deals(stage);
CREATE INDEX IF NOT EXISTS idx_deals_created_at ON deals(created_at);
CREATE INDEX IF NOT EXISTS idx_deals_close_date ON deals(close_date);
CREATE INDEX IF NOT EXISTS idx_deals_amount ON deals(amount);

-- Enable Row Level Security (RLS)
ALTER TABLE deals ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can only view their own deals
CREATE POLICY "partners_view_own_deals" ON deals
    FOR SELECT USING (
        partner_id IN (
            SELECT partner_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS Policy: Partners can insert their own deals
CREATE POLICY "partners_insert_own_deals" ON deals
    FOR INSERT WITH CHECK (
        partner_id IN (
            SELECT partner_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS Policy: Partners can update their own deals
CREATE POLICY "partners_update_own_deals" ON deals
    FOR UPDATE USING (
        partner_id IN (
            SELECT partner_id FROM users WHERE id = auth.uid()
        )
    );

-- RLS Policy: Admin users can view all deals
CREATE POLICY "admin_view_all_deals" ON deals
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create trigger for updated_at timestamp
CREATE TRIGGER trigger_update_deals_updated_at
    BEFORE UPDATE ON deals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create deal status history table
CREATE TABLE IF NOT EXISTS deal_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    deal_id UUID NOT NULL REFERENCES deals(id) ON DELETE CASCADE,
    old_stage VARCHAR(100),
    new_stage VARCHAR(100) NOT NULL,
    changed_by_user_id UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for deal stage history
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_deal_id ON deal_stage_history(deal_id);
CREATE INDEX IF NOT EXISTS idx_deal_stage_history_created_at ON deal_stage_history(created_at);

-- Enable RLS for deal stage history
ALTER TABLE deal_stage_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Partners can view history of their deals
CREATE POLICY "partners_view_deal_history" ON deal_stage_history
    FOR SELECT USING (
        deal_id IN (
            SELECT id FROM deals WHERE partner_id IN (
                SELECT partner_id FROM users WHERE id = auth.uid()
            )
        )
    );

-- Update activity_log to support deals
COMMENT ON TABLE deals IS 'Stores deals converted from leads in Zoho CRM with full sync capabilities';
COMMENT ON TABLE deal_stage_history IS 'Audit trail for deal stage changes';

