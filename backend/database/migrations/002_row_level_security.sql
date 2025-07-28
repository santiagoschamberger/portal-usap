-- =====================================================
-- Row Level Security (RLS) Policies
-- Ensures proper data isolation and access control
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PARTNERS TABLE RLS POLICIES
-- =====================================================

-- Partners can only see their own data
CREATE POLICY "Partners can view own data" ON partners
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE partner_id = partners.id
        )
    );

-- Partners can update their own data
CREATE POLICY "Partners can update own data" ON partners
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE partner_id = partners.id AND role = 'partner'
        )
    );

-- Only admins can insert new partners
CREATE POLICY "Only admins can create partners" ON partners
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )
    );

-- Only admins can delete partners
CREATE POLICY "Only admins can delete partners" ON partners
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )
    );

-- =====================================================
-- USERS TABLE RLS POLICIES
-- =====================================================

-- Users can view users in their partner organization + admins can see all
CREATE POLICY "Users can view own organization" ON users
    FOR SELECT USING (
        auth.uid()::text = id::text OR -- Own record
        auth.uid()::text IN (
            SELECT u2.id::text FROM users u2 
            WHERE u2.role = 'admin'
        ) OR -- Admins can see all
        partner_id IN (
            SELECT partner_id FROM users WHERE id::text = auth.uid()::text
        ) -- Same partner organization
    );

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (
        auth.uid()::text = id::text OR -- Own record
        (auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        )) -- Admins can update any
    );

-- Partners can create sub-accounts, admins can create any
CREATE POLICY "Partners can create sub-accounts" ON users
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        ) OR -- Admins can create any user
        (role = 'sub_account' AND partner_id IN (
            SELECT partner_id FROM users WHERE id::text = auth.uid()::text AND role = 'partner'
        )) -- Partners can create sub-accounts in their org
    );

-- Users can deactivate sub-accounts in their org, admins can delete any
CREATE POLICY "Users can manage own organization" ON users
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT id::text FROM users WHERE role = 'admin'
        ) OR -- Admins can delete any
        (auth.uid()::text IN (
            SELECT u2.id::text FROM users u2 
            WHERE u2.partner_id = users.partner_id AND u2.role = 'partner'
        ) AND role = 'sub_account') -- Partners can delete sub-accounts in their org
    );

-- =====================================================
-- LEADS TABLE RLS POLICIES
-- =====================================================

-- Users can view leads in their partner organization
CREATE POLICY "Users can view partner leads" ON leads
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u 
            WHERE u.role = 'admin'
        ) OR -- Admins can see all
        partner_id IN (
            SELECT u.partner_id FROM users u WHERE u.id::text = auth.uid()::text
        ) -- Same partner organization
    );

-- Users can create leads for their partner organization
CREATE POLICY "Users can create partner leads" ON leads
    FOR INSERT WITH CHECK (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u 
            WHERE u.role = 'admin'
        ) OR -- Admins can create any
        partner_id IN (
            SELECT u.partner_id FROM users u WHERE u.id::text = auth.uid()::text
        ) -- Same partner organization
    );

-- Users can update leads in their partner organization
CREATE POLICY "Users can update partner leads" ON leads
    FOR UPDATE USING (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u 
            WHERE u.role = 'admin'
        ) OR -- Admins can update any
        partner_id IN (
            SELECT u.partner_id FROM users u WHERE u.id::text = auth.uid()::text
        ) -- Same partner organization
    );

-- Users can delete leads in their partner organization (soft delete recommended)
CREATE POLICY "Users can delete partner leads" ON leads
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u 
            WHERE u.role = 'admin'
        ) OR -- Admins can delete any
        partner_id IN (
            SELECT u.partner_id FROM users u WHERE u.id::text = auth.uid()::text
        ) -- Same partner organization
    );

-- =====================================================
-- LEAD STATUS HISTORY RLS POLICIES
-- =====================================================

-- Users can view lead status history for leads they can access
CREATE POLICY "Users can view accessible lead history" ON lead_status_history
    FOR SELECT USING (
        lead_id IN (
            SELECT l.id FROM leads l 
            WHERE auth.uid()::text IN (
                SELECT u.id::text FROM users u 
                WHERE u.role = 'admin'
            ) OR
            l.partner_id IN (
                SELECT u.partner_id FROM users u WHERE u.id::text = auth.uid()::text
            )
        )
    );

