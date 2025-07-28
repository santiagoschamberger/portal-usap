-- =====================================================
-- Partner Portal Database Schema
-- Initial Migration: Tables, Relationships, and Indexes
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. PARTNERS TABLE
-- =====================================================
CREATE TABLE partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zoho_partner_id VARCHAR(255) UNIQUE, -- ID from Zoho CRM
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    company_name VARCHAR(255),
    website VARCHAR(255),
    address JSONB, -- Store complete address as JSON
    approved BOOLEAN DEFAULT false,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'suspended', 'rejected')),
    zoho_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (zoho_sync_status IN ('pending', 'synced', 'error')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for partners
CREATE INDEX idx_partners_zoho_id ON partners(zoho_partner_id);
CREATE INDEX idx_partners_email ON partners(email);
CREATE INDEX idx_partners_status ON partners(status);
CREATE INDEX idx_partners_approved ON partners(approved);
CREATE INDEX idx_partners_created_at ON partners(created_at);

-- =====================================================
-- 2. USERS TABLE
-- =====================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'partner' CHECK (role IN ('admin', 'partner', 'sub_account')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    last_login TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    email_verification_token VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for users
CREATE INDEX idx_users_partner_id ON users(partner_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);
CREATE INDEX idx_users_password_reset_token ON users(password_reset_token);

-- =====================================================
-- 3. LEADS TABLE
-- =====================================================
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    partner_id UUID REFERENCES partners(id) ON DELETE CASCADE,
    zoho_lead_id VARCHAR(255) UNIQUE, -- ID from Zoho CRM
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    company VARCHAR(255),
    job_title VARCHAR(255),
    website VARCHAR(255),
    industry VARCHAR(255),
    lead_source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN (
        'new', 'contacted', 'qualified', 'proposal', 'negotiation', 
        'closed_won', 'closed_lost', 'nurture', 'unqualified'
    )),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    score INTEGER DEFAULT 0 CHECK (score >= 0 AND score <= 100),
    notes TEXT,
    custom_fields JSONB, -- Store additional custom fields as JSON
    address JSONB, -- Store complete address as JSON
    zoho_sync_status VARCHAR(50) DEFAULT 'pending' CHECK (zoho_sync_status IN ('pending', 'synced', 'error')),
    last_sync_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    assigned_to UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leads
CREATE INDEX idx_leads_partner_id ON leads(partner_id);
CREATE INDEX idx_leads_zoho_id ON leads(zoho_lead_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_priority ON leads(priority);
CREATE INDEX idx_leads_score ON leads(score);
CREATE INDEX idx_leads_created_by ON leads(created_by);
CREATE INDEX idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX idx_leads_created_at ON leads(created_at);
CREATE INDEX idx_leads_lead_source ON leads(lead_source);

-- =====================================================
-- 4. LEAD STATUS HISTORY TABLE
-- =====================================================
CREATE TABLE lead_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    reason TEXT,
    notes TEXT,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for lead status history
CREATE INDEX idx_lead_status_history_lead_id ON lead_status_history(lead_id);
CREATE INDEX idx_lead_status_history_changed_by ON lead_status_history(changed_by);
CREATE INDEX idx_lead_status_history_changed_at ON lead_status_history(changed_at);
CREATE INDEX idx_lead_status_history_new_status ON lead_status_history(new_status);

-- =====================================================
-- 5. ACTIVITY LOG TABLE (for audit trail)
-- =====================================================
CREATE TABLE activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type VARCHAR(50) NOT NULL, -- 'partner', 'user', 'lead'
    entity_id UUID NOT NULL,
    action VARCHAR(100) NOT NULL, -- 'created', 'updated', 'deleted', 'login', etc.
    description TEXT,
    metadata JSONB, -- Store additional context as JSON
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for activity log
CREATE INDEX idx_activity_log_entity ON activity_log(entity_type, entity_id);
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_action ON activity_log(action);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at);

-- =====================================================
-- 6. SESSIONS TABLE (for JWT refresh tokens)
-- =====================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    refresh_token_hash VARCHAR(255) NOT NULL,
    device_info JSONB, -- Store device/browser info
    ip_address INET,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for user sessions
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_refresh_token ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_is_active ON user_sessions(is_active);

-- =====================================================
-- 7. NOTIFICATIONS TABLE
-- =====================================================
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
    category VARCHAR(50) DEFAULT 'general', -- 'lead', 'partner', 'system', etc.
    data JSONB, -- Store additional notification data
    read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_category ON notifications(category);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- =====================================================
-- COMMENTS: Initial schema creation complete
-- =====================================================

-- Add comments to tables for documentation
COMMENT ON TABLE partners IS 'Partner companies with Zoho CRM integration';
COMMENT ON TABLE users IS 'User accounts for partners and sub-accounts';
COMMENT ON TABLE leads IS 'Lead information with Zoho CRM synchronization';
COMMENT ON TABLE lead_status_history IS 'Audit trail for lead status changes';
COMMENT ON TABLE activity_log IS 'System-wide activity and audit log';
COMMENT ON TABLE user_sessions IS 'User session management for JWT tokens';
COMMENT ON TABLE notifications IS 'User notifications and alerts';

-- Add comments to important columns
COMMENT ON COLUMN partners.zoho_partner_id IS 'Partner ID from Zoho CRM system';
COMMENT ON COLUMN leads.zoho_lead_id IS 'Lead ID from Zoho CRM system';
COMMENT ON COLUMN leads.score IS 'Lead scoring from 0-100';
COMMENT ON COLUMN users.role IS 'User role: admin, partner, or sub_account'; 