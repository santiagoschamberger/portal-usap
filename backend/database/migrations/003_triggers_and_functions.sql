-- =====================================================
-- Database Triggers and Functions
-- Automatic timestamps, audit logging, and business logic
-- =====================================================

-- =====================================================
-- 1. AUTOMATIC TIMESTAMP FUNCTIONS
-- =====================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all relevant tables
CREATE TRIGGER trigger_update_partners_updated_at
    BEFORE UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_leads_updated_at
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 2. LEAD STATUS CHANGE LOGGING
-- =====================================================

-- Function to automatically log lead status changes
CREATE OR REPLACE FUNCTION log_lead_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Only log if status actually changed
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO lead_status_history (
            lead_id,
            old_status,
            new_status,
            reason,
            changed_by,
            changed_at
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            CASE 
                WHEN NEW.status = 'closed_won' THEN 'Lead converted successfully'
                WHEN NEW.status = 'closed_lost' THEN 'Lead marked as lost'
                WHEN NEW.status = 'qualified' THEN 'Lead qualified for follow-up'
                ELSE 'Status updated'
            END,
            COALESCE(NEW.assigned_to, NEW.created_by),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for lead status changes
CREATE TRIGGER trigger_log_lead_status_change
    AFTER UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_status_change();

-- =====================================================
-- 3. ACTIVITY LOGGING FUNCTIONS
-- =====================================================

-- Function to log partner activities
CREATE OR REPLACE FUNCTION log_partner_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_action VARCHAR(100);
    activity_description TEXT;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        activity_action := 'partner_created';
        activity_description := 'New partner created: ' || NEW.name;
    ELSIF TG_OP = 'UPDATE' THEN
        activity_action := 'partner_updated';
        activity_description := 'Partner updated: ' || NEW.name;
        
        -- Special handling for approval status changes
        IF OLD.approved IS DISTINCT FROM NEW.approved THEN
            IF NEW.approved = true THEN
                activity_action := 'partner_approved';
                activity_description := 'Partner approved: ' || NEW.name;
            ELSE
                activity_action := 'partner_unapproved';
                activity_description := 'Partner approval revoked: ' || NEW.name;
            END IF;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        activity_action := 'partner_deleted';
        activity_description := 'Partner deleted: ' || OLD.name;
    END IF;

    -- Insert activity log
    INSERT INTO activity_log (
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        created_at
    ) VALUES (
        'partner',
        COALESCE(NEW.id, OLD.id),
        activity_action,
        activity_description,
        jsonb_build_object(
            'partner_name', COALESCE(NEW.name, OLD.name),
            'partner_email', COALESCE(NEW.email, OLD.email),
            'approved', COALESCE(NEW.approved, OLD.approved)
        ),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log user activities
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_action VARCHAR(100);
    activity_description TEXT;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        activity_action := 'user_created';
        activity_description := 'New user created: ' || NEW.email;
    ELSIF TG_OP = 'UPDATE' THEN
        activity_action := 'user_updated';
        activity_description := 'User updated: ' || NEW.email;
        
        -- Special handling for login tracking
        IF OLD.last_login IS DISTINCT FROM NEW.last_login AND NEW.last_login IS NOT NULL THEN
            activity_action := 'user_login';
            activity_description := 'User logged in: ' || NEW.email;
        END IF;
    ELSIF TG_OP = 'DELETE' THEN
        activity_action := 'user_deleted';
        activity_description := 'User deleted: ' || OLD.email;
    END IF;

    -- Insert activity log
    INSERT INTO activity_log (
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        user_id,
        created_at
    ) VALUES (
        'user',
        COALESCE(NEW.id, OLD.id),
        activity_action,
        activity_description,
        jsonb_build_object(
            'user_email', COALESCE(NEW.email, OLD.email),
            'user_role', COALESCE(NEW.role, OLD.role),
            'partner_id', COALESCE(NEW.partner_id, OLD.partner_id)
        ),
        COALESCE(NEW.id, OLD.id),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to log lead activities
CREATE OR REPLACE FUNCTION log_lead_activity()
RETURNS TRIGGER AS $$
DECLARE
    activity_action VARCHAR(100);
    activity_description TEXT;
BEGIN
    -- Determine action type
    IF TG_OP = 'INSERT' THEN
        activity_action := 'lead_created';
        activity_description := 'New lead created: ' || NEW.first_name || ' ' || NEW.last_name;
    ELSIF TG_OP = 'UPDATE' THEN
        activity_action := 'lead_updated';
        activity_description := 'Lead updated: ' || NEW.first_name || ' ' || NEW.last_name;
    ELSIF TG_OP = 'DELETE' THEN
        activity_action := 'lead_deleted';
        activity_description := 'Lead deleted: ' || OLD.first_name || ' ' || OLD.last_name;
    END IF;

    -- Insert activity log
    INSERT INTO activity_log (
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        user_id,
        created_at
    ) VALUES (
        'lead',
        COALESCE(NEW.id, OLD.id),
        activity_action,
        activity_description,
        jsonb_build_object(
            'lead_name', COALESCE(NEW.first_name || ' ' || NEW.last_name, OLD.first_name || ' ' || OLD.last_name),
            'lead_email', COALESCE(NEW.email, OLD.email),
            'lead_status', COALESCE(NEW.status, OLD.status),
            'partner_id', COALESCE(NEW.partner_id, OLD.partner_id)
        ),
        COALESCE(NEW.created_by, OLD.created_by),
        NOW()
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for activity logging
CREATE TRIGGER trigger_log_partner_activity
    AFTER INSERT OR UPDATE OR DELETE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION log_partner_activity();

CREATE TRIGGER trigger_log_user_activity
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER trigger_log_lead_activity
    AFTER INSERT OR UPDATE OR DELETE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION log_lead_activity();

-- =====================================================
-- 4. BUSINESS LOGIC FUNCTIONS
-- =====================================================

-- Function to automatically create partner user when partner is approved
CREATE OR REPLACE FUNCTION auto_create_partner_user()
RETURNS TRIGGER AS $$
BEGIN
    -- If partner was just approved and no user exists yet
    IF OLD.approved = false AND NEW.approved = true THEN
        -- Check if user already exists for this partner
        IF NOT EXISTS (SELECT 1 FROM users WHERE partner_id = NEW.id AND role = 'partner') THEN
            -- Create a user record for the partner
            INSERT INTO users (
                partner_id,
                email,
                password_hash,
                first_name,
                last_name,
                role,
                is_active,
                email_verified,
                created_at
            ) VALUES (
                NEW.id,
                NEW.email,
                'TEMP_HASH_TO_BE_REPLACED', -- Will be updated when user sets password
                split_part(NEW.name, ' ', 1), -- First word as first name
                CASE 
                    WHEN array_length(string_to_array(NEW.name, ' '), 1) > 1 
                    THEN substring(NEW.name from length(split_part(NEW.name, ' ', 1)) + 2)
                    ELSE ''
                END, -- Rest as last name
                'partner',
                true,
                false, -- Email verification will be sent
                NOW()
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto user creation
CREATE TRIGGER trigger_auto_create_partner_user
    AFTER UPDATE ON partners
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_partner_user();

-- =====================================================
-- 5. CLEANUP FUNCTIONS
-- =====================================================

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete expired sessions
    DELETE FROM user_sessions 
    WHERE expires_at < NOW() OR is_active = false;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO activity_log (
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        created_at
    ) VALUES (
        'system',
        gen_random_uuid(),
        'cleanup_sessions',
        'Cleaned up expired user sessions',
        jsonb_build_object('deleted_sessions', deleted_count),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete notifications older than 30 days and read
    DELETE FROM notifications 
    WHERE read = true 
    AND created_at < NOW() - INTERVAL '30 days';
    
    -- Delete expired notifications
    DELETE FROM notifications 
    WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Log cleanup activity
    INSERT INTO activity_log (
        entity_type,
        entity_id,
        action,
        description,
        metadata,
        created_at
    ) VALUES (
        'system',
        gen_random_uuid(),
        'cleanup_notifications',
        'Cleaned up old notifications',
        jsonb_build_object('deleted_notifications', deleted_count),
        NOW()
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. UTILITY FUNCTIONS
-- =====================================================

-- Function to get partner statistics
CREATE OR REPLACE FUNCTION get_partner_stats(partner_uuid UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_leads', COUNT(*),
        'new_leads', COUNT(*) FILTER (WHERE status = 'new'),
        'qualified_leads', COUNT(*) FILTER (WHERE status = 'qualified'),
        'closed_won', COUNT(*) FILTER (WHERE status = 'closed_won'),
        'closed_lost', COUNT(*) FILTER (WHERE status = 'closed_lost'),
        'conversion_rate', 
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE status = 'closed_won')::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END,
        'last_lead_created', MAX(created_at),
        'total_users', (
            SELECT COUNT(*) FROM users WHERE partner_id = partner_uuid
        )
    ) INTO result
    FROM leads 
    WHERE partner_id = partner_uuid;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to search leads with filters
CREATE OR REPLACE FUNCTION search_leads(
    partner_uuid UUID,
    search_text TEXT DEFAULT NULL,
    lead_status TEXT DEFAULT NULL,
    lead_priority TEXT DEFAULT NULL,
    date_from TIMESTAMP DEFAULT NULL,
    date_to TIMESTAMP DEFAULT NULL,
    limit_count INTEGER DEFAULT 50,
    offset_count INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    company VARCHAR,
    status VARCHAR,
    priority VARCHAR,
    score INTEGER,
    created_at TIMESTAMP WITH TIME ZONE,
    created_by_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id,
        l.first_name,
        l.last_name,
        l.email,
        l.company,
        l.status,
        l.priority,
        l.score,
        l.created_at,
        u.email as created_by_email
    FROM leads l
    LEFT JOIN users u ON l.created_by = u.id
    WHERE l.partner_id = partner_uuid
    AND (search_text IS NULL OR 
         l.first_name ILIKE '%' || search_text || '%' OR
         l.last_name ILIKE '%' || search_text || '%' OR
         l.email ILIKE '%' || search_text || '%' OR
         l.company ILIKE '%' || search_text || '%')
    AND (lead_status IS NULL OR l.status = lead_status)
    AND (lead_priority IS NULL OR l.priority = lead_priority)
    AND (date_from IS NULL OR l.created_at >= date_from)
    AND (date_to IS NULL OR l.created_at <= date_to)
    ORDER BY l.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION update_updated_at_column() IS 'Automatically updates the updated_at timestamp';
COMMENT ON FUNCTION log_lead_status_change() IS 'Automatically logs lead status changes to history table';
COMMENT ON FUNCTION log_partner_activity() IS 'Logs partner-related activities for audit trail';
COMMENT ON FUNCTION log_user_activity() IS 'Logs user-related activities for audit trail';
COMMENT ON FUNCTION log_lead_activity() IS 'Logs lead-related activities for audit trail';
COMMENT ON FUNCTION auto_create_partner_user() IS 'Automatically creates user account when partner is approved';
COMMENT ON FUNCTION cleanup_expired_sessions() IS 'Cleans up expired user sessions';
COMMENT ON FUNCTION cleanup_old_notifications() IS 'Cleans up old and expired notifications';
COMMENT ON FUNCTION get_partner_stats(UUID) IS 'Returns statistics for a specific partner';
COMMENT ON FUNCTION search_leads(UUID,TEXT,TEXT,TEXT,TIMESTAMP,TIMESTAMP,INTEGER,INTEGER) IS 'Searches leads with various filters'; 