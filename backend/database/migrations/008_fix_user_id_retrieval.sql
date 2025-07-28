-- =====================================================
-- MIGRATION 008: FIX USER ID RETRIEVAL IN CREATE_PARTNER
-- =====================================================

-- This migration corrects the user ID retrieval logic
-- in the create_partner_with_user function.

-- =====================================================
-- FUNCTION: create_partner_with_user (Corrected)
-- =====================================================
CREATE OR REPLACE FUNCTION create_partner_with_user(
    p_zoho_partner_id VARCHAR,
    p_name VARCHAR,
    p_email VARCHAR
)
RETURNS TABLE (partner_id UUID, user_id UUID) AS $$
DECLARE
    new_partner_id UUID;
    new_user_id UUID;
BEGIN
    -- Insert into partners table
    INSERT INTO partners (zoho_partner_id, name, email, approved, status, zoho_sync_status)
    VALUES (p_zoho_partner_id, p_name, p_email, true, 'approved', 'synced')
    RETURNING id INTO new_partner_id;

    -- Create user in Supabase Auth if they don't exist
    SELECT id INTO new_user_id FROM auth.users WHERE email = p_email;

    IF new_user_id IS NULL THEN
        INSERT INTO auth.users (email, raw_user_meta_data)
        VALUES (p_email, json_build_object('full_name', p_name, 'partner_id', new_partner_id, 'role', 'admin'));
        
        -- Select the id of the newly created user
        SELECT id INTO new_user_id FROM auth.users WHERE email = p_email;
    END IF;
    
    -- Insert into public.users table
    INSERT INTO public.users (id, partner_id, role, first_name, last_name, is_active)
    VALUES (new_user_id, new_partner_id, 'admin', split_part(p_name, ' ', 1), split_part(p_name, ' ', 2), true)
    ON CONFLICT (id) DO NOTHING;

    -- Return the new IDs
    RETURN QUERY SELECT new_partner_id, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 