-- Users can insert lead status history for leads they can access
CREATE POLICY "Users can create accessible lead history" ON lead_status_history
    FOR INSERT WITH CHECK (
        lead_id IN (
            SELECT l.id FROM leads l 
            WHERE auth.uid()::text IN (
                SELECT u.id::text FROM users u 
                WHERE u.role = 'admin'
            ) OR
            l.partner_id IN (
                SELECT u.partner_id FROM users u WHERE u.id::text = auth.uid()::text
            )
        )
    );

-- No updates or deletes allowed on history (audit trail)
CREATE POLICY "No updates to lead history" ON lead_status_history
    FOR UPDATE USING (false);

CREATE POLICY "No deletes from lead history" ON lead_status_history
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u WHERE u.role = 'admin'
        ) -- Only admins can delete history records
    );

-- =====================================================
-- ACTIVITY LOG RLS POLICIES
-- =====================================================

-- Users can view activity logs for their organization
CREATE POLICY "Users can view organization activity" ON activity_log
    FOR SELECT USING (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u WHERE u.role = 'admin'
        ) OR -- Admins can see all
        user_id IN (
            SELECT u.id FROM users u 
            WHERE u.partner_id IN (
                SELECT u2.partner_id FROM users u2 WHERE u2.id::text = auth.uid()::text
            )
        ) -- Same partner organization
    );

-- System can insert activity logs
CREATE POLICY "System can create activity logs" ON activity_log
    FOR INSERT WITH CHECK (true); -- Allow system to log activities

-- No manual updates or deletes (audit trail)
CREATE POLICY "No updates to activity log" ON activity_log
    FOR UPDATE USING (false);

CREATE POLICY "No deletes from activity log" ON activity_log
    FOR DELETE USING (
        auth.uid()::text IN (
            SELECT u.id::text FROM users u WHERE u.role = 'admin'
        ) -- Only admins can delete logs
    );

-- =====================================================
-- USER SESSIONS RLS POLICIES
-- =====================================================

-- Users can only see their own sessions
CREATE POLICY "Users can view own sessions" ON user_sessions
    FOR SELECT USING (
        auth.uid()::text = user_id::text OR
        auth.uid()::text IN (
            SELECT u.id::text FROM users u WHERE u.role = 'admin'
        ) -- Admins can see all sessions
    );

-- Users can create their own sessions
CREATE POLICY "Users can create own sessions" ON user_sessions
    FOR INSERT WITH CHECK (
        auth.uid()::text = user_id::text
    );

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions" ON user_sessions
    FOR UPDATE USING (
        auth.uid()::text = user_id::text OR
        auth.uid()::text IN (
            SELECT u.id::text FROM users u WHERE u.role = 'admin'
        ) -- Admins can manage any session
    );

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions" ON user_sessions
    FOR DELETE USING (
        auth.uid()::text = user_id::text OR
        auth.uid()::text IN (
            SELECT u.id::text FROM users u WHERE u.role = 'admin'
        ) -- Admins can delete any session
    );

-- =====================================================
-- NOTIFICATIONS RLS POLICIES
-- =====================================================

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications" ON notifications
    FOR SELECT USING (
        auth.uid()::text = user_id::text
    );

-- System can create notifications for users
CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications" ON notifications
    FOR UPDATE USING (
        auth.uid()::text = user_id::text
    );

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications" ON notifications
    FOR DELETE USING (
        auth.uid()::text = user_id::text
    );

-- =====================================================
-- HELPER FUNCTIONS FOR RLS
-- =====================================================

-- Function to get current user's partner ID
CREATE OR REPLACE FUNCTION get_current_user_partner_id()
RETURNS UUID AS $$
BEGIN
    RETURN (
        SELECT partner_id 
        FROM users 
        WHERE id::text = auth.uid()::text
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION is_current_user_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (
        SELECT COALESCE(
            (SELECT role = 'admin' FROM users WHERE id::text = auth.uid()::text),
            false
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON POLICY "Partners can view own data" ON partners IS 'Partners can only view their own partner record';
COMMENT ON POLICY "Users can view own organization" ON users IS 'Users can view users in their partner organization, admins see all';
COMMENT ON POLICY "Users can view partner leads" ON leads IS 'Users can view leads belonging to their partner organization';
COMMENT ON FUNCTION get_current_user_partner_id() IS 'Helper function to get current user partner ID for RLS';
COMMENT ON FUNCTION is_current_user_admin() IS 'Helper function to check if current user is admin'; 