-- =====================================================
-- MIGRATION 009: FIX USER CREATION LOGIC
-- =====================================================

-- This migration corrects the user creation logic
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

    -- Create user in Supabase Auth and identities table
    INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        p_email,
        crypt('password', gen_salt('bf')), -- Placeholder password
        now(),
        json_build_object('full_name', p_name, 'partner_id', new_partner_id, 'role', 'admin'),
        now(),
        now()
    )
    RETURNING id INTO new_user_id;

    INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        new_user_id,
        json_build_object('sub', new_user_id, 'email', p_email),
        'email',
        now(),
        now(),
        now()
    );
    
    -- Insert into public.users table
    INSERT INTO public.users (id, partner_id, role, first_name, last_name, is_active)
    VALUES (new_user_id, new_partner_id, 'admin', split_part(p_name, ' ', 1), split_part(p_name, ' ', 2), true)
    ON CONFLICT (id) DO NOTHING;

    -- Return the new IDs
    RETURN QUERY SELECT new_partner_id, new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 